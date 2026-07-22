#!/usr/bin/env python3
"""Create a browser-friendly route index from an Apple Health export.

The source export stays untouched. Only outdoor workouts with a GPX file are
included. GPX points are simplified before writing JSON so the map remains fast.
"""

from __future__ import annotations

import argparse
import json
import math
import os
import re
import xml.etree.ElementTree as ET
from datetime import datetime
from pathlib import Path


TYPE_MAP = {
    "HKWorkoutActivityTypeRunning": "run",
    "HKWorkoutActivityTypeCycling": "ride",
    "HKWorkoutActivityTypeWalking": "walk",
    "HKWorkoutActivityTypeHiking": "hike",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "export_dir",
        help="Apple Health export directory",
    )
    parser.add_argument(
        "--output",
        default="public/data/routes.json",
        help="Output JSON path",
    )
    parser.add_argument(
        "--tolerance",
        type=float,
        default=0.00006,
        help="RDP simplification tolerance in degrees (default: about 6m)",
    )
    return parser.parse_args()


def attrs(line: str) -> dict[str, str]:
    return dict(re.findall(r'(\w+)="([^"]*)"', line))


def find_export_xml(export_dir: Path) -> Path:
    candidates = [export_dir / "导出.xml", export_dir / "export.xml"]
    for path in candidates:
        if path.exists():
            return path
    raise FileNotFoundError("未找到 导出.xml 或 export.xml")


def iter_workouts(xml_path: Path):
    """Yield only Workout fragments without building the 2GB XML tree."""
    fragment: list[str] | None = None
    with xml_path.open("r", encoding="utf-8") as source:
        for line in source:
            if fragment is None:
                if line.lstrip().startswith("<Workout "):
                    fragment = [line]
            else:
                fragment.append(line)
                if line.lstrip().startswith("</Workout>"):
                    yield ET.fromstring("".join(fragment))
                    fragment = None


def get_route_reference(workout: ET.Element) -> str | None:
    for route in workout.findall("WorkoutRoute"):
        ref = route.find("FileReference")
        if ref is not None and ref.attrib.get("path"):
            return ref.attrib["path"].lstrip("/")
    return None


def get_stat(workout: ET.Element, needle: str) -> float | None:
    for stat in workout.findall("WorkoutStatistics"):
        if needle in stat.attrib.get("type", "") and stat.attrib.get("sum"):
            try:
                return float(stat.attrib["sum"])
            except ValueError:
                return None
    return None


def perpendicular_distance(point, start, end) -> float:
    if start[:2] == end[:2]:
        return math.dist(point[:2], start[:2])
    x, y = point[1], point[0]
    x1, y1 = start[1], start[0]
    x2, y2 = end[1], end[0]
    return abs((y2 - y1) * x - (x2 - x1) * y + x2 * y1 - y2 * x1) / math.hypot(y2 - y1, x2 - x1)


def simplify(points: list[list[float]], tolerance: float) -> list[list[float]]:
    if len(points) <= 2:
        return points
    keep = {0, len(points) - 1}
    stack = [(0, len(points) - 1)]
    while stack:
        start_idx, end_idx = stack.pop()
        max_distance = 0.0
        split_idx = 0
        for idx in range(start_idx + 1, end_idx):
            distance = perpendicular_distance(points[idx], points[start_idx], points[end_idx])
            if distance > max_distance:
                split_idx, max_distance = idx, distance
        if max_distance > tolerance:
            keep.add(split_idx)
            stack.append((start_idx, split_idx))
            stack.append((split_idx, end_idx))
    return [points[idx] for idx in sorted(keep)]


def parse_gpx(path: Path, tolerance: float) -> dict:
    namespace = {"g": "http://www.topografix.com/GPX/1/1"}
    root = ET.parse(path).getroot()
    raw_points: list[list[float]] = []
    times: list[str] = []
    elevations: list[float] = []
    for node in root.findall(".//g:trkpt", namespace):
        try:
            lat = float(node.attrib["lat"])
            lon = float(node.attrib["lon"])
        except (KeyError, ValueError):
            continue
        ele_node = node.find("g:ele", namespace)
        time_node = node.find("g:time", namespace)
        elevation = float(ele_node.text) if ele_node is not None and ele_node.text else 0.0
        raw_points.append([round(lat, 6), round(lon, 6), round(elevation, 1)])
        elevations.append(elevation)
        if time_node is not None and time_node.text:
            times.append(time_node.text)

    if len(raw_points) < 2:
        raise ValueError("GPX 中没有足够轨迹点")

    # Ignore sub-meter elevation jitter before summing ascent.
    ascent = 0.0
    previous = elevations[0]
    for elevation in elevations[1:]:
        delta = elevation - previous
        if delta >= 1.0:
            ascent += delta
            previous = elevation
        elif delta <= -1.0:
            previous = elevation

    points = simplify(raw_points, tolerance)
    return {
        "points": points,
        "pointCount": len(raw_points),
        "ascentM": round(ascent),
        "bounds": [
            [min(p[0] for p in raw_points), min(p[1] for p in raw_points)],
            [max(p[0] for p in raw_points), max(p[1] for p in raw_points)],
        ],
        "trackStart": times[0] if times else None,
        "trackEnd": times[-1] if times else None,
    }


def parse_date(value: str) -> str:
    parsed = datetime.strptime(value[:19], "%Y-%m-%d %H:%M:%S")
    return parsed.isoformat()


def main() -> None:
    args = parse_args()
    export_dir = Path(args.export_dir).expanduser().resolve()
    xml_path = find_export_xml(export_dir)
    output_path = Path(args.output).expanduser().resolve()
    output_path.parent.mkdir(parents=True, exist_ok=True)

    routes = []
    skipped_missing = 0
    skipped_invalid = 0
    for workout in iter_workouts(xml_path):
        route_ref = get_route_reference(workout)
        if not route_ref:
            continue
        category = TYPE_MAP.get(workout.attrib.get("workoutActivityType", ""), "other")
        route_path = export_dir / route_ref
        if not route_path.exists():
            skipped_missing += 1
            continue
        try:
            gpx = parse_gpx(route_path, args.tolerance)
        except (ET.ParseError, ValueError, OSError):
            skipped_invalid += 1
            continue

        distance = get_stat(workout, "Distance")
        duration = float(workout.attrib.get("duration", 0) or 0)
        start = parse_date(workout.attrib["startDate"])
        route_id = Path(route_ref).stem.replace("route_", "")
        routes.append(
            {
                "id": route_id,
                "category": category,
                "activityType": workout.attrib.get("workoutActivityType"),
                "date": start,
                "year": int(start[:4]),
                "durationMin": round(duration, 1),
                "distanceKm": round(distance, 2) if distance is not None else None,
                "energyKcal": round(get_stat(workout, "ActiveEnergyBurned") or 0),
                "source": workout.attrib.get("sourceName", "Apple 健康"),
                "file": route_ref,
                **gpx,
            }
        )

    routes.sort(key=lambda route: route["date"], reverse=True)
    counts: dict[str, int] = {}
    for route in routes:
        counts[route["category"]] = counts.get(route["category"], 0) + 1

    payload = {
        "generatedAt": datetime.now().astimezone().isoformat(timespec="seconds"),
        "routeCount": len(routes),
        "counts": counts,
        "routes": routes,
    }
    output_path.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    size_mb = os.path.getsize(output_path) / 1024 / 1024
    print(f"已写入 {len(routes)} 条轨迹 -> {output_path} ({size_mb:.1f} MB)")
    if skipped_missing or skipped_invalid:
        print(f"跳过：缺少 GPX {skipped_missing}，无效 GPX {skipped_invalid}")


if __name__ == "__main__":
    main()

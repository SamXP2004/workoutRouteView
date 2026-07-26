#!/usr/bin/env python3
"""Fail when sensitive Apple Health artifacts are tracked or built."""

from __future__ import annotations

import subprocess
from pathlib import Path


SENSITIVE_NAMES = {
    "export.xml",
    "导出.xml",
    "routes.json",
    "import-report.json",
}
SENSITIVE_SUFFIXES = {".gpx"}


def tracked_sensitive_files() -> list[str]:
    result = subprocess.run(
        ["git", "ls-files", "-z"],
        check=True,
        capture_output=True,
    )
    tracked = result.stdout.decode("utf-8").split("\0")
    violations = []
    for value in tracked:
        if not value:
            continue
        path = Path(value)
        if path.name in SENSITIVE_NAMES or path.suffix.lower() in SENSITIVE_SUFFIXES:
            violations.append(value)
        elif path.parts[:3] == ("public", "data", "metrics"):
            violations.append(value)
        elif "preview" in path.name.lower():
            violations.append(value)
    return violations


def main() -> None:
    violations = tracked_sensitive_files()
    private_dist = Path("dist/data/routes.json")
    if private_dist.exists():
        violations.append(str(private_dist))
    private_metrics = Path("dist/data/metrics")
    if private_metrics.exists():
        violations.append(str(private_metrics))
    private_report = Path("dist/data/import-report.json")
    if private_report.exists():
        violations.append(str(private_report))

    if violations:
        print("隐私检查失败，发现不应提交或发布的文件：")
        for path in violations:
            print(f"- {path}")
        raise SystemExit(1)

    print("隐私检查通过：未跟踪或构建 Apple 健康轨迹数据。")


if __name__ == "__main__":
    main()

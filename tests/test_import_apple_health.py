from __future__ import annotations

import importlib.util
import tempfile
import unittest
from pathlib import Path


SCRIPT_PATH = Path(__file__).parents[1] / "scripts" / "import_apple_health.py"
SPEC = importlib.util.spec_from_file_location("import_apple_health", SCRIPT_PATH)
assert SPEC and SPEC.loader
IMPORTER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(IMPORTER)


class ImportAppleHealthTest(unittest.TestCase):
    def test_parse_date_preserves_timezone(self):
        self.assertEqual(
            IMPORTER.parse_date("2026-07-16 08:30:00 +0800"),
            "2026-07-16T08:30:00+08:00",
        )

    def test_convert_stat_normalizes_distance_and_energy_units(self):
        self.assertAlmostEqual(
            IMPORTER.convert_stat((1.0, "mi"), IMPORTER.DISTANCE_TO_KM),
            1.609344,
        )
        self.assertAlmostEqual(
            IMPORTER.convert_stat((100.0, "kJ"), IMPORTER.ENERGY_TO_KCAL),
            23.9005736,
        )

    def test_convert_stat_keeps_missing_or_unknown_units_missing(self):
        self.assertIsNone(
            IMPORTER.convert_stat(None, IMPORTER.DISTANCE_TO_KM),
        )
        self.assertIsNone(
            IMPORTER.convert_stat((10.0, "unknown"), IMPORTER.DISTANCE_TO_KM),
        )

    def test_parse_gpx_reads_points_time_bounds_and_ascent(self):
        gpx = """<?xml version="1.0" encoding="UTF-8"?>
<gpx xmlns="http://www.topografix.com/GPX/1/1">
  <trk><trkseg>
    <trkpt lat="0" lon="0"><ele>10</ele><time>2026-01-01T00:00:00Z</time></trkpt>
    <trkpt lat="0.001" lon="0.001"><ele>12</ele><time>2026-01-01T00:01:00Z</time></trkpt>
    <trkpt lat="0.002" lon="0.002"><ele>11</ele><time>2026-01-01T00:02:00Z</time></trkpt>
  </trkseg></trk>
</gpx>
"""
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "route.gpx"
            path.write_text(gpx, encoding="utf-8")
            result = IMPORTER.parse_gpx(path, tolerance=0)

        self.assertEqual(result["pointCount"], 3)
        self.assertEqual(result["ascentM"], 2)
        self.assertEqual(result["bounds"], [[0.0, 0.0], [0.002, 0.002]])
        self.assertEqual(result["trackStart"], "2026-01-01T00:00:00Z")
        self.assertEqual(result["trackEnd"], "2026-01-01T00:02:00Z")


if __name__ == "__main__":
    unittest.main()

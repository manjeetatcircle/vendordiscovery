from __future__ import annotations

import argparse
import csv
import hashlib
import sqlite3
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_APP_DB = REPO_ROOT / "prisma" / "dev.db"


@dataclass(frozen=True)
class CsvVendor:
    vendor_id: str
    vendor_name: str
    category: str | None
    description: str


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Rebuild the app vendor inventory from a CSV with Name, Categories, Description."
    )
    parser.add_argument("--csv-path", required=True, help="Absolute path to the vendor CSV file.")
    parser.add_argument(
        "--db-path",
        default=str(DEFAULT_APP_DB),
        help="SQLite database path to populate. Defaults to prisma/dev.db.",
    )
    return parser.parse_args()


def _make_vendor_id(name: str, category: str | None) -> str:
    digest = hashlib.sha1(f"{name}|{category or ''}".encode("utf-8")).hexdigest()[:16]
    return f"csv-{digest}"


def load_csv_rows(csv_path: Path) -> tuple[list[CsvVendor], int, int]:
    vendors: list[CsvVendor] = []
    skipped_blank_description = 0
    skipped_duplicates = 0
    seen_vendor_ids: set[str] = set()

    with csv_path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        required = {"Name", "Categories", "Description"}
        missing = required.difference(reader.fieldnames or [])
        if missing:
            raise ValueError(f"CSV missing required column(s): {', '.join(sorted(missing))}")

        for row in reader:
            name = (row.get("Name") or "").strip()
            category = (row.get("Categories") or "").strip() or None
            description = (row.get("Description") or "").strip()

            if not name:
                continue
            if not description:
                skipped_blank_description += 1
                continue

            vendor_id = _make_vendor_id(name, category)
            if vendor_id in seen_vendor_ids:
                skipped_duplicates += 1
                continue
            seen_vendor_ids.add(vendor_id)

            vendors.append(
                CsvVendor(
                    vendor_id=vendor_id,
                    vendor_name=name,
                    category=category,
                    description=description,
                )
            )

    return vendors, skipped_blank_description, skipped_duplicates


def rebuild_vendors_table(db_path: Path, vendors: list[CsvVendor]) -> None:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(db_path)
    now = datetime.now(timezone.utc).replace(microsecond=0).isoformat()

    try:
        conn.execute("DELETE FROM vendors")
        conn.executemany(
            """
            INSERT INTO vendors (
                vendor_id,
                vendor_name,
                vendor_description,
                request_title,
                request_description,
                requestor_name,
                requestor_email,
                request_id,
                department,
                category,
                subcategory,
                status,
                source_last_updated_at,
                created_at,
                updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            [
                (
                    vendor.vendor_id,
                    vendor.vendor_name,
                    vendor.description,
                    vendor.vendor_name,
                    vendor.description,
                    None,
                    None,
                    None,
                    None,
                    vendor.category,
                    None,
                    "ACTIVE",
                    now,
                    now,
                    now,
                )
                for vendor in vendors
            ],
        )
        conn.commit()
    finally:
        conn.close()


def main() -> None:
    args = parse_args()
    csv_path = Path(args.csv_path).expanduser().resolve()
    db_path = Path(args.db_path).expanduser().resolve()

    vendors, skipped_blank_description, skipped_duplicates = load_csv_rows(csv_path)
    rebuild_vendors_table(db_path, vendors)

    print(f"CSV path: {csv_path}")
    print(f"Database path: {db_path}")
    print(f"Imported vendors: {len(vendors)}")
    print(f"Skipped rows with blank description: {skipped_blank_description}")
    print(f"Skipped duplicate vendor rows: {skipped_duplicates}")


if __name__ == "__main__":
    main()

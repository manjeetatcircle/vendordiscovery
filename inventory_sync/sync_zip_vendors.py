from __future__ import annotations

from datetime import datetime, timezone

import requests

from inventory_sync.config import get_db_path, get_zip_api_key, get_zip_base_url
from inventory_sync.db import connect


HEADERS = {
    "accept": "application/json",
    "Zip-Api-Key": get_zip_api_key(),
}

ACTIVE_STATUS_VALUES = {"5"}


def fetch_all_vendors() -> dict:
    url = f"{get_zip_base_url()}/vendors"
    response = requests.get(url, headers=HEADERS, timeout=60)
    response.raise_for_status()
    return response.json()


def extract_active_vendor_rows(payload: dict) -> list[dict[str, str | None]]:
    items = payload.get("list", [])
    vendors: list[dict[str, str | None]] = []

    for item in items:
        vendor_id = item.get("id")
        vendor_name = item.get("name")
        vendor_description = item.get("description")
        vendor_status = item.get("status")

        if not vendor_name:
            continue

        if str(vendor_status) not in ACTIVE_STATUS_VALUES:
            continue

        vendors.append(
            {
                "zip_vendor_id": str(vendor_id) if vendor_id is not None else vendor_name,
                "vendor_name": vendor_name.strip(),
                "vendor_description": vendor_description.strip()
                if isinstance(vendor_description, str)
                else None,
                "vendor_status": str(vendor_status),
            }
        )

    return vendors


def upsert_vendors(vendors: list[dict[str, str | None]]) -> None:
    conn = connect(get_db_path())
    synced_at = datetime.now(timezone.utc).isoformat()

    sql = """
    INSERT INTO vendors (
        zip_vendor_id,
        vendor_name,
        vendor_description,
        requestor_name,
        vendor_status,
        synced_at
    )
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(zip_vendor_id) DO UPDATE SET
        vendor_name = excluded.vendor_name,
        vendor_description = COALESCE(excluded.vendor_description, vendors.vendor_description),
        vendor_status = excluded.vendor_status,
        synced_at = excluded.synced_at
    """

    rows = [
        (
            vendor["zip_vendor_id"],
            vendor["vendor_name"],
            vendor["vendor_description"],
            None,
            vendor["vendor_status"],
            synced_at,
        )
        for vendor in vendors
    ]

    conn.executemany(sql, rows)
    conn.commit()
    conn.close()


def main() -> None:
    payload = fetch_all_vendors()
    vendors = extract_active_vendor_rows(payload)
    print(f"Parsed {len(vendors)} active vendors")
    upsert_vendors(vendors)
    print(f"Synced {len(vendors)} active vendors into {get_db_path()}")


if __name__ == "__main__":
    main()

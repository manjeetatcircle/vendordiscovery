from __future__ import annotations

from datetime import datetime, timezone

import requests

from inventory_sync.config import get_db_path, get_zip_api_key, get_zip_base_url
from inventory_sync.db import connect


HEADERS = {
    "accept": "application/json",
    "Zip-Api-Key": get_zip_api_key(),
}


def normalize(name: str | None) -> str:
    if not name:
        return ""
    return (
        name.lower()
        .replace("inc.", "")
        .replace("inc", "")
        .replace("llc", "")
        .replace(",", "")
        .strip()
    )


def fetch_requests() -> dict:
    url = f"{get_zip_base_url()}/requests"
    response = requests.get(url, headers=HEADERS, timeout=60)
    response.raise_for_status()
    return response.json()


def extract_request_rows(payload: dict) -> list[dict[str, str | None]]:
    items = payload.get("list", [])
    rows: list[dict[str, str | None]] = []

    for item in items:
        vendor = item.get("vendor") or {}
        vendor_name = vendor.get("name")
        description = item.get("description") or item.get("name")
        requester = item.get("requester") or {}
        requestor_name = None

        if requester:
            first = requester.get("first_name", "")
            last = requester.get("last_name", "")
            requestor_name = f"{first} {last}".strip()

        if vendor_name and description:
            rows.append(
                {
                    "vendor_name": vendor_name.strip(),
                    "description": description.strip(),
                    "requestor_name": requestor_name,
                }
            )

    return rows


def update_vendors(rows: list[dict[str, str | None]]) -> int:
    conn = connect(get_db_path())
    synced_at = datetime.now(timezone.utc).isoformat()
    updated = 0

    for row in rows:
        normalized_input = normalize(row["vendor_name"])
        cursor = conn.execute("SELECT id, vendor_name FROM vendors")

        for vendor_id, db_name in cursor.fetchall():
            if normalize(db_name) == normalized_input:
                conn.execute(
                    """
                    UPDATE vendors
                    SET vendor_description = ?,
                        requestor_name = COALESCE(?, requestor_name),
                        synced_at = ?
                    WHERE id = ?
                    """,
                    (row["description"], row["requestor_name"], synced_at, vendor_id),
                )
                updated += 1
                break

    conn.commit()
    conn.close()
    return updated


def main() -> None:
    payload = fetch_requests()
    rows = extract_request_rows(payload)
    print(f"Parsed {len(rows)} request rows")
    updated = update_vendors(rows)
    print(f"Updated {updated} vendor rows")
    print("Finished request enrichment")


if __name__ == "__main__":
    main()

from __future__ import annotations

from inventory_sync.config import get_db_path
from inventory_sync.db import connect


def main() -> None:
    conn = connect(get_db_path())
    cursor = conn.cursor()
    rows = cursor.execute(
        """
        SELECT vendor_name, vendor_description, requestor_name
        FROM vendors
        WHERE vendor_description IS NOT NULL
        ORDER BY vendor_name
        LIMIT 30
        """
    ).fetchall()
    conn.close()

    print(f"Database: {get_db_path()}")
    print(f"Found {len(rows)} enriched rows\n")
    for row in rows:
        print(row)


if __name__ == "__main__":
    main()

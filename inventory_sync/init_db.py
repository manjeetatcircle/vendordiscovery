from __future__ import annotations

from inventory_sync.config import get_db_path
from inventory_sync.db import connect


SCHEMA = """
CREATE TABLE IF NOT EXISTS vendors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    zip_vendor_id TEXT UNIQUE,
    vendor_name TEXT NOT NULL,
    vendor_description TEXT,
    requestor_name TEXT,
    vendor_status TEXT,
    synced_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_vendors_name ON vendors(vendor_name);
"""


def main() -> None:
    db_path = get_db_path()
    conn = connect(db_path)
    conn.executescript(SCHEMA)
    conn.commit()
    conn.close()
    print(f"Initialized database: {db_path}")


if __name__ == "__main__":
    main()

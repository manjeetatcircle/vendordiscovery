from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv


REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_DB_PATH = REPO_ROOT / "data" / "vendor_inventory.db"

load_dotenv(REPO_ROOT / ".env")


def get_db_path() -> Path:
    raw_path = os.getenv("DATABASE_PATH", str(DEFAULT_DB_PATH))
    resolved = Path(raw_path)
    if not resolved.is_absolute():
        resolved = REPO_ROOT / resolved
    return resolved


def get_zip_base_url() -> str:
    return os.getenv("ZIP_BASE_URL", "https://api.ziphq.com")


def get_zip_api_key() -> str:
    api_key = os.getenv("ZIP_API_KEY")
    if not api_key:
        raise RuntimeError("ZIP_API_KEY is not set")
    return api_key

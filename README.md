# Vendor Discovery Tool

Internal web app for checking whether an existing vendor already provides a requested capability before onboarding a new solution.

## Stack

- Next.js App Router
- SQLite for local development
- Prisma ORM
- Tailwind CSS
- OpenAI for semantic ranking
- Zip API for inventory sync

## Features

- Natural-language vendor discovery search
- Search logging with user name/email and timestamp
- Local vendor inventory stored in SQLite
- Manual sync endpoint and weekly cron endpoint
- Mock inventory fallback before Zip sync is configured
- Requestor name and email surfaced in results

## Project structure

```text
app/
  api/
    admin/
      status/route.ts
      sync/route.ts
    cron/
      weekly-sync/route.ts
    search/route.ts
  admin/page.tsx
  results/page.tsx
  layout.tsx
  page.tsx
components/
  search-form.tsx
  search-results-card.tsx
  sync-status-panel.tsx
inventory_sync/
  config.py
  db.py
  init_db.py
  sync_zip_vendors.py
  sync_zip_requests.py
  check_vendors.py
lib/
  env.ts
  mock-data.ts
  prisma.ts
  vendor-search.ts
  vendor-sync.ts
  zip-api.ts
prisma/
  schema.prisma
data/
  vendor_inventory.db
scripts/
  run-sync.ts
```

## Environment variables

Copy `.env.example` to `.env` and set:

```bash
DATABASE_URL="file:./dev.db"
ZIP_API_KEY="..."
OPENAI_API_KEY="..."
INTERNAL_ADMIN_TOKEN="..."
CRON_SECRET="..."
```

Do not hardcode the Zip API key in source code. The user-provided key should be placed in `ZIP_API_KEY` locally or in deployment secrets.

## Setup

1. Install Node.js 18+ and npm.
2. Install dependencies:

```bash
npm install
```

3. Generate Prisma client and create the schema:

```bash
npm run db:generate
npm run db:push
```

4. Start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Repository organization

The project is split into two independent parts:

- Next.js web app:
  - UI, API routes, and Prisma-backed local search experience
- Python inventory sync tooling:
  - `inventory_sync/init_db.py`
  - `inventory_sync/sync_zip_vendors.py`
  - `inventory_sync/sync_zip_requests.py`
  - `inventory_sync/check_vendors.py`

The Python scripts maintain a separate SQLite inventory at `data/vendor_inventory.db`. This keeps inventory refresh logic independent from the web app code path.

Run the Python sync scripts from the repo root:

```bash
python3 -m inventory_sync.init_db
python3 -m inventory_sync.sync_zip_vendors
python3 -m inventory_sync.sync_zip_requests
python3 -m inventory_sync.check_vendors
```

To rebuild the app inventory from a vendor CSV with `Name`, `Categories`, and `Description`:

```bash
python3 -m inventory_sync.import_vendor_csv \
  --csv-path "/absolute/path/to/vendors.csv" \
  --db-path "prisma/dev.db"
```

Rows with blank descriptions are skipped.

## Search flow

1. User submits a natural-language request.
2. `/api/search` stores the raw query in `search_logs`.
3. The app loads vendor candidates from the local SQLite database.
4. If the vendor table is empty, mock inventory is used.
5. Stage 1 ranks candidates with keyword overlap.
6. Stage 2 optionally calls OpenAI to choose the best match and explain it.

## Zip vendor sync

Manual sync:

```bash
curl -X POST http://localhost:3000/api/admin/sync \
  -H "Authorization: Bearer $INTERNAL_ADMIN_TOKEN"
```

CLI sync:

```bash
npm run sync:vendors
```

Weekly cron:

```bash
curl http://localhost:3000/api/cron/weekly-sync \
  -H "x-cron-secret: $CRON_SECRET"
```

## Database tables

### `vendors`

- `vendor_id`
- `vendor_name`
- `vendor_description`
- `request_title`
- `request_description`
- `requestor_name`
- `requestor_email`
- `request_id`
- `department`
- `category`
- `subcategory`
- `status`
- `source_last_updated_at`
- `created_at`
- `updated_at`

### `search_logs`

- `query_text`
- `user_name`
- `user_email`
- `matched_vendor_id`
- `matched_vendor_name`
- `match_explanation`
- `created_at`

### `sync_runs`

- `started_at`
- `finished_at`
- `status`
- `records_processed`
- `error_message`

## Notes

- Search reads from the local database only. It does not call Zip live for each request.
- Local development uses SQLite via `file:./dev.db`, so no database server is required.
- `lib/zip-api.ts` assumes `GET /vendors` returns either an array or an object with `vendors` or `data`.
- If Zip requires related request detail endpoints for requestor name or description enrichment, extend `lib/zip-api.ts` and merge those records before calling `syncVendorsFromZip()`.
- The current OpenAI ranking path uses `gpt-4o-mini` and falls back to heuristic ranking when `OPENAI_API_KEY` is absent.

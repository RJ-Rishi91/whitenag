# NagmaniFoods ERP — Total Technology

## 1. Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | React 18 + Vite, React Router (`HashRouter`), Tailwind CSS, TanStack Query, Zustand, `socket.io-client` | Hosted on **GitHub Pages** |
| PWA | `vite-plugin-pwa` | Installable on Android, iOS, Windows |
| Backend | Node 20 + Express, Mongoose, Socket.IO, Zod validation, JWT, bcrypt, Pino logging | Hosted on **Render** |
| Database | **MongoDB Atlas** (M0 free to start) | Multi-document transactions are used for stock moves |
| Tally connector | **Python 3.11**, `requests`, `lxml`, `sqlite3`, packaged with PyInstaller | Runs on the Windows PC with TallyPrime |
| UI design | **Google Stitch** → export as reference, implemented in React/Tailwind | See Stitch prompt |
| PDF | `pdfmake` or server-side `puppeteer-core` alternative; start with `pdfmake` | Invoices and run sheets |
| Backups | GitHub Actions cron + `mongodump` | Nightly, to a private repo or Drive |

Keep dependencies minimal. No state-management or UI-kit sprawl.

## 2. Architecture

```
[PWA @ GitHub Pages] ⇄ HTTPS + Socket.IO ⇄ [Express API @ Render] ⇄ [MongoDB Atlas]
                                                     ▲
                       outbound HTTPS only (poll/push)│
                                                     │
                          [Python connector on Tally PC] ⇄ TallyPrime (http://localhost:9000, XML)
```

- Browser and connector both authenticate to the API. The connector uses a long-lived **API key** with a `connector` scope.
- Real-time: API emits Socket.IO events after each successful write. Clients invalidate TanStack Query caches on events. Do **not** rely on Mongo change streams.

## 3. Repo structure (monorepo)

```
nagmanifoods/
  web/            # React + Vite PWA
  api/            # Express + Mongoose
  connector/      # Python Tally connector
  docs/           # these md files
  .github/workflows/  deploy-web.yml  backup.yml
```

## 4. Environment variables

**api/.env**
```
PORT=5000
MONGODB_URI=
JWT_SECRET=
JWT_EXPIRES=12h
CORS_ORIGIN=https://<user>.github.io
CONNECTOR_API_KEY_HASH=
NODE_ENV=production
```

**web/.env**
```
VITE_API_URL=https://<service>.onrender.com
VITE_SOCKET_URL=https://<service>.onrender.com
```

**connector/config.ini**
```
[cloud]
api_url=https://<service>.onrender.com
api_key=
[tally]
host=localhost
port=9000
company=
poll_seconds=60
```

## 5. Data model (Mongoose collections)

All documents have `createdAt`, `updatedAt`, `createdBy`, and `sync` = `{ status: 'none|pending|synced|failed|conflict', tallyGuid, tallyAlterId, lastSyncedAt, error }` where relevant.

- `users` (name, username, mobile, passwordHash, roleId, active)
- `roles` (name, permissions[])
- `areas` (code, name, active)
- `godowns` (name, type, active, tallyGodown)
- `units` (name, symbol, tallyUnit)
- `items` (name, sku, category: raw|finished|packaging|other, unitId, gstRate, hsn, minStock, tallyGuid, active)
- `parties` (type: customer|supplier, name, mobile, altMobile, address, city, pincode, areaId, segment: b2b|b2c, b2bType, gstin, mapsUrl, lat, lng, creditDays, tallyGuid)
- `rate_history` (partyId, itemId, rate, orderId, date) → latest per party+item drives last-rate suggestion
- `stock_movements` (itemId, godownId, qty (+/−), type: purchase|production_in|consumption|reserve|release|pack|ship|transfer_in|transfer_out|adjustment|wastage, refType, refId, batchNo, rate, date, createdBy)
- `stock_levels` (itemId, godownId, physical, reserved) — denormalised cache updated in the same transaction as movements; rebuildable from movements
- `orders` (orderNo, partyId, segment, areaId, items[{itemId, qty, rate, discount, tax}], totals, paymentTerms, deliveryDetails, remarks, status, statusHistory[{status, at, by, note, payment}], challanNo, invoiceId)
- `invoices` (invoiceNo, orderId, partyId, type: b2b|b2c, challanNo, lines, totals, pdfUrl)
- `payments` (partyId, orderId?, invoiceId?, mode: cash|upi|online|bank|credit, amount, date, ref, direction: in|out, recordedBy)
- `purchases` (supplierId, invoiceNo, date, lines[], totals, paymentStatus, godownId)
- `boms` (productId, name, version, baseQty, lines[{itemId, qty}], active)
- `production_entries` (date, productId, qty, godownId, bomId, batchNo, wastage, lines[{itemId, bomQty, actualQty, variance}], remarks)
- `stock_transfers` (fromGodownId, toGodownId, lines[], date)
- `counters` (key, seq) for orderNo, invoiceNo, challanNo
- `sync_outbox` (entityType, entityId, operation: create|update|delete, payload, idempotencyKey, status: pending|sent|synced|failed|conflict, attempts, lastError, createdAt)
- `sync_inbox` (source: tally, entityType, tallyGuid, alterId, payload, status, receivedAt)
- `sync_log` (direction, entityType, entityId, result, message, at)
- `audit_log` (userId, action, entity, entityId, before, after, at)

## 6. Core backend rules

1. Every stock-changing action uses `session.withTransaction()`: write documents, `stock_movements`, update `stock_levels`, and insert `sync_outbox` in one transaction.
2. Reserve on order create, release on cancel/edit, convert reserve → ship movement on Shipped.
3. BOM consumption = `bom.line.qty × (qtyProduced / bom.baseQty)`, prefilled client-side, editable, validated server-side.
4. Counters via `findOneAndUpdate({$inc})` for gap-free-ish numbering.
5. Permission middleware: `requirePermission('order.pack')`.
6. Soft delete only. No hard deletes of business records.
7. Idempotency: outbox items carry an idempotency key; connector ack is safe to repeat.

## 7. API (REST, prefix `/api/v1`)

- `/auth/login`, `/auth/me`, `/auth/change-password`
- `/users`, `/roles`, `/areas`, `/godowns`, `/units`
- `/items`, `/parties` (+ `/parties/:id/rates`, `/parties/:id/ledger`)
- `/orders` (+ `POST /orders/:id/status`, `POST /orders/:id/payment`)
- `/invoices`, `/challans`
- `/payments`, `/cash-bank/summary`
- `/stock/levels`, `/stock/movements`, `/stock/transfers`, `/stock/adjustments`
- `/purchases`, `/boms`, `/production`
- `/reports/:name`, `/dashboard`, `/search`
- **Connector:** `GET /sync/pending`, `POST /sync/ack`, `POST /sync/fail`, `POST /sync/inbound`, `POST /sync/heartbeat`
- Admin sync: `/sync/log`, `/sync/conflicts`, `POST /sync/conflicts/:id/resolve`, `POST /sync/retry/:id`

## 8. Socket.IO events

Server emits after commit: `order:created`, `order:status`, `order:payment`, `stock:changed`, `purchase:created`, `production:created`, `sync:status`, `connector:status`. Clients join rooms by role and optionally area. JWT is verified on socket handshake.

## 9. Tally connector (Python)

**Run mode:** Windows service/startup app with tray status. TallyPrime must be open with the company loaded and **Tally acting as server/both on port 9000** (F1 Help → Settings → Connectivity → Client/Server configuration).

**Loop every `poll_seconds`:**
1. `POST /sync/heartbeat` (connector online, Tally reachable?)
2. **Push:** `GET /sync/pending` → for each item build Tally XML → POST to `localhost:9000` → parse `CREATED/ALTERED/ERRORS` → `POST /sync/ack` with Tally GUID/voucher no., or `/sync/fail` with the error
3. **Pull:** export masters and vouchers changed since last stored `ALTERID` (kept in local `sqlite`) → `POST /sync/inbound` in batches
4. Nightly: export GUID lists to detect deleted records

**Order of push:** masters (units, godowns, groups, ledgers, stock items) before vouchers.

**Example: create a Sales voucher**
```xml
<ENVELOPE>
  <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
  <BODY><IMPORTDATA>
    <REQUESTDESC>
      <REPORTNAME>Vouchers</REPORTNAME>
      <STATICVARIABLES><SVCURRENTCOMPANY>COMPANY NAME</SVCURRENTCOMPANY></STATICVARIABLES>
    </REQUESTDESC>
    <REQUESTDATA>
      <TALLYMESSAGE xmlns:UDF="TallyUDF">
        <VOUCHER VCHTYPE="Sales" ACTION="Create">
          <DATE>20261018</DATE>
          <VOUCHERNUMBER>INV-1025</VOUCHERNUMBER>
          <PARTYLEDGERNAME>Customer A</PARTYLEDGERNAME>
          <REFERENCE>ORD-1025</REFERENCE>
          <NARRATION>DC-000125 / SAVINA</NARRATION>
          <!-- ledger entries + ALLINVENTORYENTRIES.LIST with godown, qty, rate -->
        </VOUCHER>
      </TALLYMESSAGE>
    </REQUESTDATA>
  </IMPORTDATA></BODY>
</ENVELOPE>
```
Exact tags vary by Tally configuration (inventory on, GST on, voucher type settings). **Develop and verify against a test company and Tally's official integration docs before touching live data.**

**Mapping:** every app party/item/godown stores `tallyGuid`. Match on GUID; for first-time linking, match on exact name and send ambiguous cases to the duplicate review queue.

**Manufacturing** is posted to Tally as a Stock Journal (consumption and production) or Manufacturing Journal, depending on the company's setup; decide with the client's accountant.

**Failure handling:** Tally closed → items remain `pending`, connector retries with backoff; XML error → `failed` with Tally's message, visible on `/sync/log`; same record changed on both sides since last sync → `conflict`.

## 10. Conflict policy

See `PROJECT_EXPLAINER.md` §5 ownership table. Rules: GUID is identity; compare `alterId` and `updatedAt`; app-owned data never overwritten by Tally; posted vouchers edited in Tally create a conflict record with both versions; stock differences go to the reconcile report.

## 11. Security

- bcrypt password hashing, short-lived JWT, optional refresh token
- Role-permission checks on every route and socket join
- `helmet`, strict CORS to the Pages origin, rate limiting on `/auth` and connector routes
- Connector API key stored hashed, rotatable from Settings
- Input validation with Zod on every body
- Atlas: IP access list per Render outbound range or `0.0.0.0/0` with a strong DB user (free tier limitation), TLS only
- Secrets only in Render/GitHub secrets, never committed
- Audit log for all writes

## 12. Deployment

**Frontend (GitHub Pages)**
- Vite `base: '/<repo>/'`, `HashRouter`, `vite-plugin-pwa` scope set to the same base
- GitHub Action builds `web/` and deploys to Pages on push to `main`
- Custom domain optional (CNAME in `web/public`)

**Backend (Render)**
- Web Service from `api/`, build `npm ci`, start `node src/server.js`, health check `/health`
- Free tier sleeps after ~15 min; use an uptime ping every 5 min or the $7 Starter plan

**Database (Atlas)**
- M0 cluster, one DB user for the API, indexes created at startup (`orders.orderNo`, `parties.mobile`, `stock_movements.itemId+godownId`, `sync_outbox.status`)

**Backups**
- `.github/workflows/backup.yml`: nightly `mongodump`, compressed, uploaded to a private repo/Drive, 30-day retention. Document the restore procedure in `docs/RESTORE.md`.

## 13. Design tokens (from the Stitch design)

```
--color-primary:   #D9580B  (logo orange)
--color-secondary: #03353A  (logo deep teal)
--color-bg:        #FFF7EE  (warm cream)
--color-surface:   #FFFFFF
--color-border:    #EADFCF
--color-text:      #1E2B2D
--color-muted:     #6B7A7C
--color-success:   #2E7D32
--color-warning:   #ED6C02
--color-danger:    #C62828
--radius: 12px
Fonts: headings "Poppins" 600, body "Inter" 400/500
```

Status colours: Received = blue, Packed = amber, Shipped = purple, Delivered = green. Sync chips: Synced = green, Pending = amber, Failed = red, Conflict = orange.

## 14. Instructions for Antigravity (agent)

1. Read `PROJECT_EXPLAINER.md`, `PAGES.md`, this file, in that order.
2. Build in the phase order in the explainer. Finish and verify each phase before the next.
3. Phase 1 first: scaffold `api/` and `web/`, auth, roles, areas, godowns, units, items, parties, orders with status history and last-rate suggestion.
4. Never mutate stock quantities directly; always create `stock_movements` inside a transaction.
5. Every write that Tally should know about creates a `sync_outbox` row in the same transaction.
6. Use Stitch screens as visual reference, implement with Tailwind and the tokens above.
7. Prefer simple solutions; add a dependency only when it saves real work.
8. Write seed scripts: roles, 31 areas, units, sample godowns, sample items, BOM for Urad Papad.
9. Write minimal tests for the stock engine (reserve, release, produce, transfer) and BOM scaling.
10. Do not build the Python connector until Phase 4 is complete; then build against a Tally **test** company.
11. When requirements are ambiguous, choose the simplest reasonable option and list the assumption in `docs/ASSUMPTIONS.md`.

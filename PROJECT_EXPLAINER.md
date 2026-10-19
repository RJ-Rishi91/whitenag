# NagmaniFoods ERP — Project Explainer

> Read this first. It explains WHAT we are building and the business rules. `PAGES.md` lists every screen. `TECHNOLOGY.md` explains HOW it is built.

## 1. What is NagmaniFoods

NagmaniFoods is a mid-size FMCG food manufacturer (papad, khakhra, namkeen, masala, pickles) selling to B2B customers (wholesale, retailers, distributors) and B2C customers in and around Udaipur. Accounts are kept in **TallyPrime**.

## 2. What we are building

A single web app (installable as a PWA on Android, iOS and Windows) that runs the whole business:

```
PURCHASE → RAW MATERIAL STOCK → MANUFACTURING (BOM) → FINISHED GOODS STOCK
→ CUSTOMER ORDER → STOCK RESERVED → PACKED → SHIPPED → DELIVERED
→ INVOICE → PAYMENT → CUSTOMER LEDGER → CASH / BANK → TALLY
```

Everything is linked. One database, 5–6 users, real-time updates, and a connector that keeps **TallyPrime** and the app in sync so nothing is typed twice.

## 3. Users and roles

| Role | Can do |
|---|---|
| Admin | Everything, including users, permissions, areas, sync conflicts |
| Order User | Create/edit orders, customers, view stock |
| Packing User | Mark orders Packed, view reserved stock |
| Delivery User | Mark Shipped/Delivered, view area-wise lists and customer map links |
| Accounts User | Payments, receipts, invoices, cash/bank, Tally sync status |

Permissions are stored per role as a list of permission keys (e.g. `order.create`, `order.pack`, `payment.record`) and admin can edit them. 5–6 users total.

## 4. Core business rules (do not break these)

1. **Stock is never edited directly.** Every change is a row in `stock_movements` (purchase, production in, consumption, reserve, release, pack, ship, transfer, adjustment, wastage). Current stock = sum of movements. This gives history, audit and easy Tally sync.
2. **Physical − Reserved = Available.** Creating an order reserves stock in the chosen godown. If available < required, show a warning (admin can allow override).
3. **Stock per godown.** Every movement has a godown. Transfers create a paired out/in movement.
4. **Item categories:** Raw Material, Finished Goods, Packaging Material, Other.
5. **BOM scaling.** A BOM is defined for a base batch (e.g. 100 kg). Producing 50 kg uses 50% of each line, 200 kg uses 200%. BOMs can be created, edited, copied, versioned and activated/deactivated.
6. **Manufacturing entry** records: date, product, quantity produced, godown, BOM version, batch/lot number, wastage, and **actual** consumption per raw material (editable, pre-filled from BOM). Confirming it, in one transaction, decreases raw materials, increases finished goods and stores BOM-vs-actual variance.
7. **Closing stock** for raw materials = Opening + Purchases − Consumption ± Adjustments.
8. **Customer-wise last rate.** When an order line is added, the app suggests the last rate given to that customer for that product. User can override. Rate history is kept.
9. **Order workflow:** Order Received → Packed → Shipped → Delivered → Payment. Each step logs date, time, user, status and payment details. No skipping steps unless admin permits.
10. **Payment modes:** Cash, UPI, Online, Bank, Credit/Outstanding. Part payments allowed. Outstanding is calculated from the customer ledger.
11. **B2C Delivery Challan number:** auto-generated (e.g. DC-000125) or manually entered, saved on the order, linked to customer and invoice, printed on B2C invoice, searchable.
12. **Areas:** every customer has one area. Seed list: SEC 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, TITARDI, SAVINA, BALICHA, SURAJPOL, UDAIPOL, DELHIGATE, CHETAK, SARV RITU VILAS, SEVASHARAM, DURGA NURSERY, KUMARO KA BHATTA, ANAND PLAZA, KESHAV NAGAR, PAHADA, UNIVERSITY ROAD, KALKA MATA ROAD, CELEBRATION, SHOBHAGHPURA, UIT, KRISHI MANDI. Admin can add/edit/deactivate.
13. **Customer location:** saved as a Google Maps link and/or lat/lng, with "Open in Google Maps / Apple Maps" buttons.

## 5. Tally integration (summary)

- TallyPrime is the accounting system of record for posted vouchers.
- A **Python connector** runs on the Windows PC where TallyPrime runs. It talks to Tally on `localhost:9000` (XML over HTTP) and to our cloud API over **outbound HTTPS only**.
- **App → Tally:** every business event writes an entry into `sync_outbox`. When the connector is online and Tally is open, it pulls pending items, creates vouchers/masters in Tally, and reports back the Tally GUID. If Tally is closed or internet is down, items stay `pending` and drain automatically later.
- **Tally → App:** the connector periodically exports changed masters and vouchers (using `ALTERID`) and posts them to the API. Tally has no webhooks, so this is polling every 1–2 minutes.
- **Sync status per record:** Synced ✓, Pending, Failed, Conflict. There is a sync log screen and a conflict review screen.

### Ownership rules (to avoid conflicts)

| Data | Owner |
|---|---|
| Orders, workflow, delivery, challan, areas, BOM, manufacturing journal | App |
| Posted accounting vouchers | Tally (after sync); edits in Tally raise a conflict flag in the app |
| Masters: parties, items, godowns, units | Both, matched by Tally GUID; last-modified wins; same-name duplicates go to a manual review queue |
| Stock quantities | App is authority; Tally differences appear in a reconciliation report, never silently overwritten |

## 6. Phases

**Must do**
1. Foundation: auth, roles, masters, areas, customers, items, orders, status history, last-rate memory
2. Stock engine: movements, godowns, reserved/available, transfers
3. Purchase, raw material inventory, BOM, manufacturing journal, finished goods

**Should do**
4. Invoices (B2B/B2C, challan), PDF, WhatsApp share, payments, cash/bank
5. Connector v1: App → Tally (masters, sales, purchases, receipts)

**Nice to have / later**
6. Tally → App sync, conflict UI, reconciliation
7. Dashboard polish, full reports, limited offline order entry

## 7. Constraints and assumptions

- Free/low-cost hosting: GitHub Pages + Render + MongoDB Atlas. Render free tier sleeps; use a health ping or the paid $7 plan.
- Atlas M0 has no automated backups; a nightly `mongodump` GitHub Action is part of the project.
- TallyPrime must be open with the company loaded and the XML/HTTP server enabled for the connector to work.
- Built against a **test Tally company first**, never the live company.
- Offline use is limited: the app requires internet; Phase 7 may queue order entry offline.
- This is an unpaid project for a friend's business, so keep dependencies minimal and the code maintainable.

## 8. Brand

Name: **Nagfani Foods** (spelling taken from the supplied logo, `assets/logo.jpg`; confirm with the client). Logo colours: orange `#D9580B` and deep teal `#03353A`, on a warm cream background (see `TECHNOLOGY.md` tokens). Fast, tappable, mobile-first screens for warehouse and delivery staff.

## 9. Product catalogue (seed data)

`seed/products.json` holds 61 finished-goods SKUs imported from the client's "Product List with MRP" sheet: Papad (7, 500 g, ₹140–160), Khakhra (37, 200 g ₹60–70 and 500 g ₹140), Namkeen (8, 500 g ₹140), Aachar (6, 500 g ₹140–160), Masala (3, ₹100–200). Khakhra rows prefixed "MBL" are kept as `packagingVariant: "MBL"` (meaning to be confirmed with the client). These prices are **MRP**, used as the default/reference rate on orders; the customer-wise last rate still overrides it. Seed script should load this file into `items` with category `finished`. Raw materials, godowns and BOMs are not in the sheet and must be collected from the client.

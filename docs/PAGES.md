# NagmaniFoods ERP — Pages

Every screen in the app. Routes use `HashRouter` (GitHub Pages). **Roles:** A = Admin, O = Order, P = Packing, D = Delivery, AC = Accounts. All pages are mobile-first and responsive to desktop (sidebar layout on ≥1024px, bottom tab bar on mobile). Live updates via Socket.IO on every list.

## Global layout

- **Top bar:** NagmaniFoods logo, global search, sync status chip (Synced / Pending n / Failed / Conflict), user menu
- **Mobile bottom tabs:** Home, Orders, Stock, Deliveries, More
- **Desktop sidebar:** Dashboard, Orders, Customers, Delivery, Stock, Purchase, Manufacturing, Billing, Payments, Reports, Tally Sync, Settings

## 1. Auth

| Route | Page | Notes |
|---|---|---|
| `/login` | Login | Username/mobile + password, error states, forgot-password via admin reset |
| `/change-password` | Change password | Forced on first login |

## 2. Dashboard — `/` (all roles, widgets by permission)

Cards: today's sales, month sales, B2B vs B2C split, pending/packed/shipped/delivered counts, cash balance, bank balance, UPI collection, outstanding total, today's production, low-stock items, pending sync count. Charts: 30-day sales, area-wise delivery, top customers. Quick actions: New Order, New Purchase, New Production.

## 3. Orders

| Route | Page | Roles |
|---|---|---|
| `/orders` | Order board/list: tabs by status (Received, Packed, Shipped, Delivered, All), filters (area, date, B2B/B2C, payment status), search | A O P D AC |
| `/orders/new` | New order: customer picker (search by name/mobile), B2B/B2C auto from customer, add items with qty, **last-rate auto-suggest**, discount, area, payment terms, delivery details, remarks, stock availability warning | A O |
| `/orders/:id` | Order detail: items, totals, status timeline (date/time/user), payment records, challan no., invoice link, sync badge, actions per role (Pack / Ship / Deliver / Record payment) | all |
| `/orders/:id/edit` | Edit order (only before Packed unless admin) | A O |

## 4. Delivery

| Route | Page | Roles |
|---|---|---|
| `/delivery` | Area-wise delivery board: area chips, counts per status, list for selected area, "Open in Maps" per customer, bulk Ship/Deliver | A D P |
| `/delivery/area/:code` | Single area list: pending, packed, shipped, delivered; printable delivery list | A D |
| `/delivery/run-sheet` | Printable/PDF run sheet for a day and area | A D |

## 5. Customers

| Route | Page |
|---|---|
| `/customers` | List with filters (B2B/B2C, area, outstanding > 0), search by name/mobile |
| `/customers/new`, `/customers/:id/edit` | Form: name, mobile, alternate mobile, address, city, pincode, area, B2B type (wholesale/retailer/distributor/other) or B2C, Google Maps link / lat-lng, GST no., credit terms, Tally ledger link |
| `/customers/:id` | Profile: outstanding, order history, payment history, **rate history per product**, ledger, location buttons (Google/Apple Maps), Tally sync badge |

## 6. Inventory

| Route | Page |
|---|---|
| `/stock` | Overview tabs: Raw Material, Finished Goods, Packaging, Other. Columns: physical, reserved, available, per godown. Low-stock highlight |
| `/stock/items/:id` | Item ledger: all movements, godown-wise stock, purchase history, consumption history, last/average rate, valuation |
| `/stock/transfer` | Godown-to-godown transfer form + history |
| `/stock/adjustments` | Stock adjustment / wastage entry with reason |
| `/stock/reserved` | Reserved stock by order, stock required for pending orders |
| `/items` | Item master list (category, unit, GST, HSN, min stock, Tally link) |
| `/items/new`, `/items/:id/edit` | Item form |

## 7. Purchase

| Route | Page |
|---|---|
| `/purchases` | Purchase list, filters by supplier/date/payment status |
| `/purchases/new` | Supplier, date, invoice no., multiple raw-material lines (qty, unit, rate, GST, discount), total, payment status, receiving godown |
| `/purchases/:id` | Detail with sync badge |
| `/suppliers`, `/suppliers/new`, `/suppliers/:id` | Supplier master, purchase history, payable balance |

## 8. Manufacturing

| Route | Page |
|---|---|
| `/manufacturing` | Production journal list by date, product, batch |
| `/manufacturing/new` | Date, product, qty produced, godown, BOM version, batch/lot, **auto-calculated consumption table** (BOM qty vs editable actual qty, variance), wastage, remarks, Confirm |
| `/manufacturing/:id` | Detail: BOM vs actual, variance, stock effect, sync badge |
| `/boms` | BOM list (product, version, active status) |
| `/boms/new`, `/boms/:id/edit` | BOM editor: base batch qty, raw-material lines, copy, new version, activate/deactivate |

## 9. Billing

| Route | Page |
|---|---|
| `/invoices` | Invoice list, search by invoice no. / challan no. / customer |
| `/invoices/:id` | Invoice preview (B2B GST / B2C with **Delivery Challan No.**), company logo and details, Print, PDF, WhatsApp share, email share |
| `/challans` | Delivery challan list, searchable |

## 10. Payments, cash and bank

| Route | Page | Roles |
|---|---|---|
| `/payments` | Payments list by mode (Cash, UPI, Online, Bank, Credit), date | A AC D |
| `/payments/new` | Record receipt/payment against order or customer, part-payment | A AC D |
| `/cash-bank` | Cash balance, bank balance, daily collection, UPI collection, receipts and payments register | A AC |
| `/outstanding` | Customer outstanding list with ageing | A AC O |

## 11. Reports — `/reports`

Report hub with filter bar and CSV/PDF export:
- **Sales:** daily, monthly, customer-wise, product-wise, B2B, B2C, area-wise
- **Purchase:** supplier-wise, item-wise, date-wise, last purchase rate
- **Stock:** raw material, finished goods, godown-wise, available vs reserved, transfers, low stock
- **Manufacturing:** daily production, product-wise, consumption, BOM vs actual, wastage, batch/lot
- **Payments:** cash, bank, UPI, outstanding, payment history
- **Customers:** customer-wise purchase, outstanding, rate history, area-wise

## 12. Search — `/search?q=`

Global search across customer name, mobile, order no., invoice no., challan no., product, raw material, area, date, payment status, batch/lot no. Grouped results.

## 13. Tally sync (Admin, Accounts)

| Route | Page |
|---|---|
| `/sync` | Sync overview: connector online/offline and last seen, queue counts (pending, failed, conflict), last successful sync |
| `/sync/log` | Sync log with filters, retry button, error details |
| `/sync/conflicts` | Conflict review: App value vs Tally value side by side, choose "Keep app / Keep Tally / Merge" |
| `/sync/mapping` | Master mapping: App record ↔ Tally GUID, duplicate review queue |
| `/sync/reconcile` | Stock and party-balance difference report |

## 14. Settings (Admin)

| Route | Page |
|---|---|
| `/settings/users` | Users list, create, deactivate, reset password |
| `/settings/roles` | Role permission matrix (editable) |
| `/settings/areas` | Area codes: add, edit, deactivate |
| `/settings/godowns` | Godowns: add, edit, deactivate |
| `/settings/units` | Units and conversions |
| `/settings/company` | Company name, address, GSTIN, logo, invoice prefix and numbering, challan numbering |
| `/settings/tally` | Tally company name, connector API key, voucher type and ledger mapping (Sales, Purchase, Cash, Bank, UPI) |
| `/settings/backup` | Last backup info, export data |
| `/settings/audit` | Audit log: who changed what, when |

## 15. System pages

`/403` No access · `/404` Not found · offline banner · install-app prompt (PWA)

## Page count

About 55 routes. Build order: Auth → Settings masters → Customers/Items → Orders → Stock → Purchase → Manufacturing → Billing/Payments → Delivery polish → Reports/Dashboard → Sync screens.

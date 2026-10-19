# Nagfani Foods ERP (Udaipur, Rajasthan)

An enterprise-grade, real-time Food Manufacturing & Distribution ERP system tailored for **Nagfani Foods** (Udaipur, Rajasthan). Designed for high-volume sales of papad, khakhra, namkeen, pickles, and spices across B2B wholesale, distributor, retailer networks, and B2C channels, integrated with **TallyPrime**.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│               Nagfani Foods Web Client (Vite + React)       │
│               Port 5173 / GitHub Pages HashRouter           │
└──────────────────────────────┬──────────────────────────────┘
                               │ REST + Socket.io
┌──────────────────────────────▼──────────────────────────────┐
│           Nagfani Foods ERP API Server (Node / Express)     │
│                 Port 5000 / Multi-Doc ACID Transactions     │
└──────────────┬───────────────────────────────▲──────────────┘
               │                               │
               ▼                               │ HTTPS Polling
┌──────────────────────────────┐ ┌─────────────┴──────────────┐
│  MongoDB v7 (Replica Set rs0)│ │ Python TallyPrime Connector│
│  Port 27017                  │ │ (Local Windows PC Daemon)  │
└──────────────────────────────┘ └─────────────┬──────────────┘
                                               │ XML over HTTP
                                 ┌─────────────▼──────────────┐
                                 │   TallyPrime (Port 9000)   │
                                 └────────────────────────────┘
```

---

## Monorepo Structure

- **`api/`**: Node.js 22 + Express + Mongoose ES module backend.
  - Multi-document ACID transactions for all inventory movements (`session.withTransaction()`).
  - Strict immutable stock movements engine (`physical - reserved = available`).
  - Automated sequence generators (`ORD-`, `INV-`, `RCT-`, `PRD-`, `DC-`, `PO-`).
  - Real-time WebSocket event broadcasting for orders, stock, and sync statuses.
  - 16 modular route groups, RBAC middleware, and comprehensive unit/e2e test suites.
- **`web/`**: Modern React 19 + Tailwind CSS + Lucide Icons client.
  - `HashRouter` navigation (deployable directly to GitHub Pages or static host).
  - High-fidelity theme tokens (`#D9580B` saffron orange, `#03353A` deep teal, `#7A1F2B` royal maroon, `#FFF8EC` canvas).
  - 2-pane rapid order entry with auto last-rate memory per customer and live stock warning chips.
  - Interactive delivery board, production planner with smart BOM auto-scaling, customer ledger, and GST tax invoice generator.
- **`connector/`**: Standalone Python 3.11 TallyPrime daemon.
  - Polls `/sync/pending`, generates standard Tally XML vouchers (Sales, Receipt, Purchase, Stock Journal, Ledgers, Items).
  - Communicates with Tally on `localhost:9000` via XML over HTTP.
  - Includes a built-in Mock Tally HTTP server (`mock_tally_server.py`) for automated CI and Linux development.
- **`docs/`**: Architecture diagrams, data models, business rules, and technical specifications (`PROJECT_EXPLAINER.md`, `TECHNOLOGY.md`, `PAGES.md`, `ASSUMPTIONS.md`).

---

## Quick Start Guide

### 1. Prerequisites
- Node.js >= 20.x
- Python >= 3.10
- MongoDB >= 6.0 configured with a replica set (required for multi-document ACID transactions)

### 2. Start Database (Replica Set `rs0`)
```bash
mongod --dbpath ~/.mongodb/nagmani-data --replSet rs0 --port 27017
```

### 3. Setup & Start Backend API
```bash
cd api
npm install
npm run seed     # Seeds roles, users, 31 Udaipur areas, 61 products, 13 raw materials, BOM recipe
npm start        # Starts on port 5000
```

### 4. Setup & Start Frontend Web App
```bash
cd web
npm install
npm run dev      # Starts on http://localhost:5173
```

### 5. Run Tally Connector (Dev / Test Mode)
```bash
cd connector
# Terminal 1: Run Mock Tally Server (simulates Tally on port 9000)
python3 mock_tally_server.py

# Terminal 2: Run Connector Daemon
python3 connector.py
```

---

## Automated Test Suites

### 1. Stock Engine & Transaction Suite
Tests ACID atomic stock reservations, releases, shipments, warehouse transfers, and BOM scaling:
```bash
cd api
npm test
```

### 2. End-to-End Complete Business Flow Verification
Executes the full lifecycle: Order creation -> Stock reservation -> Packing -> Shipping -> Delivery -> GST Invoice generation -> UPI Payment receipt -> Manufacturing batch with BOM recipe consumption -> Outbox queue -> Tally XML export and ACK:
```bash
cd api
node scripts/verify_e2e_flow.js
```

### 3. Python Tally XML Test Suite
```bash
cd connector
python3 -m unittest test_connector.py
```

---

## Default System Credentials

| Role | Username | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `admin123` | Complete system access, settings, sync management |
| **Order Desk** | `order` | `order123` | Customer management, rate memory, order creation |
| **Packing Staff** | `packing` | `pack123` | Packing queue, box packing verification |
| **Delivery Staff**| `delivery`| `delivery123`| Dispatch, delivery run sheets, challan delivery |
| **Accounts Staff**| `accounts`| `accounts123`| Billing, invoices, payments register, Tally sync |

---

## Key Modules & Routes

- **Dashboard**: `#/` — Real-time sales metrics, status counts, outstanding, low stock alerts, live WebSocket sync.
- **Orders**: `#/orders`, `#/orders/new`, `#/orders/:id` — 2-pane rapid order entry with per-customer rate history auto-fill.
- **Delivery Board**: `#/delivery` — Visual Kanban board (Received -> Packed -> Shipped -> Delivered).
- **Stock Management**: `#/stock`, `#/stock/transfer`, `#/stock/adjustments` — Godown overview, inter-warehouse transfers.
- **Manufacturing**: `#/manufacturing`, `#/manufacturing/new`, `#/boms` — Recipe manager and production journal with automatic BOM ingredient consumption.
- **Billing & Tax Invoices**: `#/invoices`, `#/invoices/:id` — GST compliant invoice preview with printable format.
- **Payments & Outstanding**: `#/payments`, `#/outstanding` — Payment registration and aging customer receivables.
- **Tally Sync Center**: `#/sync`, `#/sync/conflicts`, `#/sync/mapping` — Connector health, pending outbox, and audit logs.

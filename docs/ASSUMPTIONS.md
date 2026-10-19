# Nagfani Foods ERP — Project Assumptions & Decisions

This document records architectural, business logic, and operational assumptions made during development.

## 1. Brand Identity
- **Name:** "Nagfani Foods" (matching the registered trademark logo and logo asset).
- **Brand Colors:** Orange (`#D9580B` / primary accent `#E8A317`), Deep Teal (`#03353A`), Dark Maroon (`#7A1F2B`), Warm Cream Canvas (`#FFF8EC` / `#FFF7EE`), Surface (`#FFFFFF`), Border (`#EADBC8`).

## 2. Inventory & Stock Engine
- **Single Source of Truth:** `stock_movements` collection records every physical event.
- **Denormalized Cache:** `stock_levels` stores current `physical` and `reserved` quantities per `(itemId, godownId)`.
- **Available Formula:** `available = physical - reserved`.
- **Transactions:** All stock state transitions (Order reservation, shipping, purchase inward, production consumption/inward, adjustments, transfers) execute within a MongoDB multi-document session transaction (`session.withTransaction()`).
- **Initial Godowns:** 
  1. Factory Godown (Production & bulk raw material storage)
  2. Main Warehouse / Central Godown (Primary finished goods distribution)
  3. Retail Godown (Direct store / counter inventory)

## 3. Product Catalog & Packaging
- 61 finished goods SKUs imported from `products.json`.
- Standard Finished Unit: `pcs (pack)`.
- Raw materials created with units `kg` or `g`.
- Khakhra SKUs with prefix `MBL` treated as packaging variant `MBL` (standard commercial blister/vacuum packaging variant).

## 4. Tally Connector & Outbox
- Dual-write pattern: every business event impacting accounting or stock inserts a pending entry into `sync_outbox` within the same transaction.
- The Python connector polls `sync_outbox`, communicates with TallyPrime on port 9000, and acknowledges completion or reports failure back to the API.

## 5. Security & Authentication
- Password hashing with `bcryptjs`.
- Stateless JWT authentication with role & permission claims.
- Role-based permissions matrix supporting Admin, Order User, Packing User, Delivery User, and Accounts User.

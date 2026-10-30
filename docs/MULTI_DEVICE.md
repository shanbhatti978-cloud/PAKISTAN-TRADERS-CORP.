# Pakistan Trader Corporation — Multi-Device & Multi-User Cloud Architecture Guide

## Executive Summary
Pakistan Trader Corporation Instalment & Inventory System currently operates as a high-performance, offline-first, client-side application. All business data (agreements, stock levels, cashbook entries, receipts, user accounts, and cryptographic activity audit chains) are stored securely on the local device using browser `localStorage` under `qistflow_*` key namespaces.

This architecture ensures zero latency, offline durability in regions with poor connectivity, and complete data privacy without recurring cloud infrastructure costs.

---

## Single-Device vs. Multi-Device Capabilities

| Feature | Current Offline Architecture | Cloud Backend Architecture (Supabase / Firebase) |
| :--- | :--- | :--- |
| **Storage Engine** | Local Device `localStorage` | Hosted Relational / Document Database |
| **Offline Performance** | Instant (0ms response time) | Requires local cache sync layer |
| **Multi-Staff Login** | Shared single device with account switching | Real-time multi-device sync across phones |
| **Data Backup** | Manual Encrypted JSON export/import | Automated continuous cloud backups |
| **Cloud Dependency** | None (works offline indefinitely) | Requires internet for real-time multi-device sync |

---

## When to Migrate to Multi-Device Cloud Sync
Migrating to a multi-device backend is recommended when:
1. Multiple shop branches or field collection agents need to record payments simultaneously on separate mobile devices.
2. Real-time central dashboard monitoring is required by offsite owners.
3. Automatic, offsite continuous database backups are desired without manual file export.

---

## Recommended Multi-Device Cloud Options

### Option 1: Supabase (PostgreSQL + RLS + Realtime) — *Recommended*
- **Database**: PostgreSQL with Row-Level Security (RLS) enforcing Admin / Supervisor / Viewer access control.
- **Realtime**: Instant WebSocket table subscriptions for real-time payment and inventory sync across counter smartphones.
- **Auth**: Built-in PBKDF2/Bcrypt password hashing and JWT session handling.

### Option 2: Firebase Firestore (NoSQL + Security Rules)
- **Database**: Document store organized by collections (`agreements`, `stock`, `payments`, `cashbook`, `users`).
- **Security**: Declared security rules matching `PermissionManager` action matrix.
- **Offline Support**: Native Firestore offline persistent cache for Web and Android Capacitor apps.

---

## Step-by-Step Cloud Migration Plan

### Step 1: Backup Local Data
Export a password-encrypted JSON database backup from **Settings → Data Management → Backup & Security**. Keep this file safe.

### Step 2: Provision Cloud Instance
Create a new Supabase or Firebase project, set up environment variables in `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`), and construct tables matching `types.ts` data definitions (`Customer`, `StockItem`, `Agreement`, `Payment`, `CashBookEntry`, `User`).

### Step 3: Adapter Layer Replacement
In `src/data/store.ts`, replace `getStored()` and `setStored()` calls with a dual-write sync adapter:
- Read: On initial app load, fetch records from cloud database and populate local React state.
- Write: On every store action (`recordPayment`, `createAgreement`, `receiveStock`), execute local state transition and push async mutation to cloud database.

### Step 4: Historical Data Import
Use the built-in backup restore mechanism or a script to populate the cloud database with your exported JSON backup file. All historical agreement numbers, payments, and cost layers will be seamlessly preserved.

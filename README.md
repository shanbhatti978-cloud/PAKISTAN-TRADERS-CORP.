# Pakistan Trader Corporation – Instalment & Inventory System

An offline-first enterprise retail management and hire-purchase (instalment) accounting system developed for **Pakistan Trader Corporation** (specializing in home appliances, motorcycles, mobile phones, and consumer electronics).

Packaged as an installable Android APK with **Capacitor 8** and also runnable as a desktop/web application.

---

## Key Business Capabilities

1. **Hire-Purchase (Instalment) Accounting**
   - Precise schedule calculations guaranteeing that `downPayment + sum(monthlyInstallments) === totalContractPrice` down to the exact rupee.
   - Day-of-month clamping (e.g. Day 31 clamped cleanly to Feb 28/29, April 30) without leaking into following months.
   - Local calendar dates (`Asia/Karachi` UTC+5) preserving local transaction days across APK restarts.
   - Multi-slot overpayment auto-allocation and reversible transactions with strict cash-in/cash-out balance symmetry.

2. **Inventory & Serial Tracking**
   - Serialized inventory (IMEI / Engine / Chassis numbers).
   - Multi-location stock (Counter 1, Display Rack, Warehouse).
   - Non-destructive supplier unit cost tracking for accurate Gross Margin & COGS reporting.

3. **Cashbook & Dual-Entry Ledger**
   - Real-time cashbook tracking all down payments, instalment receipts, supplier purchases, and shop operating expenses.
   - Automated reversal accounting restoring prior agreement statuses, receipt numbers, and cash balances.

4. **Role-Based Access Control (RBAC)**
   - **ADMIN**: Unrestricted access, user management, factory reset, encrypted database restore, payment reversals.
   - **SUPERVISOR**: Day-to-day operations (add agreements, collect payments, receive stock). Strictly blocked from destructive actions (cannot delete customers, agreements, or restore databases).
   - **VIEWER**: Read-only ledger viewing and reporting.

5. **Security & Cryptography**
   - WebCrypto PBKDF2 (100,000 iterations) with unique per-user 16-byte cryptographic salts.
   - Brute-force throttling with 5-attempt rate limits and 30-second lockout cooldowns.
   - Optional AES-GCM 256-bit password-protected database backups.
   - Automatic pre-restore snapshot creation to protect against accidental overwrites.

6. **Credit Intelligence & Recovery (Gemini AI + Offline Fallback)**
   - Smart customer risk scoring evaluating debt-to-income ratios, advance payment safety buffers, and guarantor backing.
   - Zero external dependency: Works 100% offline with a built-in deterministic rule engine in APK mode, and connects to Gemini 2.5 Flash when online with full applicant data anonymization.
   - Culturally respectful, multi-language recovery reminders (Urdu, Roman Urdu, English) with direct WhatsApp integration.

---

## Technology Stack

- **Framework**: React 19 + TypeScript + Vite 8
- **Styling**: Tailwind CSS 4 + Material Design 3 Glass Material Theme Engine
- **Mobile Packaging**: Capacitor 8 (Android SDK 34 / 35, Java 21)
- **Document & Data Engine**: jsPDF (A5 receipts & A4 agreements), SheetJS (XLSX reports)
- **Storage**: Offline `localStorage` with automated migration guards and AES-GCM backup encryption

---

## Development & Build Commands

### Prerequisites
- Node.js 20+ (Node 22 recommended)
- Java JDK 21 (for Android APK builds)
- Android Studio / Android SDK cmdline-tools

### Development Server
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Type Check & Linting
```bash
npm run lint
```

### Production Web Build
```bash
npm run build
```
Build output is generated into the `dist/` directory.

### Building Android APK (Capacitor)
```bash
# 1. Build web bundle
npm run build

# 2. Sync web assets with Capacitor Android native container
npx cap sync android

# 3. Build Debug APK via Gradle
cd android
./gradlew assembleDebug --no-daemon
```
The output APK is generated at:
`android/app/build/outputs/apk/debug/app-debug.apk`

---

## License & Proprietary Notice

Proprietary software for Pakistan Trader Corporation. All business logic, client ledgers, and financial schemas are configured specifically for retail hire-purchase operations under Pakistani legal and commercial standards.

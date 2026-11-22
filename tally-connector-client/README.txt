=====================================================================
    NAGFANI FOODS ERP - TALLYPRIME LIVE GATEWAY (WINDOWS SETUP)
=====================================================================

Welcome to the Nagfani Foods Tally Live Gateway!
This dedicated desktop software connects your laptop's TallyPrime
directly with the Nagfani Cloud ERP in real time.

KEY FEATURES IN THIS VERSION:
1. Dedicated Greeting & Branding:
   - Time-of-day greeting (Good Morning / Afternoon / Evening)
   - Clean Nagfani Foods visual theme and company indicator.

2. Step 1 — [Connect] Button:
   - One-click connection test that queries both TallyPrime (Port 9000)
     and Cloud ERP.
   - Shows live testing progress, then displays a clear green
     "🟢 CONNECTED" status when all systems are operational.

3. Step 2 — [Merge & Update Data] Option:
   - One-click master and transaction merge.
   - Shows live "⏳ Updating..." progress as it:
       • Pulls Customer & Supplier ledgers from Tally
       • Pulls Stock items and closing balances
       • Merges them into Cloud ERP
       • Clears and posts pending sales vouchers into Tally
   - Displays a prominent "✅ Up to Date" confirmation when complete.

4. Live Request Stream & Search:
   - Instant search filter to inspect all live XML requests, responses,
     voucher numbers, and sync status codes in real time.

5. Safe Testing & Settings:
   - [Test Safe Entry]: Posts a non-disruptive test ledger into Tally.
   - [Settings]: Adjust Tally port (default 9000), Company Name, or Cloud API URL.
   - [Background Auto-Sync]: 3-second continuous background synchronization.

---------------------------------------------------------------------
QUICK 2-STEP WINDOWS SETUP:
---------------------------------------------------------------------
Step 1: Extract this folder anywhere on your Windows PC (e.g. C:\NagfaniConnector).
Step 2: Double-click "Setup_Windows.bat".
        It verifies Python, installs required packages, and creates
        a "Nagfani Tally Connector" shortcut right on your Desktop!

After setup, launch the software anytime via the Desktop shortcut or
"Launch_Nagfani_Connector.bat". It runs cleanly without console windows.
=====================================================================

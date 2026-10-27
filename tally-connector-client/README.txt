=====================================================================
    NAGFANI FOODS ERP - TALLYPRIME LIVE GATEWAY (WINDOWS SETUP)
=====================================================================

Welcome to the Nagfani Foods Tally Gateway!
This lightweight desktop tool runs seamlessly alongside Livekeeping without
interfering with your existing setup.

WHAT THIS SOFTWARE DOES:
1. Welcome Screen & Branding: Clean Nagfani Foods interface.
2. Live Connectivity Dashboard:
   - TallyPrime (Port 9000): Checks if Tally is open and responding.
   - Cloud ERP API: Checks live cloud connection & heartbeat.
   - Sync Outbox Queue: Shows pending vouchers and real-time status.
3. Live Search & Activity Filter:
   - Instant search bar to search any incoming/outgoing request or error.
4. One-Click Controls:
   - [Test Connection]: Verifies Tally + Cloud in 1 second.
   - [Test Safe Entry]: Posts safe test ledger to Tally without touching accounts.
   - [Pull Masters from Tally]: 1-click import of Debtors, Creditors & Stock into ERP.
   - [Settings]: Adjust Company Name, Tally Port, and API URL anytime.

---------------------------------------------------------------------
QUICK 2-STEP WINDOWS SETUP:
---------------------------------------------------------------------
Step 1: Extract this folder anywhere on your computer (e.g. C:\NagfaniConnector).
Step 2: Double-click "Setup_Windows.bat".
        It will automatically verify Python, install dependencies, and create
        a "Nagfani Tally Connector" shortcut right on your Desktop!

After setup, simply double-click the desktop shortcut or "Launch_Nagfani_Connector.bat".
It launches with ZERO black terminal windows—just like Livekeeping.

---------------------------------------------------------------------
FILES INCLUDED IN THIS PACKAGE:
---------------------------------------------------------------------
- Setup_Windows.bat            : One-click setup & Desktop shortcut creator
- Launch_Nagfani_Connector.bat : Quick launcher (or use Desktop shortcut)
- Launch_Nagfani_Connector.vbs : Silent launcher (no console window)
- Build_Standalone_EXE.bat     : Compiles a standalone .exe if needed
- connector_gui.py             : Main desktop graphical application
- config.ini                   : Server URL, port & credentials
- pull_tally_masters.py        : Master extraction engine
- tally_xml.py                 : High-speed Tally XML generator
- test_make_entry.bat          : Standalone safe entry diagnostic test

SUPPORT:
If you need any adjustments, click [Settings] inside the software or contact support.
=====================================================================

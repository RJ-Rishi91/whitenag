================================================================
   NAGFANI FOODS ERP - TALLYPRIME LIVE CONNECTOR & SYNC
================================================================

QUICK SETUP ON CLIENT'S PC (OVER ANYDESK):

STEP 1: TEST TALLY CONNECTIVITY
-------------------------------
1. In TallyPrime, make sure "NAGFANI FOODS" is open.
2. Double-click "test_tally.bat".
   It will check port 9000 and say:
   "[SUCCESS] TallyPrime is responding on port 9000!"
   (Since Livekeeping is already installed on this PC, Tally is already configured!)

STEP 2: ONE-CLICK IMPORT REAL CLIENTS & STOCK (LIVEKEEPING STYLE)
-----------------------------------------------------------------
1. Double-click "sync_from_tally.bat".
2. It will automatically pull:
   - All Customer & Supplier Ledgers (Sundry Debtors & Creditors)
   - Real Tally Closing Balances & Outstandings
   - Phone Numbers, GSTINs, and Addresses
   - Real Stock Items and Closing Quantities
3. All your real Tally data will instantly appear in the Nagfani ERP web portal!

STEP 3: RUN THE CONTINUOUS TWO-WAY CONNECTOR
--------------------------------------------
1. Double-click "run_connector.bat".
2. It will continuously poll for new orders, invoices, and payment receipts
   created on mobile/web and post them directly into Tally.
3. Check the cloud ERP dashboard at:
   https://nagmani.onerishi.in/#/v3/sync
   Indicator will turn GREEN!

Need Help?
Contact Developer / Administrator.

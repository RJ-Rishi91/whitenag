================================================================
   NAGFANI FOODS ERP - TALLYPRIME LIVE CONNECTOR SETUP
================================================================

QUICK 3-STEP SETUP ON CLIENT'S PC:

STEP 1: CONFIGURE TALLYPRIME
-----------------------------
1. Open TallyPrime on this computer.
2. Load your company (e.g. Nagfani Foods).
3. Press [F1: Help] on top right -> [Settings] -> [Connectivity].
4. Set Client/Server Configuration:
   - TallyPrime acts as: BOTH
   - Enable ODBC: YES
   - Port: 9000
5. Press [Ctrl + A] to save.
6. Click YES to restart TallyPrime.
7. Open your company again.
8. Double-click "test_tally.bat" in this folder. It should say "[SUCCESS] TallyPrime is responding on port 9000!".

STEP 2: CHECK COMPANY NAME IN CONFIG.INI
-----------------------------------------
1. Open "config.ini" in Notepad.
2. Check the line:
   company = Nagfani Foods
   Make sure this matches the EXACT company name shown in TallyPrime.
   If different (e.g., "Nagfani Foods Pvt Ltd"), change it and Save.

STEP 3: RUN THE CONNECTOR
--------------------------
1. Double-click "run_connector.bat".
   (It will check Python, install requests, and connect to Tally & Cloud ERP).
2. You will see:
   [INFO] [TallyConnector] Starting Nagfani Foods Tally Connector...
   [INFO] [TallyConnector] Heartbeat posted: Tally online, company='Nagfani Foods'

Done! Check the ERP dashboard at:
https://nagmani.onerishi.in/#/v3/sync
The indicator will turn GREEN!

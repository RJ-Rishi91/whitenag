# Nagfani Foods ERP - TallyPrime Connector

Standalone Python connector running on the local PC where TallyPrime runs. It communicates with TallyPrime on `http://localhost:9000` via XML-over-HTTP and connects outbound to the Nagfani Foods ERP Cloud API.

---

## Architecture

```
[ Nagfani Foods ERP API ] (Cloud/Port 5000)
         │  ▲
         │  │ Outbound HTTPS Polling (/sync/pending, /sync/ack, /sync/fail)
         ▼  │
 [ Python Connector Daemon ]
         │  ▲
         │  │ Local XML over HTTP (port 9000)
         ▼  │
 [ TallyPrime (Port 9000) ]
```

---

## 1. Quick Local Test (with Mock Tally Server)

To verify the connector without TallyPrime installed:

1. **Start Mock Tally Server** (simulates Tally on port 9000):
   ```bash
   python3 mock_tally_server.py
   ```

2. **Run Unit Tests**:
   ```bash
   python3 -m unittest test_connector.py
   ```

3. **Run One Sync Cycle**:
   ```bash
   python3 connector.py --run-once
   ```

4. **Run as Continuous Background Service**:
   ```bash
   python3 connector.py
   ```

---

## 2. Windows PC Production Setup (with TallyPrime)

### Step 1: Configure TallyPrime
1. Open TallyPrime with the **Nagfani Foods** company loaded.
2. Press **F1: Help** → **Settings** → **Connectivity**.
3. Set **Client/Server Configuration**:
   - `TallyPrime acts as`: **Both** or **Server**
   - `Port`: **9000**
4. Restart TallyPrime and reload your company.
5. Verify in browser: `http://localhost:9000` should display Tally Server information.

### Step 2: Install Python & Dependencies
```cmd
python -m pip install -r requirements.txt
```

### Step 3: Configure `config.ini`
Edit `config.ini` with your ERP API URL and connector key:
```ini
[app]
api_url = https://your-erp-domain.com/api/v1
api_key = nagfani_connector_api_key_secure_2026
poll_interval = 10

[tally]
url = http://localhost:9000
company = Nagfani Foods
timeout = 5
```

### Step 4: Run as Windows Service or Startup Task
You can run it directly:
```cmd
python connector.py
```
Or package with PyInstaller:
```cmd
pyinstaller --onefile --name NagfaniTallyConnector connector.py
```
And add `NagfaniTallyConnector.exe` to Windows Startup (`shell:startup`).

---

## 3. Supported Entities
- **Ledgers (`party`)**: Auto-creates Customers under *Sundry Debtors* and Suppliers under *Sundry Creditors* with GSTIN, address, and credit terms.
- **Stock Items (`item`)**: Auto-creates Finished Goods & Raw Materials with HSN codes, GST rates, and base units.
- **Sales Invoices (`invoice`)**: Posts complete Sales Vouchers with multi-inventory batches, CGST, SGST, IGST, and party billing allocations.
- **Receipt Vouchers (`payment`)**: Posts customer receipts with ledger allocation (Cash, Bank, UPI).
- **Purchase Vouchers (`purchase`)**: Posts raw material inward purchases with inventory batches and supplier credits.

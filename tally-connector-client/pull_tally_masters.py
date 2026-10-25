"""
Nagfani Foods ERP - TallyPrime Master Importer (Livekeeping Style)
Pulls genuine Parties (Sundry Debtors & Creditors) and Stock Items from TallyPrime (port 9000)
and securely uploads them into Nagfani Foods ERP Cloud API.
"""

import os
import sys
import configparser
import xml.etree.ElementTree as ET
import requests
import re


def load_config(config_path="config.ini"):
    cfg = configparser.ConfigParser()
    if os.path.exists(config_path):
        cfg.read(config_path)

    api_url = os.getenv("API_URL", cfg.get("app", "api_url", fallback="http://localhost:5000/api/v1"))
    api_key = os.getenv("API_KEY", cfg.get("app", "api_key", fallback="nagfani_connector_api_key_secure_2026"))
    tally_url = os.getenv("TALLY_URL", cfg.get("tally", "url", fallback="http://localhost:9000"))
    company = os.getenv("TALLY_COMPANY", cfg.get("tally", "company", fallback="NAGFANI FOODS"))
    timeout = int(os.getenv("TALLY_TIMEOUT", cfg.get("tally", "timeout", fallback="10")))

    return api_url, api_key, tally_url, company, timeout


def clean_num(val_str):
    if not val_str:
        return 0.0
    match = re.search(r"[-+]?\d*\.?\d+", val_str)
    if match:
        try:
            return float(match.group())
        except ValueError:
            return 0.0
    return 0.0


def query_tally(tally_url, xml_query, timeout=10):
    try:
        res = requests.post(
            tally_url,
            data=xml_query.encode("utf-8"),
            headers={"Content-Type": "text/xml; charset=utf-8"},
            timeout=timeout,
        )
        if res.status_code == 200:
            return res.text
        return None
    except Exception as e:
        print(f"[ERROR] Failed to communicate with Tally: {e}")
        return None


def fetch_ledgers(tally_url, company, timeout=10):
    xml_req = f"""<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Export Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <EXPORTDATA>
      <REQUESTDESC>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>{company}</SVCURRENTCOMPANY>
          <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
        </STATICVARIABLES>
        <TDL>
          <TDLMESSAGE>
            <COLLECTION NAME="LedgersCollection" ISMODIFY="No">
              <TYPE>Ledger</TYPE>
              <FETCH>NAME, PARENT, CLOSINGBALANCE, LEDGERPHONE, LEDGERMOBILE, PARTYGSTIN, ADDRESS, PINCODE, BILLCREDITPERIOD, GUID</FETCH>
            </COLLECTION>
          </TDLMESSAGE>
        </TDL>
      </REQUESTDESC>
    </EXPORTDATA>
  </BODY>
</ENVELOPE>"""

    xml_resp = query_tally(tally_url, xml_req, timeout)
    if not xml_resp:
        return []

    parties = []
    try:
        root = ET.fromstring(xml_resp)
        for led in root.iter("LEDGER"):
            name = led.findtext("NAME") or led.get("NAME")
            parent = led.findtext("PARENT") or ""
            
            # Filter for Debtors and Creditors
            p_lower = parent.lower()
            if not ("debtor" in p_lower or "creditor" in p_lower):
                continue

            balance_str = led.findtext("CLOSINGBALANCE") or "0"
            mobile = led.findtext("LEDGERMOBILE") or led.findtext("LEDGERPHONE") or ""
            gstin = led.findtext("PARTYGSTIN") or ""
            pincode = led.findtext("PINCODE") or ""
            guid = led.findtext("GUID") or ""

            # Extract full address lines
            addr_lines = []
            for addr in led.iter("ADDRESS"):
                if addr.text and addr.text.strip():
                    addr_lines.append(addr.text.strip())
            address = ", ".join(addr_lines)

            # Credit period (e.g. '15 Days')
            credit_period = clean_num(led.findtext("BILLCREDITPERIOD") or "0")

            parties.append({
                "name": name.strip(),
                "parent": parent.strip(),
                "type": "customer" if "debtor" in p_lower else "supplier",
                "balance": clean_num(balance_str),
                "mobile": mobile.strip(),
                "address": address,
                "gstin": gstin.strip(),
                "pincode": pincode.strip(),
                "creditDays": int(credit_period),
                "tallyGuid": guid.strip() or f"TALLY-{name.strip()}"
            })
    except Exception as e:
        print(f"[WARN] Error parsing ledgers XML: {e}")

    return parties


def fetch_stock_items(tally_url, company, timeout=10):
    xml_req = f"""<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Export Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <EXPORTDATA>
      <REQUESTDESC>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>{company}</SVCURRENTCOMPANY>
          <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
        </STATICVARIABLES>
        <TDL>
          <TDLMESSAGE>
            <COLLECTION NAME="StockCollection" ISMODIFY="No">
              <TYPE>StockItem</TYPE>
              <FETCH>NAME, BASEUNITS, CLOSINGBALANCE, CLOSINGRATE, CLOSINGVALUE, PARENT, GUID</FETCH>
            </COLLECTION>
          </TDLMESSAGE>
        </TDL>
      </REQUESTDESC>
    </EXPORTDATA>
  </BODY>
</ENVELOPE>"""

    xml_resp = query_tally(tally_url, xml_req, timeout)
    if not xml_resp:
        return []

    items = []
    try:
        root = ET.fromstring(xml_resp)
        for st in root.iter("STOCKITEM"):
            name = st.findtext("NAME") or st.get("NAME")
            if not name:
                continue

            unit = st.findtext("BASEUNITS") or "PCS"
            bal_str = st.findtext("CLOSINGBALANCE") or "0"
            rate_str = st.findtext("CLOSINGRATE") or "0"
            val_str = st.findtext("CLOSINGVALUE") or "0"
            guid = st.findtext("GUID") or ""

            items.append({
                "name": name.strip(),
                "unit": unit.strip(),
                "closingQty": clean_num(bal_str),
                "rate": clean_num(rate_str),
                "value": clean_num(val_str),
                "category": "finished",
                "tallyGuid": guid.strip() or f"TALLY-ITEM-{name.strip()}"
            })
    except Exception as e:
        print(f"[WARN] Error parsing stock items XML: {e}")

    return items


def main():
    print("=" * 65)
    print("      NAGFANI FOODS ERP - TALLY MASTER PULL & SYNC")
    print("=" * 65)

    api_url, api_key, tally_url, company, timeout = load_config()

    print(f"[*] Tally Endpoint: {tally_url}")
    print(f"[*] Company Name:   {company}")
    print(f"[*] ERP Cloud API:  {api_url}")
    print("-" * 65)

    print("[1/3] Querying TallyPrime for Customer & Supplier Ledgers...")
    parties = fetch_ledgers(tally_url, company, timeout)
    print(f"      -> Extracted {len(parties)} genuine party ledgers.")

    print("[2/3] Querying TallyPrime for Stock Items & Closing Quantities...")
    items = fetch_stock_items(tally_url, company, timeout)
    print(f"      -> Extracted {len(items)} stock items.")

    if not parties and not items:
        print("[!] No masters were extracted. Please ensure:")
        print("    1. TallyPrime is open with 'NAGFANI FOODS' loaded.")
        print("    2. F1 Help -> Settings -> Connectivity -> Both / Port 9000 is active.")
        sys.exit(1)

    print("[3/3] Uploading genuine Tally masters to Nagfani Foods ERP Cloud...")
    headers = {
        "x-api-key": api_key,
        "Content-Type": "application/json"
    }

    try:
        res = requests.post(
            f"{api_url}/sync/inbound-bulk",
            json={"parties": parties, "items": items},
            headers=headers,
            timeout=30
        )
        if res.status_code == 200:
            result = res.json()
            stats = result.get("stats", {})
            print("\n" + "=" * 65)
            print(" [SUCCESS] TALLY MASTERS SYNCED TO CLOUD ERP!")
            print("=" * 65)
            print(f" - Parties Created: {stats.get('parties', {}).get('created', 0)}")
            print(f" - Parties Updated: {stats.get('parties', {}).get('updated', 0)}")
            print(f" - Items Created:   {stats.get('items', {}).get('created', 0)}")
            print(f" - Items Updated:   {stats.get('items', {}).get('updated', 0)}")
            print("\nYour genuine clients, outstanding balances, and stock are now")
            print("live in Nagfani Foods ERP (Livekeeping equivalent view)!")
        else:
            print(f"[ERROR] ERP rejected sync: {res.status_code} - {res.text}")
    except Exception as e:
        print(f"[ERROR] Failed to post masters to ERP: {e}")


if __name__ == "__main__":
    main()

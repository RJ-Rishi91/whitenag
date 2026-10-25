"""
Nagfani Foods ERP - Safe Tally Entry Verification
Tests whether the connector can write an entry into TallyPrime without affecting live finances.
Creates a zero-balance verification ledger: 'TEST - Nagfani App Connect'.
"""

import sys
import requests
import xml.etree.ElementTree as ET

TALLY_URL = "http://localhost:9000"
COMPANY = "NAGFANI FOODS"

test_xml = f"""<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>All Masters</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>{COMPANY}</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <LEDGER NAME="TEST - Nagfani App Connect" ACTION="Create">
            <NAME>TEST - Nagfani App Connect</NAME>
            <PARENT>Sundry Debtors</PARENT>
            <OPENINGBALANCE>0</OPENINGBALANCE>
            <ISBILLWISEON>No</ISBILLWISEON>
            <AFFECTSSTOCK>No</AFFECTSSTOCK>
            <DESCRIPTION>Temporary verification test by Nagfani ERP connector</DESCRIPTION>
          </LEDGER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>"""

print("=" * 65)
print("   NAGFANI FOODS ERP - SAFE TALLY ENTRY VERIFICATION TEST")
print("=" * 65)
print(f"Target Tally: {TALLY_URL}")
print(f"Company:      {COMPANY}")
print("Posting test ledger 'TEST - Nagfani App Connect'...")

try:
    res = requests.post(
        TALLY_URL,
        data=test_xml.encode("utf-8"),
        headers={"Content-Type": "text/xml; charset=utf-8"},
        timeout=5,
    )
    if res.status_code == 200:
        if "<CREATED>1</CREATED>" in res.text or "<ALTERED>1</ALTERED>" in res.text or "<STATUS>1</STATUS>" in res.text:
            print("\n" + "=" * 65)
            print("  [SUCCESS] TEST ENTRY SUCCESSFULLY CREATED IN TALLYPRIME!")
            print("=" * 65)
            print("TallyPrime accepted the XML entry with 0 errors.\n")
            print("HOW TO VERIFY IN TALLY RIGHT NOW:")
            print("1. In Gateway of Tally, select 'Alter' -> 'Ledger'.")
            print("2. You will see 'TEST - Nagfani App Connect' listed!")
            print("3. To delete: Select it, press Alt + D, then Yes.")
        else:
            print("[RESPONSE FROM TALLY]:")
            print(res.text)
    else:
        print(f"[ERROR] HTTP {res.status_code}: {res.text}")
except Exception as e:
    print(f"[FAILED] Could not connect to Tally on {TALLY_URL}: {e}")

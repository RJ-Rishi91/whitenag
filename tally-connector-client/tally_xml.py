"""
TallyPrime XML payload generators and response parsers for Nagfani Foods ERP.
Handles Vouchers (Sales, Purchase, Receipt, Payment, Stock Journal) and Masters (Ledgers, StockItems).
"""

import xml.etree.ElementTree as ET
from datetime import datetime


def escape_xml(text):
    if text is None:
        return ""
    return (
        str(text)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&apos;")
    )


def format_tally_date(date_val):
    """Returns YYYYMMDD string for Tally."""
    if not date_val:
        return datetime.now().strftime("%Y%m%d")
    if isinstance(date_val, str):
        try:
            # Handle ISO timestamp: 2026-10-19T00:00:00.000Z
            clean = date_val.split("T")[0].replace("-", "")
            if len(clean) == 8:
                return clean
        except Exception:
            pass
    if isinstance(date_val, datetime):
        return date_val.strftime("%Y%m%d")
    return datetime.now().strftime("%Y%m%d")


def build_envelope(report_name, company, body_xml):
    return f"""<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>{escape_xml(report_name)}</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>{escape_xml(company)}</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
{body_xml}
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>"""


def build_ledger_xml(party, company="Nagfani Foods"):
    """
    Creates or alters a Customer (Sundry Debtors) or Supplier (Sundry Creditors) Ledger.
    """
    name = escape_xml(party.get("name", "Unknown Party"))
    party_type = party.get("type", "customer")
    parent_group = "Sundry Debtors" if party_type == "customer" else "Sundry Creditors"
    mobile = escape_xml(party.get("mobile", ""))
    address = escape_xml(party.get("address", ""))
    gstin = escape_xml(party.get("gstin", ""))
    pincode = escape_xml(party.get("pincode", "313001"))
    credit_days = party.get("creditDays", 0)

    body = f"""          <LEDGER NAME="{name}" ACTION="Create">
            <NAME>{name}</NAME>
            <PARENT>{parent_group}</PARENT>
            <ISBILLWISEON>Yes</ISBILLWISEON>
            <ISCOSTCENTRESON>No</ISCOSTCENTRESON>
            <AFFECTSSTOCK>No</AFFECTSSTOCK>
            <ADDRESS.LIST>
              <ADDRESS>{address}</ADDRESS>
            </ADDRESS.LIST>
            <PINCODE>{pincode}</PINCODE>
            <LEDGERPHONE>{mobile}</LEDGERPHONE>
            <LEDGERMOBILE>{mobile}</LEDGERMOBILE>
            <PARTYGSTIN>{gstin}</PARTYGSTIN>
            <BILLCREDITPERIOD>{credit_days} Days</BILLCREDITPERIOD>
          </LEDGER>"""
    return build_envelope("All Masters", company, body)


def build_item_xml(item, company="Nagfani Foods"):
    """
    Creates or alters a Stock Item master in Tally.
    """
    name = escape_xml(item.get("name", "Unknown Item"))
    unit = escape_xml(item.get("unit", "PCS"))
    category = item.get("category", "finished")
    parent_group = "Finished Goods" if category == "finished" else "Raw Materials"
    hsn = escape_xml(item.get("hsn", ""))
    gst_rate = item.get("gstRate", 5)

    body = f"""          <STOCKITEM NAME="{name}" ACTION="Create">
            <NAME>{name}</NAME>
            <PARENT>{parent_group}</PARENT>
            <BASEUNITS>{unit}</BASEUNITS>
            <ISCOSTCENTRESON>No</ISCOSTCENTRESON>
            <ISBATCHWISEON>Yes</ISBATCHWISEON>
            <HSNCODE>{hsn}</HSNCODE>
            <GSTRATEDETAILS.LIST>
              <GSTRATE>{gst_rate}</GSTRATE>
            </GSTRATEDETAILS.LIST>
          </STOCKITEM>"""
    return build_envelope("All Masters", company, body)


def build_sales_voucher_xml(invoice, company="Nagfani Foods"):
    """
    Builds Sales Voucher XML for an Invoice.
    Handles inventory items, CGST, SGST, IGST, Round Off, and Party ledger entry.
    """
    invoice_no = escape_xml(invoice.get("invoiceNo") or invoice.get("invoiceNumber", "INV-TEMP"))
    date_str = format_tally_date(invoice.get("date") or invoice.get("createdAt"))
    party_name = escape_xml(
        (invoice.get("partyId") and isinstance(invoice.get("partyId"), dict) and invoice.get("partyId").get("name"))
        or invoice.get("customerName")
        or invoice.get("partyName")
        or "Cash Sales"
    )
    grand_total = float(invoice.get("grandTotal", 0))
    taxable_amount = float(invoice.get("subtotal", 0))
    cgst_amount = float(invoice.get("cgst", 0) or invoice.get("cgstTotal", 0))
    sgst_amount = float(invoice.get("sgst", 0) or invoice.get("sgstTotal", 0))
    igst_amount = float(invoice.get("igst", 0) or invoice.get("igstTotal", 0))
    round_off = float(invoice.get("roundOff", 0))

    items = invoice.get("lines") or invoice.get("items", [])

    inventory_entries = []
    for item in items:
        item_name = escape_xml(item.get("name", "Product"))
        qty = float(item.get("qty") or item.get("quantity", 0))
        unit = escape_xml(item.get("unitSymbol") or item.get("unit", "PCS"))
        rate = float(item.get("rate", 0))
        amount = float(item.get("taxableAmount") or item.get("total", qty * rate))
        godown = escape_xml(item.get("godownName", "Central Finished Goods Warehouse"))

        inv_entry = f"""            <ALLINVENTORYENTRIES.LIST>
              <STOCKITEMNAME>{item_name}</STOCKITEMNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <RATE>{rate:.2f}/{unit}</RATE>
              <AMOUNT>-{amount:.2f}</AMOUNT>
              <ACTUALQTY>-{qty:.2f} {unit}</ACTUALQTY>
              <BILLEDQTY>-{qty:.2f} {unit}</BILLEDQTY>
              <BATCHALLOCATIONS.LIST>
                <GODOWNNAME>{godown}</GODOWNNAME>
                <BATCHNAME>Primary Batch</BATCHNAME>
                <AMOUNT>-{amount:.2f}</AMOUNT>
                <ACTUALQTY>-{qty:.2f} {unit}</ACTUALQTY>
                <BILLEDQTY>-{qty:.2f} {unit}</BILLEDQTY>
              </BATCHALLOCATIONS.LIST>
              <ACCOUNTINGALLOCATIONS.LIST>
                <LEDGERNAME>Sales Account</LEDGERNAME>
                <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                <AMOUNT>-{amount:.2f}</AMOUNT>
              </ACCOUNTINGALLOCATIONS.LIST>
            </ALLINVENTORYENTRIES.LIST>"""
        inventory_entries.append(inv_entry)

    inventory_xml = "\n".join(inventory_entries)

    # Ledger entries for Taxes & Party
    tax_ledgers = []
    if cgst_amount > 0:
        tax_ledgers.append(f"""            <LEDGERENTRIES.LIST>
              <LEDGERNAME>CGST Output</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>-{cgst_amount:.2f}</AMOUNT>
            </LEDGERENTRIES.LIST>""")
    if sgst_amount > 0:
        tax_ledgers.append(f"""            <LEDGERENTRIES.LIST>
              <LEDGERNAME>SGST Output</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>-{sgst_amount:.2f}</AMOUNT>
            </LEDGERENTRIES.LIST>""")
    if igst_amount > 0:
        tax_ledgers.append(f"""            <LEDGERENTRIES.LIST>
              <LEDGERNAME>IGST Output</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>-{igst_amount:.2f}</AMOUNT>
            </LEDGERENTRIES.LIST>""")
    if round_off != 0:
        sign = "-" if round_off > 0 else ""
        tax_ledgers.append(f"""            <LEDGERENTRIES.LIST>
              <LEDGERNAME>Round Off</LEDGERNAME>
              <ISDEEMEDPOSITIVE>{"No" if round_off > 0 else "Yes"}</ISDEEMEDPOSITIVE>
              <AMOUNT>{sign}{abs(round_off):.2f}</AMOUNT>
            </LEDGERENTRIES.LIST>""")

    tax_xml = "\n".join(tax_ledgers)

    body = f"""          <VOUCHER VCHTYPE="Sales" ACTION="Create">
            <DATE>{date_str}</DATE>
            <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
            <VOUCHERNUMBER>{invoice_no}</VOUCHERNUMBER>
            <PARTYLEDGERNAME>{party_name}</PARTYLEDGERNAME>
            <PERSISTEDVIEW>Invoice View</PERSISTEDVIEW>
            <ISINVOICE>Yes</ISINVOICE>
            <EFFECTIVEDATE>{date_str}</EFFECTIVEDATE>
            <!-- Party Debit Entry -->
            <LEDGERENTRIES.LIST>
              <LEDGERNAME>{party_name}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>{grand_total:.2f}</AMOUNT>
              <BILLALLOCATIONS.LIST>
                <NAME>{invoice_no}</NAME>
                <BILLTYPE>New Ref</BILLTYPE>
                <AMOUNT>{grand_total:.2f}</AMOUNT>
              </BILLALLOCATIONS.LIST>
            </LEDGERENTRIES.LIST>
{inventory_xml}
{tax_xml}
          </VOUCHER>"""

    return build_envelope("Vouchers", company, body)


def build_receipt_voucher_xml(payment, company="Nagfani Foods"):
    """
    Builds Receipt Voucher XML when customer makes a payment.
    Debits Cash / Bank / UPI Account, Credits Party Ledger with Bill Reference.
    """
    receipt_no = escape_xml(payment.get("receiptNo") or payment.get("receiptNumber", "REC-TEMP"))
    date_str = format_tally_date(payment.get("date") or payment.get("createdAt"))
    party_name = escape_xml(
        (payment.get("partyId") and isinstance(payment.get("partyId"), dict) and payment.get("partyId").get("name"))
        or payment.get("customerName")
        or payment.get("partyName")
        or "Customer"
    )
    amount = float(payment.get("amount", 0))
    mode = (payment.get("mode") or payment.get("paymentMode", "cash")).lower()
    ref_bill = escape_xml(payment.get("ref") or payment.get("invoiceNumber", "On Account"))

    # Map mode to Tally Account
    if mode == "cash":
        account_ledger = "Cash"
    elif mode == "upi":
        account_ledger = "HDFC Bank (UPI Collection)"
    elif mode == "cheque":
        account_ledger = "HDFC Bank (Current A/c)"
    else:
        account_ledger = "Bank A/c"

    body = f"""          <VOUCHER VCHTYPE="Receipt" ACTION="Create">
            <DATE>{date_str}</DATE>
            <VOUCHERTYPENAME>Receipt</VOUCHERTYPENAME>
            <VOUCHERNUMBER>{receipt_no}</VOUCHERNUMBER>
            <PARTYLEDGERNAME>{party_name}</PARTYLEDGERNAME>
            <PERSISTEDVIEW>Accounting Voucher View</PERSISTEDVIEW>
            <!-- Debit Bank or Cash -->
            <LEDGERENTRIES.LIST>
              <LEDGERNAME>{account_ledger}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-{amount:.2f}</AMOUNT>
            </LEDGERENTRIES.LIST>
            <!-- Credit Party Ledger -->
            <LEDGERENTRIES.LIST>
              <LEDGERNAME>{party_name}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>{amount:.2f}</AMOUNT>
              <BILLALLOCATIONS.LIST>
                <NAME>{ref_bill}</NAME>
                <BILLTYPE>{"Agst Ref" if ref_bill != "On Account" else "On Account"}</BILLTYPE>
                <AMOUNT>{amount:.2f}</AMOUNT>
              </BILLALLOCATIONS.LIST>
            </LEDGERENTRIES.LIST>
          </VOUCHER>"""

    return build_envelope("Vouchers", company, body)


def build_purchase_voucher_xml(purchase, company="Nagfani Foods"):
    """
    Builds Purchase Voucher XML for inward raw materials from suppliers.
    """
    purchase_no = escape_xml(purchase.get("purchaseNumber", "PUR-TEMP"))
    supplier_inv_no = escape_xml(purchase.get("supplierInvoiceNumber", purchase_no))
    date_str = format_tally_date(purchase.get("invoiceDate") or purchase.get("date"))
    supplier_name = escape_xml(purchase.get("supplierName", "Cash Supplier"))
    grand_total = float(purchase.get("grandTotal", 0))

    items = purchase.get("items", [])
    inventory_entries = []
    for item in items:
        item_name = escape_xml(item.get("name", "Raw Material"))
        qty = float(item.get("quantity", 0))
        unit = escape_xml(item.get("unit", "KG"))
        rate = float(item.get("rate", 0))
        amount = float(item.get("total", qty * rate))
        godown = escape_xml(item.get("godownName", "Raw Material Godown"))

        inv_entry = f"""            <ALLINVENTORYENTRIES.LIST>
              <STOCKITEMNAME>{item_name}</STOCKITEMNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <RATE>{rate:.2f}/{unit}</RATE>
              <AMOUNT>{amount:.2f}</AMOUNT>
              <ACTUALQTY>{qty:.2f} {unit}</ACTUALQTY>
              <BILLEDQTY>{qty:.2f} {unit}</BILLEDQTY>
              <BATCHALLOCATIONS.LIST>
                <GODOWNNAME>{godown}</GODOWNNAME>
                <BATCHNAME>Primary Batch</BATCHNAME>
                <AMOUNT>{amount:.2f}</AMOUNT>
                <ACTUALQTY>{qty:.2f} {unit}</ACTUALQTY>
                <BILLEDQTY>{qty:.2f} {unit}</BILLEDQTY>
              </BATCHALLOCATIONS.LIST>
              <ACCOUNTINGALLOCATIONS.LIST>
                <LEDGERNAME>Purchase Account</LEDGERNAME>
                <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                <AMOUNT>{amount:.2f}</AMOUNT>
              </ACCOUNTINGALLOCATIONS.LIST>
            </ALLINVENTORYENTRIES.LIST>"""
        inventory_entries.append(inv_entry)

    inventory_xml = "\n".join(inventory_entries)

    body = f"""          <VOUCHER VCHTYPE="Purchase" ACTION="Create">
            <DATE>{date_str}</DATE>
            <VOUCHERTYPENAME>Purchase</VOUCHERTYPENAME>
            <VOUCHERNUMBER>{purchase_no}</VOUCHERNUMBER>
            <REFERENCE>{supplier_inv_no}</REFERENCE>
            <PARTYLEDGERNAME>{supplier_name}</PARTYLEDGERNAME>
            <PERSISTEDVIEW>Invoice View</PERSISTEDVIEW>
            <ISINVOICE>Yes</ISINVOICE>
            <!-- Credit Supplier -->
            <LEDGERENTRIES.LIST>
              <LEDGERNAME>{supplier_name}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>-{grand_total:.2f}</AMOUNT>
              <BILLALLOCATIONS.LIST>
                <NAME>{supplier_inv_no}</NAME>
                <BILLTYPE>New Ref</BILLTYPE>
                <AMOUNT>-{grand_total:.2f}</AMOUNT>
              </BILLALLOCATIONS.LIST>
            </LEDGERENTRIES.LIST>
{inventory_xml}
          </VOUCHER>"""

    return build_envelope("Vouchers", company, body)


def build_stock_journal_xml(production, company="Nagfani Foods"):
    """
    Builds Stock Journal Voucher XML for manufacturing entries.
    Records consumption of raw materials (out) and production of finished goods (in).
    """
    prod_no = escape_xml(production.get("productionNo", "PRD-TEMP"))
    date_str = format_tally_date(production.get("date") or production.get("createdAt"))
    batch_no = escape_xml(production.get("batchNo", "Primary Batch"))
    produce_qty = float(production.get("qty", 0))
    product_name = escape_xml(
        (production.get("productId") and isinstance(production.get("productId"), dict) and production.get("productId").get("name"))
        or production.get("productName")
        or "Finished Goods"
    )
    unit = escape_xml(production.get("unitSymbol", "pcs (pack)"))
    godown = escape_xml(production.get("godownName", "Central Finished Goods Warehouse"))

    # Consumption lines (Source/Out)
    consumptions = []
    lines = production.get("lines", [])
    for line in lines:
        raw_name = escape_xml(line.get("name", "Raw Material"))
        raw_qty = float(line.get("actualQty", line.get("qty", 0)))
        raw_unit = escape_xml(line.get("unitSymbol", "kg"))
        entry = f"""            <INVENTORYENTRIESIN.LIST>
              <STOCKITEMNAME>{raw_name}</STOCKITEMNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <ACTUALQTY>-{raw_qty:.2f} {raw_unit}</ACTUALQTY>
              <BILLEDQTY>-{raw_qty:.2f} {raw_unit}</BILLEDQTY>
              <BATCHALLOCATIONS.LIST>
                <GODOWNNAME>Factory Production Floor & Raw Godown</GODOWNNAME>
                <BATCHNAME>{batch_no}</BATCHNAME>
                <ACTUALQTY>-{raw_qty:.2f} {raw_unit}</ACTUALQTY>
                <BILLEDQTY>-{raw_qty:.2f} {raw_unit}</BILLEDQTY>
              </BATCHALLOCATIONS.LIST>
            </INVENTORYENTRIESIN.LIST>"""
        consumptions.append(entry)

    consumption_xml = "\n".join(consumptions)

    # Production entry (Destination/In)
    production_xml = f"""            <INVENTORYENTRIESOUT.LIST>
              <STOCKITEMNAME>{product_name}</STOCKITEMNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <ACTUALQTY>{produce_qty:.2f} {unit}</ACTUALQTY>
              <BILLEDQTY>{produce_qty:.2f} {unit}</BILLEDQTY>
              <BATCHALLOCATIONS.LIST>
                <GODOWNNAME>{godown}</GODOWNNAME>
                <BATCHNAME>{batch_no}</BATCHNAME>
                <ACTUALQTY>{produce_qty:.2f} {unit}</ACTUALQTY>
                <BILLEDQTY>{produce_qty:.2f} {unit}</BILLEDQTY>
              </BATCHALLOCATIONS.LIST>
            </INVENTORYENTRIESOUT.LIST>"""

    body = f"""          <VOUCHER VCHTYPE="Stock Journal" ACTION="Create">
            <DATE>{date_str}</DATE>
            <VOUCHERTYPENAME>Stock Journal</VOUCHERTYPENAME>
            <VOUCHERNUMBER>{prod_no}</VOUCHERNUMBER>
            <ISMANUFACTURING>Yes</ISMANUFACTURING>
{consumption_xml}
{production_xml}
          </VOUCHER>"""

    return build_envelope("Vouchers", company, body)


def parse_tally_response(xml_text):
    """
    Parses Tally XML response to determine success or failure.
    Returns dict: {
        "success": bool,
        "created": int,
        "altered": int,
        "errors": int,
        "message": str,
        "tally_guid": str or None
    }
    """
    if not xml_text or not xml_text.strip():
        return {
            "success": False,
            "created": 0,
            "altered": 0,
            "errors": 1,
            "message": "Empty response from Tally",
            "tally_guid": None,
        }

    try:
        root = ET.fromstring(xml_text.strip())

        # Check for standard response tags
        created = int(root.findtext(".//CREATED") or 0)
        altered = int(root.findtext(".//ALTERED") or 0)
        errors = int(root.findtext(".//ERRORS") or 0)
        last_vch_id = root.findtext(".//LASTVCHID") or root.findtext(".//GUID")

        line_errors = [elem.text for elem in root.findall(".//LINEERROR") if elem.text]

        if errors > 0 or line_errors:
            error_msg = "; ".join(line_errors) if line_errors else f"{errors} error(s) reported by Tally"
            return {
                "success": False,
                "created": created,
                "altered": altered,
                "errors": errors or len(line_errors),
                "message": error_msg,
                "tally_guid": last_vch_id,
            }

        return {
            "success": True,
            "created": created,
            "altered": altered,
            "errors": 0,
            "message": f"Success: created={created}, altered={altered}",
            "tally_guid": last_vch_id or f"TALLY-{datetime.now().strftime('%Y%m%d%H%M%S')}",
        }
    except Exception as e:
        # Check if plain text or unstructured error
        if "LINEERROR" in xml_text:
            return {
                "success": False,
                "created": 0,
                "altered": 0,
                "errors": 1,
                "message": f"XML parse error with Tally error in text: {xml_text[:200]}",
                "tally_guid": None,
            }
        return {
            "success": False,
            "created": 0,
            "altered": 0,
            "errors": 1,
            "message": f"Failed to parse XML response: {str(e)}",
            "tally_guid": None,
        }

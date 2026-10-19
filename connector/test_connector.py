"""
Unit and integration tests for TallyConnector and tally_xml.
"""

import unittest
from tally_xml import (
    build_ledger_xml,
    build_item_xml,
    build_sales_voucher_xml,
    build_receipt_voucher_xml,
    build_purchase_voucher_xml,
    build_stock_journal_xml,
    parse_tally_response,
)


class TestTallyXML(unittest.TestCase):
    def test_ledger_xml_generation(self):
        party = {
            "name": "Mewar Food Mart",
            "type": "customer",
            "mobile": "9829011111",
            "address": "Bapu Bazar, Udaipur",
            "gstin": "08ABCDE1234F1Z5",
            "pincode": "313001",
            "creditDays": 15,
        }
        xml = build_ledger_xml(party, company="Nagfani Foods")
        self.assertIn("<TALLYREQUEST>Import Data</TALLYREQUEST>", xml)
        self.assertIn('<LEDGER NAME="Mewar Food Mart"', xml)
        self.assertIn("<PARENT>Sundry Debtors</PARENT>", xml)
        self.assertIn("<PARTYGSTIN>08ABCDE1234F1Z5</PARTYGSTIN>", xml)

    def test_item_xml_generation(self):
        item = {
            "name": "Urad Hari Mirch Papad 400g",
            "category": "finished",
            "unit": "PCS",
            "gstRate": 5,
            "hsn": "19059040",
        }
        xml = build_item_xml(item, company="Nagfani Foods")
        self.assertIn('<STOCKITEM NAME="Urad Hari Mirch Papad 400g"', xml)
        self.assertIn("<PARENT>Finished Goods</PARENT>", xml)
        self.assertIn("<BASEUNITS>PCS</BASEUNITS>", xml)

    def test_sales_voucher_xml_generation(self):
        invoice = {
            "invoiceNumber": "INV-2026-0001",
            "customerName": "Mewar Food Mart",
            "createdAt": "2026-10-19T00:00:00.000Z",
            "subtotal": 12000,
            "cgstTotal": 300,
            "sgstTotal": 300,
            "igstTotal": 0,
            "roundOff": 0,
            "grandTotal": 12600,
            "items": [
                {
                    "name": "Urad Hari Mirch Papad 400g",
                    "quantity": 100,
                    "unit": "PCS",
                    "rate": 120,
                    "total": 12000,
                    "godownName": "Main Godown",
                }
            ],
        }
        xml = build_sales_voucher_xml(invoice, company="Nagfani Foods")
        self.assertIn('<VOUCHER VCHTYPE="Sales"', xml)
        self.assertIn("<VOUCHERNUMBER>INV-2026-0001</VOUCHERNUMBER>", xml)
        self.assertIn("<PARTYLEDGERNAME>Mewar Food Mart</PARTYLEDGERNAME>", xml)
        self.assertIn("<STOCKITEMNAME>Urad Hari Mirch Papad 400g</STOCKITEMNAME>", xml)
        self.assertIn("<LEDGERNAME>CGST Output</LEDGERNAME>", xml)

    def test_stock_journal_xml_generation(self):
        production = {
            "productionNo": "PRD-000001",
            "date": "2026-10-19",
            "productName": "Urad Hari Mirch Papad 500g",
            "qty": 100,
            "unitSymbol": "pcs (pack)",
            "batchNo": "B-2026-OCT-19",
            "godownName": "Central Finished Goods Warehouse",
            "lines": [
                {"name": "Urad Dal Mogar", "actualQty": 42, "unitSymbol": "kg"}
            ]
        }
        xml = build_stock_journal_xml(production, company="Nagfani Foods")
        self.assertIn('<VOUCHER VCHTYPE="Stock Journal"', xml)
        self.assertIn("<VOUCHERNUMBER>PRD-000001</VOUCHERNUMBER>", xml)
        self.assertIn("<ISMANUFACTURING>Yes</ISMANUFACTURING>", xml)
        self.assertIn("<STOCKITEMNAME>Urad Hari Mirch Papad 500g</STOCKITEMNAME>", xml)
        self.assertIn("<STOCKITEMNAME>Urad Dal Mogar</STOCKITEMNAME>", xml)

    def test_parse_tally_response_success(self):
        tally_success_xml = """<RESPONSE>
  <STATUS>1</STATUS>
  <CREATED>1</CREATED>
  <ALTERED>0</ALTERED>
  <ERRORS>0</ERRORS>
  <LASTVCHID>TALLY-VCH-999</LASTVCHID>
</RESPONSE>"""
        res = parse_tally_response(tally_success_xml)
        self.assertTrue(res["success"])
        self.assertEqual(res["created"], 1)
        self.assertEqual(res["errors"], 0)
        self.assertEqual(res["tally_guid"], "TALLY-VCH-999")

    def test_parse_tally_response_error(self):
        tally_error_xml = """<RESPONSE>
  <STATUS>0</STATUS>
  <CREATED>0</CREATED>
  <ALTERED>0</ALTERED>
  <ERRORS>1</ERRORS>
  <LINEERROR>Cannot find Ledger 'Special Sundry'</LINEERROR>
</RESPONSE>"""
        res = parse_tally_response(tally_error_xml)
        self.assertFalse(res["success"])
        self.assertEqual(res["errors"], 1)
        self.assertIn("Cannot find Ledger", res["message"])


if __name__ == "__main__":
    unittest.main()

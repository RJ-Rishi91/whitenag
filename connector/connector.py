"""
Nagfani Foods ERP - TallyPrime Connector Daemon
Connects local TallyPrime instance (port 9000) with Nagfani Foods ERP API.
Polls outbound queue, generates Tally XML, posts vouchers/masters, and reports status.
"""

import os
import sys
import time
import signal
import logging
import argparse
import configparser
import requests

from tally_xml import (
    build_ledger_xml,
    build_item_xml,
    build_sales_voucher_xml,
    build_receipt_voucher_xml,
    build_purchase_voucher_xml,
    build_stock_journal_xml,
    parse_tally_response,
)

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] [TallyConnector] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("TallyConnector")


class TallyConnector:
    def __init__(self, config_path="config.ini"):
        self.config_path = config_path
        self.running = True
        self.load_config()

    def load_config(self):
        cfg = configparser.ConfigParser()
        if os.path.exists(self.config_path):
            cfg.read(self.config_path)

        self.api_url = os.getenv("API_URL", cfg.get("app", "api_url", fallback="http://localhost:5000/api/v1"))
        self.api_key = os.getenv("API_KEY", cfg.get("app", "api_key", fallback="nagfani_connector_api_key_secure_2026"))
        self.poll_interval = int(os.getenv("POLL_INTERVAL", cfg.get("app", "poll_interval", fallback="10")))

        self.tally_url = os.getenv("TALLY_URL", cfg.get("tally", "url", fallback="http://localhost:9000"))
        self.company = os.getenv("TALLY_COMPANY", cfg.get("tally", "company", fallback="Nagfani Foods"))
        self.tally_timeout = int(os.getenv("TALLY_TIMEOUT", cfg.get("tally", "timeout", fallback="5")))

        self.headers = {
            "x-api-key": self.api_key,
            "Content-Type": "application/json",
            "User-Agent": "NagfaniTallyConnector/1.0",
        }

        logger.info(f"Loaded config: API={self.api_url}, Tally={self.tally_url}, Company='{self.company}'")

    def test_tally_connection(self):
        """Pings Tally server with a company status query XML."""
        ping_xml = f"""<ENVELOPE>
  <HEADER><TALLYREQUEST>Export Data</TALLYREQUEST></HEADER>
  <BODY>
    <EXPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>List of Companies</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>{self.company}</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
    </EXPORTDATA>
  </BODY>
</ENVELOPE>"""
        try:
            res = requests.post(
                self.tally_url,
                data=ping_xml.encode("utf-8"),
                headers={"Content-Type": "text/xml; charset=utf-8"},
                timeout=self.tally_timeout,
            )
            return res.status_code == 200
        except Exception:
            return False

    def send_heartbeat(self, tally_reachable):
        try:
            res = requests.post(
                f"{self.api_url}/sync/heartbeat",
                json={
                    "tallyReachable": tally_reachable,
                    "company": self.company,
                    "version": "1.0.0",
                },
                headers=self.headers,
                timeout=5,
            )
            if res.status_code == 200:
                logger.debug("Heartbeat posted successfully")
            else:
                logger.warning(f"Heartbeat rejected: {res.status_code} - {res.text}")
        except Exception as e:
            logger.error(f"Failed to post heartbeat to ERP: {e}")

    def fetch_pending_outbox(self, limit=25):
        try:
            res = requests.get(
                f"{self.api_url}/sync/pending",
                params={"limit": limit},
                headers=self.headers,
                timeout=10,
            )
            if res.status_code == 200:
                data = res.json()
                return data.get("data", [])
            else:
                logger.error(f"Failed to fetch pending items: {res.status_code} - {res.text}")
                return []
        except Exception as e:
            logger.error(f"Error fetching pending sync items: {e}")
            return []

    def post_to_tally(self, xml_payload):
        try:
            res = requests.post(
                self.tally_url,
                data=xml_payload.encode("utf-8"),
                headers={"Content-Type": "text/xml; charset=utf-8"},
                timeout=self.tally_timeout,
            )
            return parse_tally_response(res.text)
        except requests.exceptions.RequestException as e:
            return {
                "success": False,
                "created": 0,
                "altered": 0,
                "errors": 1,
                "message": f"Connection error to Tally: {str(e)}",
                "tally_guid": None,
            }

    def ack_sync_success(self, idempotency_key, tally_guid, voucher_number=None):
        try:
            res = requests.post(
                f"{self.api_url}/sync/ack",
                json={
                    "idempotencyKey": idempotency_key,
                    "tallyGuid": tally_guid,
                    "voucherNumber": voucher_number,
                },
                headers=self.headers,
                timeout=5,
            )
            return res.status_code == 200
        except Exception as e:
            logger.error(f"Failed to ack item {idempotency_key}: {e}")
            return False

    def report_sync_failure(self, idempotency_key, error_msg):
        try:
            res = requests.post(
                f"{self.api_url}/sync/fail",
                json={
                    "idempotencyKey": idempotency_key,
                    "error": error_msg,
                },
                headers=self.headers,
                timeout=5,
            )
            return res.status_code == 200
        except Exception as e:
            logger.error(f"Failed to report failure for item {idempotency_key}: {e}")
            return False

    def process_item(self, item):
        idempotency_key = item.get("idempotencyKey")
        entity_type = item.get("entityType")
        payload = item.get("payload", {})
        action = item.get("action", "create")

        logger.info(f"Processing outbox item: [{entity_type.upper()}] - {idempotency_key}")

        xml_payload = None
        voucher_number = None

        if entity_type == "party":
            xml_payload = build_ledger_xml(payload, self.company)
        elif entity_type == "item":
            xml_payload = build_item_xml(payload, self.company)
        elif entity_type in ("invoice", "sales"):
            xml_payload = build_sales_voucher_xml(payload, self.company)
            voucher_number = payload.get("invoiceNo") or payload.get("invoiceNumber")
        elif entity_type in ("payment", "receipt"):
            xml_payload = build_receipt_voucher_xml(payload, self.company)
            voucher_number = payload.get("receiptNo") or payload.get("receiptNumber")
        elif entity_type == "purchase":
            xml_payload = build_purchase_voucher_xml(payload, self.company)
            voucher_number = payload.get("purchaseNo") or payload.get("purchaseNumber")
        elif entity_type in ("production", "stock_journal"):
            xml_payload = build_stock_journal_xml(payload, self.company)
            voucher_number = payload.get("productionNo") or payload.get("batchNo")
        elif entity_type == "order":
            voucher_number = payload.get("orderNo") or payload.get("orderNumber") or "ORD-TRACK"
            logger.info(f"Order outbox record acknowledged: {voucher_number}")
            self.ack_sync_success(idempotency_key, f"TALLY-{voucher_number}", voucher_number)
            return True
        else:
            logger.warning(f"Unsupported entityType '{entity_type}', marking as failed")
            self.report_sync_failure(idempotency_key, f"Unsupported entityType '{entity_type}'")
            return False

        tally_result = self.post_to_tally(xml_payload)

        if tally_result.get("success"):
            tally_guid = tally_result.get("tally_guid")
            logger.info(f"Successfully posted to Tally: {idempotency_key} -> GUID: {tally_guid}")
            self.ack_sync_success(idempotency_key, tally_guid, voucher_number)
            return True
        else:
            err = tally_result.get("message", "Unknown Tally error")
            logger.error(f"Tally rejected item {idempotency_key}: {err}")
            self.report_sync_failure(idempotency_key, err)
            return False

    def run_cycle(self):
        tally_reachable = self.test_tally_connection()
        self.send_heartbeat(tally_reachable)

        if not tally_reachable:
            logger.warning(f"Tally server at {self.tally_url} is unreachable or company '{self.company}' is not active. Waiting...")
            return False

        pending_items = self.fetch_pending_outbox()
        if not pending_items:
            logger.debug("No pending items in outbox queue.")
            return False

        logger.info(f"Found {len(pending_items)} pending items in cloud queue. Pushing to Tally...")
        for item in pending_items:
            if not self.running:
                break
            self.process_item(item)

        return len(pending_items) > 0

    def start(self, run_once=False):
        logger.info(f"Starting Nagfani Foods Tally Connector (Livekeeping mode: poll={self.poll_interval}s)...")
        if run_once:
            self.run_cycle()
            logger.info("Single cycle completed.")
            return

        while self.running:
            try:
                has_more = self.run_cycle()
                # If we just drained a batch, immediately pull the next batch without waiting!
                if has_more:
                    continue
            except Exception as e:
                logger.error(f"Unexpected error in sync cycle: {e}", exc_info=True)

            # Sleep in small slices to respond promptly to shutdown signals
            for _ in range(self.poll_interval):
                if not self.running:
                    break
                time.sleep(1)

        logger.info("Tally Connector terminated cleanly.")

    def stop(self, *args):
        logger.info("Stopping Tally Connector...")
        self.running = False


def main():
    parser = argparse.ArgumentParser(description="Nagfani Foods ERP - Tally Connector")
    parser.add_argument("--config", default="config.ini", help="Path to config.ini")
    parser.add_argument("--run-once", action="store_true", help="Run a single sync cycle and exit")
    args = parser.parse_args()

    connector = TallyConnector(config_path=args.config)

    signal.signal(signal.SIGINT, connector.stop)
    signal.signal(signal.SIGTERM, connector.stop)

    connector.start(run_once=args.run_once)


if __name__ == "__main__":
    main()

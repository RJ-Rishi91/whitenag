"""
Mock TallyPrime HTTP/XML Server (Port 9000)
Used for local testing and CI verification without requiring a live Windows TallyPrime license.
Simulates Tally's XML response structures for Vouchers and Masters.
"""

import sys
import argparse
from http.server import HTTPServer, BaseHTTPRequestHandler
import xml.etree.ElementTree as ET
from datetime import datetime

received_requests = []


class MockTallyHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/history":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            import json

            self.wfile.write(
                json.dumps(
                    {
                        "total_received": len(received_requests),
                        "last": received_requests[-1] if received_requests else None,
                    }
                ).encode("utf-8")
            )
            return

        self.send_response(200)
        self.send_header("Content-Type", "text/plain")
        self.end_headers()
        self.wfile.write(b"Mock TallyPrime Server is running on port 9000.")

    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length).decode("utf-8", errors="replace")

        request_time = datetime.now().isoformat()
        received_requests.append({"at": request_time, "xml": body})

        # Check if the request is a "List of Companies" / Ping request
        if "List of Companies" in body:
            response_xml = """<ENVELOPE>
  <HEADER><STATUS>1</STATUS></HEADER>
  <BODY>
    <DATA>
      <COLLECTION>
        <COMPANY>
          <NAME>Nagfani Foods</NAME>
          <STARTINGFROM>20260401</STARTINGFROM>
        </COMPANY>
      </COLLECTION>
    </DATA>
  </BODY>
</ENVELOPE>"""
            self.send_response(200)
            self.send_header("Content-Type", "text/xml; charset=utf-8")
            self.end_headers()
            self.wfile.write(response_xml.encode("utf-8"))
            return

        # Check if simulate failure requested in body
        if "SIMULATE_FAIL" in body or "Unknown Party" in body:
            response_xml = """<RESPONSE>
  <STATUS>0</STATUS>
  <CREATED>0</CREATED>
  <ALTERED>0</ALTERED>
  <ERRORS>1</ERRORS>
  <LINEERROR>Ledger does not exist in master record</LINEERROR>
</RESPONSE>"""
            self.send_response(200)
            self.send_header("Content-Type", "text/xml; charset=utf-8")
            self.end_headers()
            self.wfile.write(response_xml.encode("utf-8"))
            return

        # Standard Success Import response
        vch_id = f"MOCK-TALLY-GUID-{len(received_requests)}"
        response_xml = f"""<RESPONSE>
  <STATUS>1</STATUS>
  <CREATED>1</CREATED>
  <ALTERED>0</ALTERED>
  <ERRORS>0</ERRORS>
  <LASTVCHID>{vch_id}</LASTVCHID>
</RESPONSE>"""
        self.send_response(200)
        self.send_header("Content-Type", "text/xml; charset=utf-8")
        self.end_headers()
        self.wfile.write(response_xml.encode("utf-8"))

    def log_message(self, format, *args):
        # Clean logging
        sys.stderr.write(f"[MockTally:9000] {args[0]} - {args[1]} {args[2]}\n")


def run_mock_tally(port=9000):
    server_address = ("127.0.0.1", port)
    httpd = HTTPServer(server_address, MockTallyHandler)
    print(f"Mock Tally Server running on http://127.0.0.1:{port}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down Mock Tally Server.")
        httpd.server_close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Mock TallyPrime HTTP/XML Server")
    parser.add_argument("--port", type=int, default=9000, help="Port to listen on (default: 9000)")
    args = parser.parse_args()
    run_mock_tally(args.port)

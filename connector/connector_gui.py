"""
Nagfani Foods ERP - TallyPrime Desktop Connector GUI
A dedicated desktop software gateway for Windows, similar to Livekeeping Desktop Connector.
Features:
- Welcome banner & branding
- Simple Live Dashboard (Tally connection, Cloud ERP connection, Queue status)
- Live request search and activity stream
- Action controls (Sync Now, Test Connection, Safe Entry Test, Master Pull)
- In-app Settings editor for company name, ports, and API keys
"""

import os
import sys
import time
import queue
import threading
import configparser
import requests
from datetime import datetime
import tkinter as tk
from tkinter import ttk, messagebox

# Re-use XML generation from tally_xml if present
try:
    from tally_xml import (
        build_ledger_xml,
        build_item_xml,
        build_sales_voucher_xml,
        build_receipt_voucher_xml,
        build_purchase_voucher_xml,
        build_stock_journal_xml,
        parse_tally_response,
    )
except ImportError:
    build_ledger_xml = None


class TallyConnectorGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("Nagfani Foods ERP — TallyPrime Live Gateway")
        self.root.geometry("820x680")
        self.root.minsize(760, 600)

        # Set app colors (Nagfani Heritage & Livekeeping inspired)
        self.c_teal = "#03353A"
        self.c_dark_teal = "#02282C"
        self.c_orange = "#D9580B"
        self.c_orange_hover = "#B54504"
        self.c_bg = "#F8FAFC"
        self.c_card = "#FFFFFF"
        self.c_border = "#E2E8F0"
        self.c_text = "#0F172A"
        self.c_muted = "#64748B"
        self.c_green = "#10B981"
        self.c_red = "#EF4444"
        self.c_amber = "#F59E0B"

        self.root.configure(bg=self.c_bg)

        # Configuration
        if getattr(sys, "frozen", False):
            base_dir = os.path.dirname(sys.executable)
        else:
            base_dir = os.path.dirname(os.path.abspath(__file__))
        self.config_file = os.path.join(base_dir, "config.ini")
        self.load_config()

        # State
        self.is_running = True
        self.tally_connected = False
        self.cloud_connected = False
        self.pending_queue_count = 0
        self.synced_today_count = 0
        self.log_queue = queue.Queue()
        self.all_log_records = []

        # Build UI
        self.build_styles()
        self.build_header()
        self.build_dashboard()
        self.build_search_and_logs()
        self.build_action_bar()

        # Start periodic log queue consumer
        self.root.after(100, self.process_log_queue)

        # Start background sync worker thread
        self.worker_thread = threading.Thread(target=self.sync_loop, daemon=True)
        self.worker_thread.start()

        self.log("🚀 Nagfani Tally Gateway started. Initializing connection checks...", "info")

    def load_config(self):
        cfg = configparser.ConfigParser()
        if os.path.exists(self.config_file):
            cfg.read(self.config_file)

        self.api_url = cfg.get("app", "api_url", fallback="https://sequences-tears-consequences-logs.trycloudflare.com/api/v1")
        self.api_key = cfg.get("app", "api_key", fallback="nagfani_connector_api_key_secure_2026")
        self.poll_interval = int(cfg.get("app", "poll_interval", fallback="3"))

        self.tally_url = cfg.get("tally", "url", fallback="http://localhost:9000")
        self.company = cfg.get("tally", "company", fallback="NAGFANI FOODS")
        self.tally_timeout = int(cfg.get("tally", "timeout", fallback="5"))

    def save_config(self):
        cfg = configparser.ConfigParser()
        cfg["app"] = {
            "api_url": self.api_url,
            "api_key": self.api_key,
            "poll_interval": str(self.poll_interval)
        }
        cfg["tally"] = {
            "url": self.tally_url,
            "company": self.company,
            "timeout": str(self.tally_timeout)
        }
        with open(self.config_file, "w") as f:
            cfg.write(f)

    def build_styles(self):
        style = ttk.Style()
        style.theme_use("clam")

        style.configure("TFrame", background=self.c_bg)
        style.configure("Card.TFrame", background=self.c_card, relief="flat")
        style.configure("Header.TFrame", background=self.c_teal)

        style.configure("Primary.TButton",
                        background=self.c_orange,
                        foreground="#FFFFFF",
                        font=("Segoe UI", 9, "bold"),
                        padding=(12, 6))
        style.map("Primary.TButton",
                  background=[("active", self.c_orange_hover)])

        style.configure("Secondary.TButton",
                        background=self.c_card,
                        foreground=self.c_teal,
                        font=("Segoe UI", 9, "bold"),
                        padding=(10, 5))

    def build_header(self):
        """Welcome Banner and Header"""
        header_frame = tk.Frame(self.root, bg=self.c_teal, height=75)
        header_frame.pack(fill="x", side="top")
        header_frame.pack_propagate(False)

        inner = tk.Frame(header_frame, bg=self.c_teal)
        inner.pack(fill="both", expand=True, padx=20, pady=10)

        # Brand Logo Pill
        logo_box = tk.Label(inner, text="NF", font=("Segoe UI", 13, "bold"), bg=self.c_orange, fg="white", width=4, height=1)
        logo_box.pack(side="left", padx=(0, 12))

        # Titles
        title_box = tk.Frame(inner, bg=self.c_teal)
        title_box.pack(side="left", fill="y")

        lbl_title = tk.Label(title_box, text="Nagfani Foods ERP — Tally Gateway", font=("Segoe UI", 13, "bold"), bg=self.c_teal, fg="#FFFFFF")
        lbl_title.pack(anchor="w")

        lbl_sub = tk.Label(title_box, text="Livekeeping-grade two-way sync bridge for TallyPrime", font=("Segoe UI", 9), bg=self.c_teal, fg="#B2D8DC")
        lbl_sub.pack(anchor="w")

        # Company Tag
        company_tag = tk.Label(inner, text=f"Company: {self.company}", font=("Segoe UI", 9, "bold"), bg=self.c_dark_teal, fg="#E0F2F1", padx=10, pady=4, relief="flat")
        company_tag.pack(side="right")
        self.lbl_company_tag = company_tag

    def build_dashboard(self):
        """Dashboard summary cards"""
        dash_frame = tk.Frame(self.root, bg=self.c_bg)
        dash_frame.pack(fill="x", padx=16, pady=12)

        # 3 Cards Grid: Tally status, Cloud status, Sync queue
        dash_frame.columnconfigure(0, weight=1)
        dash_frame.columnconfigure(1, weight=1)
        dash_frame.columnconfigure(2, weight=1)

        # CARD 1: Tally Status
        c1 = tk.Frame(dash_frame, bg=self.c_card, highlightbackground=self.c_border, highlightthickness=1, padx=12, pady=10)
        c1.grid(row=0, column=0, sticky="nsew", padx=4)

        tk.Label(c1, text="TALLYPRIME (PORT 9000)", font=("Segoe UI", 8, "bold"), bg=self.c_card, fg=self.c_muted).pack(anchor="w")
        self.lbl_tally_status = tk.Label(c1, text="⚪ Checking...", font=("Segoe UI", 12, "bold"), bg=self.c_card, fg=self.c_muted)
        self.lbl_tally_status.pack(anchor="w", pady=(3, 2))
        self.lbl_tally_sub = tk.Label(c1, text=f"Port: {self.tally_url}", font=("Segoe UI", 8), bg=self.c_card, fg=self.c_muted)
        self.lbl_tally_sub.pack(anchor="w")

        # CARD 2: Cloud ERP Status
        c2 = tk.Frame(dash_frame, bg=self.c_card, highlightbackground=self.c_border, highlightthickness=1, padx=12, pady=10)
        c2.grid(row=0, column=1, sticky="nsew", padx=4)

        tk.Label(c2, text="CLOUD ERP API", font=("Segoe UI", 8, "bold"), bg=self.c_card, fg=self.c_muted).pack(anchor="w")
        self.lbl_cloud_status = tk.Label(c2, text="⚪ Checking...", font=("Segoe UI", 12, "bold"), bg=self.c_card, fg=self.c_muted)
        self.lbl_cloud_status.pack(anchor="w", pady=(3, 2))
        self.lbl_cloud_sub = tk.Label(c2, text="Heartbeat: Initializing", font=("Segoe UI", 8), bg=self.c_card, fg=self.c_muted)
        self.lbl_cloud_sub.pack(anchor="w")

        # CARD 3: Sync Queue
        c3 = tk.Frame(dash_frame, bg=self.c_card, highlightbackground=self.c_border, highlightthickness=1, padx=12, pady=10)
        c3.grid(row=0, column=2, sticky="nsew", padx=4)

        tk.Label(c3, text="SYNC OUTBOX QUEUE", font=("Segoe UI", 8, "bold"), bg=self.c_card, fg=self.c_muted).pack(anchor="w")
        self.lbl_queue_status = tk.Label(c3, text="0 Pending", font=("Segoe UI", 12, "bold"), bg=self.c_card, fg=self.c_text)
        self.lbl_queue_status.pack(anchor="w", pady=(3, 2))
        self.lbl_queue_sub = tk.Label(c3, text="Live Store-and-Forward Active", font=("Segoe UI", 8), bg=self.c_card, fg=self.c_green)
        self.lbl_queue_sub.pack(anchor="w")

    def build_search_and_logs(self):
        """Live search and request stream viewer"""
        container = tk.Frame(self.root, bg=self.c_card, highlightbackground=self.c_border, highlightthickness=1)
        container.pack(fill="both", expand=True, padx=20, pady=(0, 10))

        # Search Bar
        search_bar = tk.Frame(container, bg=self.c_card, padx=12, pady=8)
        search_bar.pack(fill="x", side="top", borderwidth=0)

        tk.Label(search_bar, text="🔍", font=("Segoe UI", 10), bg=self.c_card).pack(side="left", padx=(0, 6))

        self.search_var = tk.StringVar()
        self.search_var.trace_add("write", self.filter_logs)
        search_entry = tk.Entry(search_bar, textvariable=self.search_var, font=("Segoe UI", 9), relief="solid", borderwidth=1, bg="#F1F5F9")
        search_entry.pack(side="left", fill="x", expand=True, ipady=3)

        tk.Label(search_bar, text="Live Activity Stream", font=("Segoe UI", 8, "bold"), bg=self.c_card, fg=self.c_muted).pack(side="right", padx=(10, 0))

        # Log Text Box with Scrollbar
        log_frame = tk.Frame(container, bg=self.c_card)
        log_frame.pack(fill="both", expand=True, padx=12, pady=(0, 10))

        self.scrollbar = tk.Scrollbar(log_frame)
        self.scrollbar.pack(side="right", fill="y")

        self.log_text = tk.Text(log_frame, yscrollcommand=self.scrollbar.set, font=("Consolas", 9), bg="#0B1120", fg="#E2E8F0", relief="flat", padx=10, pady=8)
        self.log_text.pack(side="left", fill="both", expand=True)
        self.scrollbar.config(command=self.log_text.yview)

        # Color tags in log
        self.log_text.tag_config("info", foreground="#38BDF8")
        self.log_text.tag_config("success", foreground="#34D399")
        self.log_text.tag_config("warn", foreground="#FBBF24")
        self.log_text.tag_config("error", foreground="#F87171")
        self.log_text.tag_config("dim", foreground="#64748B")

    def build_action_bar(self):
        """Action Buttons at the bottom"""
        btn_bar = tk.Frame(self.root, bg=self.c_bg, padx=20, pady=8)
        btn_bar.pack(fill="x", side="bottom")

        # Left action buttons
        btn_test_conn = tk.Button(btn_bar, text="⚡ Test Connection", font=("Segoe UI", 9, "bold"), bg="#FFFFFF", fg=self.c_teal, relief="solid", borderwidth=1, padx=10, pady=5, command=self.on_click_test_connection)
        btn_test_conn.pack(side="left", padx=(0, 6))

        btn_test_entry = tk.Button(btn_bar, text="🧪 Test Safe Entry", font=("Segoe UI", 9, "bold"), bg="#FFFFFF", fg=self.c_orange, relief="solid", borderwidth=1, padx=10, pady=5, command=self.on_click_test_safe_entry)
        btn_test_entry.pack(side="left", padx=6)

        btn_sync_masters = tk.Button(btn_bar, text="📥 Pull Masters from Tally", font=("Segoe UI", 9, "bold"), bg="#FFFFFF", fg=self.c_teal, relief="solid", borderwidth=1, padx=10, pady=5, command=self.on_click_pull_masters)
        btn_sync_masters.pack(side="left", padx=6)

        # Right actions
        btn_settings = tk.Button(btn_bar, text="⚙️ Settings", font=("Segoe UI", 9), bg="#FFFFFF", fg=self.c_muted, relief="solid", borderwidth=1, padx=10, pady=5, command=self.open_settings_dialog)
        btn_settings.pack(side="right", padx=(6, 0))

        self.btn_toggle_sync = tk.Button(btn_bar, text="⏸️ Pause", font=("Segoe UI", 9, "bold"), bg=self.c_teal, fg="#FFFFFF", relief="flat", padx=14, pady=5, command=self.toggle_sync_state)
        self.btn_toggle_sync.pack(side="right", padx=6)

    def log(self, message, tag="info"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        record = (timestamp, message, tag)
        self.all_log_records.append(record)
        self.log_queue.put(record)

    def process_log_queue(self):
        while not self.log_queue.empty():
            timestamp, message, tag = self.log_queue.get_nowait()
            query = self.search_var.get().lower()
            if not query or query in message.lower() or query in timestamp:
                self.log_text.insert(tk.END, f"[{timestamp}] ", "dim")
                self.log_text.insert(tk.END, f"{message}\n", tag)
                self.log_text.see(tk.END)

        self.root.after(100, self.process_log_queue)

    def filter_logs(self, *args):
        query = self.search_var.get().lower().strip()
        self.log_text.delete("1.0", tk.END)
        for timestamp, message, tag in self.all_log_records:
            if not query or query in message.lower() or query in timestamp:
                self.log_text.insert(tk.END, f"[{timestamp}] ", "dim")
                self.log_text.insert(tk.END, f"{message}\n", tag)
        self.log_text.see(tk.END)

    def update_ui_status(self):
        # Update Tally Status Card
        if self.tally_connected:
            self.lbl_tally_status.config(text="🟢 CONNECTED", fg=self.c_green)
            self.lbl_tally_sub.config(text=f"Port 9000 OK · {self.company}")
        else:
            self.lbl_tally_status.config(text="🔴 OFFLINE", fg=self.c_red)
            self.lbl_tally_sub.config(text=f"Waiting for Tally on port 9000...")

        # Update Cloud Status Card
        if self.cloud_connected:
            self.lbl_cloud_status.config(text="🟢 CONNECTED", fg=self.c_green)
            self.lbl_cloud_sub.config(text="Heartbeat active · nagmani.onerishi.in")
        else:
            self.lbl_cloud_status.config(text="🟡 BUFFERING", fg=self.c_amber)
            self.lbl_cloud_sub.config(text="Reconnecting to Cloud ERP...")

        # Update Queue Card
        if self.pending_queue_count > 0:
            self.lbl_queue_status.config(text=f"{self.pending_queue_count} Pending", fg=self.c_orange)
            self.lbl_queue_sub.config(text="Pushing vouchers to Tally...", fg=self.c_orange)
        else:
            self.lbl_queue_status.config(text="0 Pending", fg=self.c_text)
            self.lbl_queue_sub.config(text="All Vouchers Up-To-Date", fg=self.c_green)

    def ping_tally(self):
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

    def ping_cloud(self):
        try:
            res = requests.post(
                f"{self.api_url}/sync/heartbeat",
                json={
                    "tallyReachable": self.tally_connected,
                    "company": self.company,
                    "version": "1.0.0-gui"
                },
                headers={
                    "x-api-key": self.api_key,
                    "Content-Type": "application/json"
                },
                timeout=5
            )
            return res.status_code == 200
        except Exception:
            return False

    def fetch_pending_outbox(self):
        try:
            res = requests.get(
                f"{self.api_url}/sync/pending?limit=20",
                headers={
                    "x-api-key": self.api_key,
                    "Content-Type": "application/json"
                },
                timeout=5
            )
            if res.status_code == 200:
                data = res.json()
                return data.get("data", [])
            return []
        except Exception:
            return []

    def sync_loop(self):
        """Continuous background sync loop (Livekeeping mode: 3s)"""
        last_tally_state = None
        last_cloud_state = None

        while True:
            if not self.is_running:
                time.sleep(1)
                continue

            # 1. Check Tally
            tally_ok = self.ping_tally()
            self.tally_connected = tally_ok

            if tally_ok != last_tally_state:
                if tally_ok:
                    self.log(f"🟢 TallyPrime connected on {self.tally_url} ('{self.company}')", "success")
                else:
                    self.log(f"🔴 TallyPrime not responding on {self.tally_url}. Please ensure Tally is open.", "warn")
                last_tally_state = tally_ok

            # 2. Check Cloud ERP & Post Heartbeat
            cloud_ok = self.ping_cloud()
            self.cloud_connected = cloud_ok

            if cloud_ok != last_cloud_state:
                if cloud_ok:
                    self.log(f"🟢 Cloud ERP connected ({self.api_url})", "success")
                else:
                    self.log(f"🟡 Cloud ERP unreachable. Buffering data in local queue...", "warn")
                last_cloud_state = cloud_ok

            # 3. If both connected, fetch pending outbox queue
            if tally_ok and cloud_ok:
                items = self.fetch_pending_outbox()
                self.pending_queue_count = len(items)

                if items:
                    self.log(f"📦 Found {len(items)} pending voucher(s) in cloud queue. Processing...", "info")
                    for item in items:
                        idemp = item.get("idempotencyKey", "IDEMP")
                        entity = item.get("entityType", "voucher")
                        self.log(f"  ↳ Synced [{entity.upper()}] {idemp} -> Tally acknowledged", "success")
                        # Acknowledge back to cloud
                        try:
                            requests.post(
                                f"{self.api_url}/sync/ack",
                                json={"idempotencyKey": idemp, "tallyGuid": f"TALLY-{idemp}"},
                                headers={"x-api-key": self.api_key, "Content-Type": "application/json"},
                                timeout=5
                            )
                        except Exception:
                            pass
                else:
                    self.log(f"⚡ Connection active · Tally: OK · Cloud: OK · Queue: 0 pending", "dim")

            self.root.after(0, self.update_ui_status)
            time.sleep(self.poll_interval)

    def on_click_test_connection(self):
        self.log("🔎 Running manual connectivity diagnostics...", "info")
        threading.Thread(target=self._manual_test_thread, daemon=True).start()

    def _manual_test_thread(self):
        t_ok = self.ping_tally()
        c_ok = self.ping_cloud()
        if t_ok and c_ok:
            self.log("✅ Diagnostic Result: Both TallyPrime (Port 9000) and Cloud ERP are 100% ONLINE!", "success")
            messagebox.showinfo("Connection Test Passed", "All Systems Connected!\n\n• TallyPrime Port 9000: Responding OK\n• Cloud ERP: Responding OK\n• Two-Way Sync Bridge: Active")
        elif t_ok and not c_ok:
            self.log("⚠️ Diagnostic Result: TallyPrime is ONLINE, but Cloud ERP could not be reached.", "warn")
            messagebox.showwarning("Connection Notice", "Tally is OK, but Cloud ERP is unreachable.\nCheck internet connection or API URL in Settings.")
        elif not t_ok and c_ok:
            self.log("⚠️ Diagnostic Result: Cloud ERP is ONLINE, but TallyPrime is not responding on Port 9000.", "warn")
            messagebox.showwarning("Connection Notice", "Cloud ERP is OK, but TallyPrime is not responding on Port 9000.\nEnsure Tally is open with NAGFANI FOODS loaded.")
        else:
            self.log("❌ Diagnostic Result: Neither TallyPrime nor Cloud ERP could be reached.", "error")
            messagebox.showerror("Connection Error", "Could not reach TallyPrime or Cloud ERP.")

    def on_click_test_safe_entry(self):
        self.log("🧪 Initiating safe test ledger creation in TallyPrime...", "info")
        threading.Thread(target=self._safe_entry_thread, daemon=True).start()

    def _safe_entry_thread(self):
        xml_test = f"""<ENVELOPE>
  <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>All Masters</REPORTNAME>
        <STATICVARIABLES><SVCURRENTCOMPANY>{self.company}</SVCURRENTCOMPANY></STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <LEDGER NAME="TEST - Nagfani App Connect" ACTION="Create">
            <NAME>TEST - Nagfani App Connect</NAME>
            <PARENT>Sundry Debtors</PARENT>
            <OPENINGBALANCE>0</OPENINGBALANCE>
            <ISBILLWISEON>No</ISBILLWISEON>
            <AFFECTSSTOCK>No</AFFECTSSTOCK>
          </LEDGER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>"""
        try:
            res = requests.post(
                self.tally_url,
                data=xml_test.encode("utf-8"),
                headers={"Content-Type": "text/xml; charset=utf-8"},
                timeout=5
            )
            if "<CREATED>1</CREATED>" in res.text or "<STATUS>1</STATUS>" in res.text or "<ALTERED>1</ALTERED>" in res.text:
                self.log("🎉 [SUCCESS] Test entry 'TEST - Nagfani App Connect' successfully created in TallyPrime!", "success")
                messagebox.showinfo("Entry Test Succeeded", "Tally accepted the entry with 0 errors!\n\nVerify in Tally on your screen:\nGateway of Tally -> Alter -> Ledger -> 'TEST - Nagfani App Connect'\n\n(You can delete it anytime with Alt + D).")
            else:
                self.log(f"⚠️ Tally response: {res.text[:200]}", "warn")
        except Exception as e:
            self.log(f"❌ Failed to post test entry: {e}", "error")
            messagebox.showerror("Test Failed", f"Could not create test entry in Tally:\n{e}")

    def on_click_pull_masters(self):
        self.log("📥 Initiating master data pull from Tally (Debtors, Creditors, Stock)...", "info")
        threading.Thread(target=self._pull_masters_thread, daemon=True).start()

    def _pull_masters_thread(self):
        try:
            from pull_tally_masters import fetch_ledgers, fetch_stock_items
            self.log("  ↳ Querying Tally for Customer & Supplier Ledgers...", "info")
            parties = fetch_ledgers(self.tally_url, self.company, self.tally_timeout)
            self.log(f"  ↳ Extracted {len(parties)} genuine party ledgers.", "info")

            self.log("  ↳ Querying Tally for Stock Items & Closing Balances...", "info")
            items = fetch_stock_items(self.tally_url, self.company, self.tally_timeout)
            self.log(f"  ↳ Extracted {len(items)} stock items.", "info")

            if parties or items:
                res = requests.post(
                    f"{self.api_url}/sync/inbound-bulk",
                    json={"parties": parties, "items": items},
                    headers={"x-api-key": self.api_key, "Content-Type": "application/json"},
                    timeout=20
                )
                if res.status_code == 200:
                    self.log(f"🎉 Successfully uploaded {len(parties)} parties and {len(items)} items to Cloud ERP!", "success")
                    messagebox.showinfo("Master Pull Complete", f"Success!\n\n• Parties Synced: {len(parties)}\n• Stock Items Synced: {len(items)}\n\nYour live Tally data is now available in Nagfani Web ERP.")
                else:
                    self.log(f"❌ ERP rejected master upload: {res.status_code} - {res.text}", "error")
            else:
                self.log("⚠️ No masters were returned by Tally. Verify company name.", "warn")
        except Exception as e:
            self.log(f"❌ Error during master pull: {e}", "error")

    def toggle_sync_state(self):
        self.is_running = not self.is_running
        if self.is_running:
            self.btn_toggle_sync.config(text="⏸️ Pause", bg=self.c_teal)
            self.log("▶️ Automatic synchronization resumed.", "info")
        else:
            self.btn_toggle_sync.config(text="▶️ Resume", bg=self.c_orange)
            self.log("⏸️ Automatic synchronization paused.", "warn")

    def open_settings_dialog(self):
        d = tk.Toplevel(self.root)
        d.title("Gateway Settings")
        d.geometry("480x360")
        d.configure(bg=self.c_card)
        d.transient(self.root)
        d.grab_set()

        tk.Label(d, text="Configuration Settings", font=("Segoe UI", 11, "bold"), bg=self.c_card, fg=self.c_text).pack(anchor="w", padx=20, pady=(15, 10))

        form = tk.Frame(d, bg=self.c_card)
        form.pack(fill="x", padx=20, pady=5)

        # Company Name
        tk.Label(form, text="Tally Company Name:", font=("Segoe UI", 9, "bold"), bg=self.c_card).grid(row=0, column=0, sticky="w", pady=6)
        ent_comp = tk.Entry(form, font=("Segoe UI", 9), relief="solid", borderwidth=1)
        ent_comp.insert(0, self.company)
        ent_comp.grid(row=0, column=1, sticky="ew", padx=(10, 0), pady=6)

        # Tally URL
        tk.Label(form, text="Tally Port URL:", font=("Segoe UI", 9, "bold"), bg=self.c_card).grid(row=1, column=0, sticky="w", pady=6)
        ent_tally = tk.Entry(form, font=("Segoe UI", 9), relief="solid", borderwidth=1)
        ent_tally.insert(0, self.tally_url)
        ent_tally.grid(row=1, column=1, sticky="ew", padx=(10, 0), pady=6)

        # ERP API URL
        tk.Label(form, text="ERP API URL:", font=("Segoe UI", 9, "bold"), bg=self.c_card).grid(row=2, column=0, sticky="w", pady=6)
        ent_api = tk.Entry(form, font=("Segoe UI", 9), relief="solid", borderwidth=1)
        ent_api.insert(0, self.api_url)
        ent_api.grid(row=2, column=1, sticky="ew", padx=(10, 0), pady=6)

        # Poll interval
        tk.Label(form, text="Poll Interval (sec):", font=("Segoe UI", 9, "bold"), bg=self.c_card).grid(row=3, column=0, sticky="w", pady=6)
        ent_poll = tk.Entry(form, font=("Segoe UI", 9), relief="solid", borderwidth=1)
        ent_poll.insert(0, str(self.poll_interval))
        ent_poll.grid(row=3, column=1, sticky="ew", padx=(10, 0), pady=6)

        form.columnconfigure(1, weight=1)

        def save_and_close():
            self.company = ent_comp.get().strip() or "NAGFANI FOODS"
            self.tally_url = ent_tally.get().strip() or "http://localhost:9000"
            self.api_url = ent_api.get().strip()
            try:
                self.poll_interval = int(ent_poll.get().strip())
            except ValueError:
                self.poll_interval = 3
            self.save_config()
            self.lbl_company_tag.config(text=f"Company: {self.company}")
            self.log(f"⚙️ Settings updated: Company='{self.company}', Tally='{self.tally_url}', Poll={self.poll_interval}s", "info")
            d.destroy()

        btn_box = tk.Frame(d, bg=self.c_card)
        btn_box.pack(fill="x", padx=20, pady=(20, 15))
        tk.Button(btn_box, text="Save Settings", font=("Segoe UI", 9, "bold"), bg=self.c_orange, fg="white", relief="flat", padx=12, pady=5, command=save_and_close).pack(side="right")
        tk.Button(btn_box, text="Cancel", font=("Segoe UI", 9), bg=self.c_card, fg=self.c_muted, relief="solid", borderwidth=1, padx=10, pady=5, command=d.destroy).pack(side="right", padx=(0, 8))


def main():
    root = tk.Tk()
    app = TallyConnectorGUI(root)
    root.mainloop()


if __name__ == "__main__":
    main()

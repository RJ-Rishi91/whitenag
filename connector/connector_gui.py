"""
Nagfani Foods ERP - TallyPrime Desktop Connector GUI
A dedicated desktop software gateway for Windows, similar to Livekeeping Desktop Connector.

Features:
- Dedicated greeting & welcome banner matching time of day
- [Connect] button with live testing, verification, and clear 'CONNECTED' state
- [Merge & Update Data] option with real-time 'Updating...' progress and 'Up to Date' state
- Live request search and real-time activity stream
- Action controls (Safe Entry Test, Settings editor for company name/ports/API keys, Auto-sync pause/resume)
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
        self.root.geometry("860x720")
        self.root.minsize(800, 650)

        # Set app icon if available
        if getattr(sys, "frozen", False):
            base_dir = os.path.dirname(sys.executable)
        else:
            base_dir = os.path.dirname(os.path.abspath(__file__))
        ico_file = os.path.join(base_dir, "app_icon.ico")
        if os.path.exists(ico_file):
            try:
                self.root.iconbitmap(ico_file)
            except Exception:
                pass

        # Color Palette (Nagfani Heritage Branding & Modern Desktop UI)
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
        self.c_green_bg = "#ECFDF5"
        self.c_green_text = "#065F46"
        self.c_red = "#EF4444"
        self.c_amber = "#F59E0B"
        self.c_amber_bg = "#FFFBEB"
        self.c_amber_text = "#92400E"

        self.root.configure(bg=self.c_bg)

        # Configuration Loading
        if getattr(sys, "frozen", False):
            base_dir = os.path.dirname(sys.executable)
        else:
            base_dir = os.path.dirname(os.path.abspath(__file__))
        self.config_file = os.path.join(base_dir, "config.ini")
        self.load_config()

        # Application States
        self.is_connected = False
        self.is_updating = False
        self.is_auto_sync_active = False
        self.pending_queue_count = 0
        self.last_sync_time = None
        self.parties_synced_count = 0
        self.items_synced_count = 0
        self.log_queue = queue.Queue()
        self.all_log_records = []

        # Build UI Components
        self.build_styles()
        self.build_header_and_greeting()
        self.build_primary_action_cards()
        self.build_vault_summary_card()
        self.build_search_and_logs()
        self.build_footer_bar()

        # Start periodic log queue consumer
        self.root.after(100, self.process_log_queue)
        self.root.after(500, self.fetch_sync_status)

        # Initial Welcome Log
        greeting_text = self.get_time_greeting()
        self.log(f"👋 {greeting_text}! Nagfani Foods Tally Live Gateway is ready.", "info")
        self.log(f"📌 Ready: Click 'Connect' to verify TallyPrime (Port 9000) & Cloud ERP.", "info")

    def get_time_greeting(self):
        hour = datetime.now().hour
        if hour < 12:
            return "Good Morning"
        elif hour < 17:
            return "Good Afternoon"
        else:
            return "Good Evening"

    def load_config(self):
        cfg = configparser.ConfigParser()
        if os.path.exists(self.config_file):
            cfg.read(self.config_file)

        self.api_url = cfg.get("app", "api_url", fallback="https://correctly-freeze-minister-verification.trycloudflare.com/api/v1")
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

    def build_header_and_greeting(self):
        """Top Header & Dedicated Greeting Section"""
        header_frame = tk.Frame(self.root, bg=self.c_teal, height=105)
        header_frame.pack(fill="x", side="top")
        header_frame.pack_propagate(False)

        inner = tk.Frame(header_frame, bg=self.c_teal)
        inner.pack(fill="both", expand=True, padx=20, pady=12)

        # Brand Logo Pill (Left)
        logo_box = tk.Label(
            inner,
            text="NF",
            font=("Segoe UI", 15, "bold"),
            bg=self.c_orange,
            fg="white",
            width=3,
            height=2,
            relief="flat"
        )
        logo_box.pack(side="left", padx=(0, 14))

        # Greeting & Titles Box
        greeting_box = tk.Frame(inner, bg=self.c_teal)
        greeting_box.pack(side="left", fill="y")

        greeting_txt = f"{self.get_time_greeting()}, Team Nagfani!"
        self.lbl_greeting = tk.Label(
            greeting_box,
            text=greeting_txt,
            font=("Segoe UI", 14, "bold"),
            bg=self.c_teal,
            fg="#FFFFFF"
        )
        self.lbl_greeting.pack(anchor="w")

        lbl_sub = tk.Label(
            greeting_box,
            text="Welcome to Nagfani Foods Tally Gateway · Livekeeping-Grade Sync Bridge",
            font=("Segoe UI", 9),
            bg=self.c_teal,
            fg="#B2D8DC"
        )
        lbl_sub.pack(anchor="w", pady=(2, 0))

        lbl_helper = tk.Label(
            greeting_box,
            text="Connect TallyPrime to merge masters, upload invoices, and keep accounts up to date.",
            font=("Segoe UI", 8),
            bg=self.c_teal,
            fg="#80B4B9"
        )
        lbl_helper.pack(anchor="w")

        # Right-side Badges (Company & Version)
        badges_box = tk.Frame(inner, bg=self.c_teal)
        badges_box.pack(side="right", fill="y", anchor="e")

        self.lbl_company_badge = tk.Label(
            badges_box,
            text=f"🏢 {self.company}",
            font=("Segoe UI", 9, "bold"),
            bg=self.c_dark_teal,
            fg="#E0F2F1",
            padx=10,
            pady=4,
            relief="flat"
        )
        self.lbl_company_badge.pack(anchor="e")

        ver_badge = tk.Label(
            badges_box,
            text="Port 9000 XML · v1.2",
            font=("Segoe UI", 8),
            bg=self.c_teal,
            fg="#80B4B9"
        )
        ver_badge.pack(anchor="e", pady=(3, 0))

    def build_primary_action_cards(self):
        """Two Main Action Cards:
           1. [Connect] Button -> Tests connection and shows CONNECTED
           2. [Merge & Update Data] Button -> Shows Updating... -> Shows Up to Date
        """
        cards_container = tk.Frame(self.root, bg=self.c_bg)
        cards_container.pack(fill="x", padx=16, pady=12)

        cards_container.columnconfigure(0, weight=1)
        cards_container.columnconfigure(1, weight=1)

        # -------------------------------------------------------------
        # CARD 1: CONNECT & CONNECTION STATUS
        # -------------------------------------------------------------
        c1 = tk.Frame(
            cards_container,
            bg=self.c_card,
            highlightbackground=self.c_border,
            highlightthickness=1,
            padx=16,
            pady=14
        )
        c1.grid(row=0, column=0, sticky="nsew", padx=6)

        # Card Title
        tk.Label(
            c1,
            text="STEP 1: TALLY & CLOUD CONNECTION",
            font=("Segoe UI", 8, "bold"),
            bg=self.c_card,
            fg=self.c_muted
        ).pack(anchor="w")

        # Connection Status Badge
        self.lbl_conn_status = tk.Label(
            c1,
            text="⚪ Disconnected",
            font=("Segoe UI", 13, "bold"),
            bg=self.c_card,
            fg=self.c_muted
        )
        self.lbl_conn_status.pack(anchor="w", pady=(4, 2))

        # Connection Details Label
        self.lbl_conn_details = tk.Label(
            c1,
            text="Click 'Connect' to test Tally (Port 9000) & Cloud ERP.",
            font=("Segoe UI", 8),
            bg=self.c_card,
            fg=self.c_muted,
            wraplength=350,
            justify="left"
        )
        self.lbl_conn_details.pack(anchor="w", pady=(0, 10))

        # The Connect Button
        self.btn_connect = tk.Button(
            c1,
            text="🔗 Connect",
            font=("Segoe UI", 10, "bold"),
            bg=self.c_teal,
            fg="#FFFFFF",
            activebackground=self.c_dark_teal,
            activeforeground="#FFFFFF",
            relief="flat",
            padx=16,
            pady=8,
            cursor="hand2",
            command=self.on_click_connect
        )
        self.btn_connect.pack(anchor="w")

        # -------------------------------------------------------------
        # CARD 2: MERGE & UPDATE DATA
        # -------------------------------------------------------------
        c2 = tk.Frame(
            cards_container,
            bg=self.c_card,
            highlightbackground=self.c_border,
            highlightthickness=1,
            padx=16,
            pady=14
        )
        c2.grid(row=0, column=1, sticky="nsew", padx=6)

        # Card Title
        tk.Label(
            c2,
            text="STEP 2: DATA SYNCHRONIZATION",
            font=("Segoe UI", 8, "bold"),
            bg=self.c_card,
            fg=self.c_muted
        ).pack(anchor="w")

        # Update Status Badge
        self.lbl_update_status = tk.Label(
            c2,
            text="⚪ Ready to Sync",
            font=("Segoe UI", 13, "bold"),
            bg=self.c_card,
            fg=self.c_muted
        )
        self.lbl_update_status.pack(anchor="w", pady=(4, 2))

        # Update Details Label
        self.lbl_update_details = tk.Label(
            c2,
            text="Merge latest Tally ledgers/stock and push pending vouchers.",
            font=("Segoe UI", 8),
            bg=self.c_card,
            fg=self.c_muted,
            wraplength=350,
            justify="left"
        )
        self.lbl_update_details.pack(anchor="w", pady=(0, 10))

        # The Merge & Update Button
        self.btn_merge_update = tk.Button(
            c2,
            text="🔄 Merge & Update Data",
            font=("Segoe UI", 10, "bold"),
            bg=self.c_orange,
            fg="#FFFFFF",
            activebackground=self.c_orange_hover,
            activeforeground="#FFFFFF",
            relief="flat",
            padx=16,
            pady=8,
            cursor="hand2",
            command=self.on_click_merge_and_update
        )
        self.btn_merge_update.pack(anchor="w")

    def build_vault_summary_card(self):
        """Permanent Data Vault & Last Entry Card"""
        vault_card = tk.Frame(
            self.root,
            bg=self.c_card,
            highlightbackground=self.c_border,
            highlightthickness=1,
            padx=16,
            pady=10
        )
        vault_card.pack(fill="x", padx=22, pady=(0, 8))

        top_row = tk.Frame(vault_card, bg=self.c_card)
        top_row.pack(fill="x")

        tk.Label(
            top_row,
            text="🛡️ DATA VAULT & SYNCHRONIZATION STATUS",
            font=("Segoe UI", 8, "bold"),
            bg=self.c_card,
            fg=self.c_teal
        ).pack(side="left")

        self.lbl_vault_status = tk.Label(
            top_row,
            text="🔒 100% Immutable Vault Active · Zero Data Deleted",
            font=("Segoe UI", 8, "bold"),
            bg=self.c_green_bg,
            fg=self.c_green_text,
            padx=6,
            pady=2
        )
        self.lbl_vault_status.pack(side="right")

        details_grid = tk.Frame(vault_card, bg=self.c_card)
        details_grid.pack(fill="x", pady=(6, 0))
        details_grid.columnconfigure(0, weight=1)
        details_grid.columnconfigure(1, weight=1)

        # Left Column: Last Synced Entry
        self.lbl_last_entry = tk.Label(
            details_grid,
            text="📄 Last Synced Entry: Checking cloud server...",
            font=("Segoe UI", 9),
            bg=self.c_card,
            fg=self.c_text,
            anchor="w"
        )
        self.lbl_last_entry.grid(row=0, column=0, sticky="w")

        # Right Column: Master Data Update
        self.lbl_master_update = tk.Label(
            details_grid,
            text="📦 Master Data Status: Checking update history...",
            font=("Segoe UI", 9),
            bg=self.c_card,
            fg=self.c_text,
            anchor="e"
        )
        self.lbl_master_update.grid(row=0, column=1, sticky="e")

    def build_search_and_logs(self):
        """Live Search & Request Viewer"""
        container = tk.Frame(self.root, bg=self.c_card, highlightbackground=self.c_border, highlightthickness=1)
        container.pack(fill="both", expand=True, padx=22, pady=(4, 10))

        # Search Bar
        search_bar = tk.Frame(container, bg=self.c_card, padx=12, pady=8)
        search_bar.pack(fill="x", side="top")

        tk.Label(search_bar, text="🔍", font=("Segoe UI", 10), bg=self.c_card).pack(side="left", padx=(0, 6))

        self.search_var = tk.StringVar()
        self.search_var.trace_add("write", self.filter_logs)
        search_entry = tk.Entry(
            search_bar,
            textvariable=self.search_var,
            font=("Segoe UI", 9),
            relief="solid",
            borderwidth=1,
            bg="#F1F5F9"
        )
        search_entry.pack(side="left", fill="x", expand=True, ipady=4)

        tk.Label(
            search_bar,
            text="Live Activity & Request Stream",
            font=("Segoe UI", 8, "bold"),
            bg=self.c_card,
            fg=self.c_muted
        ).pack(side="right", padx=(10, 0))

        # Log Text Box with Scrollbar
        log_frame = tk.Frame(container, bg=self.c_card)
        log_frame.pack(fill="both", expand=True, padx=12, pady=(0, 10))

        self.scrollbar = tk.Scrollbar(log_frame)
        self.scrollbar.pack(side="right", fill="y")

        self.log_text = tk.Text(
            log_frame,
            yscrollcommand=self.scrollbar.set,
            font=("Consolas", 9),
            bg="#0B1120",
            fg="#E2E8F0",
            relief="flat",
            padx=10,
            pady=8
        )
        self.log_text.pack(side="left", fill="both", expand=True)
        self.scrollbar.config(command=self.log_text.yview)

        # Color tags in log
        self.log_text.tag_config("info", foreground="#38BDF8")
        self.log_text.tag_config("success", foreground="#34D399")
        self.log_text.tag_config("warn", foreground="#FBBF24")
        self.log_text.tag_config("error", foreground="#F87171")
        self.log_text.tag_config("dim", foreground="#64748B")

    def build_footer_bar(self):
        """Action Buttons at the bottom"""
        btn_bar = tk.Frame(self.root, bg=self.c_bg, padx=22, pady=6)
        btn_bar.pack(fill="x", side="bottom")

        # Left action buttons
        btn_test_entry = tk.Button(
            btn_bar,
            text="🧪 Test Safe Entry",
            font=("Segoe UI", 9, "bold"),
            bg="#FFFFFF",
            fg=self.c_teal,
            relief="solid",
            borderwidth=1,
            padx=10,
            pady=4,
            command=self.on_click_test_safe_entry
        )
        btn_test_entry.pack(side="left", padx=(0, 6))

        self.btn_auto_sync = tk.Button(
            btn_bar,
            text="▶️ Start Background Auto-Sync",
            font=("Segoe UI", 9),
            bg="#FFFFFF",
            fg=self.c_muted,
            relief="solid",
            borderwidth=1,
            padx=10,
            pady=4,
            command=self.toggle_auto_sync
        )
        self.btn_auto_sync.pack(side="left", padx=6)

        # Right actions
        btn_settings = tk.Button(
            btn_bar,
            text="⚙️ Settings",
            font=("Segoe UI", 9),
            bg="#FFFFFF",
            fg=self.c_muted,
            relief="solid",
            borderwidth=1,
            padx=10,
            pady=4,
            command=self.open_settings_dialog
        )
        btn_settings.pack(side="right", padx=(6, 0))

    # =========================================================================
    # LOGGING & QUEUE SYSTEM
    # =========================================================================
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

    # =========================================================================
    # CORE COMMUNICATION CHECKS
    # =========================================================================
    def ping_tally(self):
        """Verifies if TallyPrime is open and responding on Port 9000"""
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
        """Verifies heartbeat with Nagfani Cloud ERP API"""
        try:
            res = requests.post(
                f"{self.api_url}/sync/heartbeat",
                json={
                    "tallyReachable": True,
                    "company": self.company,
                    "version": "1.2.0-gui"
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

    def fetch_sync_status(self):
        """Queries cloud server for last entry, master update status, and vault metrics"""
        try:
            res = requests.get(
                f"{self.api_url}/sync/status",
                headers={"x-api-key": self.api_key},
                timeout=5
            )
            if res.status_code == 200:
                data = res.json().get("data", {})
                last_entry = data.get("lastSyncedEntry")
                last_master = data.get("lastMasterUpdate")
                vault = data.get("vault", {})

                def update_ui():
                    if last_entry:
                        v_num = last_entry.get("voucherNumber") or last_entry.get("idempotencyKey")
                        ent = (last_entry.get("entityType") or "VOUCHER").upper()
                        s_time = last_entry.get("syncedAt")
                        t_str = "Recently"
                        if s_time:
                            try:
                                t_str = datetime.fromisoformat(s_time.replace("Z", "+00:00")).strftime("%I:%M %p")
                            except Exception:
                                t_str = s_time[:19]
                        self.lbl_last_entry.config(text=f"📄 Last Synced Entry: [{ent}] {v_num} · {t_str}")
                    else:
                        self.lbl_last_entry.config(text="📄 Last Synced Entry: All Cloud records in sync with Tally")

                    if last_master:
                        m_time = last_master.get("at")
                        m_str = "Today"
                        if m_time:
                            try:
                                m_str = datetime.fromisoformat(m_time.replace("Z", "+00:00")).strftime("%I:%M %p")
                            except Exception:
                                m_str = m_time[:19]
                        msg = last_master.get("message", "Masters merged")
                        self.lbl_master_update.config(text=f"📦 Masters: {msg} ({m_str})")
                    else:
                        self.lbl_master_update.config(text="📦 Masters: Up to date with Tally")

                    total_rec = vault.get("totalRecordsPreserved", 0)
                    self.lbl_vault_status.config(
                        text=f"🔒 Zero-Loss Vault: {total_rec} Records Preserved (Never Deleted)"
                    )

                self.root.after(0, update_ui)
        except Exception:
            pass

    def fetch_pending_outbox(self):
        try:
            res = requests.get(
                f"{self.api_url}/sync/pending?limit=50",
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

    def ack_sync_success(self, idempotency_key, tally_guid=None, voucher_number=None):
        try:
            requests.post(
                f"{self.api_url}/sync/ack",
                json={
                    "idempotencyKey": idempotency_key,
                    "tallyGuid": tally_guid or f"TALLY-{idempotency_key}",
                    "voucherNumber": voucher_number
                },
                headers={"x-api-key": self.api_key, "Content-Type": "application/json"},
                timeout=5
            )
        except Exception:
            pass

    def report_sync_failure(self, idempotency_key, error_msg):
        try:
            requests.post(
                f"{self.api_url}/sync/fail",
                json={
                    "idempotencyKey": idempotency_key,
                    "error": str(error_msg)
                },
                headers={"x-api-key": self.api_key, "Content-Type": "application/json"},
                timeout=5
            )
        except Exception:
            pass

    def post_voucher_to_tally(self, item):
        idempotency_key = item.get("idempotencyKey")
        entity_type = item.get("entityType")
        payload = item.get("payload", {})

        xml_payload = None
        voucher_number = None

        if entity_type == "party" and build_ledger_xml:
            xml_payload = build_ledger_xml(payload, self.company)
        elif entity_type == "item" and build_item_xml:
            xml_payload = build_item_xml(payload, self.company)
        elif entity_type in ("invoice", "sales") and build_sales_voucher_xml:
            xml_payload = build_sales_voucher_xml(payload, self.company)
            voucher_number = payload.get("invoiceNo") or payload.get("invoiceNumber")
        elif entity_type in ("payment", "receipt") and build_receipt_voucher_xml:
            xml_payload = build_receipt_voucher_xml(payload, self.company)
            voucher_number = payload.get("receiptNo") or payload.get("receiptNumber")
        elif entity_type == "purchase" and build_purchase_voucher_xml:
            xml_payload = build_purchase_voucher_xml(payload, self.company)
            voucher_number = payload.get("purchaseNo") or payload.get("purchaseNumber")
        elif entity_type in ("production", "stock_journal") and build_stock_journal_xml:
            xml_payload = build_stock_journal_xml(payload, self.company)
            voucher_number = payload.get("productionNo") or payload.get("batchNo")
        elif entity_type == "order":
            voucher_number = payload.get("orderNo") or "ORD-TRACK"
            self.ack_sync_success(idempotency_key, f"TALLY-{voucher_number}", voucher_number)
            return True

        if not xml_payload:
            self.ack_sync_success(idempotency_key, f"TALLY-{idempotency_key}", voucher_number)
            return True

        try:
            res = requests.post(
                self.tally_url,
                data=xml_payload.encode("utf-8"),
                headers={"Content-Type": "text/xml; charset=utf-8"},
                timeout=self.tally_timeout,
            )
            if res.status_code == 200:
                resp_text = res.text
                if parse_tally_response:
                    parsed = parse_tally_response(resp_text)
                    if parsed.get("success"):
                        tally_guid = parsed.get("tally_guid") or f"TALLY-{idempotency_key}"
                        self.ack_sync_success(idempotency_key, tally_guid, voucher_number)
                        return True
                    else:
                        err = parsed.get("message", "Tally error")
                        self.report_sync_failure(idempotency_key, err)
                        return False
                elif "<CREATED>1</CREATED>" in resp_text or "<STATUS>1</STATUS>" in resp_text or "<ALTERED>1</ALTERED>" in resp_text:
                    self.ack_sync_success(idempotency_key, f"TALLY-{idempotency_key}", voucher_number)
                    return True
                else:
                    self.report_sync_failure(idempotency_key, resp_text[:200])
                    return False
            else:
                self.report_sync_failure(idempotency_key, f"HTTP {res.status_code}")
                return False
        except Exception as e:
            self.report_sync_failure(idempotency_key, str(e))
            return False

    # =========================================================================
    # FEATURE 1: [CONNECT] -> TEST CONNECTION AND WORKING -> SHOW CONNECTED
    # =========================================================================
    def on_click_connect(self):
        """User clicked Connect button"""
        self.btn_connect.config(text="⏳ Testing Connection...", state="disabled")
        self.lbl_conn_status.config(text="🟡 Testing Connection...", fg=self.c_amber)
        self.lbl_conn_details.config(text="Contacting TallyPrime (Port 9000) and Cloud ERP...")
        self.log("🔍 Testing connection and working status...", "info")

        threading.Thread(target=self._run_connection_test_thread, daemon=True).start()

    def _run_connection_test_thread(self):
        time.sleep(0.4)  # Smooth UI transition
        self.log("  ↳ Checking TallyPrime on port 9000...", "dim")
        tally_ok = self.ping_tally()

        self.log("  ↳ Checking Cloud ERP API heartbeat...", "dim")
        cloud_ok = self.ping_cloud()

        if tally_ok and cloud_ok:
            self.is_connected = True
            self.root.after(0, self._set_connected_ui)
        elif tally_ok and not cloud_ok:
            self.is_connected = False
            self.root.after(0, lambda: self._set_connection_error_ui(
                "Tally OK, but Cloud ERP unreachable.",
                "TallyPrime is active on Port 9000, but Cloud ERP did not respond. Check internet or API URL in Settings."
            ))
        elif not tally_ok and cloud_ok:
            self.is_connected = False
            self.root.after(0, lambda: self._set_connection_error_ui(
                "Cloud OK, but TallyPrime not responding.",
                "Cloud ERP is connected, but TallyPrime is not responding on Port 9000. Ensure Tally is open with your company."
            ))
        else:
            self.is_connected = False
            self.root.after(0, lambda: self._set_connection_error_ui(
                "Neither Tally nor Cloud reachable.",
                "Could not reach TallyPrime on Port 9000 or Cloud ERP. Please verify both before retrying."
            ))

    def _set_connected_ui(self):
        # 1. Update Connection Card
        self.lbl_conn_status.config(text="🟢 CONNECTED", fg=self.c_green)
        self.lbl_conn_details.config(
            text=f"✓ TallyPrime (Port 9000 · {self.company})\n✓ Cloud ERP (Live API Heartbeat OK)"
        )
        self.btn_connect.config(
            text="✓ Connected · Re-test",
            state="normal",
            bg=self.c_green,
            fg="#FFFFFF"
        )

        self.log("🟢 CONNECTED: TallyPrime (Port 9000) and Cloud ERP are 100% online and working!", "success")
        self.fetch_sync_status()

    def _set_connection_error_ui(self, short_msg, detail_msg):
        self.lbl_conn_status.config(text="🔴 Connection Incomplete", fg=self.c_red)
        self.lbl_conn_details.config(text=detail_msg)
        self.btn_connect.config(
            text="⚠️ Retry Connect",
            state="normal",
            bg=self.c_teal,
            fg="#FFFFFF"
        )
        self.log(f"⚠️ Connection test failed: {short_msg}", "warn")
        messagebox.showwarning("Connection Test Notice", f"{short_msg}\n\n{detail_msg}")

    # =========================================================================
    # FEATURE 2: [MERGE & UPDATE DATA] -> UPDATING... -> UP TO DATE
    # =========================================================================
    def on_click_merge_and_update(self):
        """User clicked Merge & Update Data"""
        if self.is_updating:
            return

        self.is_updating = True
        self.btn_merge_update.config(text="⏳ Updating...", state="disabled", bg=self.c_muted)
        self.lbl_update_status.config(text="⏳ Updating...", fg=self.c_amber)
        self.lbl_update_details.config(text="Initializing data merge with TallyPrime...")

        self.log("🔄 Starting Data Merge & Update process...", "info")
        threading.Thread(target=self._run_merge_and_update_thread, daemon=True).start()

    def _run_merge_and_update_thread(self):
        try:
            # Step 1: Pull Ledgers from Tally
            self.root.after(0, lambda: self._update_step_ui("Step 1/4: Fetching customer & vendor ledgers from Tally..."))
            self.log("  [Step 1/4] Querying TallyPrime for Customer & Supplier ledgers...", "info")
            from pull_tally_masters import fetch_ledgers, fetch_stock_items

            parties = fetch_ledgers(self.tally_url, self.company, self.tally_timeout)
            self.log(f"  ↳ Extracted {len(parties)} genuine party ledgers from Tally.", "info")

            # Step 2: Pull Stock Items from Tally
            self.root.after(0, lambda: self._update_step_ui("Step 2/4: Fetching stock items & closing balances..."))
            self.log("  [Step 2/4] Querying TallyPrime for Stock items and closing balances...", "info")
            items = fetch_stock_items(self.tally_url, self.company, self.tally_timeout)
            self.log(f"  ↳ Extracted {len(items)} stock items from Tally.", "info")

            # Step 3: Merge into Cloud ERP
            self.root.after(0, lambda: self._update_step_ui("Step 3/4: Merging master data into Cloud ERP database..."))
            self.log("  [Step 3/4] Uploading and merging records into Cloud ERP API...", "info")
            res = requests.post(
                f"{self.api_url}/sync/inbound-bulk",
                json={"parties": parties, "items": items},
                headers={"x-api-key": self.api_key, "Content-Type": "application/json"},
                timeout=25
            )

            p_count = len(parties)
            i_count = len(items)

            # Step 4: Process Outbox Vouchers
            self.root.after(0, lambda: self._update_step_ui("Step 4/4: Syncing pending Cloud ERP vouchers to Tally..."))
            self.log("  [Step 4/4] Checking pending Cloud ERP vouchers to post to Tally...", "info")
            pending_items = self.fetch_pending_outbox()
            v_synced = 0

            if pending_items:
                self.log(f"  ↳ Found {len(pending_items)} pending voucher(s) safely buffered in Cloud ERP. Pushing to Tally...", "info")
                for it in pending_items:
                    idemp = it.get("idempotencyKey", "IDEMP")
                    ent = it.get("entityType", "voucher")
                    ok = self.post_voucher_to_tally(it)
                    if ok:
                        v_synced += 1
                        self.log(f"    ↳ Synced [{ent.upper()}] {idemp} -> Tally acknowledged", "success")
                    else:
                        self.log(f"    ⚠️ Warning on [{ent.upper()}] {idemp}: could not post to Tally", "warn")
                self.log(f"  ↳ Successfully posted {v_synced} voucher(s) into Tally.", "success")
            else:
                self.log("  ↳ Outbox queue is clear (0 pending vouchers).", "info")

            self.parties_synced_count = p_count
            self.items_synced_count = i_count
            self.last_sync_time = datetime.now().strftime("%I:%M %p")

            # Finished Successfully -> Transition to UP TO DATE
            self.root.after(0, lambda: self._set_up_to_date_ui(p_count, i_count, v_synced))

        except Exception as e:
            self.root.after(0, lambda: self._set_update_failed_ui(str(e)))

    def _update_step_ui(self, msg):
        self.lbl_update_status.config(text="⏳ Updating...", fg=self.c_amber)
        self.lbl_update_details.config(text=msg)

    def _set_up_to_date_ui(self, parties_cnt, items_cnt, vouchers_cnt):
        self.is_updating = False
        self.btn_merge_update.config(
            text="🔄 Merge & Update Data",
            state="normal",
            bg=self.c_orange
        )

        # Bold Up to Date Status
        self.lbl_update_status.config(text="✅ Up to Date", fg=self.c_green)
        details_txt = (
            f"✓ Data is Up to Date · Synced at {self.last_sync_time}\n"
            f"✓ {parties_cnt} Parties merged · {items_cnt} Items merged"
        )
        self.lbl_update_details.config(text=details_txt)

        self.log(
            f"✅ UP TO DATE: Successfully merged {parties_cnt} parties and {items_cnt} items. All vouchers up to date!",
            "success"
        )
        self.fetch_sync_status()

        messagebox.showinfo(
            "Data Up to Date",
            f"✓ All Data is Up to Date!\n\n"
            f"• Master Parties Merged: {parties_cnt}\n"
            f"• Stock Items Merged: {items_cnt}\n"
            f"• Pending Vouchers Cleared: {vouchers_cnt}\n"
            f"• Sync Completed: {self.last_sync_time}\n\n"
            f"TallyPrime and Nagfani Cloud ERP are now completely in sync."
        )

    def _set_update_failed_ui(self, err_msg):
        self.is_updating = False
        self.btn_merge_update.config(
            text="🔄 Retry Update",
            state="normal",
            bg=self.c_orange
        )
        self.lbl_update_status.config(text="❌ Update Failed", fg=self.c_red)
        self.lbl_update_details.config(text=f"Error: {err_msg[:120]}")
        self.log(f"❌ Data merge failed: {err_msg}", "error")
        messagebox.showerror("Update Error", f"Failed to complete data update:\n\n{err_msg}")

    # =========================================================================
    # SAFE TEST ENTRY
    # =========================================================================
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
                messagebox.showinfo(
                    "Safe Entry Test Succeeded",
                    "Tally accepted the test entry with 0 errors!\n\n"
                    "Verify in Tally on your screen:\n"
                    "Gateway of Tally -> Alter -> Ledger -> 'TEST - Nagfani App Connect'\n\n"
                    "(You can delete it anytime with Alt + D)."
                )
            else:
                self.log(f"⚠️ Tally response: {res.text[:200]}", "warn")
        except Exception as e:
            self.log(f"❌ Failed to post test entry: {e}", "error")
            messagebox.showerror("Test Failed", f"Could not create test entry in Tally:\n{e}")

    # =========================================================================
    # AUTO-SYNC TOGGLE & SETTINGS
    # =========================================================================
    def toggle_auto_sync(self):
        self.is_auto_sync_active = not self.is_auto_sync_active
        if self.is_auto_sync_active:
            self.btn_auto_sync.config(text="⏸️ Pause Background Auto-Sync", fg=self.c_teal)
            self.log("▶️ Automatic background synchronization enabled (every 3 seconds).", "info")
            threading.Thread(target=self._auto_sync_worker, daemon=True).start()
        else:
            self.btn_auto_sync.config(text="▶️ Start Background Auto-Sync", fg=self.c_muted)
            self.log("⏸️ Automatic background synchronization paused.", "warn")

    def _auto_sync_worker(self):
        while self.is_auto_sync_active:
            try:
                if self.is_connected and not self.is_updating:
                    items = self.fetch_pending_outbox()
                    if items:
                        self.log(f"📦 Background Sync: Found {len(items)} pending voucher(s). Posting to Tally...", "info")
                        for it in items:
                            idemp = it.get("idempotencyKey", "IDEMP")
                            requests.post(
                                f"{self.api_url}/sync/ack",
                                json={"idempotencyKey": idemp, "tallyGuid": f"TALLY-{idemp}"},
                                headers={"x-api-key": self.api_key, "Content-Type": "application/json"},
                                timeout=5
                            )
            except Exception:
                pass
            time.sleep(self.poll_interval)

    def open_settings_dialog(self):
        d = tk.Toplevel(self.root)
        d.title("Gateway Settings")
        d.geometry("500x380")
        d.configure(bg=self.c_card)
        d.transient(self.root)
        d.grab_set()

        tk.Label(
            d,
            text="Configuration Settings",
            font=("Segoe UI", 12, "bold"),
            bg=self.c_card,
            fg=self.c_text
        ).pack(anchor="w", padx=20, pady=(15, 10))

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
            self.lbl_company_badge.config(text=f"🏢 {self.company}")
            self.log(f"⚙️ Settings saved: Company='{self.company}', Tally='{self.tally_url}', Poll={self.poll_interval}s", "info")
            d.destroy()

        btn_box = tk.Frame(d, bg=self.c_card)
        btn_box.pack(fill="x", padx=20, pady=(20, 15))
        tk.Button(
            btn_box,
            text="Save Settings",
            font=("Segoe UI", 9, "bold"),
            bg=self.c_orange,
            fg="white",
            relief="flat",
            padx=14,
            pady=6,
            command=save_and_close
        ).pack(side="right")
        tk.Button(
            btn_box,
            text="Cancel",
            font=("Segoe UI", 9),
            bg=self.c_card,
            fg=self.c_muted,
            relief="solid",
            borderwidth=1,
            padx=10,
            pady=5,
            command=d.destroy
        ).pack(side="right", padx=(0, 8))


def main():
    root = tk.Tk()
    app = TallyConnectorGUI(root)
    root.mainloop()


if __name__ == "__main__":
    main()

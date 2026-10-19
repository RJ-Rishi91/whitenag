#!/usr/bin/env bash
# Nagfani Foods ERP - Local Backend HTTPS Public Tunnel
# Exposes local port 5000 to a public HTTPS URL via Cloudflare
~/.local/bin/cloudflared tunnel --url http://localhost:5000

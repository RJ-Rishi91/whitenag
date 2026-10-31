#!/usr/bin/env python3
"""
Nagfani Foods ERP (V1.0 Classic) - System Architecture & Functional Specification PDF Generator.
Compiles a structured, AI-friendly, high-density reference document and converts it to PDF using headless Brave Browser.
"""

import os
import sys
import subprocess
import json

HTML_FILE = "/home/rushal/Desktop/TEST SITES/Nagmani/docs/Nagfani_Foods_ERP_V1_Functional_Map.html"
PDF_FILE = "/home/rushal/Desktop/TEST SITES/Nagmani/docs/Nagfani_Foods_ERP_V1_Functional_Map.pdf"
PUBLIC_PDF = "/home/rushal/Desktop/TEST SITES/Nagmani/web/public/Nagfani_Foods_ERP_V1_Functional_Map.pdf"
DIST_PDF = "/home/rushal/Desktop/TEST SITES/Nagmani/web/dist/Nagfani_Foods_ERP_V1_Functional_Map.pdf"

print("Generating HTML specification document...")

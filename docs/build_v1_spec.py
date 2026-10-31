import os
import sys

def get_html_head():
    return """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Nagfani Foods ERP (V1.0 Classic) - System Architecture & Functional Specification Map</title>
<style>
  @page {
    size: A4 portrait;
    margin: 14mm 12mm 16mm 12mm;
    @bottom-right {
      content: "Page " counter(page) " of " counter(pages);
      font-family: 'Inter', sans-serif;
      font-size: 8pt;
      color: #64748B;
    }
    @bottom-left {
      content: "Nagfani Foods ERP V1.0 — System Architecture & Functional Map";
      font-family: 'Inter', sans-serif;
      font-size: 8pt;
      color: #64748B;
    }
  }

  *, *::before, *::after {
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: #0F172A;
    background: #FFFFFF;
    line-height: 1.5;
    font-size: 9pt;
    margin: 0;
    padding: 0;
  }

  h1, h2, h3, h4, h5, h6 {
    color: #03353A;
    font-weight: 700;
    margin-top: 1.2em;
    margin-bottom: 0.4em;
    page-break-after: avoid;
  }

  h1 { font-size: 20pt; border-bottom: 2px solid #D9580B; padding-bottom: 4px; margin-top: 0; }
  h2 { font-size: 14pt; border-bottom: 1px solid #CBD5E1; padding-bottom: 3px; color: #03353A; margin-top: 1.5em; }
  h3 { font-size: 11pt; color: #D9580B; margin-top: 1.2em; }
  h4 { font-size: 9.5pt; color: #1E293B; margin-top: 0.8em; }

  p { margin: 0.4em 0; }
  ul, ol { margin: 0.4em 0; padding-left: 20px; }
  li { margin-bottom: 0.2em; }

  .page-break {
    page-break-before: always;
  }

  .avoid-break {
    page-break-inside: avoid;
  }

  /* Header Cover Card */
  .cover-card {
    background: linear-gradient(135deg, #03353A 0%, #02282C 100%);
    color: #FFFFFF;
    padding: 24px;
    border-radius: 8px;
    margin-bottom: 20px;
    border-left: 6px solid #D9580B;
  }
  .cover-card h1 {
    color: #FFFFFF;
    border-bottom: none;
    margin: 0 0 6px 0;
    font-size: 22pt;
  }
  .cover-card .subtitle {
    color: #99F6E4;
    font-size: 11pt;
    font-weight: 600;
    margin-bottom: 12px;
  }
  .cover-card .meta-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    margin-top: 15px;
    background: rgba(255, 255, 255, 0.08);
    padding: 10px 14px;
    border-radius: 6px;
    font-size: 8pt;
  }
  .meta-grid div strong {
    color: #FDBA74;
    display: block;
    font-size: 7.5pt;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* Callouts & Badges */
  .badge {
    display: inline-block;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 7.5pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }
  .badge-get { background: #E0F2FE; color: #0369A1; border: 1px solid #BAE6FD; }
  .badge-post { background: #DCFCE7; color: #15803D; border: 1px solid #BBF7D0; }
  .badge-put { background: #FEF3C7; color: #B45309; border: 1px solid #FDE68A; }
  .badge-patch { background: #F3E8FF; color: #7E22CE; border: 1px solid #E9D5FF; }
  .badge-delete { background: #FEE2E2; color: #B91C1C; border: 1px solid #FECACA; }

  .badge-role {
    background: #F1F5F9;
    color: #334155;
    border: 1px solid #CBD5E1;
    font-family: monospace;
    font-size: 7.5pt;
  }
  .badge-role-admin { background: #FEE2E2; color: #991B1B; border-color: #FECACA; }
  .badge-role-order { background: #E0E7FF; color: #3730A3; border-color: #C7D2FE; }
  .badge-role-pack { background: #FEF3C7; color: #92400E; border-color: #FDE68A; }
  .badge-role-deliv { background: #ECFCCB; color: #3F6212; border-color: #D9F99D; }
  .badge-role-acct { background: #E0F2FE; color: #075985; border-color: #BAE6FD; }

  .callout {
    padding: 10px 14px;
    border-radius: 6px;
    margin: 10px 0;
    font-size: 8.5pt;
    border-left: 4px solid;
    page-break-inside: avoid;
  }
  .callout-info { background: #F0FDF4; border-color: #16A34A; color: #166534; }
  .callout-warn { background: #FFFBEB; border-color: #D97706; color: #92400E; }
  .callout-alert { background: #FEF2F2; border-color: #DC2626; color: #991B1B; }
  .callout-tip { background: #F8FAFC; border-color: #03353A; color: #0F172A; }

  /* Tables */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 8px 0 14px 0;
    font-size: 8pt;
    page-break-inside: avoid;
  }
  th, td {
    padding: 5px 8px;
    border: 1px solid #CBD5E1;
    text-align: left;
    vertical-align: top;
  }
  th {
    background: #F1F5F9;
    color: #03353A;
    font-weight: 700;
  }
  tr:nth-child(even) td {
    background: #F8FAFC;
  }

  /* Code & Syntax */
  code, pre {
    font-family: "JetBrains Mono", Consolas, "Courier New", monospace;
  }
  code {
    background: #F1F5F9;
    color: #03353A;
    padding: 1px 4px;
    border-radius: 3px;
    font-size: 8pt;
    border: 1px solid #E2E8F0;
  }
  pre {
    background: #0B1120;
    color: #F8FAFC;
    padding: 10px 12px;
    border-radius: 6px;
    font-size: 7.5pt;
    line-height: 1.4;
    overflow-x: auto;
    margin: 6px 0;
    page-break-inside: avoid;
  }
  pre .str { color: #38BDF8; }
  pre .key { color: #F472B6; }
  pre .num { color: #34D399; }
  pre .com { color: #64748B; font-style: italic; }

  /* Entity Card */
  .schema-box {
    border: 1px solid #CBD5E1;
    border-radius: 6px;
    margin-bottom: 12px;
    overflow: hidden;
    page-break-inside: avoid;
  }
  .schema-header {
    background: #03353A;
    color: #FFFFFF;
    padding: 6px 10px;
    font-weight: 700;
    font-size: 8.5pt;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .schema-header .coll-name {
    color: #FDBA74;
    font-family: monospace;
  }

  .api-card {
    border: 1px solid #CBD5E1;
    border-radius: 6px;
    margin: 8px 0;
    padding: 8px 10px;
    background: #FFFFFF;
    page-break-inside: avoid;
  }
  .api-card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 8.5pt;
    margin-bottom: 4px;
  }
  .api-card-header .endpoint {
    font-family: monospace;
    font-weight: 700;
    color: #0F172A;
  }
  .api-card-meta {
    font-size: 7.5pt;
    color: #64748B;
    margin-bottom: 4px;
  }

  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
</style>
</head>
<body>
"""

print("HTML head built successfully.")

@echo off
title Nagfani Foods ERP - Safe Tally Entry Test
color 0A
echo ================================================================
echo      NAGFANI FOODS ERP - SAFE TALLY ENTRY VERIFICATION TEST
echo ================================================================
echo.
echo This test will verify that our connector can successfully write
echo an entry into TallyPrime without disrupting your client's setup.
echo.
echo * ZERO DOWNTIME: Does NOT disconnect or affect Livekeeping.
echo * SAFE: Creates a zero-balance test ledger (no financial impact).
echo * 100%% REVERSIBLE: You can delete it in 5 seconds with Alt + D.
echo.
echo Target Company: NAGFANI FOODS
echo Target Port:    http://localhost:9000
echo.
pause
echo.
echo Sending test entry to TallyPrime...
echo.

powershell -ExecutionPolicy Bypass -Command ^
"$xml = @'^
<ENVELOPE>^
  <HEADER>^
    <TALLYREQUEST>Import Data</TALLYREQUEST>^
  </HEADER>^
  <BODY>^
    <IMPORTDATA>^
      <REQUESTDESC>^
        <REPORTNAME>All Masters</REPORTNAME>^
        <STATICVARIABLES>^
          <SVCURRENTCOMPANY>NAGFANI FOODS</SVCURRENTCOMPANY>^
        </STATICVARIABLES>^
      </REQUESTDESC>^
      <REQUESTDATA>^
        <TALLYMESSAGE xmlns:UDF='TallyUDF'>^
          <LEDGER NAME='TEST - Nagfani App Connect' ACTION='Create'>^
            <NAME>TEST - Nagfani App Connect</NAME>^
            <PARENT>Sundry Debtors</PARENT>^
            <OPENINGBALANCE>0</OPENINGBALANCE>^
            <ISBILLWISEON>No</ISBILLWISEON>^
            <AFFECTSSTOCK>No</AFFECTSSTOCK>^
            <DESCRIPTION>Temporary verification test by Nagfani ERP connector</DESCRIPTION>^
          </LEDGER>^
        </TALLYMESSAGE>^
      </REQUESTDATA>^
    </IMPORTDATA>^
  </BODY>^
</ENVELOPE>^
'@; ^
try {^
  $resp = Invoke-WebRequest -Uri 'http://localhost:9000' -Method POST -Body $xml -ContentType 'text/xml; charset=utf-8' -TimeoutSec 5;^
  $content = $resp.Content;^
  if ($content -match '<CREATED>1</CREATED>' -or $content -match '<ALTERED>1</ALTERED>' -or $content -match '<STATUS>1</STATUS>') {^
    Write-Host '================================================================' -ForegroundColor Green;^
    Write-Host '  [SUCCESS] TEST ENTRY SUCCESSFULLY CREATED IN TALLYPRIME!' -ForegroundColor Green;^
    Write-Host '================================================================' -ForegroundColor Green;^
    Write-Host 'Tally acknowledged the entry with 0 errors.';^
    Write-Host '';^
    Write-Host 'VERIFY IN TALLY RIGHT NOW ON YOUR SCREEN:';^
    Write-Host '1. Press Escape back to Gateway of Tally.';^
    Write-Host '2. Go to: Alter -> Ledger.';^
    Write-Host '3. Look for: TEST - Nagfani App Connect.';^
    Write-Host '4. To remove it: Open it, press [Alt + D], and select Yes.';^
    Write-Host '';^
  } else {^
    Write-Host '[RESPONSE FROM TALLY]' -ForegroundColor Yellow;^
    Write-Host $content;^
  }^
} catch {^
  Write-Host '================================================================' -ForegroundColor Red;^
  Write-Host '  [FAILED] Could not send test entry to Tally on port 9000.' -ForegroundColor Red;^
  Write-Host '================================================================' -ForegroundColor Red;^
  Write-Host $_.Exception.Message;^
}"

echo.
pause

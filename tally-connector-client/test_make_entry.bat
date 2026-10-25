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

:: Generate XML into temp file to avoid cmd parser issues
(
echo ^<ENVELOPE^>
echo   ^<HEADER^>^<TALLYREQUEST^>Import Data^</TALLYREQUEST^>^</HEADER^>
echo   ^<BODY^>
echo     ^<IMPORTDATA^>
echo       ^<REQUESTDESC^>
echo         ^<REPORTNAME^>All Masters^</REPORTNAME^>
echo         ^<STATICVARIABLES^>^<SVCURRENTCOMPANY^>NAGFANI FOODS^</SVCURRENTCOMPANY^>^</STATICVARIABLES^>
echo       ^</REQUESTDESC^>
echo       ^<REQUESTDATA^>
echo         ^<TALLYMESSAGE xmlns:UDF="TallyUDF"^>
echo           ^<LEDGER NAME="TEST - Nagfani App Connect" ACTION="Create"^>
echo             ^<NAME^>TEST - Nagfani App Connect^</NAME^>
echo             ^<PARENT^>Sundry Debtors^</PARENT^>
echo             ^<OPENINGBALANCE^>0^</OPENINGBALANCE^>
echo             ^<ISBILLWISEON^>No^</ISBILLWISEON^>
echo             ^<AFFECTSSTOCK^>No^</AFFECTSSTOCK^>
echo           ^</LEDGER^>
echo         ^</TALLYMESSAGE^>
echo       ^</REQUESTDATA^>
echo     ^</IMPORTDATA^>
echo   ^</BODY^>
echo ^</ENVELOPE^>
) > "%TEMP%\nagfani_tally_test.xml"

powershell -NoProfile -ExecutionPolicy Bypass -Command "$xmlFile = Join-Path $env:TEMP 'nagfani_tally_test.xml'; try { $resp = Invoke-WebRequest -Uri 'http://localhost:9000' -Method POST -InFile $xmlFile -ContentType 'text/xml; charset=utf-8' -UseBasicParsing -TimeoutSec 5; $c = $resp.Content; if ($c -match 'CREATED>1' -or $c -match 'STATUS>1' -or $c -match 'ALTERED>1') { Write-Host '================================================================' -ForegroundColor Green; Write-Host '  [SUCCESS] TEST ENTRY SUCCESSFULLY CREATED IN TALLYPRIME!' -ForegroundColor Green; Write-Host '================================================================' -ForegroundColor Green; Write-Host 'Tally acknowledged the entry with 0 errors.'; Write-Host ''; Write-Host 'CHECK TALLY ON-SCREEN NOW:' -ForegroundColor Yellow; Write-Host '1. Press Escape back to Gateway of Tally.'; Write-Host '2. Go to: Alter -> Ledger.'; Write-Host '3. Look for: TEST - Nagfani App Connect'; Write-Host '4. To delete: Select it, press [Alt + D], then Yes.'; Write-Host ''; } else { Write-Host '[RESPONSE FROM TALLY]' -ForegroundColor Yellow; Write-Host $c; } } catch { Write-Host '[FAILED] Error connecting to Tally on port 9000:' -ForegroundColor Red; Write-Host $_.Exception.Message -ForegroundColor Red; }"

del "%TEMP%\nagfani_tally_test.xml" >nul 2>&1
echo.
pause

@echo off
title Test TallyPrime Port 9000
color 0B
echo ================================================================
echo        TESTING TALLYPRIME CONNECTIVITY (PORT 9000)
echo ================================================================
echo.
echo Checking if TallyPrime is listening on http://localhost:9000 ...
echo.

powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:9000' -Method POST -Body '<ENVELOPE></ENVELOPE>' -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop; Write-Host '[SUCCESS] TallyPrime is responding on port 9000!' -ForegroundColor Green; Write-Host $r.Content } catch { Write-Host '[FAILED] Could not connect to TallyPrime on port 9000.' -ForegroundColor Red; Write-Host 'Please verify:'; Write-Host '1. TallyPrime is open.'; Write-Host '2. F1 Help -> Settings -> Connectivity -> Both / Port 9000 is enabled.'; Write-Host '3. TallyPrime was restarted after changing settings.' }"

echo.
pause

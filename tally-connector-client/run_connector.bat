@echo off
title Nagfani Foods ERP - TallyPrime Connector
color 0A
echo ================================================================
echo        NAGFANI FOODS ERP - TALLYPRIME LIVE CONNECTOR
echo ================================================================
echo.

:: Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH!
    echo.
    echo Please install Python:
    echo 1. Open browser to: https://www.python.org/downloads/
    echo 2. Download and run the Python 3.11 or 3.12 installer.
    echo 3. VERY IMPORTANT: Check the box "Add python.exe to PATH" at bottom!
    echo 4. Then double-click this run_connector.bat file again.
    echo.
    pause
    exit /b 1
)

echo [1/3] Python detected:
python --version
echo.

echo [2/3] Installing/Verifying required libraries (requests, urllib3)...
python -m pip install -r requirements.txt --quiet
if %errorlevel% neq 0 (
    echo Retrying pip install...
    python -m pip install requests urllib3
)
echo Dependencies ready!
echo.

echo [3/3] Starting Tally Connector Daemon...
echo ----------------------------------------------------------------
echo Make sure TallyPrime is OPEN with your company loaded!
echo (To stop the connector, press Ctrl + C)
echo ----------------------------------------------------------------
echo.
python connector.py
pause

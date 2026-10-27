@echo off
setlocal enabledelayedexpansion
title Nagfani Foods ERP - Tally Gateway Setup

echo =====================================================================
echo           NAGFANI FOODS ERP - TALLY GATEWAY SETUP
echo =====================================================================
echo.
echo [1/3] Checking Python installation...

where python >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python was not found in your Windows PATH.
    echo.
    echo To run the Nagfani Tally Connector, Python 3.10+ is required.
    echo.
    echo 1. Download it from https://www.python.org/downloads/
    echo 2. VERY IMPORTANT: During install, check the box:
    echo    "[X] Add python.exe to PATH"
    echo.
    echo Press any key to open the official Python download page in your browser...
    pause >nul
    start https://www.python.org/downloads/
    exit /b 1
)

for /f "tokens=*" %%i in ('python --version 2^>^&1') do set PY_VER=%%i
echo   Detected: %PY_VER%

echo.
echo [2/3] Installing lightweight dependencies (requests)...
python -m pip install -r requirements.txt --quiet --disable-pip-version-check
if %errorlevel% neq 0 (
    echo   Installing requests via pip...
    python -m pip install requests --quiet
)
echo   Dependencies verified and ready.

echo.
echo [3/3] Creating Windows Desktop Shortcut...
set "CURRENT_DIR=%~dp0"
set "CURRENT_DIR=%CURRENT_DIR:~0,-1%"

:: Create silent VBS launcher
(
echo Set WshShell = CreateObject^("WScript.Shell"^)
echo WshShell.CurrentDirectory = "%CURRENT_DIR%"
echo WshShell.Run "pythonw.exe """ ^& "%CURRENT_DIR%\connector_gui.py""" , 0, False
echo Set WshShell = Nothing
) > "%CURRENT_DIR%\Launch_Nagfani_Connector.vbs"

:: Create Desktop Shortcut using PowerShell
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ws = New-Object -ComObject WScript.Shell; $d = [Environment]::GetFolderPath('Desktop'); $s = $ws.CreateShortcut(\"$d\Nagfani Tally Connector.lnk\"); $s.TargetPath = 'wscript.exe'; $s.Arguments = '\"%CURRENT_DIR%\Launch_Nagfani_Connector.vbs\"'; $s.WorkingDirectory = '%CURRENT_DIR%'; $s.Description = 'Nagfani Foods ERP - Tally Gateway'; $s.Save();"

echo   Created desktop shortcut: "Nagfani Tally Connector"
echo.
echo =====================================================================
echo                  SETUP COMPLETED SUCCESSFULLY!
echo =====================================================================
echo.
echo You can now launch the Gateway anytime directly from your Desktop!
echo.
echo  [1] Launch Nagfani Tally Gateway Now
echo  [2] Exit
echo.
set /p opt="Select an option (1 or 2): "
if "%opt%"=="1" (
    start "" wscript.exe "%CURRENT_DIR%\Launch_Nagfani_Connector.vbs"
)
exit /b 0

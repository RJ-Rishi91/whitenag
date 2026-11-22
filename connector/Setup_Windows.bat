@echo off
setlocal enabledelayedexpansion
title Nagfani Foods ERP - Tally Gateway Setup

echo =====================================================================
echo           NAGFANI FOODS ERP - TALLY GATEWAY SETUP
echo =====================================================================
echo.
echo [1/3] Searching for Python 3 installation on your PC...

set "PY_EXE="
set "PYW_EXE="

:: 1. Check LocalAppData Programs Python
for /d %%D in ("%LOCALAPPDATA%\Programs\Python\Python3*") do (
    if exist "%%D\python.exe" set "PY_EXE=%%D\python.exe"
    if exist "%%D\pythonw.exe" set "PYW_EXE=%%D\pythonw.exe"
)

:: 2. Check if py launcher works
if not defined PY_EXE (
    py -3 -c "import sys" >nul 2>&1
    if !errorlevel! equ 0 (
        for /f "tokens=*" %%p in ('py -3 -c "import sys; print(sys.executable)" 2^>nul') do set "PY_EXE=%%p"
    )
)

:: 3. Check if standard python command works
if not defined PY_EXE (
    python -c "import sys" >nul 2>&1
    if !errorlevel! equ 0 (
        for /f "tokens=*" %%p in ('where python 2^>nul') do (
            if not defined PY_EXE set "PY_EXE=%%p"
        )
    )
)

:: 4. Check Program Files
if not defined PY_EXE (
    for /d %%D in ("%ProgramFiles%\Python3*" "%ProgramFiles(x86)%\Python3*" "C:\Python3*") do (
        if exist "%%D\python.exe" set "PY_EXE=%%D\python.exe"
        if exist "%%D\pythonw.exe" set "PYW_EXE=%%D\pythonw.exe"
    )
)

:: If Python was NOT found, attempt automatic 1-click install via winget
if not defined PY_EXE (
    echo.
    echo [!] Python was not detected on this Windows PC.
    echo.
    where winget >nul 2>&1
    if !errorlevel! equ 0 (
        echo Windows Package Manager (winget) is available!
        echo.
        echo Attempting automatic installation of Python 3.12 (takes ~20 seconds)...
        echo.
        winget install Python.Python.3.12 -e --accept-package-agreements --accept-source-agreements --scope currentUser
        
        :: Re-check LocalAppData
        for /d %%D in ("%LOCALAPPDATA%\Programs\Python\Python3*") do (
            if exist "%%D\python.exe" set "PY_EXE=%%D\python.exe"
            if exist "%%D\pythonw.exe" set "PYW_EXE=%%D\pythonw.exe"
        )
    )
)

:: If still not found, open download page
if not defined PY_EXE (
    echo.
    echo =====================================================================
    echo [ERROR] Python is required to run the Tally Connector.
    echo =====================================================================
    echo.
    echo Please install Python 3:
    echo 1. Download from https://www.python.org/downloads/
    echo 2. IMPORTANT: During install, check the box:
    echo    "[X] Add python.exe to PATH"
    echo.
    echo Press any key to open the official Python download page in your browser...
    pause >nul
    start https://www.python.org/downloads/
    exit /b 1
)

echo   Found Python: "!PY_EXE!"
for /f "tokens=*" %%v in ('"!PY_EXE!" --version 2^>^&1') do echo   Version: %%v

echo.
echo [2/3] Installing lightweight dependencies (requests)...
"!PY_EXE!" -m pip install requests --quiet --disable-pip-version-check
echo   Dependencies verified and ready.

echo.
echo [3/3] Creating Windows Desktop Shortcut...
set "CURRENT_DIR=%~dp0"
set "CURRENT_DIR=%CURRENT_DIR:~0,-1%"

:: Delete old/stale desktop shortcut if present
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$d = [Environment]::GetFolderPath('Desktop'); $p = \"$d\Nagfani Tally Connector.lnk\"; if (Test-Path $p) { Remove-Item -Force $p }"

:: Create direct Desktop Shortcut pointing directly to PythonW (zero black console, no VBS dependency)
if defined PYW_EXE (
    powershell -NoProfile -ExecutionPolicy Bypass -Command ^
      "$ws = New-Object -ComObject WScript.Shell; $d = [Environment]::GetFolderPath('Desktop'); $s = $ws.CreateShortcut(\"$d\Nagfani Tally Connector.lnk\"); $s.TargetPath = '!PYW_EXE!'; $s.Arguments = '\"%CURRENT_DIR%\connector_gui.py\"'; $s.WorkingDirectory = '%CURRENT_DIR%'; $s.IconLocation = '\"%CURRENT_DIR%\app_icon.ico\"'; $s.Description = 'Nagfani Foods ERP - Tally Gateway'; $s.Save();"
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -Command ^
      "$ws = New-Object -ComObject WScript.Shell; $d = [Environment]::GetFolderPath('Desktop'); $s = $ws.CreateShortcut(\"$d\Nagfani Tally Connector.lnk\"); $s.TargetPath = '!PY_EXE!'; $s.Arguments = '\"%CURRENT_DIR%\connector_gui.py\"'; $s.WorkingDirectory = '%CURRENT_DIR%'; $s.IconLocation = '\"%CURRENT_DIR%\app_icon.ico\"'; $s.Description = 'Nagfani Foods ERP - Tally Gateway'; $s.Save();"
)

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
    if defined PYW_EXE (
        start "" "!PYW_EXE!" "%CURRENT_DIR%\connector_gui.py"
    ) else (
        start "" "!PY_EXE!" "%CURRENT_DIR%\connector_gui.py"
    )
)
exit /b 0

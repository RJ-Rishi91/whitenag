@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"
title Nagfani Foods ERP - Tally Gateway

set "PY_EXE="

:: 1. Check LocalAppData Programs Python (Preferred pythonw)
for /d %%D in ("%LOCALAPPDATA%\Programs\Python\Python3*") do (
    if exist "%%D\pythonw.exe" set "PY_EXE=%%D\pythonw.exe"
    if not defined PY_EXE if exist "%%D\python.exe" set "PY_EXE=%%D\python.exe"
)

:: 2. Check if pyw or py launcher works
if not defined PY_EXE (
    if exist "C:\Windows\pyw.exe" set "PY_EXE=C:\Windows\pyw.exe"
    if not defined PY_EXE if exist "C:\Windows\py.exe" set "PY_EXE=C:\Windows\py.exe"
)

:: 3. Check Program Files
if not defined PY_EXE (
    for /d %%D in ("%ProgramFiles%\Python3*" "%ProgramFiles(x86)%\Python3*" "C:\Python3*") do (
        if exist "%%D\pythonw.exe" set "PY_EXE=%%D\pythonw.exe"
        if not defined PY_EXE if exist "%%D\python.exe" set "PY_EXE=%%D\python.exe"
    )
)

:: 4. Check system PATH
if not defined PY_EXE (
    where pythonw >nul 2>&1 && for /f "tokens=*" %%p in ('where pythonw 2^>nul') do set "PY_EXE=%%p"
    if not defined PY_EXE where python >nul 2>&1 && for /f "tokens=*" %%p in ('where python 2^>nul') do set "PY_EXE=%%p"
)

:: Launch if found
if defined PY_EXE (
    start "" "!PY_EXE!" connector_gui.py
    exit /b 0
)

:: If not found, open Setup_Windows.bat
echo [!] Python is not yet configured on this PC.
echo Starting one-time setup...
echo.
call "%~dp0Setup_Windows.bat"

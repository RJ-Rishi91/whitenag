@echo off
cd /d "%~dp0"
title Nagfani Foods ERP - Tally Gateway

:: Try pythonw first (runs silently with zero black console window)
where pythonw >nul 2>&1
if %errorlevel% equ 0 (
    start "" pythonw connector_gui.py
    exit /b 0
)

:: Fallback to python
where python >nul 2>&1
if %errorlevel% equ 0 (
    start "" python connector_gui.py
    exit /b 0
)

echo [ERROR] Python not found in PATH.
echo Please run Setup_Windows.bat first to configure Python.
echo.
pause

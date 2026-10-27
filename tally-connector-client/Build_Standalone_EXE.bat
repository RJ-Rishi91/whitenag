@echo off
cd /d "%~dp0"
title Build Nagfani Tally Connector Standalone EXE
echo =====================================================================
echo       BUILD STANDALONE WINDOWS EXE (Nagfani Tally Gateway)
echo =====================================================================
echo.
echo Installing PyInstaller and dependencies...
python -m pip install pyinstaller requests --quiet

echo.
echo Compiling standalone Windows executable (this takes ~15 seconds)...
python -m PyInstaller --noconsole --onefile --clean ^
  --name "Nagfani_Tally_Connector" ^
  connector_gui.py

if exist "dist\Nagfani_Tally_Connector.exe" (
    copy /y config.ini dist\config.ini >nul 2>&1
    echo.
    echo =====================================================================
    echo SUCCESS! Standalone executable created at:
    echo   dist\Nagfani_Tally_Connector.exe
    echo.
    echo You can distribute this single file + config.ini to any Windows PC!
    echo Zero Python installation required on client machines.
    echo =====================================================================
) else (
    echo.
    echo [ERROR] Build failed. Please inspect errors above.
)
echo.
pause

@echo off
title Nagfani Foods ERP - One-Click Sync from TallyPrime
color 0E
echo ================================================================
echo        PULL REAL CUSTOMERS & STOCK ITEMS FROM TALLYPRIME
echo ================================================================
echo.
echo This utility pulls your genuine Customer Ledgers, Outstanding Balances,
echo and Stock Items from TallyPrime and syncs them to your Nagfani ERP Cloud.
echo.
echo Make sure TallyPrime is OPEN with company 'NAGFANI FOODS'!
echo.
pause
echo.
python pull_tally_masters.py
echo.
echo ================================================================
pause

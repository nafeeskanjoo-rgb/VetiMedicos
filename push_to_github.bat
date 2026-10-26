@echo off
set "PATH=%LOCALAPPDATA%\Programs\Git\cmd;%PATH%"
cd /d "D:\#Projects 2026\#VetiCare"

echo =======================================================
echo   Pushing VetiMedicos Store to GitHub Repository
echo   Repo: https://github.com/nafeeskanjoo-rgb/VetiMedicos
echo =======================================================
echo.

git push -u origin main

echo.
echo =======================================================
echo   Push Completed! Press any key to exit.
echo =======================================================
pause

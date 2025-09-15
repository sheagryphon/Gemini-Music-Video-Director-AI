@echo off
TITLE MV Director AI - Prerequisite Installer

:start
cls
echo ==========================================================
echo  MV Director AI - Prerequisite Installer
echo ==========================================================
echo.
echo This script will check for prerequisites and guide you through installation.
echo.
echo IMPORTANT: If a User Account Control (UAC) prompt appears during this process,
echo please click "Yes" to grant the necessary permissions.
echo.
echo Press any key to continue...
pause >nul
echo.

echo --- Step 1: Checking for winget package manager... ---
winget --version
IF %ERRORLEVEL% EQU 0 (
    echo.
    echo [SUCCESS] winget package manager found.
    GOTO :install_node
) ELSE (
    echo.
    echo [INFO] winget not found or not working correctly. Proceeding with manual instructions.
    GOTO :winget_fail
)

:install_node
echo.
echo --- Step 2: Attempting to install Node.js (LTS) using winget... ---
echo This may take a few moments. Please be patient.
echo.
winget install OpenJS.NodeJS.LTS --source winget --accept-source-agreements --accept-package-agreements
IF %ERRORLEVEL% EQU 0 (
    GOTO :install_success
) ELSE (
    echo.
    echo [ERROR] Node.js installation via winget failed.
    GOTO :manual_install
)

:winget_fail
echo.
echo Could not use winget to install prerequisites automatically.
echo Please follow the manual installation steps below.
echo.
GOTO :manual_install

:manual_install
echo.
echo ----------------------------------------------------------
echo         MANUAL INSTALLATION REQUIRED: Node.js
echo ----------------------------------------------------------
echo.
echo 1. Open your web browser and go to: https://nodejs.org/
echo 2. Download the installer for the "LTS" (Long-Term Support) version.
echo 3. Run the installer and follow the on-screen instructions.
echo.
echo After Node.js is installed, you can set up the project.
GOTO :next_steps

:install_success
echo.
echo ----------------------------------------------------------
echo       [SUCCESS] Node.js has been installed!
echo ----------------------------------------------------------
echo.
GOTO :next_steps

:next_steps
echo.
echo --- Next Steps After Node.js is Installed ---
echo.
echo 1. Open a NEW Command Prompt or PowerShell window.
echo    (It's important to open a new one so it recognizes Node.js).
echo.
echo 2. In the new window, navigate to this project's folder.
echo.
echo 3. Run this command to install project dependencies:
echo    npm install
echo.
echo 4. Then, run this command to start the application:
echo    npm run dev
echo.
echo ==========================================================
echo.
echo Press any key to close this window.
pause >nul
exit
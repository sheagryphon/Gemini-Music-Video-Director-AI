@echo off
TITLE MV Director AI - Start Application

:start
cls
echo ==========================================================
echo  MV Director AI - Application Starter
echo ==========================================================
echo.
echo This script will:
echo 1. Install all required project dependencies (npm install).
echo 2. Start the local development server (npm run dev).
echo.
echo The first step may take a few minutes if you are running
echo this for the first time. Please be patient.
echo.
echo Press any key to begin...
pause >nul
echo.

echo --- Step 1 of 2: Installing dependencies... ---
call npm install

IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] 'npm install' failed with an error.
    echo.
    echo Please make sure Node.js is installed correctly and that you
    echo are connected to the internet.
    echo.
    echo You can try running 'npm install' manually in a command
    echo prompt for more detailed error information.
    echo.
    pause
    exit /b
)

echo.
echo [SUCCESS] Dependencies installed successfully.
echo.

echo --- Step 2 of 2: Starting the application... ---
echo The server will now start. Your browser should open automatically.
echo.
echo If it doesn't, please open your web browser and navigate to the
echo local address that will be displayed in this window (usually http://localhost:5173).
echo.
echo THIS WINDOW MUST REMAIN OPEN FOR THE APPLICATION TO RUN.
echo To stop the application, simply close this window.
echo.
call npm run dev

echo.
echo The development server has stopped.
pause
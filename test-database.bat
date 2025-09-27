@echo off
echo -----------------------------------------------------
echo Nyaya Mitra Database Connection Test
echo -----------------------------------------------------
echo.

rem Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    goto :end
)

echo [1/5] Checking database diagnostic script...
if not exist "%~dp0js\db-diagnostic.js" (
    echo ERROR: Database diagnostic script not found
    echo Please ensure js/db-diagnostic.js exists
    goto :end
)

echo [2/5] Checking required modules...
echo.
call npm list sqlite3 bcrypt --depth=0
if %errorlevel% neq 0 (
    echo.
    echo Installing required modules...
    call npm install sqlite3 bcrypt --save
)
echo.

echo [3/5] Running database diagnostic script...
echo.
node "%~dp0js\db-diagnostic.js"
if %errorlevel% neq 0 (
    echo ERROR: Database diagnostic failed
    goto :end
)

echo [4/5] Testing server.js database connection...
echo.
node -e "const sqlite3=require('sqlite3').verbose();const path=require('path');const dbPath=path.join(__dirname,'data','nyaya_mitra.db');console.log('Testing connection to: '+dbPath);const db=new sqlite3.Database(dbPath,(err)=>{if(err){console.error('ERROR: '+err.message);process.exit(1);}console.log('Connection successful!');db.close(()=>{console.log('Connection closed');});});"

echo [5/5] All tests complete.
echo.

:end
echo.
echo Press any key to exit...
pause >nul
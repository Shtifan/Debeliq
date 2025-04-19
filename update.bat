@echo off
echo ===================================
echo   Debeliq Bot Update Utility
echo ===================================
echo.

echo [1/3] Updating repository from GitHub...
git pull
if %ERRORLEVEL% neq 0 (
    echo Error updating repository from GitHub!
    pause
    exit /b %ERRORLEVEL%
)
echo Repository updated successfully!
echo.

echo [2/3] Updating Node.js packages...
npm install
if %ERRORLEVEL% neq 0 (
    echo Error updating Node.js packages!
    pause
    exit /b %ERRORLEVEL%
)
echo Node.js packages updated successfully!
echo.

echo [3/3] Updating Python packages for chess solver...
cd "commands\other\chess solver"
pip install -r requirements.txt --upgrade
if %ERRORLEVEL% neq 0 (
    echo Error updating Python packages!
    cd ..\..\..\
    pause
    exit /b %ERRORLEVEL%
)
cd ..\..\..\
echo Python packages updated successfully!
echo.

echo ===================================
echo   Update completed successfully!
echo ===================================
echo.

pause

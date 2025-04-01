@echo off
echo Starting update process...

echo Pulling latest changes from Git...
git pull
if errorlevel 1 (
    echo Error: Failed to pull from Git
    pause
    exit /b 1
)

echo Updating npm packages...
call npm update
if errorlevel 1 (
    echo Error: Failed to update npm packages
    pause
    exit /b 1
)

echo Update completed successfully!
pause
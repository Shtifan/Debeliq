@echo off
echo Updating dependencies...
npm run update

echo.
echo If the regular update fails, you can force update by pressing any key...
pause

echo.
echo Force updating dependencies...
npm run update:force

echo.
echo Update complete! Press any key to exit...
pause
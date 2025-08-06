@echo off
echo Testing Gradle 8.11.1 upgrade...
cd android
echo Checking Gradle version...
gradlew.bat --version
echo.
echo Testing project configuration...
gradlew.bat help --quiet
echo Exit code: %ERRORLEVEL%
if %ERRORLEVEL% EQU 0 (
    echo SUCCESS: Gradle 8.11.1 is working!
) else (
    echo FAILED: Gradle configuration has issues
)
pause
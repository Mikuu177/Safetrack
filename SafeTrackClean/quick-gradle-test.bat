@echo off
echo Testing Gradle configuration...
cd android
echo Running gradle tasks command to test configuration...
gradlew.bat tasks --quiet
echo Exit code: %ERRORLEVEL%
if %ERRORLEVEL% EQU 0 (
    echo SUCCESS: Gradle configuration is valid!
) else (
    echo FAILED: Gradle configuration has issues
)
pause
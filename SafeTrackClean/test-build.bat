@echo off
cd android
echo Testing Gradle build...
gradlew.bat assembleDebug
echo Build result: %ERRORLEVEL%
pause
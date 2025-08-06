@echo off
echo 正在修复 React Native 0.80.1 的 Kotlin DSL 兼容性问题...

REM 创建一个简化的项目配置
echo 正在重置项目配置...

REM 使用更简单的 Gradle 配置
copy /Y android\build.gradle android\build.gradle.backup

echo buildscript { > android\build.gradle.tmp
echo     ext { >> android\build.gradle.tmp
echo         buildToolsVersion = "34.0.0" >> android\build.gradle.tmp
echo         minSdkVersion = 24 >> android\build.gradle.tmp
echo         compileSdkVersion = 34 >> android\build.gradle.tmp
echo         targetSdkVersion = 34 >> android\build.gradle.tmp
echo         ndkVersion = "25.1.8937393" >> android\build.gradle.tmp
echo         kotlinVersion = "1.7.10" >> android\build.gradle.tmp
echo     } >> android\build.gradle.tmp
echo     repositories { >> android\build.gradle.tmp
echo         google() >> android\build.gradle.tmp
echo         mavenCentral() >> android\build.gradle.tmp
echo     } >> android\build.gradle.tmp
echo     dependencies { >> android\build.gradle.tmp
echo         classpath("com.android.tools.build:gradle:7.4.2") >> android\build.gradle.tmp
echo         classpath("com.facebook.react:react-native-gradle-plugin") >> android\build.gradle.tmp
echo         classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:1.7.10") >> android\build.gradle.tmp
echo     } >> android\build.gradle.tmp
echo } >> android\build.gradle.tmp
echo. >> android\build.gradle.tmp
echo apply plugin: "com.facebook.react.rootproject" >> android\build.gradle.tmp

move android\build.gradle.tmp android\build.gradle

echo 配置已重置。现在尝试运行：
echo cd android
echo gradlew clean assembleDebug

pause
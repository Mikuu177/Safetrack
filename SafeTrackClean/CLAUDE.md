# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Essential Commands
- `npm start` - Start Metro bundler (React Native dev server)
- `npm run android` - Build and run Android app (requires Android emulator/device)
- `npm run ios` - Build and run iOS app (requires iOS simulator/device and Xcode)
- `npm run lint` - Run ESLint to check code quality
- `npm test` - Run Jest tests

### iOS Setup (First Time)
Before running iOS commands, install dependencies:
```bash
bundle install
bundle exec pod install
```

### Testing Commands
- `npm test -- --watch` - Run tests in watch mode
- `npm test -- --coverage` - Run tests with coverage report
- `npm test -- AlertEngine.test.ts` - Run algorithm validation tests (core personalization logic)
- `npm test -- Performance.test.ts` - Run basic performance benchmarks
- `npm test -- AccuratePerformance.test.ts` - Run precise performance measurements (10-round averaging)
- `npm test -- ThesisVerification.test.ts` - Run comprehensive thesis claims verification (all 13 test cases)

## Project Architecture

SafeTrack is a React Native health monitoring application for individuals with chronic conditions, built with TypeScript. The app provides personalized health monitoring with age/gender/condition-specific thresholds and real-time alerts when health metrics exceed safe ranges.

### Core Architecture Pattern
- **Context-based state management**: Central AppContext provides global state using React's useReducer
- **Singleton services**: DatabaseManager and AlertEngine use singleton pattern for consistent data access
- **Layered architecture**: Clear separation between UI (screens/components), business logic (contexts/utils), and data (database)

### Key Directories
- `src/screens/` - Main app screens (Home, Input, Alerts, Trends, Settings, UserSetup)
- `src/contexts/` - React Context for global state management (AppContext)
- `src/database/` - SQLite database layer (DatabaseManager, DatabaseService)
- `src/utils/` - Business logic utilities (AlertEngine with personalized thresholds, theme)
- `src/components/` - Reusable UI components (AppNavigator)
- `src/types/` - TypeScript interfaces and type definitions
- `__tests__/` - Jest test suites (AlertEngine.test.ts, Performance.test.ts)
- `docs/` - Project documentation and research materials

### Database Schema
SQLite database with four main tables:
- `users` - User profiles with medical conditions
- `health_records` - Time-series health data (heart rate, blood pressure)
- `thresholds` - User-defined alert thresholds per metric
- `alerts` - Generated alerts when thresholds are exceeded

### State Management Flow
1. AppContext initializes with default user and loads all data
2. Health record additions trigger threshold checking via AlertEngine
3. New alerts are automatically generated and stored
4. UI components subscribe to context state changes

### Key Components
- **AppContext** (`src/contexts/AppContext.tsx`): Central state management with useReducer
- **DatabaseManager** (`src/database/DatabaseManager.ts`): SQLite connection and table creation
- **AlertEngine** (`src/utils/AlertEngine.ts`): Threshold monitoring and alert generation
- **AppNavigator** (`src/components/AppNavigator.tsx`): Bottom tab navigation with badge alerts

### Navigation Structure
Bottom tab navigation with 5 screens:
- Home: Dashboard overview
- Input: Add new health data
- Alerts: View and acknowledge alerts (shows badge count)
- Trends: Data visualization and trends
- Settings: User preferences and thresholds

### Development Notes
- Uses react-native-sqlite-storage for local data persistence (stored in device flash storage)
- First-time users complete UserSetupScreen to create personalized health profiles
- Alert system uses medical literature-based thresholds (AHA, ESC guidelines)
- Personalized thresholds adjust based on age (65+, 25-, 40-64), gender, and medical conditions
- Gender-specific adjustments: Female (+5 bpm heart rate, -5 mmHg systolic), Male (+5 mmHg systolic)
- Medical condition adjustments: Hypertension (≤130/80), Cardiovascular disease (≤130 bpm), Diabetes, Asthma
- Theme system supports light/dark mode switching
- Uses emoji icons for tab navigation with alert badges

## Critical Code Interactions

### Personalized Threshold Calculation Flow
The core innovation is in `AlertEngine.getDefaultThresholds()` which combines:
1. **Base medical values** from AHA/ESC guidelines (e.g., 60-150 bpm heart rate)
2. **Age adjustments** using Tanaka formula (<25: +10 bpm, 65+: -20 bpm, 40-64: -10 bpm)  
3. **Gender modifications** (Female: +5 bpm, -5 mmHg systolic; Male: +5 mmHg systolic)
4. **Medical condition overrides** (Hypertension: max 130/80, Cardiovascular: max 130 bpm)

### Alert System Workflow
1. **Data Entry**: User adds health record via InputScreen
2. **Context Update**: AppContext.addHealthRecord() triggers state change
3. **Threshold Check**: AlertEngine.checkThresholds() automatically runs personalized calculation
4. **Severity Classification**: Deviation percentage determines Low/Medium/High (0-25%/25-50%/50%+)
5. **Alert Generation**: New alerts created with context-aware messages
6. **UI Updates**: Navigation badge shows unacknowledged alert count

### State Management Critical Path
- AppContext uses useReducer pattern with 8 action types
- All database operations go through DatabaseService singleton
- AlertEngine singleton ensures consistent threshold calculations
- User setup flow determines if UserSetupScreen or main app loads

## Key Architectural Decisions

### State Management Pattern
- Uses Context + useReducer instead of Redux for medium-complexity needs
- Single AppProvider wraps entire app with useApp() hook for components
- All state mutations go through defined action types

### Database Strategy  
- SQLite for offline-first health data (critical for medical applications)
- Singleton pattern ensures consistent database access across app
- Four-table schema: users, health_records, thresholds, alerts

### Alert Engine Implementation Notes
- **Medical accuracy verified**: All thresholds cite specific papers (AHA 2017, Tanaka 2001, Vaidya & Forman 2018)
- **Performance optimized**: 0.0008ms single calculation, 0.1ms for 1000 records (verified via AccuratePerformance.test.ts)
- **Gender math**: Actual implementation creates 10 mmHg difference (Male: baseline+5, Female: baseline-5)
- **Age boundaries**: Exact implementation uses `age < 25`, `age >= 65`, `age >= 40` for threshold branches
- **Severity algorithm**: `deviationPercentage = Math.abs(value - threshold) / thresholdRange * 100`

## Technology Stack
- **React Native 0.80.1** with TypeScript
- **react-native-sqlite-storage** for local persistence (flash storage)
- **react-navigation** with bottom tabs and alert badges
- **react-native-chart-kit** for health data visualization and trends
- **Jest** for testing with comprehensive algorithm and performance tests

## Performance Characteristics

### Verified Performance Metrics (2025-08-05 Testing)
- **Single threshold calculation**: 0.0008ms average (12.5x faster than 0.01ms target)
- **Batch processing**: 0.1ms for 1000 records (40x faster than 4ms target)
- **Alert processing**: Sub-millisecond real-time generation
- **Memory efficiency**: 129 bytes per health record (JSON serialized)
- **Storage**: 126KB for 1000 health records (actual measured)

### Testing Methodology
- Multiple test rounds with warm-up phases to eliminate JIT compilation effects
- 10,000 iterations for micro-benchmarks with statistical analysis
- Real health data scenarios with random but realistic values
- Cross-platform verification on Node.js test environment

## Known Issues & Workarounds

### React Native 0.80.1 Gradle Compatibility ⚠️ ONGOING ISSUE
- **Issue**: Kotlin DSL syntax errors and Java toolchain conflicts in React Native Gradle plugin
- **Status**: Partially fixed - Kotlin DSL syntax corrected but Java toolchain compatibility issues remain
- **Fixed files**: 4 files in `node_modules/@react-native/gradle-plugin/` patched to use `.set()` method
- **Remaining issue**: "The new Java toolchain feature cannot be used at the project level in combination with source and/or target compatibility"
- **Workaround**: Tests work perfectly, but Android builds may require Android Studio or additional Gradle configuration

### Database Initialization
- **Critical**: DatabaseManager must initialize before any screen that uses health data
- **Implementation**: App.tsx calls `DatabaseManager.getInstance().initializeDatabase()` on startup
- **Testing**: Database operations in tests require manual initialization
- **Jest Testing**: App.test.tsx is ignored due to SQLite not being available in Jest environment

### Project Status (Post-Migration)
- ✅ **Core functionality**: All business logic tests pass (25/25 tests)
- ✅ **Algorithm verification**: ThesisVerification.test.ts confirms all thesis claims
- ✅ **Performance validation**: AccuratePerformance.test.ts meets all benchmarks
- ✅ **Dependencies**: All npm packages installed and working
- ⚠️ **Android builds**: Gradle compatibility issues persist despite fixes
- ✅ **Code quality**: ESLint and TypeScript compilation working

## Documentation References
- **Complete verification report**: `__tests__/ThesisDiscrepancyReport.md` - technical claims verification
- **Medical literature**: `docs/Medical_Literature_References.md` - 26 academic citations supporting algorithms
- **Performance benchmarks**: `docs/Performance_Benchmarks.md` - detailed performance analysis
- **User study design**: `docs/User_Study_Plan.md` - methodology for academic validation
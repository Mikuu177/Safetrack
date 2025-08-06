module.exports = {
  preset: 'react-native',
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-sqlite-storage|react-native-chart-kit|react-native-svg)/)',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/__tests__/App.test.tsx', // SQLite not available in Jest environment
  ],
};

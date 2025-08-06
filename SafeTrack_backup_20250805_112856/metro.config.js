const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration for Windows compatibility
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  maxWorkers: 2,
  resetCache: true,
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);

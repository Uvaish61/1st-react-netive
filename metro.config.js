const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { withNativeWind } = require('nativewind/metro');
const { wrapWithReanimatedMetroConfig } = require('react-native-reanimated/metro-config');
const path = require('path');

// Get base config
const baseConfig = getDefaultConfig(path.resolve(__dirname));

// Customize asset extensions and resolver
const customConfig = {
  resolver: {
    assetExts: [
      'png', 'jpg', 'jpeg', 'svg', 'gif',
      'webp', 'ttf', 'otf',
    ],
    sourceExts: ['js', 'json', 'ts', 'tsx', 'jsx'],
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
};

// Merge base config with custom changes
const mergedConfig = mergeConfig(baseConfig, customConfig);

// Wrap with NativeWind and Reanimated support
const finalConfig = wrapWithReanimatedMetroConfig(
  withNativeWind(mergedConfig, { input: './global.css' })
);

module.exports = finalConfig;
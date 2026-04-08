module.exports = {
  preset: 'react-native',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native|@react-navigation|nativewind|react-native-css-interop|react-native-vector-icons)/)',
  ],
};

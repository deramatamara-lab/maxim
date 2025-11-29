module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', {
        // Disable reanimated plugin for tests to avoid worklets dependency
        lazyImports: false,
        jsxImportSource: undefined,
      }]
    ],
    plugins: [
      // expo-router/babel is now included via babel-preset-expo in SDK 50+.
      // Note: react-native-reanimated/plugin can cause issues with mocks
      // 'react-native-reanimated/plugin', // Exclude for tests
    ],
    env: {
      test: {
        plugins: [
          // Override expo preset plugins for test environment
          '@babel/plugin-transform-runtime',
        ],
      },
    },
  };
};

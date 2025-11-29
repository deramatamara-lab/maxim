module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // expo-router/babel is now included via babel-preset-expo in SDK 50+.
      'react-native-reanimated/plugin', // must be last
    ],
  };
};

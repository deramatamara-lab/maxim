// Mock react-native-worklets plugin for Jest
// This prevents babel errors when running tests
module.exports = function() {
  return {
    visitor: {
      // Empty visitor - we don't need to transform anything in tests
    }
  };
};

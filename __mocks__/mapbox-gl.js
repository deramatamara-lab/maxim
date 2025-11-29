/* eslint-env jest */
// Mock mapbox-gl to avoid dynamic import issues
const mockMap = jest.fn(() => ({
  once: jest.fn(),
  remove: jest.fn(),
  easeTo: jest.fn(),
  flyTo: jest.fn(),
}));

const mapboxgl = {
  Map: mockMap,
  accessToken: '',
};

module.exports = mapboxgl;
module.exports.default = mapboxgl;

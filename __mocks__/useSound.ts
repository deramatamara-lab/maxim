/**
 * Mock for useSound hook
 * Bypasses audio file loading in tests
 */

export type SoundEffect = 'tapSoft' | 'tapHard' | 'powerUp' | 'success' | 'warning';

export const useSound = jest.fn(() => ({
  play: jest.fn((sound: SoundEffect) => Promise.resolve()),
  stop: jest.fn(() => Promise.resolve()),
  setVolume: jest.fn((volume: number) => Promise.resolve()),
  isLoaded: true,
}));

export default useSound;

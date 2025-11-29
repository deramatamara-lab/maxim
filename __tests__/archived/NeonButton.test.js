import React from 'react';
import renderer from 'react-test-renderer';
import { Text } from 'react-native';

import { NeonButton } from '../src/components/ui/NeonButton';

jest.mock('../src/hooks/useHaptics', () => ({
  useHaptics: () => ({ trigger: jest.fn() }),
}));

jest.mock('../src/hooks/useSound', () => ({
  useSound: () => ({ play: jest.fn() }),
}));

describe.skip('NeonButton', () => {
  it('renders child label text', () => {
    const tree = renderer.create(<NeonButton>Search Rides</NeonButton>).toJSON();
    expect(JSON.stringify(tree)).toContain('Search Rides');
  });

  it('marks accessibility state as disabled when disabled', () => {
    const instance = renderer
      .create(
        <NeonButton disabled accessibilityLabel="Test Button">
          <Text>Test</Text>
        </NeonButton>
      )
      .root;

    const button = instance.findByProps({ accessibilityRole: 'button' });
    expect(button.props.accessibilityState).toEqual({ disabled: true });
  });
});

import React from 'react';
import renderer from 'react-test-renderer';
import { Text } from 'react-native';

import { GlassView } from '../src/components/ui/GlassView';

jest.mock('expo-blur', () => ({
  // Minimal stub: we only care that children render without crashing.
  BlurView: ({ children }) => <>{children}</>,
}));

describe.skip('GlassView', () => {
  it('renders its children', () => {
    const tree = renderer
      .create(
        <GlassView>
          <Text>Inner Content</Text>
        </GlassView>
      )
      .toJSON();

    expect(JSON.stringify(tree)).toContain('Inner Content');
  });
});

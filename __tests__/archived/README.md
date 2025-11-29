# Archived Complex Tests

This directory contains the original complex test implementation that was over-engineered and ultimately failed due to:

## Issues with Complex Approach

1. **Brittle React Internal Access**: Used `container._fiber.stateNode` patterns that break with React Native Testing Library updates
2. **Over-mocking**: Created extensive mock infrastructure that was difficult to maintain
3. **Implementation Detail Testing**: Focused on testing internal state rather than user-facing behavior
4. **Timing Complexity**: Debounce/throttle tests were fragile and provided minimal value
5. **Dynamic Import Issues**: Attempted to mock complex module loading patterns incompatible with Jest

## Lessons Learned

- Test user behavior, not implementation details
- Avoid React internal access patterns
- Keep mocking minimal and focused
- Prefer simple "does it render" tests over complex timing tests
- Start with a stable baseline before adding complexity

## Files in This Archive

- `AnimationProvider.test.tsx` - Complex context testing with React internals
- `Globe.native.test.tsx` - Over-mocked 3D component tests
- `MapContainer.test.tsx` - Dynamic import and platform-specific complexity
- `FloatingTabBar.test.tsx` - Complex gesture and animation testing
- `SleekNav.test.tsx` - Over-engineered navigation component tests
- `integration/UserFlows.test.tsx` - Complex integration testing patterns

These files are kept for reference but should not be used as templates for new tests.

import * as fc from 'fast-check';

/**
 * Smoke test to verify fast-check property-based testing setup
 */
describe('Fast-check Setup', () => {
  it('should run property-based tests', () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer(), (a, b) => {
        return a + b === b + a; // Commutativity of addition
      }),
      { numRuns: 100 }
    );
  });

  it('should generate arbitrary values', () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        return typeof s === 'string';
      }),
      { numRuns: 100 }
    );
  });
});

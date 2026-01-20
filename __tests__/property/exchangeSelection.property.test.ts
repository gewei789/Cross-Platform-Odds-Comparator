import * as fc from 'fast-check';
import { Exchange } from '../../src/types';
import {
  validateExchangeSelection,
  AVAILABLE_EXCHANGES,
  MIN_EXCHANGES_REQUIRED,
} from '../../src/components/config/ExchangeSelector';

/**
 * **Feature: crypto-arbitrage-scanner, Property 2: Exchange Selection Validation**
 *
 * *For any* selection of exchanges where the count is less than 2, the Scanner SHALL
 * prevent scanning from starting and display an error.
 *
 * **Validates: Requirements 1.4**
 */
describe('Property 2: Exchange Selection Validation', () => {
  /**
   * Available exchange IDs for generating test data
   */
  const validExchangeIds: Exchange[] = AVAILABLE_EXCHANGES.map((e) => e.id);

  // ============================================
  // Arbitraries for generating test data
  // ============================================

  /**
   * Arbitrary for valid exchange selections (2 or more exchanges)
   * Generates unique subsets of available exchanges with at least MIN_EXCHANGES_REQUIRED
   */
  const validExchangeSelectionArb = fc
    .subarray(validExchangeIds, {
      minLength: MIN_EXCHANGES_REQUIRED,
      maxLength: validExchangeIds.length,
    })
    .filter((arr) => arr.length >= MIN_EXCHANGES_REQUIRED);

  /**
   * Arbitrary for invalid exchange selections (0 or 1 exchange)
   * Generates subsets with fewer than MIN_EXCHANGES_REQUIRED exchanges
   */
  const invalidExchangeSelectionArb = fc.subarray(validExchangeIds, {
    minLength: 0,
    maxLength: MIN_EXCHANGES_REQUIRED - 1,
  });

  /**
   * Arbitrary for empty exchange selection
   */
  const emptyExchangeSelectionArb = fc.constant([] as Exchange[]);

  /**
   * Arbitrary for single exchange selection
   */
  const singleExchangeSelectionArb = fc
    .constantFrom(...validExchangeIds)
    .map((exchange) => [exchange] as Exchange[]);

  /**
   * Arbitrary for exactly 2 exchanges (minimum valid)
   */
  const exactlyTwoExchangesArb = fc
    .subarray(validExchangeIds, { minLength: 2, maxLength: 2 })
    .filter((arr) => arr.length === 2);

  /**
   * Arbitrary for all 3 exchanges
   */
  const allExchangesArb = fc.constant([...validExchangeIds] as Exchange[]);

  // ============================================
  // Valid Selection Tests - SHALL be accepted
  // ============================================

  /**
   * Property: Selections with 2 or more exchanges SHALL be valid
   *
   * **Validates: Requirements 1.4**
   */
  it('should accept selections with 2 or more exchanges', () => {
    fc.assert(
      fc.property(validExchangeSelectionArb, (exchanges) => {
        const result = validateExchangeSelection(exchanges);
        expect(result.isValid).toBe(true);
        expect(result.errorMessage).toBeNull();
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Selections with exactly 2 exchanges SHALL be valid (boundary case)
   *
   * **Validates: Requirements 1.4**
   */
  it('should accept selections with exactly 2 exchanges (minimum valid)', () => {
    fc.assert(
      fc.property(exactlyTwoExchangesArb, (exchanges) => {
        const result = validateExchangeSelection(exchanges);
        expect(result.isValid).toBe(true);
        expect(result.errorMessage).toBeNull();
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Selection with all 3 exchanges SHALL be valid
   *
   * **Validates: Requirements 1.4**
   */
  it('should accept selection with all 3 exchanges', () => {
    fc.assert(
      fc.property(allExchangesArb, (exchanges) => {
        const result = validateExchangeSelection(exchanges);
        expect(result.isValid).toBe(true);
        expect(result.errorMessage).toBeNull();
        return true;
      }),
      { numRuns: 100 }
    );
  });

  // ============================================
  // Invalid Selection Tests - SHALL be rejected
  // ============================================

  /**
   * Property: Selections with fewer than 2 exchanges SHALL be invalid
   *
   * **Validates: Requirements 1.4**
   */
  it('should reject selections with fewer than 2 exchanges', () => {
    fc.assert(
      fc.property(invalidExchangeSelectionArb, (exchanges) => {
        const result = validateExchangeSelection(exchanges);
        expect(result.isValid).toBe(false);
        expect(result.errorMessage).not.toBeNull();
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Empty exchange selection SHALL be invalid
   *
   * **Validates: Requirements 1.4**
   */
  it('should reject empty exchange selection', () => {
    fc.assert(
      fc.property(emptyExchangeSelectionArb, (exchanges) => {
        const result = validateExchangeSelection(exchanges);
        expect(result.isValid).toBe(false);
        expect(result.errorMessage).not.toBeNull();
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Single exchange selection SHALL be invalid
   *
   * **Validates: Requirements 1.4**
   */
  it('should reject single exchange selection', () => {
    fc.assert(
      fc.property(singleExchangeSelectionArb, (exchanges) => {
        const result = validateExchangeSelection(exchanges);
        expect(result.isValid).toBe(false);
        expect(result.errorMessage).not.toBeNull();
        return true;
      }),
      { numRuns: 100 }
    );
  });

  // ============================================
  // Error Message Tests
  // ============================================

  /**
   * Property: Invalid selections SHALL display an error message
   *
   * **Validates: Requirements 1.4**
   */
  it('should display error message for invalid selections', () => {
    fc.assert(
      fc.property(invalidExchangeSelectionArb, (exchanges) => {
        const result = validateExchangeSelection(exchanges);
        expect(result.isValid).toBe(false);
        expect(typeof result.errorMessage).toBe('string');
        expect(result.errorMessage!.length).toBeGreaterThan(0);
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Valid selections SHALL NOT display an error message
   *
   * **Validates: Requirements 1.4**
   */
  it('should not display error message for valid selections', () => {
    fc.assert(
      fc.property(validExchangeSelectionArb, (exchanges) => {
        const result = validateExchangeSelection(exchanges);
        expect(result.isValid).toBe(true);
        expect(result.errorMessage).toBeNull();
        return true;
      }),
      { numRuns: 100 }
    );
  });

  // ============================================
  // Edge Cases and Invalid Input Tests
  // ============================================

  /**
   * Property: Non-array inputs SHALL be rejected
   *
   * **Validates: Requirements 1.4**
   */
  it('should reject non-array inputs', () => {
    expect(validateExchangeSelection(null as unknown as Exchange[]).isValid).toBe(false);
    expect(validateExchangeSelection(undefined as unknown as Exchange[]).isValid).toBe(false);
    expect(validateExchangeSelection('binance' as unknown as Exchange[]).isValid).toBe(false);
    expect(validateExchangeSelection({} as unknown as Exchange[]).isValid).toBe(false);
    expect(validateExchangeSelection(123 as unknown as Exchange[]).isValid).toBe(false);
  });

  /**
   * Property: Arrays with invalid exchange names SHALL be rejected
   *
   * **Validates: Requirements 1.4**
   */
  it('should reject arrays with invalid exchange names', () => {
    const invalidExchanges = ['invalid_exchange', 'another_invalid'] as Exchange[];
    const result = validateExchangeSelection(invalidExchanges);
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).not.toBeNull();
  });

  /**
   * Property: Mixed valid and invalid exchanges SHALL be rejected
   *
   * **Validates: Requirements 1.4**
   */
  it('should reject mixed valid and invalid exchanges', () => {
    const mixedExchanges = ['binance', 'invalid_exchange'] as Exchange[];
    const result = validateExchangeSelection(mixedExchanges);
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).not.toBeNull();
  });

  // ============================================
  // Specific Example Tests (for documentation)
  // ============================================

  /**
   * Example tests with specific exchange combinations
   *
   * **Validates: Requirements 1.4**
   */
  describe('Specific exchange combination examples', () => {
    it('should accept [binance, coinbase]', () => {
      const result = validateExchangeSelection(['binance', 'coinbase']);
      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeNull();
    });

    it('should accept [binance, kraken]', () => {
      const result = validateExchangeSelection(['binance', 'kraken']);
      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeNull();
    });

    it('should accept [coinbase, kraken]', () => {
      const result = validateExchangeSelection(['coinbase', 'kraken']);
      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeNull();
    });

    it('should accept [binance, coinbase, kraken]', () => {
      const result = validateExchangeSelection(['binance', 'coinbase', 'kraken']);
      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeNull();
    });

    it('should reject [binance] (single exchange)', () => {
      const result = validateExchangeSelection(['binance']);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).not.toBeNull();
    });

    it('should reject [] (empty selection)', () => {
      const result = validateExchangeSelection([]);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).not.toBeNull();
    });
  });

  // ============================================
  // Invariant Tests
  // ============================================

  /**
   * Property: The validation result SHALL always have isValid as boolean
   *
   * **Validates: Requirements 1.4**
   */
  it('should always return isValid as boolean', () => {
    fc.assert(
      fc.property(
        fc.oneof(validExchangeSelectionArb, invalidExchangeSelectionArb),
        (exchanges) => {
          const result = validateExchangeSelection(exchanges);
          expect(typeof result.isValid).toBe('boolean');
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: The validation result SHALL always have errorMessage as string or null
   *
   * **Validates: Requirements 1.4**
   */
  it('should always return errorMessage as string or null', () => {
    fc.assert(
      fc.property(
        fc.oneof(validExchangeSelectionArb, invalidExchangeSelectionArb),
        (exchanges) => {
          const result = validateExchangeSelection(exchanges);
          expect(result.errorMessage === null || typeof result.errorMessage === 'string').toBe(
            true
          );
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: isValid=true implies errorMessage=null, isValid=false implies errorMessage is string
   *
   * **Validates: Requirements 1.4**
   */
  it('should have consistent isValid and errorMessage relationship', () => {
    fc.assert(
      fc.property(
        fc.oneof(validExchangeSelectionArb, invalidExchangeSelectionArb),
        (exchanges) => {
          const result = validateExchangeSelection(exchanges);
          if (result.isValid) {
            expect(result.errorMessage).toBeNull();
          } else {
            expect(result.errorMessage).not.toBeNull();
            expect(typeof result.errorMessage).toBe('string');
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

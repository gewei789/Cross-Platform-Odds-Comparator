import * as fc from 'fast-check';
import { validateTradingPair } from '../../src/components/config/TradingPairSelector';

/**
 * **Feature: crypto-arbitrage-scanner, Property 1: Trading Pair Validation**
 * 
 * *For any* string input to the trading pair field, the validator SHALL accept inputs 
 * matching the pattern `{BASE}/{QUOTE}` (e.g., "ETH/USDT", "BTC/USD") and reject all other formats.
 * 
 * **Validates: Requirements 1.2**
 */
describe('Property 1: Trading Pair Validation', () => {
  /**
   * Arbitrary for valid BASE or QUOTE symbols
   * Valid symbols consist of alphanumeric characters (A-Z, 0-9)
   */
  const alphanumericChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  
  const validSymbolArb = fc.array(
    fc.constantFrom(...alphanumericChars.split('')),
    { minLength: 1, maxLength: 10 }
  ).map(chars => chars.join(''));

  /**
   * Arbitrary for valid trading pairs in BASE/QUOTE format
   */
  const validTradingPairArb = fc.tuple(validSymbolArb, validSymbolArb)
    .map(([base, quote]) => `${base}/${quote}`);

  /**
   * Arbitrary for valid trading pairs with optional whitespace (should be trimmed)
   */
  const validTradingPairWithWhitespaceArb = fc.tuple(
    fc.nat({ max: 3 }),
    validTradingPairArb,
    fc.nat({ max: 3 })
  ).map(([leadingCount, pair, trailingCount]) => 
    `${' '.repeat(leadingCount)}${pair}${' '.repeat(trailingCount)}`
  );

  /**
   * Arbitrary for valid trading pairs in lowercase (should be accepted after uppercase conversion)
   */
  const validTradingPairLowercaseArb = validTradingPairArb
    .map(pair => pair.toLowerCase());

  /**
   * Arbitrary for valid trading pairs in mixed case
   */
  const validTradingPairMixedCaseArb = fc.tuple(validSymbolArb, validSymbolArb)
    .map(([base, quote]) => {
      // Randomly mix case for each character
      const mixedBase = [...base].map((c, i) => 
        i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()
      ).join('');
      const mixedQuote = [...quote].map((c, i) => 
        i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()
      ).join('');
      return `${mixedBase}/${mixedQuote}`;
    });

  /**
   * Property: Valid trading pairs in BASE/QUOTE format SHALL be accepted
   * 
   * **Validates: Requirements 1.2**
   */
  it('should accept valid trading pairs in BASE/QUOTE format', () => {
    fc.assert(
      fc.property(
        validTradingPairArb,
        (tradingPair) => {
          const result = validateTradingPair(tradingPair);
          expect(result).toBe(true);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Valid trading pairs with leading/trailing whitespace SHALL be accepted
   * (after trimming)
   * 
   * **Validates: Requirements 1.2**
   */
  it('should accept valid trading pairs with leading/trailing whitespace', () => {
    fc.assert(
      fc.property(
        validTradingPairWithWhitespaceArb,
        (tradingPair) => {
          const result = validateTradingPair(tradingPair);
          expect(result).toBe(true);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Valid trading pairs in lowercase SHALL be accepted
   * (after uppercase conversion)
   * 
   * **Validates: Requirements 1.2**
   */
  it('should accept valid trading pairs in lowercase', () => {
    fc.assert(
      fc.property(
        validTradingPairLowercaseArb,
        (tradingPair) => {
          const result = validateTradingPair(tradingPair);
          expect(result).toBe(true);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Valid trading pairs in mixed case SHALL be accepted
   * 
   * **Validates: Requirements 1.2**
   */
  it('should accept valid trading pairs in mixed case', () => {
    fc.assert(
      fc.property(
        validTradingPairMixedCaseArb,
        (tradingPair) => {
          const result = validateTradingPair(tradingPair);
          expect(result).toBe(true);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // ============================================
  // Invalid Input Tests - SHALL be rejected
  // ============================================

  /**
   * Arbitrary for strings without a slash separator
   */
  const noSlashArb = fc.array(
    fc.constantFrom(...alphanumericChars.split('')),
    { minLength: 1, maxLength: 20 }
  ).map(chars => chars.join(''));

  /**
   * Arbitrary for strings with wrong separators (not /)
   */
  const wrongSeparatorArb = fc.tuple(validSymbolArb, validSymbolArb)
    .chain(([base, quote]) => {
      return fc.constantFrom('-', '_', ':', '.', '|', '\\', ' ')
        .map(sep => `${base}${sep}${quote}`);
    });

  /**
   * Arbitrary for strings with multiple slashes
   */
  const multipleSlashesArb = fc.tuple(validSymbolArb, validSymbolArb, validSymbolArb)
    .map(([a, b, c]) => `${a}/${b}/${c}`);

  /**
   * Arbitrary for strings with empty BASE (starts with /)
   */
  const emptyBaseArb = validSymbolArb.map(quote => `/${quote}`);

  /**
   * Arbitrary for strings with empty QUOTE (ends with /)
   */
  const emptyQuoteArb = validSymbolArb.map(base => `${base}/`);

  /**
   * Arbitrary for strings with special characters in BASE or QUOTE
   */
  const specialChars = '!@#$%^&*()';
  const specialCharsSymbolArb = fc.array(
    fc.constantFrom(...specialChars.split('')),
    { minLength: 1, maxLength: 5 }
  ).map(chars => chars.join(''));

  const specialCharsArb = fc.tuple(specialCharsSymbolArb, validSymbolArb)
    .chain(([special, valid]) => {
      return fc.constantFrom(
        `${special}/${valid}`,
        `${valid}/${special}`,
        `${special}/${special}`
      );
    });

  /**
   * Property: Strings without a slash separator SHALL be rejected
   * 
   * **Validates: Requirements 1.2**
   */
  it('should reject strings without a slash separator', () => {
    fc.assert(
      fc.property(
        noSlashArb,
        (input) => {
          const result = validateTradingPair(input);
          expect(result).toBe(false);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Strings with wrong separators (not /) SHALL be rejected
   * 
   * **Validates: Requirements 1.2**
   */
  it('should reject strings with wrong separators', () => {
    fc.assert(
      fc.property(
        wrongSeparatorArb,
        (input) => {
          const result = validateTradingPair(input);
          expect(result).toBe(false);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Strings with multiple slashes SHALL be rejected
   * 
   * **Validates: Requirements 1.2**
   */
  it('should reject strings with multiple slashes', () => {
    fc.assert(
      fc.property(
        multipleSlashesArb,
        (input) => {
          const result = validateTradingPair(input);
          expect(result).toBe(false);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Strings with empty BASE (starts with /) SHALL be rejected
   * 
   * **Validates: Requirements 1.2**
   */
  it('should reject strings with empty BASE', () => {
    fc.assert(
      fc.property(
        emptyBaseArb,
        (input) => {
          const result = validateTradingPair(input);
          expect(result).toBe(false);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Strings with empty QUOTE (ends with /) SHALL be rejected
   * 
   * **Validates: Requirements 1.2**
   */
  it('should reject strings with empty QUOTE', () => {
    fc.assert(
      fc.property(
        emptyQuoteArb,
        (input) => {
          const result = validateTradingPair(input);
          expect(result).toBe(false);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Strings with special characters SHALL be rejected
   * 
   * **Validates: Requirements 1.2**
   */
  it('should reject strings with special characters', () => {
    fc.assert(
      fc.property(
        specialCharsArb,
        (input) => {
          const result = validateTradingPair(input);
          expect(result).toBe(false);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Empty strings SHALL be rejected
   * 
   * **Validates: Requirements 1.2**
   */
  it('should reject empty strings', () => {
    expect(validateTradingPair('')).toBe(false);
    expect(validateTradingPair('   ')).toBe(false);
  });

  /**
   * Property: Null and undefined inputs SHALL be rejected
   * 
   * **Validates: Requirements 1.2**
   */
  it('should reject null and undefined inputs', () => {
    expect(validateTradingPair(null as unknown as string)).toBe(false);
    expect(validateTradingPair(undefined as unknown as string)).toBe(false);
  });

  /**
   * Property: Non-string inputs SHALL be rejected
   * 
   * **Validates: Requirements 1.2**
   */
  it('should reject non-string inputs', () => {
    expect(validateTradingPair(123 as unknown as string)).toBe(false);
    expect(validateTradingPair({} as unknown as string)).toBe(false);
    expect(validateTradingPair([] as unknown as string)).toBe(false);
  });

  /**
   * Property: Just a slash SHALL be rejected
   * 
   * **Validates: Requirements 1.2**
   */
  it('should reject just a slash', () => {
    expect(validateTradingPair('/')).toBe(false);
  });

  // ============================================
  // Specific Example Tests (for documentation)
  // ============================================

  /**
   * Example tests with common trading pairs
   * 
   * **Validates: Requirements 1.2**
   */
  describe('Common trading pair examples', () => {
    it('should accept ETH/USDT', () => {
      expect(validateTradingPair('ETH/USDT')).toBe(true);
    });

    it('should accept BTC/USD', () => {
      expect(validateTradingPair('BTC/USD')).toBe(true);
    });

    it('should accept eth/usdt (lowercase)', () => {
      expect(validateTradingPair('eth/usdt')).toBe(true);
    });

    it('should accept SOL/BTC', () => {
      expect(validateTradingPair('SOL/BTC')).toBe(true);
    });

    it('should accept DOGE/EUR', () => {
      expect(validateTradingPair('DOGE/EUR')).toBe(true);
    });

    it('should accept pairs with numbers like USDT2/USD', () => {
      expect(validateTradingPair('USDT2/USD')).toBe(true);
    });
  });
});

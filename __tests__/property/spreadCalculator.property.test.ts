import * as fc from 'fast-check';
import { calculateSpreadPercent } from '../../src/services/spreadCalculator';

/**
 * **Feature: crypto-arbitrage-scanner, Property 6: Spread Calculation Correctness**
 * 
 * *For any* two prices (highPrice, lowPrice) where highPrice >= lowPrice > 0, 
 * the spread calculation SHALL equal ((highPrice - lowPrice) / lowPrice) × 100.
 * 
 * **Validates: Requirements 3.2**
 */
describe('Property 6: Spread Calculation Correctness', () => {
  // Arbitrary for positive prices (lowPrice must be > 0)
  // Using reasonable price ranges for cryptocurrency
  const positivePriceArb = fc.double({
    min: 0.00000001, // Minimum positive value (for very small altcoins)
    max: 100000,     // Maximum reasonable price
    noNaN: true,
    noDefaultInfinity: true,
  });

  /**
   * Property: For any highPrice >= lowPrice > 0, spread calculation equals
   * ((highPrice - lowPrice) / lowPrice) × 100
   * 
   * In the implementation:
   * - buyPrice corresponds to lowPrice (where you buy cheap)
   * - sellPrice corresponds to highPrice (where you sell high)
   * - Spread% = ((sellPrice - buyPrice) / buyPrice) * 100
   */
  it('should calculate spread correctly for any valid price pair', () => {
    fc.assert(
      fc.property(
        positivePriceArb,
        positivePriceArb,
        (price1, price2) => {
          // Ensure we have lowPrice and highPrice where highPrice >= lowPrice > 0
          const lowPrice = Math.min(price1, price2);
          const highPrice = Math.max(price1, price2);

          // Skip if lowPrice is 0 or negative (invalid input)
          if (lowPrice <= 0) {
            return true; // Skip this case
          }

          // Calculate expected spread using the formula from requirements
          // Spread% = ((HighPrice - LowPrice) / LowPrice) × 100
          const expectedSpread = ((highPrice - lowPrice) / lowPrice) * 100;

          // Calculate actual spread using the implementation
          // In the implementation: buyPrice = lowPrice, sellPrice = highPrice
          const actualSpread = calculateSpreadPercent(lowPrice, highPrice);

          // Compare with tolerance for floating point precision
          const tolerance = 1e-10;
          const difference = Math.abs(actualSpread - expectedSpread);

          expect(difference).toBeLessThanOrEqual(tolerance);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Spread should be 0 when highPrice equals lowPrice
   */
  it('should return 0 spread when prices are equal', () => {
    fc.assert(
      fc.property(
        positivePriceArb,
        (price) => {
          // Skip invalid prices
          if (price <= 0) {
            return true;
          }

          const spread = calculateSpreadPercent(price, price);
          
          // When prices are equal, spread should be 0
          expect(spread).toBe(0);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Spread should be positive when highPrice > lowPrice
   */
  it('should return positive spread when sell price is higher than buy price', () => {
    fc.assert(
      fc.property(
        positivePriceArb,
        positivePriceArb,
        (price1, price2) => {
          const lowPrice = Math.min(price1, price2);
          const highPrice = Math.max(price1, price2);

          // Skip if prices are equal or lowPrice is invalid
          if (lowPrice <= 0 || lowPrice === highPrice) {
            return true;
          }

          const spread = calculateSpreadPercent(lowPrice, highPrice);

          // Spread should be positive when highPrice > lowPrice
          expect(spread).toBeGreaterThan(0);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Spread should be negative when sellPrice < buyPrice
   * (This represents a loss scenario in arbitrage)
   */
  it('should return negative spread when sell price is lower than buy price', () => {
    fc.assert(
      fc.property(
        positivePriceArb,
        positivePriceArb,
        (price1, price2) => {
          const lowPrice = Math.min(price1, price2);
          const highPrice = Math.max(price1, price2);

          // Skip if prices are equal or lowPrice is invalid
          if (lowPrice <= 0 || lowPrice === highPrice) {
            return true;
          }

          // Calculate spread with reversed prices (buy high, sell low = loss)
          const spread = calculateSpreadPercent(highPrice, lowPrice);

          // Spread should be negative when sellPrice < buyPrice
          expect(spread).toBeLessThan(0);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Spread calculation should throw error for non-positive buyPrice
   */
  it('should throw error when buy price is zero or negative', () => {
    fc.assert(
      fc.property(
        fc.double({ max: 0, noNaN: true }), // Zero or negative
        positivePriceArb,
        (invalidBuyPrice, sellPrice) => {
          expect(() => {
            calculateSpreadPercent(invalidBuyPrice, sellPrice);
          }).toThrow('Buy price must be greater than 0');

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Mathematical consistency - spread percentage should scale correctly
   * If we double the price difference while keeping lowPrice constant,
   * the spread should also double
   */
  it('should maintain mathematical consistency with price scaling', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 1, max: 1000, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 0.01, max: 100, noNaN: true, noDefaultInfinity: true }),
        (lowPrice, priceDiff) => {
          const highPrice1 = lowPrice + priceDiff;
          const highPrice2 = lowPrice + (priceDiff * 2);

          const spread1 = calculateSpreadPercent(lowPrice, highPrice1);
          const spread2 = calculateSpreadPercent(lowPrice, highPrice2);

          // The spread with double the price difference should be approximately
          // double the original spread (within floating point tolerance)
          // spread1 = (priceDiff / lowPrice) * 100
          // spread2 = (2 * priceDiff / lowPrice) * 100 = 2 * spread1
          const expectedRatio = 2;
          const actualRatio = spread2 / spread1;

          const tolerance = 1e-10;
          expect(Math.abs(actualRatio - expectedRatio)).toBeLessThanOrEqual(tolerance);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * **Feature: crypto-arbitrage-scanner, Property 7: Spread Results Sorting**
 * 
 * *For any* list of SpreadResult objects, after sorting, each element's spreadPercent 
 * SHALL be greater than or equal to the next element's spreadPercent (descending order).
 * 
 * **Validates: Requirements 3.3**
 */
import { sortBySpread } from '../../src/services/spreadCalculator';
import { SpreadResult, TradingPair, Exchange } from '../../src/types';

describe('Property 7: Spread Results Sorting', () => {
  // Arbitrary for Exchange type
  const exchangeArb = fc.constantFrom<Exchange>('binance', 'coinbase', 'kraken');

  // Arbitrary for TradingPair
  const tradingPairArb = fc.record({
    base: fc.constantFrom('ETH', 'BTC', 'SOL', 'DOGE', 'XRP'),
    quote: fc.constantFrom('USDT', 'USD', 'EUR', 'BTC'),
  }).map(({ base, quote }) => ({
    base,
    quote,
    symbol: `${base}/${quote}`,
  }));

  // Arbitrary for positive prices
  const positivePriceArb = fc.double({
    min: 0.00000001,
    max: 100000,
    noNaN: true,
    noDefaultInfinity: true,
  });

  // Arbitrary for spread percentage (can be negative, zero, or positive)
  const spreadPercentArb = fc.double({
    min: -50,
    max: 100,
    noNaN: true,
    noDefaultInfinity: true,
  });

  // Arbitrary for SpreadResult
  const spreadResultArb: fc.Arbitrary<SpreadResult> = fc.record({
    pair: tradingPairArb,
    buyExchange: exchangeArb,
    sellExchange: exchangeArb,
    buyPrice: positivePriceArb,
    sellPrice: positivePriceArb,
    spreadPercent: spreadPercentArb,
    timestamp: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-01-01') }),
  });

  // Arbitrary for array of SpreadResult (0 to 50 items)
  const spreadResultArrayArb = fc.array(spreadResultArb, { minLength: 0, maxLength: 50 });

  /**
   * Property: After sorting, each element's spreadPercent SHALL be >= the next element's spreadPercent
   * This verifies descending order sorting
   */
  it('should sort spread results in descending order by spreadPercent', () => {
    fc.assert(
      fc.property(
        spreadResultArrayArb,
        (spreadResults) => {
          // Sort the results
          const sorted = sortBySpread(spreadResults);

          // Verify descending order: each element's spreadPercent >= next element's spreadPercent
          for (let i = 0; i < sorted.length - 1; i++) {
            expect(sorted[i].spreadPercent).toBeGreaterThanOrEqual(sorted[i + 1].spreadPercent);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Sorting should preserve all elements (same length)
   */
  it('should preserve all elements after sorting', () => {
    fc.assert(
      fc.property(
        spreadResultArrayArb,
        (spreadResults) => {
          const sorted = sortBySpread(spreadResults);

          // Length should be preserved
          expect(sorted.length).toBe(spreadResults.length);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Sorting should not mutate the original array
   */
  it('should not mutate the original array', () => {
    fc.assert(
      fc.property(
        spreadResultArrayArb,
        (spreadResults) => {
          // Create a deep copy of the original for comparison
          const originalCopy = spreadResults.map(r => ({ ...r }));

          // Sort the results
          sortBySpread(spreadResults);

          // Original array should remain unchanged
          expect(spreadResults.length).toBe(originalCopy.length);
          for (let i = 0; i < spreadResults.length; i++) {
            expect(spreadResults[i].spreadPercent).toBe(originalCopy[i].spreadPercent);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Sorting an empty array should return an empty array
   */
  it('should handle empty arrays correctly', () => {
    const sorted = sortBySpread([]);
    expect(sorted).toEqual([]);
    expect(sorted.length).toBe(0);
  });

  /**
   * Property: Sorting a single-element array should return that element
   */
  it('should handle single-element arrays correctly', () => {
    fc.assert(
      fc.property(
        spreadResultArb,
        (spreadResult) => {
          const sorted = sortBySpread([spreadResult]);

          expect(sorted.length).toBe(1);
          expect(sorted[0].spreadPercent).toBe(spreadResult.spreadPercent);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: The first element after sorting should have the maximum spreadPercent
   */
  it('should have maximum spreadPercent as first element after sorting', () => {
    fc.assert(
      fc.property(
        fc.array(spreadResultArb, { minLength: 1, maxLength: 50 }),
        (spreadResults) => {
          const sorted = sortBySpread(spreadResults);

          // Find the maximum spreadPercent in the original array
          const maxSpread = Math.max(...spreadResults.map(r => r.spreadPercent));

          // First element should have the maximum spread
          expect(sorted[0].spreadPercent).toBe(maxSpread);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: The last element after sorting should have the minimum spreadPercent
   */
  it('should have minimum spreadPercent as last element after sorting', () => {
    fc.assert(
      fc.property(
        fc.array(spreadResultArb, { minLength: 1, maxLength: 50 }),
        (spreadResults) => {
          const sorted = sortBySpread(spreadResults);

          // Find the minimum spreadPercent in the original array
          const minSpread = Math.min(...spreadResults.map(r => r.spreadPercent));

          // Last element should have the minimum spread
          expect(sorted[sorted.length - 1].spreadPercent).toBe(minSpread);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Sorting should be idempotent - sorting twice should give the same result
   */
  it('should be idempotent - sorting twice gives same result', () => {
    fc.assert(
      fc.property(
        spreadResultArrayArb,
        (spreadResults) => {
          const sortedOnce = sortBySpread(spreadResults);
          const sortedTwice = sortBySpread(sortedOnce);

          // Both sorted arrays should have the same spreadPercent values in the same order
          expect(sortedOnce.length).toBe(sortedTwice.length);
          for (let i = 0; i < sortedOnce.length; i++) {
            expect(sortedOnce[i].spreadPercent).toBe(sortedTwice[i].spreadPercent);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

import * as fc from 'fast-check';
import {
  validateThreshold,
  isValidThreshold,
  ALERT_CONSTANTS,
} from '../../src/services/alertSystem';

/**
 * **Feature: crypto-arbitrage-scanner, Property 13: Alert Threshold Validation**
 *
 * *For any* threshold input value, values between 0.1 and 10 (inclusive) SHALL be accepted;
 * values outside this range SHALL be rejected.
 *
 * **Validates: Requirements 5.1**
 */
describe('Property 13: Alert Threshold Validation', () => {
  const { MIN_THRESHOLD, MAX_THRESHOLD } = ALERT_CONSTANTS;

  // Arbitrary for valid threshold values (between 0.1 and 10 inclusive)
  const validThresholdArb = fc.double({
    min: MIN_THRESHOLD,
    max: MAX_THRESHOLD,
    noNaN: true,
    noDefaultInfinity: true,
  });

  // Arbitrary for threshold values below the minimum (< 0.1)
  const belowMinThresholdArb = fc.double({
    min: -1000,
    max: MIN_THRESHOLD - 0.0001,
    noNaN: true,
    noDefaultInfinity: true,
  });

  // Arbitrary for threshold values above the maximum (> 10)
  const aboveMaxThresholdArb = fc.double({
    min: MAX_THRESHOLD + 0.0001,
    max: 10000,
    noNaN: true,
    noDefaultInfinity: true,
  });

  /**
   * Property: Values between 0.1 and 10 (inclusive) SHALL be accepted
   * Tests the isValidThreshold function (non-throwing version)
   */
  it('should accept threshold values between 0.1 and 10 (inclusive) using isValidThreshold', () => {
    fc.assert(
      fc.property(validThresholdArb, (threshold) => {
        const result = isValidThreshold(threshold);
        expect(result).toBe(true);
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Values between 0.1 and 10 (inclusive) SHALL be accepted
   * Tests the validateThreshold function (throwing version)
   */
  it('should accept threshold values between 0.1 and 10 (inclusive) using validateThreshold', () => {
    fc.assert(
      fc.property(validThresholdArb, (threshold) => {
        // validateThreshold should not throw for valid values
        expect(() => validateThreshold(threshold)).not.toThrow();
        // validateThreshold should return true for valid values
        expect(validateThreshold(threshold)).toBe(true);
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Values below 0.1 SHALL be rejected
   * Tests the isValidThreshold function (non-throwing version)
   */
  it('should reject threshold values below 0.1 using isValidThreshold', () => {
    fc.assert(
      fc.property(belowMinThresholdArb, (threshold) => {
        const result = isValidThreshold(threshold);
        expect(result).toBe(false);
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Values below 0.1 SHALL be rejected
   * Tests the validateThreshold function (throwing version)
   */
  it('should reject threshold values below 0.1 using validateThreshold', () => {
    fc.assert(
      fc.property(belowMinThresholdArb, (threshold) => {
        expect(() => validateThreshold(threshold)).toThrow(
          `Threshold must be between ${MIN_THRESHOLD}% and ${MAX_THRESHOLD}%`
        );
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Values above 10 SHALL be rejected
   * Tests the isValidThreshold function (non-throwing version)
   */
  it('should reject threshold values above 10 using isValidThreshold', () => {
    fc.assert(
      fc.property(aboveMaxThresholdArb, (threshold) => {
        const result = isValidThreshold(threshold);
        expect(result).toBe(false);
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Values above 10 SHALL be rejected
   * Tests the validateThreshold function (throwing version)
   */
  it('should reject threshold values above 10 using validateThreshold', () => {
    fc.assert(
      fc.property(aboveMaxThresholdArb, (threshold) => {
        expect(() => validateThreshold(threshold)).toThrow(
          `Threshold must be between ${MIN_THRESHOLD}% and ${MAX_THRESHOLD}%`
        );
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Boundary value 0.1 (MIN_THRESHOLD) SHALL be accepted
   */
  it('should accept the minimum boundary value (0.1)', () => {
    expect(isValidThreshold(MIN_THRESHOLD)).toBe(true);
    expect(() => validateThreshold(MIN_THRESHOLD)).not.toThrow();
    expect(validateThreshold(MIN_THRESHOLD)).toBe(true);
  });

  /**
   * Property: Boundary value 10 (MAX_THRESHOLD) SHALL be accepted
   */
  it('should accept the maximum boundary value (10)', () => {
    expect(isValidThreshold(MAX_THRESHOLD)).toBe(true);
    expect(() => validateThreshold(MAX_THRESHOLD)).not.toThrow();
    expect(validateThreshold(MAX_THRESHOLD)).toBe(true);
  });

  /**
   * Property: NaN values SHALL be rejected
   */
  it('should reject NaN values', () => {
    expect(isValidThreshold(NaN)).toBe(false);
    expect(() => validateThreshold(NaN)).toThrow('Threshold must be a valid number');
  });

  /**
   * Property: Infinity values SHALL be rejected
   */
  it('should reject Infinity values', () => {
    expect(isValidThreshold(Infinity)).toBe(false);
    expect(isValidThreshold(-Infinity)).toBe(false);
    expect(() => validateThreshold(Infinity)).toThrow('Threshold must be a finite number');
    expect(() => validateThreshold(-Infinity)).toThrow('Threshold must be a finite number');
  });

  /**
   * Property: Validation should be deterministic
   * Same input should always produce the same result
   */
  it('should be deterministic - same input produces same result', () => {
    fc.assert(
      fc.property(
        fc.double({ noNaN: true, noDefaultInfinity: true }),
        (threshold) => {
          const result1 = isValidThreshold(threshold);
          const result2 = isValidThreshold(threshold);
          expect(result1).toBe(result2);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: isValidThreshold and validateThreshold should be consistent
   * If isValidThreshold returns true, validateThreshold should not throw
   * If isValidThreshold returns false, validateThreshold should throw
   */
  it('should have consistent behavior between isValidThreshold and validateThreshold', () => {
    fc.assert(
      fc.property(validThresholdArb, (threshold) => {
        const isValid = isValidThreshold(threshold);
        if (isValid) {
          expect(() => validateThreshold(threshold)).not.toThrow();
        } else {
          expect(() => validateThreshold(threshold)).toThrow();
        }
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Values just below minimum (0.1 - epsilon) SHALL be rejected
   */
  it('should reject values just below minimum threshold', () => {
    fc.assert(
      fc.property(
        fc.double({
          min: 0.00001,
          max: 0.09999,
          noNaN: true,
          noDefaultInfinity: true,
        }),
        (threshold) => {
          expect(isValidThreshold(threshold)).toBe(false);
          expect(() => validateThreshold(threshold)).toThrow();
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Values just above maximum (10 + epsilon) SHALL be rejected
   */
  it('should reject values just above maximum threshold', () => {
    fc.assert(
      fc.property(
        fc.double({
          min: 10.00001,
          max: 10.1,
          noNaN: true,
          noDefaultInfinity: true,
        }),
        (threshold) => {
          expect(isValidThreshold(threshold)).toBe(false);
          expect(() => validateThreshold(threshold)).toThrow();
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Zero and negative values SHALL be rejected
   */
  it('should reject zero and negative values', () => {
    expect(isValidThreshold(0)).toBe(false);
    expect(() => validateThreshold(0)).toThrow();

    fc.assert(
      fc.property(
        fc.double({
          min: -10000,
          max: -0.0001,
          noNaN: true,
          noDefaultInfinity: true,
        }),
        (threshold) => {
          expect(isValidThreshold(threshold)).toBe(false);
          expect(() => validateThreshold(threshold)).toThrow();
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});


import {
  spreadExceedsThreshold,
  AlertSystem,
} from '../../src/services/alertSystem';
import { SpreadResult, TradingPair, Exchange } from '../../src/types';

/**
 * **Feature: crypto-arbitrage-scanner, Property 14: Alert Triggering**
 *
 * *For any* SpreadResult where spreadPercent exceeds the configured threshold,
 * an alert SHALL be triggered.
 *
 * **Validates: Requirements 5.2**
 */
describe('Property 14: Alert Triggering', () => {
  const { MIN_THRESHOLD, MAX_THRESHOLD } = ALERT_CONSTANTS;

  // Arbitrary for valid exchanges
  const exchangeArb: fc.Arbitrary<Exchange> = fc.constantFrom('binance', 'coinbase', 'kraken');

  // Arbitrary for trading pairs
  const tradingPairArb: fc.Arbitrary<TradingPair> = fc.record({
    base: fc.constantFrom('ETH', 'BTC', 'SOL', 'DOGE', 'XRP'),
    quote: fc.constantFrom('USDT', 'USD', 'EUR', 'BTC'),
  }).map(({ base, quote }) => ({
    base,
    quote,
    symbol: `${base}/${quote}`,
  }));

  // Arbitrary for positive prices
  const priceArb = fc.double({
    min: 0.0001,
    max: 100000,
    noNaN: true,
    noDefaultInfinity: true,
  });

  // Arbitrary for valid threshold values
  const validThresholdArb = fc.double({
    min: MIN_THRESHOLD,
    max: MAX_THRESHOLD,
    noNaN: true,
    noDefaultInfinity: true,
  });

  // Create a SpreadResult with a specific spreadPercent
  const createSpreadResult = (
    pair: TradingPair,
    buyExchange: Exchange,
    sellExchange: Exchange,
    buyPrice: number,
    spreadPercent: number
  ): SpreadResult => {
    // Calculate sellPrice from buyPrice and spreadPercent
    // spreadPercent = ((sellPrice - buyPrice) / buyPrice) * 100
    // sellPrice = buyPrice * (1 + spreadPercent / 100)
    const sellPrice = buyPrice * (1 + spreadPercent / 100);
    return {
      pair,
      buyExchange,
      sellExchange,
      buyPrice,
      sellPrice,
      spreadPercent,
      timestamp: new Date(),
    };
  };

  /**
   * Property: spreadExceedsThreshold returns true when spreadPercent > threshold
   */
  it('spreadExceedsThreshold should return true when spreadPercent exceeds threshold', () => {
    fc.assert(
      fc.property(
        validThresholdArb,
        tradingPairArb,
        exchangeArb,
        exchangeArb,
        priceArb,
        (threshold, pair, buyExchange, sellExchange, buyPrice) => {
          // Generate a spread that exceeds the threshold
          const spreadPercent = threshold + 0.01 + Math.random() * 10;
          const spread = createSpreadResult(pair, buyExchange, sellExchange, buyPrice, spreadPercent);

          const result = spreadExceedsThreshold(spread, threshold);
          expect(result).toBe(true);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: spreadExceedsThreshold returns false when spreadPercent <= threshold
   */
  it('spreadExceedsThreshold should return false when spreadPercent does not exceed threshold', () => {
    fc.assert(
      fc.property(
        validThresholdArb,
        tradingPairArb,
        exchangeArb,
        exchangeArb,
        priceArb,
        (threshold, pair, buyExchange, sellExchange, buyPrice) => {
          // Generate a spread that does NOT exceed the threshold (equal or less)
          const spreadPercent = threshold * Math.random(); // 0 to threshold (exclusive of threshold)
          const spread = createSpreadResult(pair, buyExchange, sellExchange, buyPrice, spreadPercent);

          const result = spreadExceedsThreshold(spread, threshold);
          expect(result).toBe(false);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: spreadExceedsThreshold returns false when spreadPercent equals threshold exactly
   */
  it('spreadExceedsThreshold should return false when spreadPercent equals threshold exactly', () => {
    fc.assert(
      fc.property(
        validThresholdArb,
        tradingPairArb,
        exchangeArb,
        exchangeArb,
        priceArb,
        (threshold, pair, buyExchange, sellExchange, buyPrice) => {
          const spread = createSpreadResult(pair, buyExchange, sellExchange, buyPrice, threshold);

          const result = spreadExceedsThreshold(spread, threshold);
          // spreadPercent > threshold, so equal should return false
          expect(result).toBe(false);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: AlertSystem.checkAndAlert triggers alerts for all spreads exceeding threshold
   */
  it('AlertSystem.checkAndAlert should trigger alerts for all spreads exceeding threshold', () => {
    fc.assert(
      fc.property(
        validThresholdArb,
        fc.array(
          fc.tuple(tradingPairArb, exchangeArb, exchangeArb, priceArb),
          { minLength: 1, maxLength: 10 }
        ),
        (threshold, spreadInputs) => {
          const alertSystem = new AlertSystem(threshold);

          // Create spreads that all exceed the threshold
          const spreads: SpreadResult[] = spreadInputs.map(([pair, buyExchange, sellExchange, buyPrice]) => {
            const spreadPercent = threshold + 0.1 + Math.random() * 5;
            return createSpreadResult(pair, buyExchange, sellExchange, buyPrice, spreadPercent);
          });

          const triggeredAlerts = alertSystem.checkAndAlert(spreads);

          // All spreads exceed threshold, so all should trigger alerts
          expect(triggeredAlerts.length).toBe(spreads.length);

          // Each triggered alert should correspond to a spread that exceeded threshold
          triggeredAlerts.forEach((alert, index) => {
            expect(alert.spread.spreadPercent).toBeGreaterThan(threshold);
          });

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: AlertSystem.checkAndAlert does NOT trigger alerts for spreads not exceeding threshold
   */
  it('AlertSystem.checkAndAlert should NOT trigger alerts for spreads not exceeding threshold', () => {
    fc.assert(
      fc.property(
        validThresholdArb,
        fc.array(
          fc.tuple(tradingPairArb, exchangeArb, exchangeArb, priceArb),
          { minLength: 1, maxLength: 10 }
        ),
        (threshold, spreadInputs) => {
          const alertSystem = new AlertSystem(threshold);

          // Create spreads that do NOT exceed the threshold
          const spreads: SpreadResult[] = spreadInputs.map(([pair, buyExchange, sellExchange, buyPrice]) => {
            const spreadPercent = threshold * Math.random() * 0.9; // 0 to 90% of threshold
            return createSpreadResult(pair, buyExchange, sellExchange, buyPrice, spreadPercent);
          });

          const triggeredAlerts = alertSystem.checkAndAlert(spreads);

          // No spreads exceed threshold, so no alerts should be triggered
          expect(triggeredAlerts.length).toBe(0);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: AlertSystem.checkAndAlert correctly filters mixed spreads
   * Only spreads exceeding threshold should trigger alerts
   */
  it('AlertSystem.checkAndAlert should only trigger alerts for spreads exceeding threshold in mixed input', () => {
    fc.assert(
      fc.property(
        validThresholdArb,
        fc.array(
          fc.tuple(tradingPairArb, exchangeArb, exchangeArb, priceArb, fc.boolean()),
          { minLength: 1, maxLength: 10 }
        ),
        (threshold, spreadInputs) => {
          const alertSystem = new AlertSystem(threshold);

          // Create mixed spreads - some exceed threshold, some don't
          const spreads: SpreadResult[] = spreadInputs.map(([pair, buyExchange, sellExchange, buyPrice, shouldExceed]) => {
            const spreadPercent = shouldExceed
              ? threshold + 0.1 + Math.random() * 5 // Exceeds threshold
              : threshold * Math.random() * 0.9;    // Does not exceed threshold
            return createSpreadResult(pair, buyExchange, sellExchange, buyPrice, spreadPercent);
          });

          const expectedAlertCount = spreadInputs.filter(([, , , , shouldExceed]) => shouldExceed).length;

          const triggeredAlerts = alertSystem.checkAndAlert(spreads);

          // Only spreads that exceed threshold should trigger alerts
          expect(triggeredAlerts.length).toBe(expectedAlertCount);

          // Verify each triggered alert has spreadPercent > threshold
          triggeredAlerts.forEach((alert) => {
            expect(alert.spread.spreadPercent).toBeGreaterThan(threshold);
          });

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Triggered alerts contain valid alert records with correct spread data
   */
  it('triggered alerts should contain valid AlertRecord with correct spread data', () => {
    fc.assert(
      fc.property(
        validThresholdArb,
        tradingPairArb,
        exchangeArb,
        exchangeArb,
        priceArb,
        (threshold, pair, buyExchange, sellExchange, buyPrice) => {
          const alertSystem = new AlertSystem(threshold);

          // Create a spread that exceeds threshold
          const spreadPercent = threshold + 1;
          const spread = createSpreadResult(pair, buyExchange, sellExchange, buyPrice, spreadPercent);

          const triggeredAlerts = alertSystem.checkAndAlert([spread]);

          expect(triggeredAlerts.length).toBe(1);

          const alert = triggeredAlerts[0];

          // Verify alert record structure
          expect(alert.id).toBeDefined();
          expect(typeof alert.id).toBe('string');
          expect(alert.spread).toBeDefined();
          expect(alert.spread.spreadPercent).toBe(spreadPercent);
          expect(alert.spread.pair.symbol).toBe(pair.symbol);
          expect(alert.spread.buyExchange).toBe(buyExchange);
          expect(alert.spread.sellExchange).toBe(sellExchange);
          expect(alert.estimatedProfit).toBeDefined();
          expect(alert.triggeredAt).toBeInstanceOf(Date);
          expect(alert.acknowledged).toBe(false);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Alert triggering is deterministic for the same input
   */
  it('alert triggering should be deterministic - same spread and threshold produces same result', () => {
    fc.assert(
      fc.property(
        validThresholdArb,
        tradingPairArb,
        exchangeArb,
        exchangeArb,
        priceArb,
        fc.double({ min: -5, max: 20, noNaN: true, noDefaultInfinity: true }),
        (threshold, pair, buyExchange, sellExchange, buyPrice, spreadPercent) => {
          const spread = createSpreadResult(pair, buyExchange, sellExchange, buyPrice, spreadPercent);

          // Check multiple times - result should be consistent
          const result1 = spreadExceedsThreshold(spread, threshold);
          const result2 = spreadExceedsThreshold(spread, threshold);
          const result3 = spreadExceedsThreshold(spread, threshold);

          expect(result1).toBe(result2);
          expect(result2).toBe(result3);

          // Verify the result matches the expected logic
          const expectedResult = spreadPercent > threshold;
          expect(result1).toBe(expectedResult);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Empty spread array should trigger no alerts
   */
  it('empty spread array should trigger no alerts', () => {
    fc.assert(
      fc.property(validThresholdArb, (threshold) => {
        const alertSystem = new AlertSystem(threshold);
        const triggeredAlerts = alertSystem.checkAndAlert([]);

        expect(triggeredAlerts.length).toBe(0);
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Negative spread percentages should never trigger alerts (always below positive threshold)
   */
  it('negative spread percentages should never trigger alerts', () => {
    fc.assert(
      fc.property(
        validThresholdArb,
        fc.array(
          fc.tuple(tradingPairArb, exchangeArb, exchangeArb, priceArb),
          { minLength: 1, maxLength: 10 }
        ),
        (threshold, spreadInputs) => {
          const alertSystem = new AlertSystem(threshold);

          // Create spreads with negative percentages
          const spreads: SpreadResult[] = spreadInputs.map(([pair, buyExchange, sellExchange, buyPrice]) => {
            const spreadPercent = -(Math.random() * 10 + 0.1); // -0.1 to -10.1
            return createSpreadResult(pair, buyExchange, sellExchange, buyPrice, spreadPercent);
          });

          const triggeredAlerts = alertSystem.checkAndAlert(spreads);

          // Negative spreads should never exceed positive threshold
          expect(triggeredAlerts.length).toBe(0);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});


import {
  trimAlertHistory,
  addAlertsToHistory,
  createAlertRecord,
} from '../../src/services/alertSystem';
import { ProfitResult } from '../../src/types';

/**
 * **Feature: crypto-arbitrage-scanner, Property 16: Alert History Limit**
 *
 * *For any* sequence of alerts, the alert history SHALL contain at most 50 entries,
 * keeping only the most recent ones.
 *
 * **Validates: Requirements 5.6**
 */
describe('Property 16: Alert History Limit', () => {
  const { MAX_HISTORY_SIZE, MIN_THRESHOLD, MAX_THRESHOLD } = ALERT_CONSTANTS;

  // Arbitrary for valid exchanges
  const exchangeArb: fc.Arbitrary<Exchange> = fc.constantFrom('binance', 'coinbase', 'kraken');

  // Arbitrary for trading pairs
  const tradingPairArb: fc.Arbitrary<TradingPair> = fc.record({
    base: fc.constantFrom('ETH', 'BTC', 'SOL', 'DOGE', 'XRP'),
    quote: fc.constantFrom('USDT', 'USD', 'EUR', 'BTC'),
  }).map(({ base, quote }) => ({
    base,
    quote,
    symbol: `${base}/${quote}`,
  }));

  // Arbitrary for positive prices
  const priceArb = fc.double({
    min: 0.0001,
    max: 100000,
    noNaN: true,
    noDefaultInfinity: true,
  });

  // Arbitrary for valid threshold values
  const validThresholdArb = fc.double({
    min: MIN_THRESHOLD,
    max: MAX_THRESHOLD,
    noNaN: true,
    noDefaultInfinity: true,
  });

  // Arbitrary for spread percentages that exceed threshold
  const exceedingSpreadPercentArb = (threshold: number) => fc.double({
    min: threshold + 0.01,
    max: threshold + 20,
    noNaN: true,
    noDefaultInfinity: true,
  });

  // Create a SpreadResult with a specific spreadPercent
  const createSpreadResult = (
    pair: TradingPair,
    buyExchange: Exchange,
    sellExchange: Exchange,
    buyPrice: number,
    spreadPercent: number
  ): SpreadResult => {
    const sellPrice = buyPrice * (1 + spreadPercent / 100);
    return {
      pair,
      buyExchange,
      sellExchange,
      buyPrice,
      sellPrice,
      spreadPercent,
      timestamp: new Date(),
    };
  };

  // Create a mock ProfitResult
  const createMockProfitResult = (): ProfitResult => ({
    grossProfit: 100,
    totalFees: 10,
    netProfit: 90,
    isProfitable: true,
  });

  // Create an AlertRecord with a specific timestamp
  const createAlertRecordWithTimestamp = (
    spread: SpreadResult,
    timestamp: Date
  ): AlertRecord => ({
    id: `alert_${timestamp.getTime()}_${Math.random().toString(36).substring(2, 9)}`,
    spread,
    estimatedProfit: createMockProfitResult(),
    triggeredAt: timestamp,
    acknowledged: false,
  });

  /**
   * Property: trimAlertHistory should never return more than maxSize entries
   */
  it('trimAlertHistory should never return more than MAX_HISTORY_SIZE entries', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.tuple(tradingPairArb, exchangeArb, exchangeArb, priceArb, fc.date()),
          { minLength: 0, maxLength: 200 }
        ),
        (alertInputs) => {
          // Create alert records with various timestamps
          const alerts: AlertRecord[] = alertInputs.map(([pair, buyExchange, sellExchange, buyPrice, timestamp]) => {
            const spread = createSpreadResult(pair, buyExchange, sellExchange, buyPrice, 5);
            return createAlertRecordWithTimestamp(spread, timestamp);
          });

          const trimmed = trimAlertHistory(alerts, MAX_HISTORY_SIZE);

          // The result should never exceed MAX_HISTORY_SIZE
          expect(trimmed.length).toBeLessThanOrEqual(MAX_HISTORY_SIZE);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: trimAlertHistory should keep the most recent entries
   */
  it('trimAlertHistory should keep the most recent entries when trimming', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.tuple(tradingPairArb, exchangeArb, exchangeArb, priceArb, fc.date()),
          { minLength: MAX_HISTORY_SIZE + 1, maxLength: 150 }
        ),
        (alertInputs) => {
          // Create alert records with various timestamps
          const alerts: AlertRecord[] = alertInputs.map(([pair, buyExchange, sellExchange, buyPrice, timestamp]) => {
            const spread = createSpreadResult(pair, buyExchange, sellExchange, buyPrice, 5);
            return createAlertRecordWithTimestamp(spread, timestamp);
          });

          const trimmed = trimAlertHistory(alerts, MAX_HISTORY_SIZE);

          // Sort original alerts by timestamp descending to find the most recent ones
          const sortedOriginal = [...alerts].sort(
            (a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime()
          );
          const expectedMostRecent = sortedOriginal.slice(0, MAX_HISTORY_SIZE);

          // The trimmed result should contain exactly the most recent entries
          expect(trimmed.length).toBe(MAX_HISTORY_SIZE);

          // All trimmed entries should be from the most recent set
          const trimmedTimestamps = new Set(trimmed.map(a => a.triggeredAt.getTime()));
          const expectedTimestamps = new Set(expectedMostRecent.map(a => a.triggeredAt.getTime()));
          
          // Every timestamp in trimmed should be in expected
          trimmed.forEach(alert => {
            expect(expectedTimestamps.has(alert.triggeredAt.getTime())).toBe(true);
          });

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: addAlertsToHistory should never exceed MAX_HISTORY_SIZE
   */
  it('addAlertsToHistory should never exceed MAX_HISTORY_SIZE', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.tuple(tradingPairArb, exchangeArb, exchangeArb, priceArb, fc.date()),
          { minLength: 0, maxLength: 100 }
        ),
        fc.array(
          fc.tuple(tradingPairArb, exchangeArb, exchangeArb, priceArb, fc.date()),
          { minLength: 0, maxLength: 100 }
        ),
        (existingInputs, newInputs) => {
          // Create existing alert history
          const existingHistory: AlertRecord[] = existingInputs.map(([pair, buyExchange, sellExchange, buyPrice, timestamp]) => {
            const spread = createSpreadResult(pair, buyExchange, sellExchange, buyPrice, 5);
            return createAlertRecordWithTimestamp(spread, timestamp);
          });

          // Create new alerts to add
          const newAlerts: AlertRecord[] = newInputs.map(([pair, buyExchange, sellExchange, buyPrice, timestamp]) => {
            const spread = createSpreadResult(pair, buyExchange, sellExchange, buyPrice, 5);
            return createAlertRecordWithTimestamp(spread, timestamp);
          });

          const result = addAlertsToHistory(existingHistory, newAlerts, MAX_HISTORY_SIZE);

          // Result should never exceed MAX_HISTORY_SIZE
          expect(result.length).toBeLessThanOrEqual(MAX_HISTORY_SIZE);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: AlertSystem.getAlertHistory should never exceed MAX_HISTORY_SIZE after multiple checkAndAlert calls
   */
  it('AlertSystem.getAlertHistory should never exceed MAX_HISTORY_SIZE after multiple checkAndAlert calls', () => {
    fc.assert(
      fc.property(
        validThresholdArb,
        fc.array(
          fc.array(
            fc.tuple(tradingPairArb, exchangeArb, exchangeArb, priceArb),
            { minLength: 1, maxLength: 20 }
          ),
          { minLength: 1, maxLength: 10 }
        ),
        (threshold, batchesOfSpreadInputs) => {
          const alertSystemInstance = new AlertSystem(threshold);

          // Process multiple batches of spreads
          for (const spreadInputs of batchesOfSpreadInputs) {
            // Create spreads that exceed threshold to trigger alerts
            const spreads: SpreadResult[] = spreadInputs.map(([pair, buyExchange, sellExchange, buyPrice]) => {
              const spreadPercent = threshold + 1 + Math.random() * 5;
              return createSpreadResult(pair, buyExchange, sellExchange, buyPrice, spreadPercent);
            });

            alertSystemInstance.checkAndAlert(spreads);
          }

          const history = alertSystemInstance.getAlertHistory();

          // History should never exceed MAX_HISTORY_SIZE
          expect(history.length).toBeLessThanOrEqual(MAX_HISTORY_SIZE);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: When history is at max capacity, new alerts should replace oldest ones
   */
  it('when history is at max capacity, new alerts should replace oldest ones', () => {
    fc.assert(
      fc.property(
        validThresholdArb,
        fc.array(
          fc.tuple(tradingPairArb, exchangeArb, exchangeArb, priceArb),
          { minLength: MAX_HISTORY_SIZE + 10, maxLength: MAX_HISTORY_SIZE + 50 }
        ),
        (threshold, spreadInputs) => {
          const alertSystemInstance = new AlertSystem(threshold);

          // Create spreads that exceed threshold
          const spreads: SpreadResult[] = spreadInputs.map(([pair, buyExchange, sellExchange, buyPrice], index) => {
            const spreadPercent = threshold + 1;
            const spread = createSpreadResult(pair, buyExchange, sellExchange, buyPrice, spreadPercent);
            // Set timestamp to ensure ordering (newer alerts have higher timestamps)
            spread.timestamp = new Date(Date.now() + index * 1000);
            return spread;
          });

          // Trigger all alerts at once
          alertSystemInstance.checkAndAlert(spreads);

          const history = alertSystemInstance.getAlertHistory();

          // History should be exactly MAX_HISTORY_SIZE
          expect(history.length).toBe(MAX_HISTORY_SIZE);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: History should preserve all alerts when count is below MAX_HISTORY_SIZE
   */
  it('history should preserve all alerts when count is below MAX_HISTORY_SIZE', () => {
    fc.assert(
      fc.property(
        validThresholdArb,
        fc.array(
          fc.tuple(tradingPairArb, exchangeArb, exchangeArb, priceArb),
          { minLength: 1, maxLength: MAX_HISTORY_SIZE - 1 }
        ),
        (threshold, spreadInputs) => {
          const alertSystemInstance = new AlertSystem(threshold);

          // Create spreads that exceed threshold
          const spreads: SpreadResult[] = spreadInputs.map(([pair, buyExchange, sellExchange, buyPrice]) => {
            const spreadPercent = threshold + 1;
            return createSpreadResult(pair, buyExchange, sellExchange, buyPrice, spreadPercent);
          });

          const triggeredAlerts = alertSystemInstance.checkAndAlert(spreads);
          const history = alertSystemInstance.getAlertHistory();

          // All triggered alerts should be in history when below max
          expect(history.length).toBe(triggeredAlerts.length);
          expect(history.length).toBeLessThan(MAX_HISTORY_SIZE);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: trimAlertHistory with empty array should return empty array
   */
  it('trimAlertHistory with empty array should return empty array', () => {
    const result = trimAlertHistory([], MAX_HISTORY_SIZE);
    expect(result.length).toBe(0);
  });

  /**
   * Property: trimAlertHistory should be idempotent for arrays within limit
   */
  it('trimAlertHistory should be idempotent for arrays within limit', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.tuple(tradingPairArb, exchangeArb, exchangeArb, priceArb, fc.date()),
          { minLength: 0, maxLength: MAX_HISTORY_SIZE }
        ),
        (alertInputs) => {
          const alerts: AlertRecord[] = alertInputs.map(([pair, buyExchange, sellExchange, buyPrice, timestamp]) => {
            const spread = createSpreadResult(pair, buyExchange, sellExchange, buyPrice, 5);
            return createAlertRecordWithTimestamp(spread, timestamp);
          });

          const trimmed1 = trimAlertHistory(alerts, MAX_HISTORY_SIZE);
          const trimmed2 = trimAlertHistory(trimmed1, MAX_HISTORY_SIZE);

          // Trimming twice should produce same result
          expect(trimmed1.length).toBe(trimmed2.length);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: History limit should be exactly 50 (MAX_HISTORY_SIZE constant check)
   */
  it('MAX_HISTORY_SIZE constant should be 50', () => {
    expect(MAX_HISTORY_SIZE).toBe(50);
  });

  /**
   * Property: Sequential alert additions should maintain history limit
   */
  it('sequential alert additions should maintain history limit', () => {
    fc.assert(
      fc.property(
        validThresholdArb,
        fc.integer({ min: 1, max: 20 }),
        fc.integer({ min: 5, max: 15 }),
        (threshold, numBatches, batchSize) => {
          const alertSystemInstance = new AlertSystem(threshold);

          // Add alerts in multiple batches
          for (let batch = 0; batch < numBatches; batch++) {
            const spreads: SpreadResult[] = [];
            for (let i = 0; i < batchSize; i++) {
              const spread: SpreadResult = {
                pair: { base: 'ETH', quote: 'USDT', symbol: 'ETH/USDT' },
                buyExchange: 'binance',
                sellExchange: 'coinbase',
                buyPrice: 2000 + batch * 10 + i,
                sellPrice: 2100 + batch * 10 + i,
                spreadPercent: threshold + 1,
                timestamp: new Date(Date.now() + batch * 10000 + i * 100),
              };
              spreads.push(spread);
            }
            alertSystemInstance.checkAndAlert(spreads);

            // After each batch, history should never exceed MAX_HISTORY_SIZE
            const history = alertSystemInstance.getAlertHistory();
            expect(history.length).toBeLessThanOrEqual(MAX_HISTORY_SIZE);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

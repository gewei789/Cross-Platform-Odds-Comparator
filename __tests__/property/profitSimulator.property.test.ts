import * as fc from 'fast-check';
import { calculateNetProfit, calculateProfit, calculateProfitFromPrices } from '../../src/services/profitSimulator';
import { FeeConfig, SpreadResult, TradingPair, Exchange } from '../../src/types';

/**
 * **Feature: crypto-arbitrage-scanner, Property 10: Profit Calculation Correctness**
 * 
 * *For any* valid inputs (sellAmount, buyAmount, sellFeeRate, buyFeeRate, withdrawalFee, gasFee), 
 * the net profit calculation SHALL equal: 
 * (sellAmount × (1 - sellFeeRate)) - (buyAmount × (1 + buyFeeRate)) - withdrawalFee - gasFee.
 * 
 * **Validates: Requirements 4.4**
 */
describe('Property 10: Profit Calculation Correctness', () => {
  // Arbitrary for fee rates (0 to less than 1, as per validation)
  const feeRateArb = fc.double({
    min: 0,
    max: 0.99,
    noNaN: true,
    noDefaultInfinity: true,
  });

  // Arbitrary for fixed fees (non-negative)
  const fixedFeeArb = fc.double({
    min: 0,
    max: 1000,
    noNaN: true,
    noDefaultInfinity: true,
  });

  // Arbitrary for amounts (positive values representing quote currency amounts)
  const amountArb = fc.double({
    min: 0.01,
    max: 1000000,
    noNaN: true,
    noDefaultInfinity: true,
  });

  // Arbitrary for valid FeeConfig
  const feeConfigArb: fc.Arbitrary<FeeConfig> = fc.record({
    buyFeeRate: feeRateArb,
    sellFeeRate: feeRateArb,
    withdrawalFee: fixedFeeArb,
    gasFee: fixedFeeArb,
  });

  /**
   * Property: Net profit calculation SHALL equal the formula from Requirements 4.4
   * Net Profit = (sellAmount × (1 - sellFeeRate)) - (buyAmount × (1 + buyFeeRate)) - withdrawalFee - gasFee
   */
  it('should calculate net profit correctly using the formula from Requirements 4.4', () => {
    fc.assert(
      fc.property(
        amountArb,
        amountArb,
        feeConfigArb,
        (sellAmount, buyAmount, fees) => {
          // Calculate expected net profit using the formula from requirements 4.4
          const expectedNetProfit = 
            (sellAmount * (1 - fees.sellFeeRate)) - 
            (buyAmount * (1 + fees.buyFeeRate)) - 
            fees.withdrawalFee - 
            fees.gasFee;

          // Calculate actual net profit using the implementation
          const actualNetProfit = calculateNetProfit(sellAmount, buyAmount, fees);

          // Compare with tolerance for floating point precision
          const tolerance = 1e-9;
          const difference = Math.abs(actualNetProfit - expectedNetProfit);

          expect(difference).toBeLessThanOrEqual(tolerance);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Net profit should decrease as buy fee rate increases
   * (all other parameters held constant)
   */
  it('should decrease net profit when buy fee rate increases', () => {
    // Use a constrained fee rate that leaves room for increase
    const constrainedFeeRateArb = fc.double({
      min: 0,
      max: 0.5, // Leave room for increase
      noNaN: true,
      noDefaultInfinity: true,
    });

    // Fee rate increase (must be positive)
    const feeIncreaseArb = fc.double({
      min: 0.01,
      max: 0.1,
      noNaN: true,
      noDefaultInfinity: true,
    });

    fc.assert(
      fc.property(
        amountArb,
        amountArb,
        feeRateArb,
        constrainedFeeRateArb,
        feeIncreaseArb,
        fixedFeeArb,
        fixedFeeArb,
        (sellAmount, buyAmount, sellFeeRate, buyFeeRate1, feeIncrease, withdrawalFee, gasFee) => {
          const buyFeeRate2 = buyFeeRate1 + feeIncrease;

          const fees1: FeeConfig = { buyFeeRate: buyFeeRate1, sellFeeRate, withdrawalFee, gasFee };
          const fees2: FeeConfig = { buyFeeRate: buyFeeRate2, sellFeeRate, withdrawalFee, gasFee };

          const netProfit1 = calculateNetProfit(sellAmount, buyAmount, fees1);
          const netProfit2 = calculateNetProfit(sellAmount, buyAmount, fees2);

          // Higher buy fee rate should result in lower net profit
          expect(netProfit2).toBeLessThan(netProfit1);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Net profit should decrease as sell fee rate increases
   * (all other parameters held constant)
   */
  it('should decrease net profit when sell fee rate increases', () => {
    // Use a constrained fee rate that leaves room for increase
    const constrainedFeeRateArb = fc.double({
      min: 0,
      max: 0.5, // Leave room for increase
      noNaN: true,
      noDefaultInfinity: true,
    });

    // Fee rate increase (must be positive)
    const feeIncreaseArb = fc.double({
      min: 0.01,
      max: 0.1,
      noNaN: true,
      noDefaultInfinity: true,
    });

    fc.assert(
      fc.property(
        amountArb,
        amountArb,
        feeRateArb,
        constrainedFeeRateArb,
        feeIncreaseArb,
        fixedFeeArb,
        fixedFeeArb,
        (sellAmount, buyAmount, buyFeeRate, sellFeeRate1, feeIncrease, withdrawalFee, gasFee) => {
          const sellFeeRate2 = sellFeeRate1 + feeIncrease;

          const fees1: FeeConfig = { buyFeeRate, sellFeeRate: sellFeeRate1, withdrawalFee, gasFee };
          const fees2: FeeConfig = { buyFeeRate, sellFeeRate: sellFeeRate2, withdrawalFee, gasFee };

          const netProfit1 = calculateNetProfit(sellAmount, buyAmount, fees1);
          const netProfit2 = calculateNetProfit(sellAmount, buyAmount, fees2);

          // Higher sell fee rate should result in lower net profit
          expect(netProfit2).toBeLessThan(netProfit1);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Net profit should decrease as withdrawal fee increases
   * (all other parameters held constant)
   */
  it('should decrease net profit when withdrawal fee increases', () => {
    fc.assert(
      fc.property(
        amountArb,
        amountArb,
        feeConfigArb,
        fc.double({ min: 0.01, max: 100, noNaN: true, noDefaultInfinity: true }),
        (sellAmount, buyAmount, baseFees, feeIncrease) => {
          const fees1 = { ...baseFees };
          const fees2 = { ...baseFees, withdrawalFee: baseFees.withdrawalFee + feeIncrease };

          const netProfit1 = calculateNetProfit(sellAmount, buyAmount, fees1);
          const netProfit2 = calculateNetProfit(sellAmount, buyAmount, fees2);

          // Higher withdrawal fee should result in lower net profit
          expect(netProfit2).toBeLessThan(netProfit1);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Net profit should decrease as gas fee increases
   * (all other parameters held constant)
   */
  it('should decrease net profit when gas fee increases', () => {
    fc.assert(
      fc.property(
        amountArb,
        amountArb,
        feeConfigArb,
        fc.double({ min: 0.01, max: 100, noNaN: true, noDefaultInfinity: true }),
        (sellAmount, buyAmount, baseFees, feeIncrease) => {
          const fees1 = { ...baseFees };
          const fees2 = { ...baseFees, gasFee: baseFees.gasFee + feeIncrease };

          const netProfit1 = calculateNetProfit(sellAmount, buyAmount, fees1);
          const netProfit2 = calculateNetProfit(sellAmount, buyAmount, fees2);

          // Higher gas fee should result in lower net profit
          expect(netProfit2).toBeLessThan(netProfit1);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Net profit should increase as sell amount increases
   * (all other parameters held constant)
   */
  it('should increase net profit when sell amount increases', () => {
    fc.assert(
      fc.property(
        amountArb,
        amountArb,
        feeConfigArb,
        fc.double({ min: 0.01, max: 1000, noNaN: true, noDefaultInfinity: true }),
        (sellAmount1, buyAmount, fees, amountIncrease) => {
          const sellAmount2 = sellAmount1 + amountIncrease;

          const netProfit1 = calculateNetProfit(sellAmount1, buyAmount, fees);
          const netProfit2 = calculateNetProfit(sellAmount2, buyAmount, fees);

          // Higher sell amount should result in higher net profit
          expect(netProfit2).toBeGreaterThan(netProfit1);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Net profit should decrease as buy amount increases
   * (all other parameters held constant)
   */
  it('should decrease net profit when buy amount increases', () => {
    fc.assert(
      fc.property(
        amountArb,
        amountArb,
        feeConfigArb,
        fc.double({ min: 0.01, max: 1000, noNaN: true, noDefaultInfinity: true }),
        (sellAmount, buyAmount1, fees, amountIncrease) => {
          const buyAmount2 = buyAmount1 + amountIncrease;

          const netProfit1 = calculateNetProfit(sellAmount, buyAmount1, fees);
          const netProfit2 = calculateNetProfit(sellAmount, buyAmount2, fees);

          // Higher buy amount should result in lower net profit
          expect(netProfit2).toBeLessThan(netProfit1);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: With zero fees, net profit should equal sellAmount - buyAmount
   */
  it('should equal sellAmount - buyAmount when all fees are zero', () => {
    fc.assert(
      fc.property(
        amountArb,
        amountArb,
        (sellAmount, buyAmount) => {
          const zeroFees: FeeConfig = {
            buyFeeRate: 0,
            sellFeeRate: 0,
            withdrawalFee: 0,
            gasFee: 0,
          };

          const netProfit = calculateNetProfit(sellAmount, buyAmount, zeroFees);
          const expectedProfit = sellAmount - buyAmount;

          const tolerance = 1e-9;
          expect(Math.abs(netProfit - expectedProfit)).toBeLessThanOrEqual(tolerance);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Net profit calculation should be deterministic
   * Same inputs should always produce the same output
   */
  it('should be deterministic - same inputs produce same output', () => {
    fc.assert(
      fc.property(
        amountArb,
        amountArb,
        feeConfigArb,
        (sellAmount, buyAmount, fees) => {
          const result1 = calculateNetProfit(sellAmount, buyAmount, fees);
          const result2 = calculateNetProfit(sellAmount, buyAmount, fees);

          expect(result1).toBe(result2);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: The formula components should be additive
   * Removing each fee component should increase profit by that component's value
   */
  it('should have additive fee components', () => {
    fc.assert(
      fc.property(
        amountArb,
        amountArb,
        feeConfigArb,
        (sellAmount, buyAmount, fees) => {
          // Calculate with all fees
          const fullProfit = calculateNetProfit(sellAmount, buyAmount, fees);

          // Calculate without withdrawal fee
          const feesNoWithdrawal = { ...fees, withdrawalFee: 0 };
          const profitNoWithdrawal = calculateNetProfit(sellAmount, buyAmount, feesNoWithdrawal);

          // The difference should equal the withdrawal fee
          const tolerance = 1e-9;
          expect(Math.abs((profitNoWithdrawal - fullProfit) - fees.withdrawalFee)).toBeLessThanOrEqual(tolerance);

          // Calculate without gas fee
          const feesNoGas = { ...fees, gasFee: 0 };
          const profitNoGas = calculateNetProfit(sellAmount, buyAmount, feesNoGas);

          // The difference should equal the gas fee
          expect(Math.abs((profitNoGas - fullProfit) - fees.gasFee)).toBeLessThanOrEqual(tolerance);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Additional tests for calculateProfit function integration
 * These tests verify that the full profit calculation pipeline works correctly
 */
describe('Property 10: Profit Calculation Integration', () => {
  // Arbitrary for Exchange type
  const exchangeArb = fc.constantFrom<Exchange>('binance', 'coinbase', 'kraken');

  // Arbitrary for TradingPair
  const tradingPairArb: fc.Arbitrary<TradingPair> = fc.record({
    base: fc.constantFrom('ETH', 'BTC', 'SOL', 'DOGE', 'XRP'),
    quote: fc.constantFrom('USDT', 'USD', 'EUR'),
  }).map(({ base, quote }) => ({
    base,
    quote,
    symbol: `${base}/${quote}`,
  }));

  // Arbitrary for positive prices
  const positivePriceArb = fc.double({
    min: 0.01,
    max: 100000,
    noNaN: true,
    noDefaultInfinity: true,
  });

  // Arbitrary for trade amount (positive)
  const tradeAmountArb = fc.double({
    min: 0.001,
    max: 1000,
    noNaN: true,
    noDefaultInfinity: true,
  });

  // Arbitrary for fee rates (0 to less than 1)
  const feeRateArb = fc.double({
    min: 0,
    max: 0.99,
    noNaN: true,
    noDefaultInfinity: true,
  });

  // Arbitrary for fixed fees (non-negative)
  const fixedFeeArb = fc.double({
    min: 0,
    max: 100,
    noNaN: true,
    noDefaultInfinity: true,
  });

  // Arbitrary for valid FeeConfig
  const feeConfigArb: fc.Arbitrary<FeeConfig> = fc.record({
    buyFeeRate: feeRateArb,
    sellFeeRate: feeRateArb,
    withdrawalFee: fixedFeeArb,
    gasFee: fixedFeeArb,
  });

  // Arbitrary for SpreadResult
  const spreadResultArb: fc.Arbitrary<SpreadResult> = fc.record({
    pair: tradingPairArb,
    buyExchange: exchangeArb,
    sellExchange: exchangeArb,
    buyPrice: positivePriceArb,
    sellPrice: positivePriceArb,
    spreadPercent: fc.double({ min: -50, max: 100, noNaN: true, noDefaultInfinity: true }),
    timestamp: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-01-01') }),
  });

  /**
   * Property: calculateProfit should use the correct formula for net profit
   * Net Profit = (sellAmount × (1 - sellFeeRate)) - (buyAmount × (1 + buyFeeRate)) - withdrawalFee - gasFee
   */
  it('should calculate profit correctly using the formula from Requirements 4.4', () => {
    fc.assert(
      fc.property(
        spreadResultArb,
        tradeAmountArb,
        feeConfigArb,
        (spread, amount, fees) => {
          // Calculate amounts in quote currency
          const buyAmount = amount * spread.buyPrice;
          const sellAmount = amount * spread.sellPrice;

          // Calculate expected net profit using the formula from requirements 4.4
          const expectedNetProfit = 
            (sellAmount * (1 - fees.sellFeeRate)) - 
            (buyAmount * (1 + fees.buyFeeRate)) - 
            fees.withdrawalFee - 
            fees.gasFee;

          // Calculate actual profit using the implementation
          const result = calculateProfit(spread, amount, fees);

          // Compare with tolerance for floating point precision
          const tolerance = 1e-9;
          const difference = Math.abs(result.netProfit - expectedNetProfit);

          expect(difference).toBeLessThanOrEqual(tolerance);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: isProfitable should be true if and only if netProfit > 0
   */
  it('should set isProfitable correctly based on netProfit', () => {
    fc.assert(
      fc.property(
        spreadResultArb,
        tradeAmountArb,
        feeConfigArb,
        (spread, amount, fees) => {
          const result = calculateProfit(spread, amount, fees);

          // isProfitable should be true iff netProfit > 0
          expect(result.isProfitable).toBe(result.netProfit > 0);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: grossProfit should equal sellAmount - buyAmount (before fees)
   */
  it('should calculate gross profit as sellAmount - buyAmount', () => {
    fc.assert(
      fc.property(
        spreadResultArb,
        tradeAmountArb,
        feeConfigArb,
        (spread, amount, fees) => {
          const buyAmount = amount * spread.buyPrice;
          const sellAmount = amount * spread.sellPrice;
          const expectedGrossProfit = sellAmount - buyAmount;

          const result = calculateProfit(spread, amount, fees);

          const tolerance = 1e-9;
          expect(Math.abs(result.grossProfit - expectedGrossProfit)).toBeLessThanOrEqual(tolerance);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: netProfit should always be less than or equal to grossProfit
   * (fees can only reduce profit, never increase it)
   */
  it('should have netProfit <= grossProfit (fees reduce profit)', () => {
    fc.assert(
      fc.property(
        spreadResultArb,
        tradeAmountArb,
        feeConfigArb,
        (spread, amount, fees) => {
          const result = calculateProfit(spread, amount, fees);

          // Net profit should be less than or equal to gross profit
          // (with some tolerance for floating point)
          const tolerance = 1e-9;
          expect(result.netProfit).toBeLessThanOrEqual(result.grossProfit + tolerance);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: totalFees should be non-negative
   */
  it('should have non-negative totalFees', () => {
    fc.assert(
      fc.property(
        spreadResultArb,
        tradeAmountArb,
        feeConfigArb,
        (spread, amount, fees) => {
          const result = calculateProfit(spread, amount, fees);

          expect(result.totalFees).toBeGreaterThanOrEqual(0);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: calculateProfitFromPrices should produce same result as calculateProfit
   * when given equivalent inputs
   */
  it('should produce consistent results between calculateProfit and calculateProfitFromPrices', () => {
    fc.assert(
      fc.property(
        positivePriceArb,
        positivePriceArb,
        tradeAmountArb,
        feeConfigArb,
        (buyPrice, sellPrice, amount, fees) => {
          // Create a SpreadResult for calculateProfit
          const spread: SpreadResult = {
            pair: { base: 'ETH', quote: 'USDT', symbol: 'ETH/USDT' },
            buyExchange: 'binance',
            sellExchange: 'coinbase',
            buyPrice,
            sellPrice,
            spreadPercent: ((sellPrice - buyPrice) / buyPrice) * 100,
            timestamp: new Date(),
          };

          const result1 = calculateProfit(spread, amount, fees);
          const result2 = calculateProfitFromPrices(buyPrice, sellPrice, amount, fees);

          const tolerance = 1e-9;
          expect(Math.abs(result1.netProfit - result2.netProfit)).toBeLessThanOrEqual(tolerance);
          expect(Math.abs(result1.grossProfit - result2.grossProfit)).toBeLessThanOrEqual(tolerance);
          expect(result1.isProfitable).toBe(result2.isProfitable);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

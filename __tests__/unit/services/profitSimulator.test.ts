import {
  validateTradeAmount,
  validateFeeConfig,
  calculateGrossProfit,
  calculateTotalFees,
  calculateNetProfit,
  calculateProfit,
  calculateProfitFromPrices,
  createDefaultFeeConfig,
  calculateBreakEvenSpread,
  ProfitSimulator,
} from '../../../src/services/profitSimulator';
import { SpreadResult, FeeConfig, TradingPair } from '../../../src/types';

/**
 * Unit tests for Profit Simulator Service
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */
describe('Profit Simulator Service', () => {
  // Helper function to create mock SpreadResult
  const createSpreadResult = (
    buyPrice: number,
    sellPrice: number,
    pair: TradingPair = { base: 'ETH', quote: 'USDT', symbol: 'ETH/USDT' }
  ): SpreadResult => ({
    pair,
    buyExchange: 'binance',
    sellExchange: 'coinbase',
    buyPrice,
    sellPrice,
    spreadPercent: ((sellPrice - buyPrice) / buyPrice) * 100,
    timestamp: new Date('2024-01-15T10:00:00Z'),
  });

  // Helper function to create FeeConfig
  const createFeeConfig = (
    buyFeeRate: number = 0.001,
    sellFeeRate: number = 0.001,
    withdrawalFee: number = 0,
    gasFee: number = 0
  ): FeeConfig => ({
    buyFeeRate,
    sellFeeRate,
    withdrawalFee,
    gasFee,
  });

  describe('validateTradeAmount', () => {
    /**
     * Requirements: 4.1 - Accept and validate numeric value
     */
    it('should accept valid positive trade amount', () => {
      expect(validateTradeAmount(100)).toBe(true);
      expect(validateTradeAmount(0.001)).toBe(true);
      expect(validateTradeAmount(1000000)).toBe(true);
    });

    it('should throw error for zero amount', () => {
      expect(() => validateTradeAmount(0)).toThrow('Trade amount must be greater than 0');
    });

    it('should throw error for negative amount', () => {
      expect(() => validateTradeAmount(-100)).toThrow('Trade amount must be greater than 0');
    });

    it('should throw error for NaN', () => {
      expect(() => validateTradeAmount(NaN)).toThrow('Trade amount must be a valid number');
    });

    it('should throw error for Infinity', () => {
      expect(() => validateTradeAmount(Infinity)).toThrow('Trade amount must be a finite number');
    });
  });

  describe('validateFeeConfig', () => {
    /**
     * Requirements: 4.2, 4.3 - Allow setting buy fee rate, sell fee rate, withdrawal fee, and gas fee
     */
    it('should accept valid fee configuration', () => {
      const fees = createFeeConfig(0.001, 0.001, 5, 10);
      expect(validateFeeConfig(fees)).toBe(true);
    });

    it('should accept zero fees', () => {
      const fees = createFeeConfig(0, 0, 0, 0);
      expect(validateFeeConfig(fees)).toBe(true);
    });

    it('should throw error for negative buy fee rate', () => {
      const fees = createFeeConfig(-0.001, 0.001, 0, 0);
      expect(() => validateFeeConfig(fees)).toThrow('Buy fee rate must be between 0 and 1');
    });

    it('should throw error for buy fee rate >= 1', () => {
      const fees = createFeeConfig(1, 0.001, 0, 0);
      expect(() => validateFeeConfig(fees)).toThrow('Buy fee rate must be between 0 and 1');
    });

    it('should throw error for negative sell fee rate', () => {
      const fees = createFeeConfig(0.001, -0.001, 0, 0);
      expect(() => validateFeeConfig(fees)).toThrow('Sell fee rate must be between 0 and 1');
    });

    it('should throw error for sell fee rate >= 1', () => {
      const fees = createFeeConfig(0.001, 1, 0, 0);
      expect(() => validateFeeConfig(fees)).toThrow('Sell fee rate must be between 0 and 1');
    });

    it('should throw error for negative withdrawal fee', () => {
      const fees = createFeeConfig(0.001, 0.001, -5, 0);
      expect(() => validateFeeConfig(fees)).toThrow('Withdrawal fee must be non-negative');
    });

    it('should throw error for negative gas fee', () => {
      const fees = createFeeConfig(0.001, 0.001, 0, -10);
      expect(() => validateFeeConfig(fees)).toThrow('Gas fee must be non-negative');
    });

    it('should throw error for NaN buy fee rate', () => {
      const fees = createFeeConfig(NaN, 0.001, 0, 0);
      expect(() => validateFeeConfig(fees)).toThrow('Buy fee rate must be a valid number');
    });
  });

  describe('calculateGrossProfit', () => {
    it('should calculate gross profit correctly', () => {
      // Buy 1 ETH at 2500, sell at 2510
      // Gross profit = (1 * 2510) - (1 * 2500) = 10
      expect(calculateGrossProfit(2500, 2510, 1)).toBeCloseTo(10, 5);
    });

    it('should handle larger amounts', () => {
      // Buy 10 ETH at 2500, sell at 2510
      // Gross profit = (10 * 2510) - (10 * 2500) = 100
      expect(calculateGrossProfit(2500, 2510, 10)).toBeCloseTo(100, 5);
    });

    it('should return negative for unprofitable spread', () => {
      // Buy at 2510, sell at 2500
      // Gross profit = (1 * 2500) - (1 * 2510) = -10
      expect(calculateGrossProfit(2510, 2500, 1)).toBeCloseTo(-10, 5);
    });

    it('should return zero for equal prices', () => {
      expect(calculateGrossProfit(2500, 2500, 1)).toBe(0);
    });
  });

  describe('calculateTotalFees', () => {
    /**
     * Requirements: 4.2, 4.3
     */
    it('should calculate total fees correctly', () => {
      const buyAmount = 2500; // 1 ETH at 2500
      const sellAmount = 2510; // 1 ETH at 2510
      const fees = createFeeConfig(0.001, 0.001, 5, 10);

      // Buy fee = 2500 * 0.001 = 2.5
      // Sell fee = 2510 * 0.001 = 2.51
      // Total = 2.5 + 2.51 + 5 + 10 = 20.01
      expect(calculateTotalFees(buyAmount, sellAmount, fees)).toBeCloseTo(20.01, 5);
    });

    it('should return zero for zero fees', () => {
      const fees = createFeeConfig(0, 0, 0, 0);
      expect(calculateTotalFees(2500, 2510, fees)).toBe(0);
    });

    it('should handle only percentage fees', () => {
      const fees = createFeeConfig(0.001, 0.001, 0, 0);
      // Buy fee = 2500 * 0.001 = 2.5
      // Sell fee = 2510 * 0.001 = 2.51
      expect(calculateTotalFees(2500, 2510, fees)).toBeCloseTo(5.01, 5);
    });

    it('should handle only fixed fees', () => {
      const fees = createFeeConfig(0, 0, 5, 10);
      expect(calculateTotalFees(2500, 2510, fees)).toBe(15);
    });
  });

  describe('calculateNetProfit', () => {
    /**
     * Requirements: 4.4 - Net Profit = (Sell Amount × (1 - Sell Fee Rate)) - (Buy Amount × (1 + Buy Fee Rate)) - Withdrawal Fee - Gas Fee
     */
    it('should calculate net profit using the correct formula', () => {
      const sellAmount = 2510;
      const buyAmount = 2500;
      const fees = createFeeConfig(0.001, 0.001, 5, 10);

      // Net Profit = (2510 × (1 - 0.001)) - (2500 × (1 + 0.001)) - 5 - 10
      // = (2510 × 0.999) - (2500 × 1.001) - 15
      // = 2507.49 - 2502.5 - 15
      // = -10.01
      const expected = (2510 * 0.999) - (2500 * 1.001) - 5 - 10;
      expect(calculateNetProfit(sellAmount, buyAmount, fees)).toBeCloseTo(expected, 5);
    });

    it('should return positive for profitable trade with no fees', () => {
      const fees = createFeeConfig(0, 0, 0, 0);
      // Net Profit = 2510 - 2500 = 10
      expect(calculateNetProfit(2510, 2500, fees)).toBeCloseTo(10, 5);
    });

    it('should return negative when fees exceed gross profit', () => {
      const fees = createFeeConfig(0.01, 0.01, 10, 10);
      // Gross profit = 10
      // Fees are much higher
      const netProfit = calculateNetProfit(2510, 2500, fees);
      expect(netProfit).toBeLessThan(0);
    });
  });

  describe('calculateProfit', () => {
    /**
     * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
     */
    it('should return complete ProfitResult with all fields', () => {
      const spread = createSpreadResult(2500, 2510);
      const fees = createFeeConfig(0.001, 0.001, 0, 0);
      const amount = 1;

      const result = calculateProfit(spread, amount, fees);

      expect(result).toHaveProperty('grossProfit');
      expect(result).toHaveProperty('totalFees');
      expect(result).toHaveProperty('netProfit');
      expect(result).toHaveProperty('isProfitable');
    });

    it('should calculate gross profit correctly', () => {
      const spread = createSpreadResult(2500, 2510);
      const fees = createFeeConfig(0, 0, 0, 0);
      const amount = 1;

      const result = calculateProfit(spread, amount, fees);

      // Gross profit = (1 * 2510) - (1 * 2500) = 10
      expect(result.grossProfit).toBeCloseTo(10, 5);
    });

    it('should calculate total fees correctly', () => {
      const spread = createSpreadResult(2500, 2510);
      const fees = createFeeConfig(0.001, 0.001, 5, 10);
      const amount = 1;

      const result = calculateProfit(spread, amount, fees);

      // Buy fee = 2500 * 0.001 = 2.5
      // Sell fee = 2510 * 0.001 = 2.51
      // Total = 2.5 + 2.51 + 5 + 10 = 20.01
      expect(result.totalFees).toBeCloseTo(20.01, 5);
    });

    it('should calculate net profit using the formula from requirements 4.4', () => {
      const spread = createSpreadResult(2500, 2510);
      const fees = createFeeConfig(0.001, 0.001, 5, 10);
      const amount = 1;

      const result = calculateProfit(spread, amount, fees);

      // Net Profit = (Sell × (1 - SellFee)) - (Buy × (1 + BuyFee)) - Withdrawal - Gas
      // = (2510 × 0.999) - (2500 × 1.001) - 5 - 10
      const expected = (2510 * 0.999) - (2500 * 1.001) - 5 - 10;
      expect(result.netProfit).toBeCloseTo(expected, 5);
    });

    it('should set isProfitable to true when net profit is positive', () => {
      const spread = createSpreadResult(2500, 2600); // Large spread
      const fees = createFeeConfig(0.001, 0.001, 0, 0);
      const amount = 1;

      const result = calculateProfit(spread, amount, fees);

      expect(result.netProfit).toBeGreaterThan(0);
      expect(result.isProfitable).toBe(true);
    });

    it('should set isProfitable to false when net profit is negative', () => {
      const spread = createSpreadResult(2500, 2501); // Small spread
      const fees = createFeeConfig(0.01, 0.01, 10, 10); // High fees
      const amount = 1;

      const result = calculateProfit(spread, amount, fees);

      expect(result.netProfit).toBeLessThan(0);
      expect(result.isProfitable).toBe(false);
    });

    it('should set isProfitable to false when net profit is zero', () => {
      // This is a tricky case - we need to find exact break-even
      const spread = createSpreadResult(2500, 2500);
      const fees = createFeeConfig(0, 0, 0, 0);
      const amount = 1;

      const result = calculateProfit(spread, amount, fees);

      expect(result.netProfit).toBe(0);
      expect(result.isProfitable).toBe(false);
    });

    it('should handle larger trade amounts', () => {
      const spread = createSpreadResult(2500, 2510);
      const fees = createFeeConfig(0.001, 0.001, 5, 10);
      const amount = 10;

      const result = calculateProfit(spread, amount, fees);

      // Gross profit = 10 * (2510 - 2500) = 100
      expect(result.grossProfit).toBeCloseTo(100, 5);
    });

    it('should throw error for invalid trade amount', () => {
      const spread = createSpreadResult(2500, 2510);
      const fees = createFeeConfig(0.001, 0.001, 0, 0);

      expect(() => calculateProfit(spread, 0, fees)).toThrow();
      expect(() => calculateProfit(spread, -1, fees)).toThrow();
    });

    it('should throw error for invalid fee config', () => {
      const spread = createSpreadResult(2500, 2510);
      const invalidFees = createFeeConfig(-0.001, 0.001, 0, 0);

      expect(() => calculateProfit(spread, 1, invalidFees)).toThrow();
    });
  });

  describe('calculateProfitFromPrices', () => {
    it('should calculate profit from raw prices', () => {
      const fees = createFeeConfig(0.001, 0.001, 0, 0);
      const result = calculateProfitFromPrices(2500, 2510, 1, fees);

      expect(result.grossProfit).toBeCloseTo(10, 5);
      expect(result).toHaveProperty('totalFees');
      expect(result).toHaveProperty('netProfit');
      expect(result).toHaveProperty('isProfitable');
    });

    it('should throw error for zero buy price', () => {
      const fees = createFeeConfig(0.001, 0.001, 0, 0);
      expect(() => calculateProfitFromPrices(0, 2510, 1, fees)).toThrow('Prices must be greater than 0');
    });

    it('should throw error for zero sell price', () => {
      const fees = createFeeConfig(0.001, 0.001, 0, 0);
      expect(() => calculateProfitFromPrices(2500, 0, 1, fees)).toThrow('Prices must be greater than 0');
    });

    it('should throw error for negative prices', () => {
      const fees = createFeeConfig(0.001, 0.001, 0, 0);
      expect(() => calculateProfitFromPrices(-2500, 2510, 1, fees)).toThrow('Prices must be greater than 0');
    });
  });

  describe('createDefaultFeeConfig', () => {
    it('should return default fee configuration', () => {
      const defaults = createDefaultFeeConfig();

      expect(defaults.buyFeeRate).toBe(0.001);
      expect(defaults.sellFeeRate).toBe(0.001);
      expect(defaults.withdrawalFee).toBe(0);
      expect(defaults.gasFee).toBe(0);
    });
  });

  describe('calculateBreakEvenSpread', () => {
    it('should calculate break-even spread for percentage fees only', () => {
      const fees = createFeeConfig(0.001, 0.001, 0, 0);
      const breakEven = calculateBreakEvenSpread(fees, 2500, 1);

      // Total percentage fees = 0.1% + 0.1% = 0.2%
      expect(breakEven).toBeCloseTo(0.2, 5);
    });

    it('should include fixed fees in break-even calculation', () => {
      const fees = createFeeConfig(0.001, 0.001, 5, 10);
      const breakEven = calculateBreakEvenSpread(fees, 2500, 1);

      // Percentage fees = 0.2%
      // Fixed fees = (5 + 10) / 2500 * 100 = 0.6%
      // Total = 0.8%
      expect(breakEven).toBeCloseTo(0.8, 5);
    });

    it('should scale fixed fees with trade amount', () => {
      const fees = createFeeConfig(0, 0, 15, 0);
      
      // With amount 1, trade value = 2500
      const breakEven1 = calculateBreakEvenSpread(fees, 2500, 1);
      // Fixed fees = 15 / 2500 * 100 = 0.6%
      expect(breakEven1).toBeCloseTo(0.6, 5);

      // With amount 10, trade value = 25000
      const breakEven10 = calculateBreakEvenSpread(fees, 2500, 10);
      // Fixed fees = 15 / 25000 * 100 = 0.06%
      expect(breakEven10).toBeCloseTo(0.06, 5);
    });
  });

  describe('ProfitSimulator class', () => {
    it('should implement IProfitSimulator interface', () => {
      const simulator = new ProfitSimulator();
      const spread = createSpreadResult(2500, 2510);
      const fees = createFeeConfig(0.001, 0.001, 0, 0);

      const result = simulator.calculateProfit(spread, 1, fees);

      expect(result).toHaveProperty('grossProfit');
      expect(result).toHaveProperty('totalFees');
      expect(result).toHaveProperty('netProfit');
      expect(result).toHaveProperty('isProfitable');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle realistic arbitrage scenario', () => {
      // Realistic scenario: ETH price difference between exchanges
      const spread = createSpreadResult(2500, 2512.5); // 0.5% spread
      const fees = createFeeConfig(0.001, 0.001, 5, 15); // 0.1% each + $5 withdrawal + $15 gas
      const amount = 2; // Trading 2 ETH

      const result = calculateProfit(spread, amount, fees);

      // Gross profit = 2 * (2512.5 - 2500) = 25
      expect(result.grossProfit).toBeCloseTo(25, 5);

      // Verify the formula is applied correctly
      const expectedNetProfit = 
        (2 * 2512.5 * 0.999) - (2 * 2500 * 1.001) - 5 - 15;
      expect(result.netProfit).toBeCloseTo(expectedNetProfit, 5);
    });

    it('should correctly identify unprofitable trade due to fees', () => {
      // Small spread that becomes unprofitable after fees
      const spread = createSpreadResult(2500, 2502.5); // 0.1% spread
      const fees = createFeeConfig(0.001, 0.001, 5, 15); // Fees exceed profit
      const amount = 1;

      const result = calculateProfit(spread, amount, fees);

      expect(result.grossProfit).toBeCloseTo(2.5, 5);
      expect(result.netProfit).toBeLessThan(0);
      expect(result.isProfitable).toBe(false);
    });
  });
});

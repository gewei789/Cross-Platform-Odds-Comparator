import {
  calculateSpreadPercent,
  groupByPair,
  generateExchangeCombinations,
  calculateSpread,
  sortBySpread,
  calculateAndSortSpreads,
  filterByMinSpread,
  getBestSpreadForPair,
  getSpreadsByExchange,
  SpreadCalculator,
} from '../../../src/services/spreadCalculator';
import { PriceData, TradingPair, Exchange, SpreadResult } from '../../../src/types';

/**
 * Unit tests for Spread Calculator Service
 * Requirements: 3.1, 3.2, 3.3
 */
describe('Spread Calculator Service', () => {
  // Helper function to create mock PriceData
  const createPriceData = (
    exchange: Exchange,
    price: number,
    pair: TradingPair = { base: 'ETH', quote: 'USDT', symbol: 'ETH/USDT' }
  ): PriceData => ({
    pair,
    exchange,
    price,
    volume24h: 100000,
    bidAskSpread: 0.05,
    timestamp: new Date('2024-01-15T10:00:00Z'),
    isStale: false,
  });

  describe('calculateSpreadPercent', () => {
    it('should calculate spread correctly for positive prices', () => {
      // Spread% = ((sellPrice - buyPrice) / buyPrice) * 100
      // ((110 - 100) / 100) * 100 = 10%
      expect(calculateSpreadPercent(100, 110)).toBeCloseTo(10, 5);
    });

    it('should return 0 when prices are equal', () => {
      expect(calculateSpreadPercent(100, 100)).toBe(0);
    });

    it('should return negative spread when sell price is lower', () => {
      // ((90 - 100) / 100) * 100 = -10%
      expect(calculateSpreadPercent(100, 90)).toBeCloseTo(-10, 5);
    });

    it('should handle small price differences', () => {
      // ((100.5 - 100) / 100) * 100 = 0.5%
      expect(calculateSpreadPercent(100, 100.5)).toBeCloseTo(0.5, 5);
    });

    it('should handle large price differences', () => {
      // ((2000 - 1000) / 1000) * 100 = 100%
      expect(calculateSpreadPercent(1000, 2000)).toBeCloseTo(100, 5);
    });

    it('should throw error for zero buy price', () => {
      expect(() => calculateSpreadPercent(0, 100)).toThrow('Buy price must be greater than 0');
    });

    it('should throw error for negative buy price', () => {
      expect(() => calculateSpreadPercent(-100, 100)).toThrow('Buy price must be greater than 0');
    });
  });

  describe('groupByPair', () => {
    it('should group prices by trading pair symbol', () => {
      const ethPair: TradingPair = { base: 'ETH', quote: 'USDT', symbol: 'ETH/USDT' };
      const btcPair: TradingPair = { base: 'BTC', quote: 'USDT', symbol: 'BTC/USDT' };

      const prices: PriceData[] = [
        createPriceData('binance', 2500, ethPair),
        createPriceData('coinbase', 2510, ethPair),
        createPriceData('binance', 45000, btcPair),
        createPriceData('kraken', 45100, btcPair),
      ];

      const grouped = groupByPair(prices);

      expect(grouped.size).toBe(2);
      expect(grouped.get('ETH/USDT')?.length).toBe(2);
      expect(grouped.get('BTC/USDT')?.length).toBe(2);
    });

    it('should return empty map for empty input', () => {
      const grouped = groupByPair([]);
      expect(grouped.size).toBe(0);
    });

    it('should handle single price data', () => {
      const prices: PriceData[] = [createPriceData('binance', 2500)];
      const grouped = groupByPair(prices);

      expect(grouped.size).toBe(1);
      expect(grouped.get('ETH/USDT')?.length).toBe(1);
    });
  });

  describe('generateExchangeCombinations', () => {
    it('should generate combinations where buy price is lower than sell price', () => {
      const prices: PriceData[] = [
        createPriceData('binance', 2500),
        createPriceData('coinbase', 2510),
        createPriceData('kraken', 2505),
      ];

      const combinations = generateExchangeCombinations(prices);

      // Each combination should have buyPrice < sellPrice
      for (const combo of combinations) {
        expect(combo.buyPrice.price).toBeLessThan(combo.sellPrice.price);
      }
    });

    it('should not include same exchange combinations', () => {
      const prices: PriceData[] = [
        createPriceData('binance', 2500),
        createPriceData('coinbase', 2510),
      ];

      const combinations = generateExchangeCombinations(prices);

      for (const combo of combinations) {
        expect(combo.buyPrice.exchange).not.toBe(combo.sellPrice.exchange);
      }
    });

    it('should return empty array for single price', () => {
      const prices: PriceData[] = [createPriceData('binance', 2500)];
      const combinations = generateExchangeCombinations(prices);
      expect(combinations.length).toBe(0);
    });

    it('should return empty array for equal prices', () => {
      const prices: PriceData[] = [
        createPriceData('binance', 2500),
        createPriceData('coinbase', 2500),
      ];
      const combinations = generateExchangeCombinations(prices);
      expect(combinations.length).toBe(0);
    });
  });

  describe('calculateSpread', () => {
    it('should calculate spreads for all exchange combinations', () => {
      const prices: PriceData[] = [
        createPriceData('binance', 2500),
        createPriceData('coinbase', 2510),
        createPriceData('kraken', 2505),
      ];

      const results = calculateSpread(prices);

      // With 3 exchanges and different prices, we should have combinations
      expect(results.length).toBeGreaterThan(0);

      // Verify spread calculation is correct
      for (const result of results) {
        const expectedSpread = ((result.sellPrice - result.buyPrice) / result.buyPrice) * 100;
        expect(result.spreadPercent).toBeCloseTo(expectedSpread, 5);
      }
    });

    it('should return empty array when less than 2 exchanges', () => {
      const prices: PriceData[] = [createPriceData('binance', 2500)];
      const results = calculateSpread(prices);
      expect(results.length).toBe(0);
    });

    it('should handle multiple trading pairs', () => {
      const ethPair: TradingPair = { base: 'ETH', quote: 'USDT', symbol: 'ETH/USDT' };
      const btcPair: TradingPair = { base: 'BTC', quote: 'USDT', symbol: 'BTC/USDT' };

      const prices: PriceData[] = [
        createPriceData('binance', 2500, ethPair),
        createPriceData('coinbase', 2510, ethPair),
        createPriceData('binance', 45000, btcPair),
        createPriceData('coinbase', 45100, btcPair),
      ];

      const results = calculateSpread(prices);

      // Should have results for both pairs
      const ethResults = results.filter((r) => r.pair.symbol === 'ETH/USDT');
      const btcResults = results.filter((r) => r.pair.symbol === 'BTC/USDT');

      expect(ethResults.length).toBeGreaterThan(0);
      expect(btcResults.length).toBeGreaterThan(0);
    });

    it('should set correct buy and sell exchanges', () => {
      const prices: PriceData[] = [
        createPriceData('binance', 2500), // Lower price - buy here
        createPriceData('coinbase', 2510), // Higher price - sell here
      ];

      const results = calculateSpread(prices);

      expect(results.length).toBe(1);
      expect(results[0].buyExchange).toBe('binance');
      expect(results[0].sellExchange).toBe('coinbase');
      expect(results[0].buyPrice).toBe(2500);
      expect(results[0].sellPrice).toBe(2510);
    });
  });

  describe('sortBySpread', () => {
    it('should sort results by spread in descending order', () => {
      const results: SpreadResult[] = [
        {
          pair: { base: 'ETH', quote: 'USDT', symbol: 'ETH/USDT' },
          buyExchange: 'binance',
          sellExchange: 'coinbase',
          buyPrice: 2500,
          sellPrice: 2510,
          spreadPercent: 0.4,
          timestamp: new Date(),
        },
        {
          pair: { base: 'BTC', quote: 'USDT', symbol: 'BTC/USDT' },
          buyExchange: 'binance',
          sellExchange: 'kraken',
          buyPrice: 45000,
          sellPrice: 45500,
          spreadPercent: 1.11,
          timestamp: new Date(),
        },
        {
          pair: { base: 'ETH', quote: 'USDT', symbol: 'ETH/USDT' },
          buyExchange: 'kraken',
          sellExchange: 'coinbase',
          buyPrice: 2495,
          sellPrice: 2510,
          spreadPercent: 0.6,
          timestamp: new Date(),
        },
      ];

      const sorted = sortBySpread(results);

      // Should be sorted descending
      expect(sorted[0].spreadPercent).toBe(1.11);
      expect(sorted[1].spreadPercent).toBe(0.6);
      expect(sorted[2].spreadPercent).toBe(0.4);
    });

    it('should not mutate the original array', () => {
      const results: SpreadResult[] = [
        {
          pair: { base: 'ETH', quote: 'USDT', symbol: 'ETH/USDT' },
          buyExchange: 'binance',
          sellExchange: 'coinbase',
          buyPrice: 2500,
          sellPrice: 2510,
          spreadPercent: 0.4,
          timestamp: new Date(),
        },
        {
          pair: { base: 'BTC', quote: 'USDT', symbol: 'BTC/USDT' },
          buyExchange: 'binance',
          sellExchange: 'kraken',
          buyPrice: 45000,
          sellPrice: 45500,
          spreadPercent: 1.11,
          timestamp: new Date(),
        },
      ];

      const originalFirst = results[0].spreadPercent;
      sortBySpread(results);

      expect(results[0].spreadPercent).toBe(originalFirst);
    });

    it('should handle empty array', () => {
      const sorted = sortBySpread([]);
      expect(sorted.length).toBe(0);
    });

    it('should handle single element', () => {
      const results: SpreadResult[] = [
        {
          pair: { base: 'ETH', quote: 'USDT', symbol: 'ETH/USDT' },
          buyExchange: 'binance',
          sellExchange: 'coinbase',
          buyPrice: 2500,
          sellPrice: 2510,
          spreadPercent: 0.4,
          timestamp: new Date(),
        },
      ];

      const sorted = sortBySpread(results);
      expect(sorted.length).toBe(1);
      expect(sorted[0].spreadPercent).toBe(0.4);
    });
  });

  describe('calculateAndSortSpreads', () => {
    it('should calculate and sort spreads in one operation', () => {
      const prices: PriceData[] = [
        createPriceData('binance', 2500),
        createPriceData('coinbase', 2510),
        createPriceData('kraken', 2505),
      ];

      const results = calculateAndSortSpreads(prices);

      // Should be sorted descending
      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].spreadPercent).toBeGreaterThanOrEqual(results[i + 1].spreadPercent);
      }
    });
  });

  describe('filterByMinSpread', () => {
    it('should filter results by minimum spread', () => {
      const results: SpreadResult[] = [
        {
          pair: { base: 'ETH', quote: 'USDT', symbol: 'ETH/USDT' },
          buyExchange: 'binance',
          sellExchange: 'coinbase',
          buyPrice: 2500,
          sellPrice: 2510,
          spreadPercent: 0.4,
          timestamp: new Date(),
        },
        {
          pair: { base: 'BTC', quote: 'USDT', symbol: 'BTC/USDT' },
          buyExchange: 'binance',
          sellExchange: 'kraken',
          buyPrice: 45000,
          sellPrice: 45500,
          spreadPercent: 1.11,
          timestamp: new Date(),
        },
      ];

      const filtered = filterByMinSpread(results, 0.5);

      expect(filtered.length).toBe(1);
      expect(filtered[0].spreadPercent).toBe(1.11);
    });

    it('should include results equal to minimum spread', () => {
      const results: SpreadResult[] = [
        {
          pair: { base: 'ETH', quote: 'USDT', symbol: 'ETH/USDT' },
          buyExchange: 'binance',
          sellExchange: 'coinbase',
          buyPrice: 2500,
          sellPrice: 2510,
          spreadPercent: 0.5,
          timestamp: new Date(),
        },
      ];

      const filtered = filterByMinSpread(results, 0.5);
      expect(filtered.length).toBe(1);
    });
  });

  describe('getBestSpreadForPair', () => {
    it('should return the best spread for a specific pair', () => {
      const ethPair: TradingPair = { base: 'ETH', quote: 'USDT', symbol: 'ETH/USDT' };
      const btcPair: TradingPair = { base: 'BTC', quote: 'USDT', symbol: 'BTC/USDT' };

      const results: SpreadResult[] = [
        {
          pair: ethPair,
          buyExchange: 'binance',
          sellExchange: 'coinbase',
          buyPrice: 2500,
          sellPrice: 2510,
          spreadPercent: 0.4,
          timestamp: new Date(),
        },
        {
          pair: ethPair,
          buyExchange: 'kraken',
          sellExchange: 'coinbase',
          buyPrice: 2495,
          sellPrice: 2510,
          spreadPercent: 0.6,
          timestamp: new Date(),
        },
        {
          pair: btcPair,
          buyExchange: 'binance',
          sellExchange: 'kraken',
          buyPrice: 45000,
          sellPrice: 45500,
          spreadPercent: 1.11,
          timestamp: new Date(),
        },
      ];

      const best = getBestSpreadForPair(results, ethPair);

      expect(best).not.toBeNull();
      expect(best?.spreadPercent).toBe(0.6);
      expect(best?.pair.symbol).toBe('ETH/USDT');
    });

    it('should return null if pair not found', () => {
      const results: SpreadResult[] = [];
      const pair: TradingPair = { base: 'ETH', quote: 'USDT', symbol: 'ETH/USDT' };

      const best = getBestSpreadForPair(results, pair);
      expect(best).toBeNull();
    });
  });

  describe('getSpreadsByExchange', () => {
    it('should return spreads involving a specific exchange', () => {
      const results: SpreadResult[] = [
        {
          pair: { base: 'ETH', quote: 'USDT', symbol: 'ETH/USDT' },
          buyExchange: 'binance',
          sellExchange: 'coinbase',
          buyPrice: 2500,
          sellPrice: 2510,
          spreadPercent: 0.4,
          timestamp: new Date(),
        },
        {
          pair: { base: 'ETH', quote: 'USDT', symbol: 'ETH/USDT' },
          buyExchange: 'kraken',
          sellExchange: 'coinbase',
          buyPrice: 2495,
          sellPrice: 2510,
          spreadPercent: 0.6,
          timestamp: new Date(),
        },
        {
          pair: { base: 'BTC', quote: 'USDT', symbol: 'BTC/USDT' },
          buyExchange: 'binance',
          sellExchange: 'kraken',
          buyPrice: 45000,
          sellPrice: 45500,
          spreadPercent: 1.11,
          timestamp: new Date(),
        },
      ];

      const binanceSpreads = getSpreadsByExchange(results, 'binance');
      expect(binanceSpreads.length).toBe(2);

      const coinbaseSpreads = getSpreadsByExchange(results, 'coinbase');
      expect(coinbaseSpreads.length).toBe(2);

      const krakenSpreads = getSpreadsByExchange(results, 'kraken');
      expect(krakenSpreads.length).toBe(2);
    });
  });

  describe('SpreadCalculator class', () => {
    it('should implement ISpreadCalculator interface', () => {
      const calculator = new SpreadCalculator();

      const prices: PriceData[] = [
        createPriceData('binance', 2500),
        createPriceData('coinbase', 2510),
      ];

      const spreads = calculator.calculateSpread(prices);
      expect(spreads.length).toBeGreaterThan(0);

      const sorted = calculator.sortBySpread(spreads);
      expect(sorted.length).toBe(spreads.length);
    });
  });
});

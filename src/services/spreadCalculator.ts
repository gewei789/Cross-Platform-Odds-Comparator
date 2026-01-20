// Spread Calculator Service
// Requirements: 3.1, 3.2, 3.3

import { PriceData, SpreadResult, TradingPair, Exchange } from '../types';

/**
 * Interface for Spread Calculator
 * Requirements: 3.1, 3.2, 3.3
 */
export interface ISpreadCalculator {
  calculateSpread(prices: PriceData[]): SpreadResult[];
  sortBySpread(results: SpreadResult[]): SpreadResult[];
}

/**
 * Calculate spread percentage using the formula:
 * Spread% = ((HighPrice - LowPrice) / LowPrice) * 100
 * 
 * In arbitrage context:
 * - buyPrice is the lower price (where you buy)
 * - sellPrice is the higher price (where you sell)
 * - Spread% = ((sellPrice - buyPrice) / buyPrice) * 100
 * 
 * Requirements: 3.2
 */
export function calculateSpreadPercent(buyPrice: number, sellPrice: number): number {
  if (buyPrice <= 0) {
    throw new Error('Buy price must be greater than 0');
  }
  return ((sellPrice - buyPrice) / buyPrice) * 100;
}

/**
 * Group price data by trading pair
 * Returns a map of pair symbol to array of price data
 */
export function groupByPair(prices: PriceData[]): Map<string, PriceData[]> {
  const grouped = new Map<string, PriceData[]>();
  
  for (const price of prices) {
    const symbol = price.pair.symbol;
    if (!grouped.has(symbol)) {
      grouped.set(symbol, []);
    }
    grouped.get(symbol)!.push(price);
  }
  
  return grouped;
}

/**
 * Generate all exchange pair combinations for spread calculation
 * For each pair of exchanges, we calculate the spread where:
 * - buyExchange has the lower price
 * - sellExchange has the higher price
 * 
 * Requirements: 3.1
 */
export function generateExchangeCombinations(
  pricesForPair: PriceData[]
): { buyPrice: PriceData; sellPrice: PriceData }[] {
  const combinations: { buyPrice: PriceData; sellPrice: PriceData }[] = [];
  
  for (let i = 0; i < pricesForPair.length; i++) {
    for (let j = 0; j < pricesForPair.length; j++) {
      if (i === j) continue;
      
      const price1 = pricesForPair[i];
      const price2 = pricesForPair[j];
      
      if (price1.price < price2.price) {
        combinations.push({
          buyPrice: price1,
          sellPrice: price2,
        });
      }
    }
  }
  
  return combinations;
}

/**
 * Calculate spread for all exchange combinations from price data
 * Requirements: 3.1, 3.2
 */
export function calculateSpread(prices: PriceData[]): SpreadResult[] {
  const results: SpreadResult[] = [];
  const groupedPrices = groupByPair(prices);
  
  for (const [, pricesForPair] of groupedPrices) {
    if (pricesForPair.length < 2) {
      continue;
    }
    
    const pair = pricesForPair[0].pair;
    const combinations = generateExchangeCombinations(pricesForPair);
    
    for (const { buyPrice, sellPrice } of combinations) {
      const spreadPercent = calculateSpreadPercent(buyPrice.price, sellPrice.price);
      
      results.push({
        pair,
        buyExchange: buyPrice.exchange,
        sellExchange: sellPrice.exchange,
        buyPrice: buyPrice.price,
        sellPrice: sellPrice.price,
        spreadPercent,
        timestamp: new Date(Math.max(
          buyPrice.timestamp.getTime(),
          sellPrice.timestamp.getTime()
        )),
      });
    }
  }
  
  return results;
}

/**
 * Sort spread results by spread percentage in descending order
 * Requirements: 3.3
 */
export function sortBySpread(results: SpreadResult[]): SpreadResult[] {
  return [...results].sort((a, b) => b.spreadPercent - a.spreadPercent);
}

/**
 * Calculate and sort spreads in one operation
 * Requirements: 3.1, 3.2, 3.3
 */
export function calculateAndSortSpreads(prices: PriceData[]): SpreadResult[] {
  const spreads = calculateSpread(prices);
  return sortBySpread(spreads);
}

/**
 * Filter spread results by minimum spread percentage
 */
export function filterByMinSpread(
  results: SpreadResult[],
  minSpread: number
): SpreadResult[] {
  return results.filter((result) => result.spreadPercent >= minSpread);
}

/**
 * Get the best spread opportunity for a specific trading pair
 */
export function getBestSpreadForPair(
  results: SpreadResult[],
  pair: TradingPair
): SpreadResult | null {
  const pairResults = results.filter(
    (result) => result.pair.symbol === pair.symbol
  );
  
  if (pairResults.length === 0) {
    return null;
  }
  
  return pairResults.reduce((best, current) =>
    current.spreadPercent > best.spreadPercent ? current : best
  );
}

/**
 * Get spread results for a specific exchange
 */
export function getSpreadsByExchange(
  results: SpreadResult[],
  exchange: Exchange
): SpreadResult[] {
  return results.filter(
    (result) =>
      result.buyExchange === exchange || result.sellExchange === exchange
  );
}

/**
 * SpreadCalculator class implementing ISpreadCalculator interface
 */
export class SpreadCalculator implements ISpreadCalculator {
  calculateSpread(prices: PriceData[]): SpreadResult[] {
    return calculateSpread(prices);
  }
  
  sortBySpread(results: SpreadResult[]): SpreadResult[] {
    return sortBySpread(results);
  }
}

export const spreadCalculator = new SpreadCalculator();

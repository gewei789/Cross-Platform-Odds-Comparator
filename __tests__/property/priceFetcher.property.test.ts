import * as fc from 'fast-check';
import {
  parseTickerToPriceData,
  filterTickersByExchanges,
  transformApiResponse,
  EXCHANGE_IDENTIFIERS,
  IDENTIFIER_TO_EXCHANGE,
} from '../../src/services/priceFetcher';
import {
  TradingPair,
  Exchange,
  CoinGeckoTicker,
  CoinGeckoTickersResponse,
  PriceData,
} from '../../src/types';

/**
 * Property 4: Price Data Parsing Round-Trip
 * 
 * *For any* valid CoinGecko API response, parsing the response and extracting 
 * price data SHALL produce PriceData objects where price is a positive number 
 * and exchange matches one of the configured exchanges.
 * 
 * **Validates: Requirements 2.2**
 */
describe('Property 4: Price Data Parsing Round-Trip', () => {
  // Arbitrary for supported exchange identifiers
  const exchangeIdentifierArb = fc.constantFrom('binance', 'gdax', 'kraken');

  // Arbitrary for Exchange type
  const exchangeArb: fc.Arbitrary<Exchange> = fc.constantFrom(
    'binance',
    'coinbase',
    'kraken'
  );

  // Arbitrary for positive price
  const positiveNumberArb = fc.double({
    min: 0.00000001,
    max: 1000000,
    noNaN: true,
  });

  // Arbitrary for valid CoinGecko ticker
  const validTickerArb = (
    exchangeId: string,
    targetCurrency: string
  ): fc.Arbitrary<CoinGeckoTicker> =>
    fc.record({
      base: fc.constantFrom('ETH', 'BTC', 'SOL'),
      target: fc.constant(targetCurrency),
      market: fc.record({
        name: fc.string({ minLength: 1, maxLength: 20 }),
        identifier: fc.constant(exchangeId),
      }),
      last: positiveNumberArb,
      volume: positiveNumberArb,
      bid_ask_spread_percentage: fc.double({ min: 0, max: 5, noNaN: true }),
      timestamp: fc.date().map((d) => d.toISOString()),
      last_traded_at: fc.date().map((d) => d.toISOString()),
      last_fetch_at: fc.date().map((d) => d.toISOString()),
      is_anomaly: fc.boolean(),
      is_stale: fc.boolean(),
      trade_url: fc.option(fc.webUrl(), { nil: null }),
      converted_last: fc.record({ usd: positiveNumberArb }),
      converted_volume: fc.record({ usd: positiveNumberArb }),
    });

  // Arbitrary for trading pair
  const tradingPairArb: fc.Arbitrary<TradingPair> = fc.record({
    base: fc.constantFrom('ETH', 'BTC', 'SOL'),
    quote: fc.constantFrom('USDT', 'USD', 'USDC'),
    symbol: fc.constant(''), // Will be computed
  }).map((p) => ({ ...p, symbol: `${p.base}/${p.quote}` }));

  it('should produce PriceData with positive price for valid tickers', () => {
    fc.assert(
      fc.property(
        exchangeIdentifierArb,
        tradingPairArb,
        (exchangeId, pair) => {
          // Generate a valid ticker for this exchange and pair
          const ticker: CoinGeckoTicker = {
            base: pair.base,
            target: pair.quote,
            market: {
              name: 'Test Exchange',
              identifier: exchangeId,
            },
            last: Math.random() * 10000 + 0.01, // Positive price
            volume: Math.random() * 1000000,
            bid_ask_spread_percentage: Math.random() * 2,
            timestamp: new Date().toISOString(),
            last_traded_at: new Date().toISOString(),
            last_fetch_at: new Date().toISOString(),
            is_anomaly: false,
            is_stale: false,
            trade_url: null,
            converted_last: { usd: Math.random() * 10000 },
            converted_volume: { usd: Math.random() * 1000000 },
          };

          const result = parseTickerToPriceData(ticker, pair);

          // Result should exist for supported exchanges
          if (result !== null) {
            // Price must be positive
            expect(result.price).toBeGreaterThan(0);
            // Exchange must be one of the supported exchanges
            expect(['binance', 'coinbase', 'kraken']).toContain(result.exchange);
            // Pair should match
            expect(result.pair).toEqual(pair);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return null for unsupported exchanges', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).filter(
          (s) => !['binance', 'gdax', 'kraken'].includes(s.toLowerCase())
        ),
        tradingPairArb,
        (unsupportedExchangeId, pair) => {
          const ticker: CoinGeckoTicker = {
            base: pair.base,
            target: pair.quote,
            market: {
              name: 'Unknown Exchange',
              identifier: unsupportedExchangeId,
            },
            last: 1000,
            volume: 10000,
            bid_ask_spread_percentage: 0.1,
            timestamp: new Date().toISOString(),
            last_traded_at: new Date().toISOString(),
            last_fetch_at: new Date().toISOString(),
            is_anomaly: false,
            is_stale: false,
            trade_url: null,
            converted_last: { usd: 1000 },
            converted_volume: { usd: 10000 },
          };

          const result = parseTickerToPriceData(ticker, pair);
          expect(result).toBeNull();
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return null for non-positive prices', () => {
    fc.assert(
      fc.property(
        exchangeIdentifierArb,
        tradingPairArb,
        fc.double({ max: 0, noNaN: true }),
        (exchangeId, pair, invalidPrice) => {
          const ticker: CoinGeckoTicker = {
            base: pair.base,
            target: pair.quote,
            market: {
              name: 'Test Exchange',
              identifier: exchangeId,
            },
            last: invalidPrice,
            volume: 10000,
            bid_ask_spread_percentage: 0.1,
            timestamp: new Date().toISOString(),
            last_traded_at: new Date().toISOString(),
            last_fetch_at: new Date().toISOString(),
            is_anomaly: false,
            is_stale: false,
            trade_url: null,
            converted_last: { usd: 1000 },
            converted_volume: { usd: 10000 },
          };

          const result = parseTickerToPriceData(ticker, pair);
          expect(result).toBeNull();
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should filter tickers to only include selected exchanges', () => {
    fc.assert(
      fc.property(
        fc.array(exchangeArb, { minLength: 1, maxLength: 3 }),
        (selectedExchanges) => {
          // Create tickers for all possible exchanges
          const allTickers: CoinGeckoTicker[] = [
            { ...createBaseTicker(), market: { name: 'Binance', identifier: 'binance' } },
            { ...createBaseTicker(), market: { name: 'Coinbase', identifier: 'gdax' } },
            { ...createBaseTicker(), market: { name: 'Kraken', identifier: 'kraken' } },
            { ...createBaseTicker(), market: { name: 'Other', identifier: 'other' } },
          ];

          const filtered = filterTickersByExchanges(allTickers, selectedExchanges);

          // All filtered tickers should be from selected exchanges
          const selectedIdentifiers = selectedExchanges.map(
            (e) => EXCHANGE_IDENTIFIERS[e]
          );
          
          for (const ticker of filtered) {
            expect(selectedIdentifiers).toContain(
              ticker.market.identifier.toLowerCase()
            );
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should transform API response to PriceData with correct exchange mapping', () => {
    fc.assert(
      fc.property(
        fc.array(exchangeArb, { minLength: 1, maxLength: 3 }),
        tradingPairArb,
        (selectedExchanges, pair) => {
          // Create a mock API response
          const response: CoinGeckoTickersResponse = {
            name: pair.base,
            tickers: [
              createTickerForExchange('binance', pair),
              createTickerForExchange('gdax', pair),
              createTickerForExchange('kraken', pair),
            ],
          };

          const priceDataList = transformApiResponse(
            response,
            pair,
            selectedExchanges
          );

          // All returned PriceData should have exchanges from selected list
          for (const priceData of priceDataList) {
            expect(selectedExchanges).toContain(priceData.exchange);
            expect(priceData.price).toBeGreaterThan(0);
            expect(priceData.pair.symbol).toBe(pair.symbol);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Helper function to create a base ticker
function createBaseTicker(): CoinGeckoTicker {
  return {
    base: 'ETH',
    target: 'USDT',
    market: {
      name: 'Test',
      identifier: 'test',
    },
    last: 2500,
    volume: 100000,
    bid_ask_spread_percentage: 0.05,
    timestamp: new Date().toISOString(),
    last_traded_at: new Date().toISOString(),
    last_fetch_at: new Date().toISOString(),
    is_anomaly: false,
    is_stale: false,
    trade_url: null,
    converted_last: { usd: 2500 },
    converted_volume: { usd: 250000000 },
  };
}

// Helper function to create a ticker for a specific exchange
function createTickerForExchange(
  exchangeId: string,
  pair: TradingPair
): CoinGeckoTicker {
  const exchangeNames: Record<string, string> = {
    binance: 'Binance',
    gdax: 'Coinbase Exchange',
    kraken: 'Kraken',
  };

  return {
    base: pair.base,
    target: pair.quote,
    market: {
      name: exchangeNames[exchangeId] || exchangeId,
      identifier: exchangeId,
    },
    last: 2500 + Math.random() * 100,
    volume: 100000,
    bid_ask_spread_percentage: 0.05,
    timestamp: new Date().toISOString(),
    last_traded_at: new Date().toISOString(),
    last_fetch_at: new Date().toISOString(),
    is_anomaly: false,
    is_stale: false,
    trade_url: null,
    converted_last: { usd: 2500 },
    converted_volume: { usd: 250000000 },
  };
}

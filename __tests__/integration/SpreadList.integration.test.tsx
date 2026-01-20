/**
 * Integration test for SpreadList component with SpreadCalculator service
 * Verifies that the component correctly displays data from the spread calculator
 */

import { render, screen } from '@testing-library/react';
import { SpreadList } from '../../src/components/scanner/SpreadList';
import { calculateAndSortSpreads } from '../../src/services/spreadCalculator';
import { PriceData, TradingPair, Exchange } from '../../src/types';

describe('SpreadList Integration Tests', () => {
  it('should correctly display spreads calculated by SpreadCalculator service', () => {
    // Create mock price data for ETH/USDT across three exchanges
    const ethUsdtPair: TradingPair = {
      base: 'ETH',
      quote: 'USDT',
      symbol: 'ETH/USDT',
    };

    const priceData: PriceData[] = [
      {
        pair: ethUsdtPair,
        exchange: 'binance' as Exchange,
        price: 2450.00,
        volume24h: 1000000,
        bidAskSpread: 0.01,
        timestamp: new Date('2024-01-15T10:30:00Z'),
        isStale: false,
      },
      {
        pair: ethUsdtPair,
        exchange: 'coinbase' as Exchange,
        price: 2475.00,
        volume24h: 800000,
        bidAskSpread: 0.02,
        timestamp: new Date('2024-01-15T10:30:00Z'),
        isStale: false,
      },
      {
        pair: ethUsdtPair,
        exchange: 'kraken' as Exchange,
        price: 2460.00,
        volume24h: 600000,
        bidAskSpread: 0.015,
        timestamp: new Date('2024-01-15T10:30:00Z'),
        isStale: false,
      },
    ];

    // Calculate spreads using the service
    const spreadResults = calculateAndSortSpreads(priceData);

    // Render the component with calculated spreads
    render(<SpreadList spreadResults={spreadResults} />);

    // Verify the component displays the results
    expect(screen.getByText('Arbitrage Opportunities')).toBeInTheDocument();
    
    // Should show multiple opportunities (3 exchanges = 6 combinations, but only 3 with positive spreads)
    expect(screen.getByText(/opportunities found/)).toBeInTheDocument();

    // Verify exchange names are displayed
    expect(screen.getAllByText('Binance').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Coinbase').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Kraken').length).toBeGreaterThan(0);

    // Verify the highest spread is displayed first (Binance -> Coinbase: 1.02%)
    const spreadElements = screen.getAllByTestId('spread-percent');
    expect(spreadElements[0]).toHaveTextContent('+1.020%'); // (2475-2450)/2450 * 100 = 1.02%
  });

  it('should handle empty price data gracefully', () => {
    const spreadResults = calculateAndSortSpreads([]);
    
    render(<SpreadList spreadResults={spreadResults} />);
    
    expect(screen.getByText('No spread data available')).toBeInTheDocument();
  });

  it('should handle single exchange (no spreads possible)', () => {
    const ethUsdtPair: TradingPair = {
      base: 'ETH',
      quote: 'USDT',
      symbol: 'ETH/USDT',
    };

    const priceData: PriceData[] = [
      {
        pair: ethUsdtPair,
        exchange: 'binance' as Exchange,
        price: 2450.00,
        volume24h: 1000000,
        bidAskSpread: 0.01,
        timestamp: new Date('2024-01-15T10:30:00Z'),
        isStale: false,
      },
    ];

    const spreadResults = calculateAndSortSpreads(priceData);
    
    render(<SpreadList spreadResults={spreadResults} />);
    
    // Should show empty state since no spreads can be calculated with one exchange
    expect(screen.getByText('No spread data available')).toBeInTheDocument();
  });

  it('should display multiple trading pairs correctly', () => {
    const ethUsdtPair: TradingPair = {
      base: 'ETH',
      quote: 'USDT',
      symbol: 'ETH/USDT',
    };

    const btcUsdPair: TradingPair = {
      base: 'BTC',
      quote: 'USD',
      symbol: 'BTC/USD',
    };

    const priceData: PriceData[] = [
      // ETH/USDT prices
      {
        pair: ethUsdtPair,
        exchange: 'binance' as Exchange,
        price: 2450.00,
        volume24h: 1000000,
        bidAskSpread: 0.01,
        timestamp: new Date('2024-01-15T10:30:00Z'),
        isStale: false,
      },
      {
        pair: ethUsdtPair,
        exchange: 'coinbase' as Exchange,
        price: 2475.00,
        volume24h: 800000,
        bidAskSpread: 0.02,
        timestamp: new Date('2024-01-15T10:30:00Z'),
        isStale: false,
      },
      // BTC/USD prices
      {
        pair: btcUsdPair,
        exchange: 'binance' as Exchange,
        price: 45000.00,
        volume24h: 2000000,
        bidAskSpread: 0.01,
        timestamp: new Date('2024-01-15T10:30:00Z'),
        isStale: false,
      },
      {
        pair: btcUsdPair,
        exchange: 'kraken' as Exchange,
        price: 45200.00,
        volume24h: 1500000,
        bidAskSpread: 0.015,
        timestamp: new Date('2024-01-15T10:30:00Z'),
        isStale: false,
      },
    ];

    const spreadResults = calculateAndSortSpreads(priceData);
    
    render(<SpreadList spreadResults={spreadResults} />);

    // Both trading pairs should be displayed
    expect(screen.getByText('ETH/USDT')).toBeInTheDocument();
    expect(screen.getByText('BTC/USD')).toBeInTheDocument();
  });
});

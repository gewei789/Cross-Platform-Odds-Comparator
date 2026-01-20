import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  PriceTable,
  formatPrice,
  formatVolume,
  formatTimestamp,
  formatRelativeTime,
  API_CALLS_WARNING_THRESHOLD,
  API_CALLS_TOTAL,
  EXCHANGE_DISPLAY_NAMES,
} from '../../../src/components/scanner/PriceTable';
import { PriceData, TradingPair, Exchange } from '../../../src/types';

/**
 * Unit tests for PriceTable component
 * Requirements: 2.4, 2.5
 */
describe('PriceTable', () => {
  // Helper to create mock price data
  const createMockPriceData = (
    overrides: Partial<PriceData> = {}
  ): PriceData => ({
    pair: { base: 'ETH', quote: 'USDT', symbol: 'ETH/USDT' },
    exchange: 'binance',
    price: 2456.78,
    volume24h: 123456789,
    bidAskSpread: 0.01,
    timestamp: new Date(),
    isStale: false,
    ...overrides,
  });

  // Default props for testing
  const defaultProps = {
    priceData: [] as PriceData[],
    remainingCalls: 9500,
    lastUpdateTime: new Date(),
  };

  describe('Helper Functions', () => {
    describe('formatPrice', () => {
      it('should format large prices with 2 decimal places', () => {
        expect(formatPrice(2456.78)).toBe('2,456.78');
        expect(formatPrice(10000)).toBe('10,000.00');
      });

      it('should format medium prices with 4 decimal places', () => {
        expect(formatPrice(1.2345)).toBe('1.2345');
        expect(formatPrice(999.9999)).toBe('999.9999');
      });

      it('should format small prices with up to 8 decimal places', () => {
        expect(formatPrice(0.00001234)).toBe('0.00001234');
        expect(formatPrice(0.5)).toMatch(/0\.5/);
      });
    });

    describe('formatVolume', () => {
      it('should format billions with B suffix', () => {
        expect(formatVolume(1500000000)).toBe('1.50B');
      });

      it('should format millions with M suffix', () => {
        expect(formatVolume(1500000)).toBe('1.50M');
      });

      it('should format thousands with K suffix', () => {
        expect(formatVolume(1500)).toBe('1.50K');
      });

      it('should format small numbers without suffix', () => {
        expect(formatVolume(500)).toBe('500.00');
      });
    });

    describe('formatTimestamp', () => {
      it('should format time in HH:MM:SS format', () => {
        const date = new Date('2024-01-15T10:30:45');
        const result = formatTimestamp(date);
        expect(result).toMatch(/\d{1,2}:\d{2}:\d{2}/);
      });
    });

    describe('formatRelativeTime', () => {
      it('should show seconds for recent times', () => {
        const now = new Date();
        const thirtySecondsAgo = new Date(now.getTime() - 30000);
        expect(formatRelativeTime(thirtySecondsAgo)).toBe('30s ago');
      });

      it('should show minutes for older times', () => {
        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
        expect(formatRelativeTime(fiveMinutesAgo)).toBe('5m ago');
      });

      it('should show timestamp for very old times', () => {
        const now = new Date();
        const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
        const result = formatRelativeTime(twoHoursAgo);
        expect(result).toMatch(/\d{1,2}:\d{2}:\d{2}/);
      });
    });
  });

  describe('Component Rendering', () => {
    it('should render the component with title', () => {
      render(<PriceTable {...defaultProps} />);
      expect(screen.getByText('Exchange Prices')).toBeInTheDocument();
    });

    it('should show "No price data available" when empty', () => {
      render(<PriceTable {...defaultProps} priceData={[]} />);
      expect(screen.getByText('No price data available.')).toBeInTheDocument();
    });

    it('should render table headers', () => {
      const priceData = [createMockPriceData()];
      render(<PriceTable {...defaultProps} priceData={priceData} />);

      expect(screen.getByText('Pair')).toBeInTheDocument();
      expect(screen.getByText('Exchange')).toBeInTheDocument();
      expect(screen.getByText('Price')).toBeInTheDocument();
      expect(screen.getByText('24h Volume')).toBeInTheDocument();
      expect(screen.getByText('Spread')).toBeInTheDocument();
      expect(screen.getByText('Updated')).toBeInTheDocument();
    });

    it('should display price data in table rows', () => {
      const priceData = [
        createMockPriceData({
          exchange: 'binance',
          price: 2456.78,
        }),
      ];
      render(<PriceTable {...defaultProps} priceData={priceData} />);

      expect(screen.getByText('ETH/USDT')).toBeInTheDocument();
      expect(screen.getByText('Binance')).toBeInTheDocument();
      expect(screen.getByText('$2,456.78')).toBeInTheDocument();
    });

    it('should display multiple exchanges for same pair', () => {
      const priceData = [
        createMockPriceData({ exchange: 'binance', price: 2456.78 }),
        createMockPriceData({ exchange: 'coinbase', price: 2458.50 }),
        createMockPriceData({ exchange: 'kraken', price: 2455.00 }),
      ];
      render(<PriceTable {...defaultProps} priceData={priceData} />);

      expect(screen.getByText('Binance')).toBeInTheDocument();
      expect(screen.getByText('Coinbase')).toBeInTheDocument();
      expect(screen.getByText('Kraken')).toBeInTheDocument();
    });
  });

  describe('Last Update Time Display - Requirements: 2.4', () => {
    it('should display last update time', () => {
      const lastUpdateTime = new Date();
      render(<PriceTable {...defaultProps} lastUpdateTime={lastUpdateTime} />);

      expect(screen.getByText('Last update:')).toBeInTheDocument();
    });

    it('should show "Never" when lastUpdateTime is null', () => {
      render(<PriceTable {...defaultProps} lastUpdateTime={null} />);
      expect(screen.getByText('Never')).toBeInTheDocument();
    });

    it('should show "Updating..." when loading', () => {
      render(<PriceTable {...defaultProps} isLoading={true} />);
      expect(screen.getByText('Updating...')).toBeInTheDocument();
    });
  });

  describe('Remaining API Calls Display - Requirements: 2.4, 2.5', () => {
    it('should display remaining API calls', () => {
      render(<PriceTable {...defaultProps} remainingCalls={9500} />);

      expect(screen.getByText('API calls:')).toBeInTheDocument();
      expect(screen.getByText('9,500 remaining')).toBeInTheDocument();
    });

    it('should show green color when calls are healthy', () => {
      render(<PriceTable {...defaultProps} remainingCalls={9500} />);

      const remainingText = screen.getByText('9,500 remaining');
      expect(remainingText).toHaveClass('text-green-600');
    });

    it('should show yellow color when calls are moderate', () => {
      render(<PriceTable {...defaultProps} remainingCalls={2500} />);

      const remainingText = screen.getByText('2,500 remaining');
      expect(remainingText).toHaveClass('text-yellow-600');
    });

    it('should show red color when approaching limit', () => {
      render(<PriceTable {...defaultProps} remainingCalls={500} />);

      const remainingText = screen.getByText('500 remaining');
      expect(remainingText).toHaveClass('text-red-600');
    });
  });

  describe('API Limit Warning - Requirements: 2.5', () => {
    it('should show warning when API calls exceed 9000', () => {
      // remainingCalls = 500 means usedCalls = 9500 (> 9000)
      render(<PriceTable {...defaultProps} remainingCalls={500} />);

      expect(screen.getByText('API call limit approaching!')).toBeInTheDocument();
      expect(
        screen.getByText(/Consider reducing the refresh frequency/)
      ).toBeInTheDocument();
    });

    it('should not show warning when API calls are below threshold', () => {
      render(<PriceTable {...defaultProps} remainingCalls={5000} />);

      expect(screen.queryByText('API call limit approaching!')).not.toBeInTheDocument();
    });

    it('should show exact usage in warning message', () => {
      render(<PriceTable {...defaultProps} remainingCalls={500} />);

      expect(
        screen.getByText(/You have used 9,500 of 10,000 monthly API calls/)
      ).toBeInTheDocument();
    });
  });

  describe('Stale Data Highlighting', () => {
    it('should highlight stale data with yellow background', () => {
      const priceData = [
        createMockPriceData({ isStale: true }),
      ];
      render(<PriceTable {...defaultProps} priceData={priceData} />);

      // Check for "Stale" badge
      expect(screen.getByText('Stale')).toBeInTheDocument();
    });

    it('should not show stale badge for fresh data', () => {
      const priceData = [
        createMockPriceData({ isStale: false }),
      ];
      render(<PriceTable {...defaultProps} priceData={priceData} />);

      expect(screen.queryByText('Stale')).not.toBeInTheDocument();
    });
  });

  describe('Error Display', () => {
    it('should display error message when provided', () => {
      render(
        <PriceTable
          {...defaultProps}
          error="Network error. Please check your connection."
        />
      );

      expect(
        screen.getByText('Network error. Please check your connection.')
      ).toBeInTheDocument();
    });

    it('should not display error section when no error', () => {
      render(<PriceTable {...defaultProps} error={null} />);

      // Error section should not be present
      const alerts = screen.queryAllByRole('alert');
      // Only API warning might be present, not error
      expect(
        alerts.every(
          (alert) => !alert.textContent?.includes('Network error')
        )
      ).toBe(true);
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner when loading with no data', () => {
      render(<PriceTable {...defaultProps} isLoading={true} priceData={[]} />);

      expect(screen.getByText('Fetching prices...')).toBeInTheDocument();
    });

    it('should not show loading spinner when data is present', () => {
      const priceData = [createMockPriceData()];
      render(<PriceTable {...defaultProps} isLoading={true} priceData={priceData} />);

      expect(screen.queryByText('Fetching prices...')).not.toBeInTheDocument();
    });
  });

  describe('Volume Formatting', () => {
    it('should format volume with appropriate suffix', () => {
      const priceData = [
        createMockPriceData({ volume24h: 123456789 }),
      ];
      render(<PriceTable {...defaultProps} priceData={priceData} />);

      expect(screen.getByText('$123.46M')).toBeInTheDocument();
    });
  });

  describe('Bid-Ask Spread Display', () => {
    it('should display bid-ask spread percentage', () => {
      const priceData = [
        createMockPriceData({ bidAskSpread: 0.015 }),
      ];
      render(<PriceTable {...defaultProps} priceData={priceData} />);

      expect(screen.getByText('0.015%')).toBeInTheDocument();
    });
  });

  describe('Multiple Trading Pairs', () => {
    it('should group prices by trading pair', () => {
      const priceData = [
        createMockPriceData({
          pair: { base: 'ETH', quote: 'USDT', symbol: 'ETH/USDT' },
          exchange: 'binance',
        }),
        createMockPriceData({
          pair: { base: 'ETH', quote: 'USDT', symbol: 'ETH/USDT' },
          exchange: 'coinbase',
        }),
        createMockPriceData({
          pair: { base: 'BTC', quote: 'USD', symbol: 'BTC/USD' },
          exchange: 'binance',
        }),
      ];
      render(<PriceTable {...defaultProps} priceData={priceData} />);

      expect(screen.getByText('ETH/USDT')).toBeInTheDocument();
      expect(screen.getByText('BTC/USD')).toBeInTheDocument();
    });
  });

  describe('Exchange Display Names', () => {
    it('should have correct display names for all exchanges', () => {
      expect(EXCHANGE_DISPLAY_NAMES.binance).toBe('Binance');
      expect(EXCHANGE_DISPLAY_NAMES.coinbase).toBe('Coinbase');
      expect(EXCHANGE_DISPLAY_NAMES.kraken).toBe('Kraken');
    });
  });

  describe('Constants', () => {
    it('should have correct API call thresholds', () => {
      expect(API_CALLS_WARNING_THRESHOLD).toBe(9000);
      expect(API_CALLS_TOTAL).toBe(10000);
    });
  });

  describe('Accessibility', () => {
    it('should have role="alert" on warning messages', () => {
      render(<PriceTable {...defaultProps} remainingCalls={500} />);

      const alerts = screen.getAllByRole('alert');
      expect(alerts.length).toBeGreaterThan(0);
    });

    it('should have role="alert" on error messages', () => {
      render(<PriceTable {...defaultProps} error="Test error" />);

      const alerts = screen.getAllByRole('alert');
      expect(alerts.some((alert) => alert.textContent?.includes('Test error'))).toBe(
        true
      );
    });
  });
});

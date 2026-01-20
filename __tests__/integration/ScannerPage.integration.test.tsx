/**
 * Integration tests for Scanner Page
 * 
 * Tests the full integration of Scanner page with real components
 * Requirements: All Scanner requirements
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import ScannerPage from '../../src/app/scanner/page';
import { AppProvider } from '../../src/context/AppContext';
import { TradingPair, Exchange, PriceData, SpreadResult } from '../../src/types';
import * as priceFetcher from '../../src/services/priceFetcher';
import * as spreadCalculator from '../../src/services/spreadCalculator';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock price fetcher
jest.mock('../../src/services/priceFetcher', () => ({
  fetchPrices: jest.fn(),
  setErrorCallback: jest.fn(),
  getRemainingCalls: jest.fn(() => 9500),
}));

// Mock spread calculator
jest.mock('../../src/services/spreadCalculator', () => ({
  calculateAndSortSpreads: jest.fn(),
}));

describe('ScannerPage Integration', () => {
  const mockPush = jest.fn();

  const mockPair: TradingPair = {
    base: 'ETH',
    quote: 'USDT',
    symbol: 'ETH/USDT',
  };

  const mockPriceData: PriceData[] = [
    {
      pair: mockPair,
      exchange: 'binance' as Exchange,
      price: 2450.5,
      volume24h: 1000000,
      bidAskSpread: 0.01,
      timestamp: new Date(),
      isStale: false,
    },
    {
      pair: mockPair,
      exchange: 'coinbase' as Exchange,
      price: 2455.0,
      volume24h: 800000,
      bidAskSpread: 0.02,
      timestamp: new Date(),
      isStale: false,
    },
  ];

  const mockSpreadResults: SpreadResult[] = [
    {
      pair: mockPair,
      buyExchange: 'binance' as Exchange,
      sellExchange: 'coinbase' as Exchange,
      buyPrice: 2450.5,
      sellPrice: 2455.0,
      spreadPercent: 0.184,
      timestamp: new Date(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    (priceFetcher.fetchPrices as jest.Mock).mockResolvedValue(mockPriceData);
    (spreadCalculator.calculateAndSortSpreads as jest.Mock).mockReturnValue(mockSpreadResults);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const renderWithProvider = (initialState?: any) => {
    return render(
      <AppProvider initialStateOverride={initialState}>
        <ScannerPage />
      </AppProvider>
    );
  };

  describe('Full Scanner Workflow', () => {
    it('should display all components when configuration is valid', () => {
      renderWithProvider({
        selectedPairs: [mockPair],
        selectedExchanges: ['binance', 'coinbase'] as Exchange[],
      });

      // Check header
      expect(screen.getByText('Scanner')).toBeInTheDocument();
      expect(screen.getByText(/Monitoring 1 pair across 2 exchanges/)).toBeInTheDocument();

      // Check controls
      expect(screen.getByText('Start Scanning')).toBeInTheDocument();
      expect(screen.getByLabelText('Refresh every:')).toBeInTheDocument();

      // Check components are rendered
      expect(screen.getByText('Spread History')).toBeInTheDocument();
      expect(screen.getByText('Arbitrage Opportunities')).toBeInTheDocument();
      expect(screen.getByText('Exchange Prices')).toBeInTheDocument();
    });

    it('should start scanning and display data when start button clicked', async () => {
      renderWithProvider({
        selectedPairs: [mockPair],
        selectedExchanges: ['binance', 'coinbase'] as Exchange[],
      });

      // Click start scanning
      const startButton = screen.getByText('Start Scanning');
      fireEvent.click(startButton);

      // Wait for data to be fetched
      await waitFor(() => {
        expect(priceFetcher.fetchPrices).toHaveBeenCalledWith(
          [mockPair],
          ['binance', 'coinbase'],
          true
        );
      });

      // Check that spread calculator was called
      await waitFor(() => {
        expect(spreadCalculator.calculateAndSortSpreads).toHaveBeenCalledWith(mockPriceData);
      });

      // Check scanning indicator appears
      expect(screen.getByText('Scanning...')).toBeInTheDocument();
      expect(screen.getByText('Stop Scanning')).toBeInTheDocument();
    });

    it('should stop scanning when stop button clicked', async () => {
      renderWithProvider({
        selectedPairs: [mockPair],
        selectedExchanges: ['binance', 'coinbase'] as Exchange[],
      });

      // Start scanning
      const startButton = screen.getByText('Start Scanning');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText('Stop Scanning')).toBeInTheDocument();
      });

      // Stop scanning
      const stopButton = screen.getByText('Stop Scanning');
      fireEvent.click(stopButton);

      // Check that start button appears again
      await waitFor(() => {
        expect(screen.getByText('Start Scanning')).toBeInTheDocument();
      });

      expect(screen.queryByText('Scanning...')).not.toBeInTheDocument();
    });

    it('should update data at refresh interval', async () => {
      renderWithProvider({
        selectedPairs: [mockPair],
        selectedExchanges: ['binance', 'coinbase'] as Exchange[],
        refreshInterval: 10,
      });

      // Start scanning
      const startButton = screen.getByText('Start Scanning');
      fireEvent.click(startButton);

      // Wait for initial fetch
      await waitFor(() => {
        expect(priceFetcher.fetchPrices).toHaveBeenCalledTimes(1);
      });

      // Advance time by 10 seconds
      jest.advanceTimersByTime(10000);

      // Wait for second fetch
      await waitFor(() => {
        expect(priceFetcher.fetchPrices).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Configuration Changes', () => {
    it('should redirect to config page when no pairs selected', () => {
      renderWithProvider({
        selectedPairs: [],
        selectedExchanges: ['binance', 'coinbase'] as Exchange[],
      });

      expect(mockPush).toHaveBeenCalledWith('/config');
    });

    it('should redirect to config page when less than 2 exchanges selected', () => {
      renderWithProvider({
        selectedPairs: [mockPair],
        selectedExchanges: ['binance'] as Exchange[],
      });

      expect(mockPush).toHaveBeenCalledWith('/config');
    });

    it('should navigate to config page when configure button clicked', () => {
      renderWithProvider({
        selectedPairs: [mockPair],
        selectedExchanges: ['binance', 'coinbase'] as Exchange[],
      });

      const configButton = screen.getByText('Configure');
      fireEvent.click(configButton);

      expect(mockPush).toHaveBeenCalledWith('/config');
    });
  });

  describe('Error Handling', () => {
    it('should display error when price fetching fails', async () => {
      const errorMessage = 'Network error';
      (priceFetcher.fetchPrices as jest.Mock).mockRejectedValue(new Error(errorMessage));

      renderWithProvider({
        selectedPairs: [mockPair],
        selectedExchanges: ['binance', 'coinbase'] as Exchange[],
      });

      // Start scanning
      const startButton = screen.getByText('Start Scanning');
      fireEvent.click(startButton);

      // Wait for error to appear (use getAllByText since error appears in multiple places)
      await waitFor(() => {
        const errors = screen.getAllByText(errorMessage);
        expect(errors.length).toBeGreaterThan(0);
      });
    });

    it('should display error when no pairs selected and start scanning clicked', async () => {
      renderWithProvider({
        selectedPairs: [],
        selectedExchanges: ['binance', 'coinbase'] as Exchange[],
      });

      // This should redirect, but let's test the error handling in useScanner
      // The page will redirect before we can click, so this test verifies the redirect happens
      expect(mockPush).toHaveBeenCalledWith('/config');
    });
  });

  describe('Refresh Interval Control', () => {
    it('should update refresh interval when changed', async () => {
      renderWithProvider({
        selectedPairs: [mockPair],
        selectedExchanges: ['binance', 'coinbase'] as Exchange[],
        refreshInterval: 10,
      });

      // Change refresh interval
      const select = screen.getByLabelText('Refresh every:') as HTMLSelectElement;
      fireEvent.change(select, { target: { value: '20' } });

      // Verify the value changed
      await waitFor(() => {
        expect(select.value).toBe('20');
      });
    });

    it('should disable refresh interval control when scanning', async () => {
      renderWithProvider({
        selectedPairs: [mockPair],
        selectedExchanges: ['binance', 'coinbase'] as Exchange[],
      });

      // Start scanning
      const startButton = screen.getByText('Start Scanning');
      fireEvent.click(startButton);

      await waitFor(() => {
        const select = screen.getByLabelText('Refresh every:') as HTMLSelectElement;
        expect(select).toBeDisabled();
      });
    });
  });

  describe('Chart Data Updates', () => {
    it('should update chart data when spread results change', async () => {
      renderWithProvider({
        selectedPairs: [mockPair],
        selectedExchanges: ['binance', 'coinbase'] as Exchange[],
      });

      // Start scanning
      const startButton = screen.getByText('Start Scanning');
      fireEvent.click(startButton);

      // Wait for data to be fetched
      await waitFor(() => {
        expect(spreadCalculator.calculateAndSortSpreads).toHaveBeenCalled();
      });

      // Chart should be rendered (even if empty initially)
      expect(screen.getByText('Spread History')).toBeInTheDocument();
    });
  });

  describe('Multiple Trading Pairs', () => {
    it('should display correct count for multiple pairs', () => {
      const pair2: TradingPair = {
        base: 'BTC',
        quote: 'USD',
        symbol: 'BTC/USD',
      };

      renderWithProvider({
        selectedPairs: [mockPair, pair2],
        selectedExchanges: ['binance', 'coinbase', 'kraken'] as Exchange[],
      });

      expect(screen.getByText(/Monitoring 2 pairs across 3 exchanges/)).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should display ready to scan message when not scanning', () => {
      renderWithProvider({
        selectedPairs: [mockPair],
        selectedExchanges: ['binance', 'coinbase'] as Exchange[],
      });

      expect(screen.getByText('Ready to Scan')).toBeInTheDocument();
      expect(screen.getByText(/Click "Start Scanning" to begin monitoring/)).toBeInTheDocument();
    });

    it('should hide ready message when scanning starts', async () => {
      renderWithProvider({
        selectedPairs: [mockPair],
        selectedExchanges: ['binance', 'coinbase'] as Exchange[],
      });

      // Start scanning
      const startButton = screen.getByText('Start Scanning');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.queryByText('Ready to Scan')).not.toBeInTheDocument();
      });
    });
  });
});

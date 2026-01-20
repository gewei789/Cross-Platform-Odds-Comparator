/**
 * Unit tests for Scanner Page
 * 
 * Tests the integration of PriceTable, SpreadList, and SpreadChart components
 * Requirements: All Scanner requirements
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import ScannerPage from '../../../src/app/scanner/page';
import { useScanner } from '../../../src/hooks/useScanner';
import { useAppContext } from '../../../src/context/AppContext';
import { PriceData, SpreadResult, TradingPair, Exchange } from '../../../src/types';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock useScanner hook
jest.mock('../../../src/hooks/useScanner', () => ({
  useScanner: jest.fn(),
}));

// Mock useAppContext hook
jest.mock('../../../src/context/AppContext', () => ({
  useAppContext: jest.fn(),
}));

// Mock child components
jest.mock('../../../src/components/scanner/PriceTable', () => ({
  PriceTable: ({ priceData, isLoading }: any) => (
    <div data-testid="price-table">
      {isLoading ? 'Loading...' : `${priceData.length} prices`}
    </div>
  ),
}));

jest.mock('../../../src/components/scanner/SpreadList', () => ({
  SpreadList: ({ spreadResults }: any) => (
    <div data-testid="spread-list">
      {spreadResults.length} spreads
    </div>
  ),
}));

jest.mock('../../../src/components/scanner/SpreadChart', () => ({
  SpreadChart: ({ dataPoints, timeRange }: any) => (
    <div data-testid="spread-chart">
      Chart: {dataPoints.length} points, {timeRange}min
    </div>
  ),
}));

describe('ScannerPage', () => {
  const mockPush = jest.fn();
  const mockStartScanning = jest.fn();
  const mockStopScanning = jest.fn();
  const mockSetRefreshInterval = jest.fn();

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

    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    (useScanner as jest.Mock).mockReturnValue({
      startScanning: mockStartScanning,
      stopScanning: mockStopScanning,
      isScanning: false,
      priceData: [],
      spreadResults: [],
      lastUpdateTime: null,
      error: null,
      refreshInterval: 10,
      setRefreshInterval: mockSetRefreshInterval,
    });

    (useAppContext as jest.Mock).mockReturnValue({
      state: {
        selectedPairs: [mockPair],
        selectedExchanges: ['binance', 'coinbase'] as Exchange[],
        alertThreshold: 1.0,
      },
      dispatch: jest.fn(),
    });
  });

  describe('Configuration Validation', () => {
    it('should redirect to config page if no pairs selected', () => {
      (useAppContext as jest.Mock).mockReturnValue({
        state: {
          selectedPairs: [],
          selectedExchanges: ['binance', 'coinbase'] as Exchange[],
          alertThreshold: 1.0,
        },
        dispatch: jest.fn(),
      });

      render(<ScannerPage />);

      expect(mockPush).toHaveBeenCalledWith('/config');
    });

    it('should redirect to config page if less than 2 exchanges selected', () => {
      (useAppContext as jest.Mock).mockReturnValue({
        state: {
          selectedPairs: [mockPair],
          selectedExchanges: ['binance'] as Exchange[],
          alertThreshold: 1.0,
        },
        dispatch: jest.fn(),
      });

      render(<ScannerPage />);

      expect(mockPush).toHaveBeenCalledWith('/config');
    });

    it('should render page when configuration is valid', () => {
      render(<ScannerPage />);

      expect(screen.getByText('Scanner')).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Scanner Controls', () => {
    it('should display start scanning button when not scanning', () => {
      render(<ScannerPage />);

      const startButton = screen.getByText('Start Scanning');
      expect(startButton).toBeInTheDocument();
    });

    it('should call startScanning when start button clicked', () => {
      render(<ScannerPage />);

      const startButton = screen.getByText('Start Scanning');
      fireEvent.click(startButton);

      expect(mockStartScanning).toHaveBeenCalledTimes(1);
    });

    it('should display stop scanning button when scanning', () => {
      (useScanner as jest.Mock).mockReturnValue({
        startScanning: mockStartScanning,
        stopScanning: mockStopScanning,
        isScanning: true,
        priceData: mockPriceData,
        spreadResults: mockSpreadResults,
        lastUpdateTime: new Date(),
        error: null,
        refreshInterval: 10,
        setRefreshInterval: mockSetRefreshInterval,
      });

      render(<ScannerPage />);

      const stopButton = screen.getByText('Stop Scanning');
      expect(stopButton).toBeInTheDocument();
    });

    it('should call stopScanning when stop button clicked', () => {
      (useScanner as jest.Mock).mockReturnValue({
        startScanning: mockStartScanning,
        stopScanning: mockStopScanning,
        isScanning: true,
        priceData: mockPriceData,
        spreadResults: mockSpreadResults,
        lastUpdateTime: new Date(),
        error: null,
        refreshInterval: 10,
        setRefreshInterval: mockSetRefreshInterval,
      });

      render(<ScannerPage />);

      const stopButton = screen.getByText('Stop Scanning');
      fireEvent.click(stopButton);

      expect(mockStopScanning).toHaveBeenCalledTimes(1);
    });

    it('should display scanning indicator when scanning', () => {
      (useScanner as jest.Mock).mockReturnValue({
        startScanning: mockStartScanning,
        stopScanning: mockStopScanning,
        isScanning: true,
        priceData: mockPriceData,
        spreadResults: mockSpreadResults,
        lastUpdateTime: new Date(),
        error: null,
        refreshInterval: 10,
        setRefreshInterval: mockSetRefreshInterval,
      });

      render(<ScannerPage />);

      expect(screen.getByText('Scanning...')).toBeInTheDocument();
    });
  });

  describe('Refresh Interval Control', () => {
    it('should display current refresh interval', () => {
      render(<ScannerPage />);

      const select = screen.getByLabelText('Refresh every:') as HTMLSelectElement;
      expect(select.value).toBe('10');
    });

    it('should call setRefreshInterval when interval changed', () => {
      render(<ScannerPage />);

      const select = screen.getByLabelText('Refresh every:');
      fireEvent.change(select, { target: { value: '20' } });

      expect(mockSetRefreshInterval).toHaveBeenCalledWith(20);
    });

    it('should disable refresh interval control when scanning', () => {
      (useScanner as jest.Mock).mockReturnValue({
        startScanning: mockStartScanning,
        stopScanning: mockStopScanning,
        isScanning: true,
        priceData: mockPriceData,
        spreadResults: mockSpreadResults,
        lastUpdateTime: new Date(),
        error: null,
        refreshInterval: 10,
        setRefreshInterval: mockSetRefreshInterval,
      });

      render(<ScannerPage />);

      const select = screen.getByLabelText('Refresh every:') as HTMLSelectElement;
      expect(select).toBeDisabled();
    });
  });

  describe('Component Integration', () => {
    it('should render PriceTable component', () => {
      render(<ScannerPage />);

      expect(screen.getByTestId('price-table')).toBeInTheDocument();
    });

    it('should render SpreadList component', () => {
      render(<ScannerPage />);

      expect(screen.getByTestId('spread-list')).toBeInTheDocument();
    });

    it('should render SpreadChart component', () => {
      render(<ScannerPage />);

      expect(screen.getByTestId('spread-chart')).toBeInTheDocument();
    });

    it('should pass price data to PriceTable', () => {
      (useScanner as jest.Mock).mockReturnValue({
        startScanning: mockStartScanning,
        stopScanning: mockStopScanning,
        isScanning: false,
        priceData: mockPriceData,
        spreadResults: [],
        lastUpdateTime: new Date(),
        error: null,
        refreshInterval: 10,
        setRefreshInterval: mockSetRefreshInterval,
      });

      render(<ScannerPage />);

      expect(screen.getByText('2 prices')).toBeInTheDocument();
    });

    it('should pass spread results to SpreadList', () => {
      (useScanner as jest.Mock).mockReturnValue({
        startScanning: mockStartScanning,
        stopScanning: mockStopScanning,
        isScanning: false,
        priceData: [],
        spreadResults: mockSpreadResults,
        lastUpdateTime: new Date(),
        error: null,
        refreshInterval: 10,
        setRefreshInterval: mockSetRefreshInterval,
      });

      render(<ScannerPage />);

      expect(screen.getByText('1 spreads')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when error occurs', () => {
      (useScanner as jest.Mock).mockReturnValue({
        startScanning: mockStartScanning,
        stopScanning: mockStopScanning,
        isScanning: false,
        priceData: [],
        spreadResults: [],
        lastUpdateTime: null,
        error: 'Failed to fetch prices',
        refreshInterval: 10,
        setRefreshInterval: mockSetRefreshInterval,
      });

      render(<ScannerPage />);

      expect(screen.getByText('Failed to fetch prices')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should display configuration summary in header', () => {
      render(<ScannerPage />);

      expect(screen.getByText(/Monitoring 1 pair across 2 exchanges/)).toBeInTheDocument();
    });

    it('should navigate back to config page when configure button clicked', () => {
      render(<ScannerPage />);

      const configButton = screen.getByText('Configure');
      fireEvent.click(configButton);

      expect(mockPush).toHaveBeenCalledWith('/config');
    });

    it('should stop scanning before navigating to config', () => {
      (useScanner as jest.Mock).mockReturnValue({
        startScanning: mockStartScanning,
        stopScanning: mockStopScanning,
        isScanning: true,
        priceData: mockPriceData,
        spreadResults: mockSpreadResults,
        lastUpdateTime: new Date(),
        error: null,
        refreshInterval: 10,
        setRefreshInterval: mockSetRefreshInterval,
      });

      render(<ScannerPage />);

      const configButton = screen.getByText('Configure');
      fireEvent.click(configButton);

      expect(mockStopScanning).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith('/config');
    });
  });

  describe('Empty State', () => {
    it('should display ready to scan message when not scanning and no data', () => {
      render(<ScannerPage />);

      expect(screen.getByText('Ready to Scan')).toBeInTheDocument();
      expect(screen.getByText(/Click "Start Scanning" to begin monitoring/)).toBeInTheDocument();
    });

    it('should not display ready message when scanning', () => {
      (useScanner as jest.Mock).mockReturnValue({
        startScanning: mockStartScanning,
        stopScanning: mockStopScanning,
        isScanning: true,
        priceData: [],
        spreadResults: [],
        lastUpdateTime: null,
        error: null,
        refreshInterval: 10,
        setRefreshInterval: mockSetRefreshInterval,
      });

      render(<ScannerPage />);

      expect(screen.queryByText('Ready to Scan')).not.toBeInTheDocument();
    });
  });

  describe('Disclaimer', () => {
    it('should display disclaimer message', () => {
      render(<ScannerPage />);

      expect(screen.getByText(/This app provides simulation only/)).toBeInTheDocument();
    });
  });
});

/**
 * Unit tests for useScanner hook
 * Requirements: All scanner-related requirements
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import React, { ReactNode } from 'react';
import { AppProvider, initialState, AppState } from '../../../src/context/AppContext';
import { useScanner } from '../../../src/hooks/useScanner';
import * as priceFetcher from '../../../src/services/priceFetcher';
import * as spreadCalculator from '../../../src/services/spreadCalculator';
import { TradingPair, Exchange, PriceData, SpreadResult } from '../../../src/types';

// Mock the services
jest.mock('../../../src/services/priceFetcher');
jest.mock('../../../src/services/spreadCalculator');

const mockedPriceFetcher = priceFetcher as jest.Mocked<typeof priceFetcher>;
const mockedSpreadCalculator = spreadCalculator as jest.Mocked<typeof spreadCalculator>;

describe('useScanner hook', () => {
  // Test wrapper with AppProvider
  const createWrapper = (initialStateOverride?: Partial<AppState>) => {
    const Wrapper = ({ children }: { children: ReactNode }) => (
      <AppProvider initialStateOverride={initialStateOverride}>
        {children}
      </AppProvider>
    );
    return Wrapper;
  };

  // Mock data
  const mockPair: TradingPair = { base: 'ETH', quote: 'USDT', symbol: 'ETH/USDT' };
  const mockExchanges: Exchange[] = ['binance', 'coinbase'];
  
  const mockPriceData: PriceData[] = [
    {
      pair: mockPair,
      exchange: 'binance',
      price: 2500,
      volume24h: 1000000,
      bidAskSpread: 0.01,
      timestamp: new Date(),
      isStale: false,
    },
    {
      pair: mockPair,
      exchange: 'coinbase',
      price: 2510,
      volume24h: 900000,
      bidAskSpread: 0.02,
      timestamp: new Date(),
      isStale: false,
    },
  ];

  const mockSpreadResults: SpreadResult[] = [
    {
      pair: mockPair,
      buyExchange: 'binance',
      sellExchange: 'coinbase',
      buyPrice: 2500,
      sellPrice: 2510,
      spreadPercent: 0.4,
      timestamp: new Date(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Setup default mock implementations
    mockedPriceFetcher.fetchPrices.mockResolvedValue(mockPriceData);
    mockedPriceFetcher.setErrorCallback.mockImplementation(() => {});
    mockedSpreadCalculator.calculateAndSortSpreads.mockReturnValue(mockSpreadResults);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('initial state', () => {
    it('should return initial scanning state as false', () => {
      const { result } = renderHook(() => useScanner(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isScanning).toBe(false);
    });

    it('should return empty price data initially', () => {
      const { result } = renderHook(() => useScanner(), {
        wrapper: createWrapper(),
      });

      expect(result.current.priceData).toEqual([]);
    });

    it('should return empty spread results initially', () => {
      const { result } = renderHook(() => useScanner(), {
        wrapper: createWrapper(),
      });

      expect(result.current.spreadResults).toEqual([]);
    });

    it('should return null lastUpdateTime initially', () => {
      const { result } = renderHook(() => useScanner(), {
        wrapper: createWrapper(),
      });

      expect(result.current.lastUpdateTime).toBeNull();
    });

    it('should return null error initially', () => {
      const { result } = renderHook(() => useScanner(), {
        wrapper: createWrapper(),
      });

      expect(result.current.error).toBeNull();
    });

    it('should return default refresh interval', () => {
      const { result } = renderHook(() => useScanner(), {
        wrapper: createWrapper(),
      });

      expect(result.current.refreshInterval).toBe(10);
    });
  });

  describe('startScanning', () => {
    it('should set isScanning to true when started with valid config', async () => {
      const { result } = renderHook(() => useScanner(), {
        wrapper: createWrapper({
          selectedPairs: [mockPair],
          selectedExchanges: mockExchanges,
        }),
      });

      await act(async () => {
        result.current.startScanning();
      });

      expect(result.current.isScanning).toBe(true);
    });

    it('should set error when no trading pairs selected', async () => {
      const { result } = renderHook(() => useScanner(), {
        wrapper: createWrapper({
          selectedPairs: [],
          selectedExchanges: mockExchanges,
        }),
      });

      await act(async () => {
        result.current.startScanning();
      });

      expect(result.current.error).toBe('No trading pairs selected');
      expect(result.current.isScanning).toBe(false);
    });

    it('should set error when less than 2 exchanges selected', async () => {
      const { result } = renderHook(() => useScanner(), {
        wrapper: createWrapper({
          selectedPairs: [mockPair],
          selectedExchanges: ['binance'],
        }),
      });

      await act(async () => {
        result.current.startScanning();
      });

      expect(result.current.error).toBe('At least 2 exchanges must be selected');
      expect(result.current.isScanning).toBe(false);
    });

    it('should fetch prices immediately when started', async () => {
      const { result } = renderHook(() => useScanner(), {
        wrapper: createWrapper({
          selectedPairs: [mockPair],
          selectedExchanges: mockExchanges,
        }),
      });

      await act(async () => {
        result.current.startScanning();
      });

      expect(mockedPriceFetcher.fetchPrices).toHaveBeenCalledWith(
        [mockPair],
        mockExchanges,
        true
      );
    });

    it('should calculate spreads after fetching prices', async () => {
      const { result } = renderHook(() => useScanner(), {
        wrapper: createWrapper({
          selectedPairs: [mockPair],
          selectedExchanges: mockExchanges,
        }),
      });

      await act(async () => {
        result.current.startScanning();
      });

      expect(mockedSpreadCalculator.calculateAndSortSpreads).toHaveBeenCalledWith(mockPriceData);
    });
  });

  describe('stopScanning', () => {
    it('should set isScanning to false when stopped', async () => {
      const { result } = renderHook(() => useScanner(), {
        wrapper: createWrapper({
          selectedPairs: [mockPair],
          selectedExchanges: mockExchanges,
        }),
      });

      await act(async () => {
        result.current.startScanning();
      });

      expect(result.current.isScanning).toBe(true);

      act(() => {
        result.current.stopScanning();
      });

      expect(result.current.isScanning).toBe(false);
    });
  });

  describe('setRefreshInterval', () => {
    it('should update refresh interval', () => {
      const { result } = renderHook(() => useScanner(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setRefreshInterval(15);
      });

      expect(result.current.refreshInterval).toBe(15);
    });

    it('should clamp refresh interval to minimum (5 seconds)', () => {
      const { result } = renderHook(() => useScanner(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setRefreshInterval(2);
      });

      expect(result.current.refreshInterval).toBe(5);
    });

    it('should clamp refresh interval to maximum (30 seconds)', () => {
      const { result } = renderHook(() => useScanner(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setRefreshInterval(60);
      });

      expect(result.current.refreshInterval).toBe(30);
    });
  });

  describe('error handling', () => {
    it('should set error when fetch fails', async () => {
      mockedPriceFetcher.fetchPrices.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useScanner(), {
        wrapper: createWrapper({
          selectedPairs: [mockPair],
          selectedExchanges: mockExchanges,
        }),
      });

      await act(async () => {
        result.current.startScanning();
      });

      expect(result.current.error).toBe('Network error');
    });

    it('should clear error when scanning starts successfully', async () => {
      const { result } = renderHook(() => useScanner(), {
        wrapper: createWrapper({
          selectedPairs: [mockPair],
          selectedExchanges: mockExchanges,
          error: 'Previous error',
        }),
      });

      await act(async () => {
        result.current.startScanning();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('data updates', () => {
    it('should update priceData after successful fetch', async () => {
      const { result } = renderHook(() => useScanner(), {
        wrapper: createWrapper({
          selectedPairs: [mockPair],
          selectedExchanges: mockExchanges,
        }),
      });

      await act(async () => {
        result.current.startScanning();
      });

      expect(result.current.priceData).toEqual(mockPriceData);
    });

    it('should update spreadResults after successful calculation', async () => {
      const { result } = renderHook(() => useScanner(), {
        wrapper: createWrapper({
          selectedPairs: [mockPair],
          selectedExchanges: mockExchanges,
        }),
      });

      await act(async () => {
        result.current.startScanning();
      });

      expect(result.current.spreadResults).toEqual(mockSpreadResults);
    });

    it('should update lastUpdateTime after successful fetch', async () => {
      const { result } = renderHook(() => useScanner(), {
        wrapper: createWrapper({
          selectedPairs: [mockPair],
          selectedExchanges: mockExchanges,
        }),
      });

      expect(result.current.lastUpdateTime).toBeNull();

      await act(async () => {
        result.current.startScanning();
      });

      expect(result.current.lastUpdateTime).toBeInstanceOf(Date);
    });
  });

  describe('cleanup', () => {
    it('should clean up interval on unmount', async () => {
      const { result, unmount } = renderHook(() => useScanner(), {
        wrapper: createWrapper({
          selectedPairs: [mockPair],
          selectedExchanges: mockExchanges,
        }),
      });

      await act(async () => {
        result.current.startScanning();
      });

      // Clear mock call count
      mockedPriceFetcher.fetchPrices.mockClear();

      // Unmount the hook
      unmount();

      // Advance timers - should not trigger more fetches
      act(() => {
        jest.advanceTimersByTime(20000);
      });

      // fetchPrices should not have been called after unmount
      expect(mockedPriceFetcher.fetchPrices).not.toHaveBeenCalled();
    });
  });
});

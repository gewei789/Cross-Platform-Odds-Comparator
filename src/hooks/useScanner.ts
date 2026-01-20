'use client';

/**
 * useScanner Hook
 * Provides scanning functionality for price data and spread calculations
 * 
 * Requirements: All scanner-related requirements
 */

import { useCallback, useEffect, useRef } from 'react';
import { useAppContext, actions } from '../context/AppContext';
import { fetchPrices, setErrorCallback } from '../services/priceFetcher';
import { calculateAndSortSpreads } from '../services/spreadCalculator';
import { PriceData, SpreadResult } from '../types';

/**
 * Return type for useScanner hook
 */
export interface UseScannerReturn {
  /** Start the price scanning loop */
  startScanning: () => void;
  /** Stop the scanning loop */
  stopScanning: () => void;
  /** Current scanning state */
  isScanning: boolean;
  /** Current price data from exchanges */
  priceData: PriceData[];
  /** Current spread calculation results */
  spreadResults: SpreadResult[];
  /** Last update timestamp */
  lastUpdateTime: Date | null;
  /** Any error message */
  error: string | null;
  /** Current refresh interval in seconds */
  refreshInterval: number;
  /** Update the refresh interval */
  setRefreshInterval: (interval: number) => void;
}

/**
 * useScanner hook
 * Manages the price scanning loop and spread calculations
 * 
 * @returns UseScannerReturn object with scanning controls and data
 */
export function useScanner(): UseScannerReturn {
  const { state, dispatch } = useAppContext();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef<boolean>(true);

  // Set up error callback for price fetcher
  useEffect(() => {
    setErrorCallback((error: string) => {
      if (isMountedRef.current) {
        dispatch(actions.setError(error));
      }
    });

    return () => {
      setErrorCallback(null);
    };
  }, [dispatch]);

  // Track mounted state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Fetch prices and calculate spreads
   */
  const fetchAndCalculate = useCallback(async () => {
    if (!isMountedRef.current) return;

    // Check if we have pairs and exchanges configured
    if (state.selectedPairs.length === 0) {
      dispatch(actions.setError('No trading pairs selected'));
      return;
    }

    if (state.selectedExchanges.length < 2) {
      dispatch(actions.setError('At least 2 exchanges must be selected'));
      return;
    }

    try {
      // Clear any previous error
      dispatch(actions.clearError());

      // Fetch prices from all exchanges
      const prices = await fetchPrices(
        state.selectedPairs,
        state.selectedExchanges,
        true // enable retry
      );

      if (!isMountedRef.current) return;

      // Update price data in state
      dispatch(actions.updatePriceData(prices));

      // Calculate spreads
      const spreads = calculateAndSortSpreads(prices);

      // Update spread results in state
      dispatch(actions.updateSpreadResults(spreads));
    } catch (error) {
      if (!isMountedRef.current) return;
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to fetch prices';
      dispatch(actions.setError(errorMessage));
    }
  }, [state.selectedPairs, state.selectedExchanges, dispatch]);

  /**
   * Start the scanning loop
   */
  const startScanning = useCallback(() => {
    // Validate configuration before starting
    if (state.selectedPairs.length === 0) {
      dispatch(actions.setError('No trading pairs selected'));
      return;
    }

    if (state.selectedExchanges.length < 2) {
      dispatch(actions.setError('At least 2 exchanges must be selected'));
      return;
    }

    // Clear any previous interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set scanning state
    dispatch(actions.setScanning(true));
    dispatch(actions.clearError());

    // Fetch immediately
    fetchAndCalculate();

    // Set up interval for continuous scanning
    intervalRef.current = setInterval(() => {
      fetchAndCalculate();
    }, state.refreshInterval * 1000);
  }, [state.selectedPairs.length, state.selectedExchanges.length, state.refreshInterval, dispatch, fetchAndCalculate]);

  /**
   * Stop the scanning loop
   */
  const stopScanning = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    dispatch(actions.setScanning(false));
  }, [dispatch]);

  /**
   * Update the refresh interval
   */
  const setRefreshInterval = useCallback((interval: number) => {
    dispatch(actions.setRefreshInterval(interval));
  }, [dispatch]);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  // Restart scanning when refresh interval changes (if currently scanning)
  useEffect(() => {
    if (state.isScanning && intervalRef.current) {
      // Clear existing interval
      clearInterval(intervalRef.current);
      
      // Set up new interval with updated refresh rate
      intervalRef.current = setInterval(() => {
        fetchAndCalculate();
      }, state.refreshInterval * 1000);
    }
  }, [state.refreshInterval, state.isScanning, fetchAndCalculate]);

  return {
    startScanning,
    stopScanning,
    isScanning: state.isScanning,
    priceData: state.priceData,
    spreadResults: state.spreadResults,
    lastUpdateTime: state.lastUpdateTime,
    error: state.error,
    refreshInterval: state.refreshInterval,
    setRefreshInterval,
  };
}

export default useScanner;

'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PriceTable } from '../../components/scanner/PriceTable';
import { SpreadList } from '../../components/scanner/SpreadList';
import { SpreadChart, TimeRange } from '../../components/scanner/SpreadChart';
import { useScanner } from '../../hooks/useScanner';
import { useAppContext } from '../../context/AppContext';
import { ChartDataPoint, SpreadResult } from '../../types';

/**
 * Maximum number of chart data points to keep in memory
 * Requirements: 6.2 - Show last 30 minutes of data
 * At 10-second intervals, 30 minutes = 180 data points
 */
const MAX_CHART_DATA_POINTS = 200;

/**
 * Remaining API calls count (mock for now - will be implemented in priceFetcher)
 * Requirements: 2.4, 2.5
 */
const MOCK_REMAINING_CALLS = 9500;

/**
 * ScannerControls Component
 * Controls for starting/stopping scanning and adjusting refresh interval
 */
interface ScannerControlsProps {
  isScanning: boolean;
  refreshInterval: number;
  onStartScanning: () => void;
  onStopScanning: () => void;
  onRefreshIntervalChange: (interval: number) => void;
}

function ScannerControls({
  isScanning,
  refreshInterval,
  onStartScanning,
  onStopScanning,
  onRefreshIntervalChange,
}: ScannerControlsProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Scan Control Buttons */}
        <div className="flex items-center gap-3">
          {isScanning ? (
            <button
              onClick={onStopScanning}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                />
              </svg>
              Stop Scanning
            </button>
          ) : (
            <button
              onClick={onStartScanning}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Start Scanning
            </button>
          )}

          {/* Scanning Indicator */}
          {isScanning && (
            <div className="flex items-center gap-2 text-green-600">
              <div className="relative">
                <div className="w-3 h-3 bg-green-600 rounded-full animate-ping absolute"></div>
                <div className="w-3 h-3 bg-green-600 rounded-full"></div>
              </div>
              <span className="text-sm font-medium">Scanning...</span>
            </div>
          )}
        </div>

        {/* Refresh Interval Control */}
        <div className="flex items-center gap-3">
          <label htmlFor="refresh-interval" className="text-sm text-gray-600 font-medium">
            Refresh every:
          </label>
          <select
            id="refresh-interval"
            value={refreshInterval}
            onChange={(e) => onRefreshIntervalChange(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isScanning}
          >
            <option value={5}>5 seconds</option>
            <option value={10}>10 seconds</option>
            <option value={15}>15 seconds</option>
            <option value={20}>20 seconds</option>
            <option value={30}>30 seconds</option>
          </select>
        </div>
      </div>
    </div>
  );
}

/**
 * ScannerPage Component
 * Main scanner page that integrates PriceTable, SpreadList, and SpreadChart
 * 
 * Requirements: All Scanner requirements (2.x, 3.x, 6.x)
 * - Display real-time prices from exchanges
 * - Calculate and display spread opportunities
 * - Visualize spread history over time
 * - Control scanning and refresh intervals
 */
export default function ScannerPage() {
  const router = useRouter();
  const { state } = useAppContext();
  const {
    startScanning,
    stopScanning,
    isScanning,
    priceData,
    spreadResults,
    lastUpdateTime,
    error,
    refreshInterval,
    setRefreshInterval,
  } = useScanner();

  // Local state for chart data and time range
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [chartTimeRange, setChartTimeRange] = useState<TimeRange>(30);

  /**
   * Check if configuration is valid
   */
  const hasValidConfig = useMemo(() => {
    return state.selectedPairs.length > 0 && state.selectedExchanges.length >= 2;
  }, [state.selectedPairs, state.selectedExchanges]);

  /**
   * Redirect to config page if no valid configuration
   */
  useEffect(() => {
    if (!hasValidConfig) {
      router.push('/config');
    }
  }, [hasValidConfig, router]);

  /**
   * Update chart data when spread results change
   * Requirements: 6.1, 6.2 - Real-time spread line chart
   */
  useEffect(() => {
    if (spreadResults.length > 0 && isScanning) {
      // Get the highest spread from current results
      const highestSpread = spreadResults[0]; // Already sorted by spreadCalculator
      
      // Create new chart data point
      const newPoint: ChartDataPoint = {
        timestamp: new Date(),
        spreadPercent: highestSpread.spreadPercent,
        isAlert: highestSpread.spreadPercent >= state.alertThreshold,
      };

      // Add to chart data and limit to max points
      setChartData((prev) => {
        const updated = [...prev, newPoint];
        return updated.slice(-MAX_CHART_DATA_POINTS);
      });
    }
  }, [spreadResults, isScanning, state.alertThreshold]);

  /**
   * Handle spread click - could navigate to simulator or show details
   */
  const handleSpreadClick = useCallback((spread: SpreadResult) => {
    // For now, just log - could navigate to simulator page in future
    console.log('Spread clicked:', spread);
  }, []);

  /**
   * Handle back to config
   */
  const handleBackToConfig = useCallback(() => {
    if (isScanning) {
      stopScanning();
    }
    router.push('/config');
  }, [isScanning, stopScanning, router]);

  // Don't render if no valid config (will redirect)
  if (!hasValidConfig) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Scanner
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Monitoring {state.selectedPairs.length} pair{state.selectedPairs.length !== 1 ? 's' : ''} across{' '}
                {state.selectedExchanges.length} exchanges
              </p>
            </div>
            <button
              onClick={handleBackToConfig}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Configure
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Scanner Controls */}
        <div className="mb-6">
          <ScannerControls
            isScanning={isScanning}
            refreshInterval={refreshInterval}
            onStartScanning={startScanning}
            onStopScanning={stopScanning}
            onRefreshIntervalChange={setRefreshInterval}
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <svg
              className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Main Grid Layout */}
        <div className="space-y-6">
          {/* Spread Chart - Full Width */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <SpreadChart
              dataPoints={chartData}
              timeRange={chartTimeRange}
              onTimeRangeChange={setChartTimeRange}
              height={300}
            />
          </div>

          {/* Two Column Layout for Spread List and Price Table */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Spread List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <SpreadList
                spreadResults={spreadResults}
                onSpreadClick={handleSpreadClick}
              />
            </div>

            {/* Price Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <PriceTable
                priceData={priceData}
                remainingCalls={MOCK_REMAINING_CALLS}
                lastUpdateTime={lastUpdateTime}
                isLoading={isScanning && priceData.length === 0}
                error={error}
              />
            </div>
          </div>
        </div>

        {/* Info Section */}
        {!isScanning && priceData.length === 0 && (
          <div className="mt-8 text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <svg
              className="mx-auto h-16 w-16 text-gray-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Ready to Scan
            </h3>
            <p className="text-gray-600 mb-4">
              Click "Start Scanning" to begin monitoring arbitrage opportunities
            </p>
            <p className="text-sm text-gray-500">
              The scanner will fetch prices every {refreshInterval} seconds and calculate spreads automatically
            </p>
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="text-sm text-yellow-800">
              <strong>Disclaimer:</strong> This app provides simulation only, not investment advice. 
              Users bear their own trading risks. All data processing is completed locally.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

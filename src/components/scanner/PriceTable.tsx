'use client';

import React, { useMemo } from 'react';
import { PriceData, Exchange, TradingPair } from '../../types';

/**
 * Exchange display names for better readability
 */
const EXCHANGE_DISPLAY_NAMES: Record<Exchange, string> = {
  binance: 'Binance',
  coinbase: 'Coinbase',
  kraken: 'Kraken',
};

/**
 * Format price with appropriate decimal places
 */
function formatPrice(price: number): string {
  if (price >= 1000) {
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } else if (price >= 1) {
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    });
  } else {
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 6,
      maximumFractionDigits: 8,
    });
  }
}

/**
 * Format volume with K/M/B suffixes
 */
function formatVolume(volume: number): string {
  if (volume >= 1_000_000_000) {
    return `${(volume / 1_000_000_000).toFixed(2)}B`;
  } else if (volume >= 1_000_000) {
    return `${(volume / 1_000_000).toFixed(2)}M`;
  } else if (volume >= 1_000) {
    return `${(volume / 1_000).toFixed(2)}K`;
  }
  return volume.toFixed(2);
}

/**
 * Format timestamp to readable time
 */
function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Format relative time (e.g., "2 min ago")
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);

  if (diffSec < 60) {
    return `${diffSec}s ago`;
  } else if (diffMin < 60) {
    return `${diffMin}m ago`;
  } else {
    return formatTimestamp(date);
  }
}

/**
 * Props for PriceTable component
 */
interface PriceTableProps {
  /** Price data from all exchanges */
  priceData: PriceData[];
  /** Remaining API calls count */
  remainingCalls: number;
  /** Last update time */
  lastUpdateTime: Date | null;
  /** Whether data is currently loading */
  isLoading?: boolean;
  /** Error message if any */
  error?: string | null;
}

/**
 * API Calls Warning Threshold
 * Requirements: 2.5 - Warn when API calls approach limit (>9000 of 10000)
 */
const API_CALLS_WARNING_THRESHOLD = 9000;
const API_CALLS_TOTAL = 10000;

/**
 * PriceTable Component
 * 
 * Displays prices from each exchange for selected trading pairs.
 * Shows last update time and remaining API calls indicator.
 * Highlights stale data.
 * 
 * Requirements: 2.4, 2.5
 * - Display last update time and remaining API calls count
 * - Warn when API calls approach limit (>9000 of 10000)
 */
export function PriceTable({
  priceData,
  remainingCalls,
  lastUpdateTime,
  isLoading = false,
  error = null,
}: PriceTableProps) {
  /**
   * Group price data by trading pair
   */
  const groupedByPair = useMemo(() => {
    const groups = new Map<string, PriceData[]>();
    
    for (const data of priceData) {
      const key = data.pair.symbol;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(data);
    }
    
    return groups;
  }, [priceData]);

  /**
   * Check if API calls are approaching limit
   * Requirements: 2.5
   */
  const isApproachingLimit = remainingCalls < (API_CALLS_TOTAL - API_CALLS_WARNING_THRESHOLD);
  const usedCalls = API_CALLS_TOTAL - remainingCalls;

  return (
    <div className="w-full">
      {/* Header with Status Indicators */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Exchange Prices</h3>
        
        <div className="flex flex-wrap items-center gap-4 text-sm">
          {/* Last Update Time - Requirements: 2.4 */}
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Last update:</span>
            {isLoading ? (
              <span className="text-blue-600 animate-pulse">Updating...</span>
            ) : lastUpdateTime ? (
              <span className="text-gray-700" title={lastUpdateTime.toLocaleString()}>
                {formatRelativeTime(lastUpdateTime)}
              </span>
            ) : (
              <span className="text-gray-400">Never</span>
            )}
          </div>

          {/* Remaining API Calls Indicator - Requirements: 2.4, 2.5 */}
          <div className="flex items-center gap-2">
            <span className="text-gray-500">API calls:</span>
            <span
              className={`font-medium ${
                isApproachingLimit
                  ? 'text-red-600'
                  : usedCalls > API_CALLS_TOTAL * 0.7
                  ? 'text-yellow-600'
                  : 'text-green-600'
              }`}
              title={`${usedCalls} of ${API_CALLS_TOTAL} used`}
            >
              {remainingCalls.toLocaleString()} remaining
            </span>
          </div>
        </div>
      </div>

      {/* API Limit Warning - Requirements: 2.5 */}
      {isApproachingLimit && (
        <div
          className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2"
          role="alert"
        >
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
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            <p className="text-sm font-medium text-red-800">
              API call limit approaching!
            </p>
            <p className="text-sm text-red-700">
              You have used {usedCalls.toLocaleString()} of {API_CALLS_TOTAL.toLocaleString()} monthly API calls.
              Consider reducing the refresh frequency to conserve your quota.
            </p>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div
          className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2"
          role="alert"
        >
          <svg
            className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5"
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
          <p className="text-sm text-yellow-800">{error}</p>
        </div>
      )}

      {/* Price Table */}
      {priceData.length === 0 && !isLoading ? (
        <div className="text-center py-8 text-gray-500">
          <p>No price data available.</p>
          <p className="text-sm mt-1">Start scanning to fetch prices from exchanges.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Pair
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Exchange
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  24h Volume
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Spread
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Updated
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {Array.from(groupedByPair.entries()).map(([pairSymbol, prices]) =>
                prices.map((data, index) => (
                  <tr
                    key={`${pairSymbol}-${data.exchange}`}
                    className={`
                      ${data.isStale ? 'bg-yellow-50' : 'bg-white'}
                      hover:bg-gray-50 transition-colors
                    `}
                  >
                    {/* Pair - only show on first row of group */}
                    <td className="px-4 py-3">
                      {index === 0 ? (
                        <span className="font-medium text-gray-900">
                          {pairSymbol}
                        </span>
                      ) : null}
                    </td>
                    
                    {/* Exchange */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-700">
                          {EXCHANGE_DISPLAY_NAMES[data.exchange]}
                        </span>
                        {data.isStale && (
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800"
                            title="Data may be outdated"
                          >
                            Stale
                          </span>
                        )}
                      </div>
                    </td>
                    
                    {/* Price */}
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`font-mono ${
                          data.isStale ? 'text-yellow-700' : 'text-gray-900'
                        }`}
                      >
                        ${formatPrice(data.price)}
                      </span>
                    </td>
                    
                    {/* 24h Volume */}
                    <td className="px-4 py-3 text-right">
                      <span className="text-gray-600 font-mono">
                        ${formatVolume(data.volume24h)}
                      </span>
                    </td>
                    
                    {/* Bid-Ask Spread */}
                    <td className="px-4 py-3 text-right">
                      <span className="text-gray-600">
                        {data.bidAskSpread.toFixed(3)}%
                      </span>
                    </td>
                    
                    {/* Last Update Time */}
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`text-sm ${
                          data.isStale ? 'text-yellow-600' : 'text-gray-500'
                        }`}
                        title={data.timestamp.toLocaleString()}
                      >
                        {formatRelativeTime(data.timestamp)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && priceData.length === 0 && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3 text-gray-600">
            <svg
              className="animate-spin h-5 w-5 text-blue-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Fetching prices...</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default PriceTable;

// Export helper functions for testing
export { formatPrice, formatVolume, formatTimestamp, formatRelativeTime };
export { API_CALLS_WARNING_THRESHOLD, API_CALLS_TOTAL, EXCHANGE_DISPLAY_NAMES };

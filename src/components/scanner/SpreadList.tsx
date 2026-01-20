'use client';

import { useMemo } from 'react';
import { SpreadResult, Exchange } from '../../types';

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
 * Format spread percentage with appropriate precision
 */
function formatSpreadPercent(percent: number): string {
  return percent.toFixed(3);
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
 * Determine the color class based on spread percentage
 * Property 9: Spread Color Coding
 * - If spreadPercent > 0 then green
 * - If spreadPercent <= 0 then gray
 */
function getSpreadColorClass(spreadPercent: number): {
  row: string;
  text: string;
  badge: string;
} {
  if (spreadPercent > 0) {
    return {
      row: 'bg-green-50 hover:bg-green-100',
      text: 'text-green-700',
      badge: 'bg-green-100 text-green-800',
    };
  }
  return {
    row: 'bg-gray-50 hover:bg-gray-100',
    text: 'text-gray-600',
    badge: 'bg-gray-100 text-gray-600',
  };
}

/**
 * Props for SpreadList component
 */
interface SpreadListProps {
  /** Spread results to display */
  spreadResults: SpreadResult[];
  /** Optional callback when a spread result is clicked */
  onSpreadClick?: (spread: SpreadResult) => void;
}

/**
 * SpreadList Component
 * 
 * Displays spread results sorted by percentage in descending order.
 * Shows buy/sell exchange, prices, and spread percentage.
 * Uses green highlight for positive spreads, gray for zero/negative.
 * 
 * Requirements: 3.3, 3.4, 3.5
 * - Property 7: Spread Results Sorting - sorted by spreadPercent descending
 * - Property 8: Spread Display Completeness - shows buyExchange, sellExchange, buyPrice, sellPrice, spreadPercent
 * - Property 9: Spread Color Coding - green for positive, gray for zero/negative
 */
export function SpreadList({ spreadResults, onSpreadClick }: SpreadListProps) {
  /**
   * Sort spread results by spreadPercent in descending order
   * Property 7: Spread Results Sorting
   * Requirements: 3.3
   */
  const sortedResults = useMemo(() => {
    return [...spreadResults].sort((a, b) => b.spreadPercent - a.spreadPercent);
  }, [spreadResults]);

  if (spreadResults.length === 0) {
    return (
      <div className="w-full">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Arbitrage Opportunities
        </h3>
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-3"
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
          <p className="font-medium">No spread data available</p>
          <p className="text-sm mt-1">
            Start scanning to calculate arbitrage opportunities.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Arbitrage Opportunities
        </h3>
        <span className="text-sm text-gray-500">
          {sortedResults.length} {sortedResults.length === 1 ? 'opportunity' : 'opportunities'} found
        </span>
      </div>

      {/* Spread Results Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Pair
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Buy Exchange
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Buy Price
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Sell Exchange
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Sell Price
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Spread %
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Time
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedResults.map((result, index) => {
              const colorClass = getSpreadColorClass(result.spreadPercent);
              
              return (
                <tr
                  key={`${result.pair.symbol}-${result.buyExchange}-${result.sellExchange}-${index}`}
                  className={`
                    ${colorClass.row}
                    transition-colors cursor-pointer
                  `}
                  onClick={() => onSpreadClick?.(result)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSpreadClick?.(result);
                    }
                  }}
                  aria-label={`${result.pair.symbol}: Buy at ${EXCHANGE_DISPLAY_NAMES[result.buyExchange]} for $${formatPrice(result.buyPrice)}, Sell at ${EXCHANGE_DISPLAY_NAMES[result.sellExchange]} for $${formatPrice(result.sellPrice)}, Spread ${formatSpreadPercent(result.spreadPercent)}%`}
                >
                  {/* Pair - Property 8: Spread Display Completeness */}
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">
                      {result.pair.symbol}
                    </span>
                  </td>

                  {/* Buy Exchange - Property 8: Spread Display Completeness */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                        B
                      </span>
                      <span className="text-gray-700">
                        {EXCHANGE_DISPLAY_NAMES[result.buyExchange]}
                      </span>
                    </div>
                  </td>

                  {/* Buy Price - Property 8: Spread Display Completeness */}
                  <td className="px-4 py-3 text-right">
                    <span className="font-mono text-gray-900">
                      ${formatPrice(result.buyPrice)}
                    </span>
                  </td>

                  {/* Sell Exchange - Property 8: Spread Display Completeness */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 text-xs font-medium">
                        S
                      </span>
                      <span className="text-gray-700">
                        {EXCHANGE_DISPLAY_NAMES[result.sellExchange]}
                      </span>
                    </div>
                  </td>

                  {/* Sell Price - Property 8: Spread Display Completeness */}
                  <td className="px-4 py-3 text-right">
                    <span className="font-mono text-gray-900">
                      ${formatPrice(result.sellPrice)}
                    </span>
                  </td>

                  {/* Spread Percent - Property 8 & 9: Display Completeness & Color Coding */}
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`
                        inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium
                        ${colorClass.badge}
                      `}
                      data-testid="spread-percent"
                      data-spread-positive={result.spreadPercent > 0}
                    >
                      {result.spreadPercent > 0 ? '+' : ''}
                      {formatSpreadPercent(result.spreadPercent)}%
                    </span>
                  </td>

                  {/* Timestamp */}
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm text-gray-500">
                      {formatTimestamp(result.timestamp)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-green-100 border border-green-200"></span>
          <span>Positive spread (profitable)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-gray-100 border border-gray-200"></span>
          <span>Zero/negative spread</span>
        </div>
      </div>
    </div>
  );
}

export default SpreadList;

// Export helper functions for testing
export { formatPrice, formatSpreadPercent, formatTimestamp, getSpreadColorClass };
export { EXCHANGE_DISPLAY_NAMES };

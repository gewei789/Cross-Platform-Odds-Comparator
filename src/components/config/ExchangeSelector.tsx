'use client';

import React, { useCallback } from 'react';
import { Exchange } from '../../types';

/**
 * Available exchanges for selection
 * Requirements: 1.3 - Provide options including Binance, Coinbase, and Kraken
 */
export const AVAILABLE_EXCHANGES: { id: Exchange; name: string; description: string }[] = [
  { id: 'binance', name: 'Binance', description: 'World\'s largest crypto exchange' },
  { id: 'coinbase', name: 'Coinbase', description: 'US-based regulated exchange' },
  { id: 'kraken', name: 'Kraken', description: 'Established European exchange' },
];

/**
 * Default exchanges to be selected
 * Requirements: 1.3 - 2-3 selected by default
 */
export const DEFAULT_EXCHANGES: Exchange[] = ['binance', 'coinbase'];

/**
 * Minimum number of exchanges required for scanning
 * Property 2: Exchange Selection Validation
 * Requirements: 1.4
 */
export const MIN_EXCHANGES_REQUIRED = 2;

/**
 * Validates exchange selection
 * Property 2: For any selection of exchanges where the count is less than 2,
 * the Scanner SHALL prevent scanning from starting and display an error.
 * 
 * @param exchanges - Array of selected exchanges
 * @returns Object with isValid boolean and optional error message
 */
export function validateExchangeSelection(exchanges: Exchange[]): {
  isValid: boolean;
  errorMessage: string | null;
} {
  if (!Array.isArray(exchanges)) {
    return {
      isValid: false,
      errorMessage: 'Invalid exchange selection',
    };
  }

  if (exchanges.length < MIN_EXCHANGES_REQUIRED) {
    return {
      isValid: false,
      errorMessage: `Please select at least ${MIN_EXCHANGES_REQUIRED} exchanges to compare prices`,
    };
  }

  // Validate that all exchanges are valid
  const validExchangeIds = AVAILABLE_EXCHANGES.map((e) => e.id);
  const allValid = exchanges.every((exchange) => validExchangeIds.includes(exchange));
  
  if (!allValid) {
    return {
      isValid: false,
      errorMessage: 'Invalid exchange in selection',
    };
  }

  return {
    isValid: true,
    errorMessage: null,
  };
}

/**
 * Props for ExchangeSelector component
 */
interface ExchangeSelectorProps {
  /** Currently selected exchanges */
  selectedExchanges: Exchange[];
  /** Callback when exchanges change */
  onExchangesChange: (exchanges: Exchange[]) => void;
  /** Whether the component is disabled */
  disabled?: boolean;
}

/**
 * ExchangeSelector Component
 * 
 * Allows users to select exchanges for price comparison.
 * Provides checkbox list with validation for minimum 2 exchanges.
 * 
 * Requirements: 1.3, 1.4
 * - Provide options including Binance, Coinbase, and Kraken with 2-3 selected by default
 * - Display error message and prevent scanning when less than 2 exchanges selected
 * 
 * Property 2: Exchange Selection Validation
 * - For any selection of exchanges where the count is less than 2,
 *   the Scanner SHALL prevent scanning from starting and display an error.
 */
export function ExchangeSelector({
  selectedExchanges,
  onExchangesChange,
  disabled = false,
}: ExchangeSelectorProps) {
  // Validate current selection
  const validation = validateExchangeSelection(selectedExchanges);

  /**
   * Handles toggling an exchange selection
   */
  const handleExchangeToggle = useCallback(
    (exchangeId: Exchange) => {
      const isSelected = selectedExchanges.includes(exchangeId);
      
      if (isSelected) {
        // Remove the exchange
        onExchangesChange(selectedExchanges.filter((e) => e !== exchangeId));
      } else {
        // Add the exchange
        onExchangesChange([...selectedExchanges, exchangeId]);
      }
    },
    [selectedExchanges, onExchangesChange]
  );

  /**
   * Handles selecting all exchanges
   */
  const handleSelectAll = useCallback(() => {
    onExchangesChange(AVAILABLE_EXCHANGES.map((e) => e.id));
  }, [onExchangesChange]);

  /**
   * Handles clearing all selections
   */
  const handleClearAll = useCallback(() => {
    onExchangesChange([]);
  }, [onExchangesChange]);

  return (
    <div className="w-full">
      {/* Section Title */}
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Exchanges</h3>

      {/* Quick Actions */}
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={handleSelectAll}
          disabled={disabled || selectedExchanges.length === AVAILABLE_EXCHANGES.length}
          className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          Select All
        </button>
        <span className="text-gray-300">|</span>
        <button
          type="button"
          onClick={handleClearAll}
          disabled={disabled || selectedExchanges.length === 0}
          className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          Clear All
        </button>
      </div>

      {/* Exchange Checkboxes */}
      <div className="space-y-3">
        {AVAILABLE_EXCHANGES.map((exchange) => {
          const isSelected = selectedExchanges.includes(exchange.id);
          return (
            <label
              key={exchange.id}
              className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-blue-50 border-blue-300'
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleExchangeToggle(exchange.id)}
                disabled={disabled}
                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:cursor-not-allowed"
                aria-describedby={`${exchange.id}-description`}
              />
              <div className="flex-1">
                <span className="font-medium text-gray-900">{exchange.name}</span>
                <p
                  id={`${exchange.id}-description`}
                  className="text-sm text-gray-500"
                >
                  {exchange.description}
                </p>
              </div>
              {isSelected && (
                <span className="text-blue-600">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              )}
            </label>
          );
        })}
      </div>

      {/* Selection Summary */}
      <div className="mt-4">
        <p className="text-sm text-gray-600">
          Selected: {selectedExchanges.length} of {AVAILABLE_EXCHANGES.length} exchanges
        </p>
      </div>

      {/* Validation Error */}
      {!validation.isValid && validation.errorMessage && (
        <div
          className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg"
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-red-600"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm text-red-700">{validation.errorMessage}</p>
          </div>
        </div>
      )}

      {/* Info Message */}
      <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-sm text-gray-600">
          <span className="font-medium">Note:</span> Select at least 2 exchanges to compare
          prices and find arbitrage opportunities.
        </p>
      </div>
    </div>
  );
}

export default ExchangeSelector;

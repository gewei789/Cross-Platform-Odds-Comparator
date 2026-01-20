'use client';

import React, { useState, useCallback } from 'react';
import { TradingPair } from '../../types';

/**
 * Common trading pair suggestions
 * Requirements: 1.1 - Display common pairs as suggestions
 */
const COMMON_PAIRS: TradingPair[] = [
  { base: 'ETH', quote: 'USDT', symbol: 'ETH/USDT' },
  { base: 'BTC', quote: 'USD', symbol: 'BTC/USD' },
  { base: 'BTC', quote: 'USDT', symbol: 'BTC/USDT' },
  { base: 'ETH', quote: 'BTC', symbol: 'ETH/BTC' },
];

/**
 * Trading pair validation regex pattern
 * Property 1: Trading Pair Validation - accepts {BASE}/{QUOTE} format
 * Requirements: 1.2
 */
const TRADING_PAIR_PATTERN = /^[A-Z0-9]+\/[A-Z0-9]+$/;

/**
 * Validates a trading pair string format
 * @param input - The input string to validate
 * @returns true if the input matches BASE/QUOTE format, false otherwise
 */
export function validateTradingPair(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return false;
  }
  const trimmed = input.trim().toUpperCase();
  return TRADING_PAIR_PATTERN.test(trimmed);
}

/**
 * Parses a trading pair string into a TradingPair object
 * @param input - The input string in BASE/QUOTE format
 * @returns TradingPair object or null if invalid
 */
export function parseTradingPair(input: string): TradingPair | null {
  if (!validateTradingPair(input)) {
    return null;
  }
  const trimmed = input.trim().toUpperCase();
  const [base, quote] = trimmed.split('/');
  return {
    base,
    quote,
    symbol: trimmed,
  };
}

/**
 * Props for TradingPairSelector component
 */
interface TradingPairSelectorProps {
  /** Currently selected trading pairs */
  selectedPairs: TradingPair[];
  /** Callback when pairs change */
  onPairsChange: (pairs: TradingPair[]) => void;
  /** Maximum number of pairs allowed (for subscription limits) */
  maxPairs?: number;
  /** Whether to show upgrade prompt when limit reached */
  showUpgradePrompt?: boolean;
  /** Callback when upgrade is requested */
  onUpgradeRequest?: () => void;
  /** Whether the component is disabled */
  disabled?: boolean;
}

/**
 * TradingPairSelector Component
 * 
 * Allows users to select and configure trading pairs for monitoring.
 * Provides input validation, common pair suggestions, and add/remove functionality.
 * 
 * Requirements: 1.1, 1.2
 * - Display trading pair input interface with common pairs as suggestions
 * - Validate format and add to monitoring list
 */
export function TradingPairSelector({
  selectedPairs,
  onPairsChange,
  maxPairs,
  showUpgradePrompt = false,
  onUpgradeRequest,
  disabled = false,
}: TradingPairSelectorProps) {
  const [inputValue, setInputValue] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  /**
   * Checks if a pair is already selected
   */
  const isPairSelected = useCallback(
    (symbol: string): boolean => {
      return selectedPairs.some((pair) => pair.symbol === symbol.toUpperCase());
    },
    [selectedPairs]
  );

  /**
   * Handles adding a new trading pair
   */
  const handleAddPair = useCallback(
    (pairInput: string) => {
      // Clear previous error
      setValidationError(null);

      // Validate input format
      if (!validateTradingPair(pairInput)) {
        setValidationError('Invalid format. Use BASE/QUOTE (e.g., ETH/USDT)');
        return;
      }

      const pair = parseTradingPair(pairInput);
      if (!pair) {
        setValidationError('Invalid trading pair');
        return;
      }

      // Check if already selected
      if (isPairSelected(pair.symbol)) {
        setValidationError('This pair is already added');
        return;
      }

      // Check max pairs limit
      if (maxPairs !== undefined && selectedPairs.length >= maxPairs) {
        if (showUpgradePrompt && onUpgradeRequest) {
          onUpgradeRequest();
        }
        setValidationError(`Maximum ${maxPairs} pair(s) allowed. Upgrade for more.`);
        return;
      }

      // Add the pair
      onPairsChange([...selectedPairs, pair]);
      setInputValue('');
    },
    [selectedPairs, onPairsChange, isPairSelected, maxPairs, showUpgradePrompt, onUpgradeRequest]
  );

  /**
   * Handles removing a trading pair
   */
  const handleRemovePair = useCallback(
    (symbol: string) => {
      onPairsChange(selectedPairs.filter((pair) => pair.symbol !== symbol));
    },
    [selectedPairs, onPairsChange]
  );

  /**
   * Handles form submission
   */
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (inputValue.trim()) {
        handleAddPair(inputValue);
      }
    },
    [inputValue, handleAddPair]
  );

  /**
   * Handles input change
   */
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value.toUpperCase());
    // Clear error when user starts typing
    if (validationError) {
      setValidationError(null);
    }
  }, [validationError]);

  /**
   * Handles clicking a suggestion
   */
  const handleSuggestionClick = useCallback(
    (pair: TradingPair) => {
      if (!isPairSelected(pair.symbol)) {
        handleAddPair(pair.symbol);
      }
    },
    [isPairSelected, handleAddPair]
  );

  return (
    <div className="w-full">
      {/* Section Title */}
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Trading Pairs</h3>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              placeholder="Enter pair (e.g., ETH/USDT)"
              disabled={disabled}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationError
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300'
              } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
              aria-label="Trading pair input"
              aria-invalid={!!validationError}
              aria-describedby={validationError ? 'pair-error' : undefined}
            />
          </div>
          <button
            type="submit"
            disabled={disabled || !inputValue.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Add
          </button>
        </div>
        {/* Validation Error */}
        {validationError && (
          <p id="pair-error" className="mt-2 text-sm text-red-600" role="alert">
            {validationError}
          </p>
        )}
      </form>

      {/* Common Pairs Suggestions */}
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">Common pairs:</p>
        <div className="flex flex-wrap gap-2">
          {COMMON_PAIRS.map((pair) => {
            const isSelected = isPairSelected(pair.symbol);
            return (
              <button
                key={pair.symbol}
                type="button"
                onClick={() => handleSuggestionClick(pair)}
                disabled={disabled || isSelected}
                className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                  isSelected
                    ? 'bg-blue-100 border-blue-300 text-blue-700 cursor-default'
                    : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200 hover:border-gray-400'
                } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                aria-pressed={isSelected}
              >
                {pair.symbol}
                {isSelected && ' ✓'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Pairs List */}
      <div>
        <p className="text-sm text-gray-600 mb-2">
          Selected pairs ({selectedPairs.length}
          {maxPairs !== undefined && `/${maxPairs}`}):
        </p>
        {selectedPairs.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No pairs selected</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selectedPairs.map((pair) => (
              <div
                key={pair.symbol}
                className="flex items-center gap-1 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full"
              >
                <span className="text-sm text-blue-800">{pair.symbol}</span>
                <button
                  type="button"
                  onClick={() => handleRemovePair(pair.symbol)}
                  disabled={disabled}
                  className="ml-1 text-blue-600 hover:text-red-600 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={`Remove ${pair.symbol}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upgrade Prompt */}
      {showUpgradePrompt && maxPairs !== undefined && selectedPairs.length >= maxPairs && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            Free tier is limited to {maxPairs} trading pair(s).{' '}
            <button
              type="button"
              onClick={onUpgradeRequest}
              className="text-yellow-900 font-semibold underline hover:no-underline"
            >
              Upgrade to add more
            </button>
          </p>
        </div>
      )}
    </div>
  );
}

export default TradingPairSelector;

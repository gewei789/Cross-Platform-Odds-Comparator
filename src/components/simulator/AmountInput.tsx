'use client';

import React, { useState, useCallback, useEffect, useId } from 'react';

/**
 * Props for AmountInput component
 */
interface AmountInputProps {
  /** Current amount value */
  value: number;
  /** Callback when amount changes */
  onChange: (amount: number) => void;
  /** Label for the input */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Currency symbol to display */
  currency?: string;
  /** Minimum allowed value */
  min?: number;
  /** Maximum allowed value */
  max?: number;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Validates a numeric input value
 * @param input - The input string to validate
 * @returns true if the input is a valid number, false otherwise
 */
export function validateNumericInput(input: string): boolean {
  if (!input || input.trim() === '') {
    return false;
  }
  
  // Allow numbers with optional decimal point
  const numericPattern = /^-?\d*\.?\d+$/;
  return numericPattern.test(input.trim());
}

/**
 * Parses a numeric input string to a number
 * @param input - The input string to parse
 * @returns Parsed number or 0 if invalid
 */
export function parseNumericInput(input: string): number {
  if (!validateNumericInput(input)) {
    return 0;
  }
  const parsed = parseFloat(input.trim());
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * AmountInput Component
 * 
 * Numeric input with validation for trade amount entry.
 * Accepts and validates numeric values for profit simulation.
 * 
 * Requirements: 4.1
 * - Accept and validate numeric trade amount values
 */
export function AmountInput({
  value,
  onChange,
  label = 'Trade Amount',
  placeholder = 'Enter amount',
  currency = 'USDT',
  min = 0,
  max,
  disabled = false,
  className = '',
}: AmountInputProps) {
  // Generate unique IDs for accessibility
  const inputId = useId();
  const errorId = useId();
  const currencyId = useId();
  
  // Local state for input value (string) to allow partial input like "123."
  const [inputValue, setInputValue] = useState<string>(value.toString());
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Sync input value when prop value changes externally
  useEffect(() => {
    if (!isFocused) {
      setInputValue(value.toString());
    }
  }, [value, isFocused]);

  /**
   * Handles input change
   */
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Clear error when user starts typing
    if (validationError) {
      setValidationError(null);
    }

    // Allow empty input
    if (newValue === '') {
      setInputValue('');
      onChange(0);
      return;
    }

    // Allow partial input like "123." or "0."
    if (/^-?\d*\.?\d*$/.test(newValue)) {
      setInputValue(newValue);
      
      // Only update parent if it's a complete valid number
      if (validateNumericInput(newValue)) {
        const parsed = parseNumericInput(newValue);
        onChange(parsed);
      }
    }
  }, [onChange, validationError]);

  /**
   * Handles input blur - validate and format
   */
  const handleBlur = useCallback(() => {
    setIsFocused(false);
    
    // Validate on blur
    if (inputValue === '' || inputValue === '-') {
      setValidationError('Please enter a valid amount');
      setInputValue('0');
      onChange(0);
      return;
    }

    if (!validateNumericInput(inputValue)) {
      setValidationError('Please enter a valid number');
      setInputValue('0');
      onChange(0);
      return;
    }

    const parsed = parseNumericInput(inputValue);

    // Check minimum value
    if (min !== undefined && parsed < min) {
      setValidationError(`Amount must be at least ${min}`);
      setInputValue(min.toString());
      onChange(min);
      return;
    }

    // Check maximum value
    if (max !== undefined && parsed > max) {
      setValidationError(`Amount must not exceed ${max}`);
      setInputValue(max.toString());
      onChange(max);
      return;
    }

    // Format the value (remove trailing dots, etc.)
    const formatted = parsed.toString();
    setInputValue(formatted);
    onChange(parsed);
  }, [inputValue, onChange, min, max]);

  /**
   * Handles input focus
   */
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setValidationError(null);
  }, []);

  /**
   * Handles increment button
   */
  const handleIncrement = useCallback(() => {
    const current = parseNumericInput(inputValue) || 0;
    const step = current >= 1000 ? 100 : current >= 100 ? 10 : 1;
    const newValue = current + step;
    
    if (max === undefined || newValue <= max) {
      setInputValue(newValue.toString());
      onChange(newValue);
    }
  }, [inputValue, onChange, max]);

  /**
   * Handles decrement button
   */
  const handleDecrement = useCallback(() => {
    const current = parseNumericInput(inputValue) || 0;
    const step = current > 1000 ? 100 : current > 100 ? 10 : 1;
    const newValue = Math.max(min, current - step);
    
    setInputValue(newValue.toString());
    onChange(newValue);
  }, [inputValue, onChange, min]);

  return (
    <div className={`w-full ${className}`}>
      {/* Label */}
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          {label}
        </label>
      )}

      {/* Input Group */}
      <div className="relative">
        <div className="flex items-center">
          {/* Decrement Button */}
          <button
            type="button"
            onClick={handleDecrement}
            disabled={disabled || parseNumericInput(inputValue) <= min}
            className="px-3 py-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            aria-label="Decrease amount"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 12H4"
              />
            </svg>
          </button>

          {/* Input Field */}
          <div className="relative flex-1">
            <input
              id={inputId}
              type="text"
              inputMode="decimal"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleBlur}
              onFocus={handleFocus}
              placeholder={placeholder}
              disabled={disabled}
              className={`w-full px-4 py-2 border-t border-b text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationError
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300'
              } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
              aria-label="Amount input"
              aria-invalid={!!validationError}
              aria-describedby={validationError ? errorId : currencyId}
            />
            {/* Currency Label */}
            {currency && (
              <span
                id={currencyId}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 pointer-events-none"
              >
                {currency}
              </span>
            )}
          </div>

          {/* Increment Button */}
          <button
            type="button"
            onClick={handleIncrement}
            disabled={disabled || (max !== undefined && parseNumericInput(inputValue) >= max)}
            className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            aria-label="Increase amount"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </div>

        {/* Validation Error */}
        {validationError && (
          <p id={errorId} className="mt-2 text-sm text-red-600" role="alert">
            {validationError}
          </p>
        )}
      </div>

      {/* Helper Text */}
      {!validationError && (min !== undefined || max !== undefined) && (
        <p className="mt-2 text-xs text-gray-500">
          {min !== undefined && max !== undefined
            ? `Enter a value between ${min} and ${max}`
            : min !== undefined
            ? `Minimum value: ${min}`
            : `Maximum value: ${max}`}
        </p>
      )}
    </div>
  );
}

export default AmountInput;

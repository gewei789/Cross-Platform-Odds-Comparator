'use client';

import React, { useState, useCallback, useEffect, useId } from 'react';
import { FeeConfig } from '@/types';

/**
 * Props for FeeConfigForm component
 */
interface FeeConfigFormProps {
  /** Current fee configuration */
  value: FeeConfig;
  /** Callback when fee configuration changes */
  onChange: (config: FeeConfig) => void;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Props for individual fee input field
 */
interface FeeInputFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  onFocus: () => void;
  placeholder: string;
  suffix?: string;
  disabled?: boolean;
  error?: string | null;
  helpText?: string;
  min?: number;
  max?: number;
}

/**
 * Validates a numeric input value for fees
 * @param input - The input string to validate
 * @returns true if the input is a valid non-negative number, false otherwise
 */
export function validateFeeInput(input: string): boolean {
  if (!input || input.trim() === '') {
    return false;
  }
  
  // Allow non-negative numbers with optional decimal point
  const numericPattern = /^\d*\.?\d+$/;
  return numericPattern.test(input.trim());
}

/**
 * Parses a fee input string to a number
 * @param input - The input string to parse
 * @returns Parsed number or 0 if invalid
 */
export function parseFeeInput(input: string): number {
  if (!validateFeeInput(input)) {
    return 0;
  }
  const parsed = parseFloat(input.trim());
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Individual fee input field component
 */
function FeeInputField({
  id,
  label,
  value,
  onChange,
  onBlur,
  onFocus,
  placeholder,
  suffix,
  disabled = false,
  error = null,
  helpText,
  min,
  max,
}: FeeInputFieldProps) {
  const errorId = `${id}-error`;
  const helpId = `${id}-help`;

  return (
    <div className="w-full">
      {/* Label */}
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        {label}
      </label>

      {/* Input Field */}
      <div className="relative">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          onFocus={onFocus}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300'
          } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'} ${
            suffix ? 'pr-12' : ''
          }`}
          aria-label={label}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : helpText ? helpId : undefined}
        />
        {/* Suffix Label */}
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 pointer-events-none">
            {suffix}
          </span>
        )}
      </div>

      {/* Validation Error */}
      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {/* Helper Text */}
      {!error && helpText && (
        <p id={helpId} className="mt-1 text-xs text-gray-500">
          {helpText}
        </p>
      )}
    </div>
  );
}

/**
 * FeeConfigForm Component
 * 
 * Form for configuring trading fees including buy fee rate, sell fee rate,
 * withdrawal fee, and gas fee. Used for profit simulation calculations.
 * 
 * Requirements: 4.2, 4.3
 * - Accept user-configured buy fee rate, sell fee rate, and withdrawal fee
 * - Accept user-input gas fee estimates
 */
export function FeeConfigForm({
  value,
  onChange,
  disabled = false,
  className = '',
}: FeeConfigFormProps) {
  // Generate unique IDs for accessibility
  const buyFeeId = useId();
  const sellFeeId = useId();
  const withdrawalFeeId = useId();
  const gasFeeId = useId();

  // Local state for input values (strings) to allow partial input
  const [buyFeeInput, setBuyFeeInput] = useState<string>((value.buyFeeRate * 100).toString());
  const [sellFeeInput, setSellFeeInput] = useState<string>((value.sellFeeRate * 100).toString());
  const [withdrawalFeeInput, setWithdrawalFeeInput] = useState<string>(value.withdrawalFee.toString());
  const [gasFeeInput, setGasFeeInput] = useState<string>(value.gasFee.toString());

  // Validation errors
  const [buyFeeError, setBuyFeeError] = useState<string | null>(null);
  const [sellFeeError, setSellFeeError] = useState<string | null>(null);
  const [withdrawalFeeError, setWithdrawalFeeError] = useState<string | null>(null);
  const [gasFeeError, setGasFeeError] = useState<string | null>(null);

  // Focus state
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Sync input values when prop value changes externally
  useEffect(() => {
    if (focusedField !== 'buyFee') {
      setBuyFeeInput((value.buyFeeRate * 100).toString());
    }
  }, [value.buyFeeRate, focusedField]);

  useEffect(() => {
    if (focusedField !== 'sellFee') {
      setSellFeeInput((value.sellFeeRate * 100).toString());
    }
  }, [value.sellFeeRate, focusedField]);

  useEffect(() => {
    if (focusedField !== 'withdrawalFee') {
      setWithdrawalFeeInput(value.withdrawalFee.toString());
    }
  }, [value.withdrawalFee, focusedField]);

  useEffect(() => {
    if (focusedField !== 'gasFee') {
      setGasFeeInput(value.gasFee.toString());
    }
  }, [value.gasFee, focusedField]);

  /**
   * Handles buy fee rate input change
   */
  const handleBuyFeeChange = useCallback((newValue: string) => {
    setBuyFeeError(null);

    // Allow empty input
    if (newValue === '') {
      setBuyFeeInput('');
      return;
    }

    // Allow partial input like "0." or "1."
    if (/^\d*\.?\d*$/.test(newValue)) {
      setBuyFeeInput(newValue);
      
      // Only update parent if it's a complete valid number
      if (validateFeeInput(newValue)) {
        const parsed = parseFeeInput(newValue);
        onChange({
          ...value,
          buyFeeRate: parsed / 100, // Convert percentage to decimal
        });
      }
    }
  }, [onChange, value]);

  /**
   * Handles sell fee rate input change
   */
  const handleSellFeeChange = useCallback((newValue: string) => {
    setSellFeeError(null);

    // Allow empty input
    if (newValue === '') {
      setSellFeeInput('');
      return;
    }

    // Allow partial input
    if (/^\d*\.?\d*$/.test(newValue)) {
      setSellFeeInput(newValue);
      
      if (validateFeeInput(newValue)) {
        const parsed = parseFeeInput(newValue);
        onChange({
          ...value,
          sellFeeRate: parsed / 100, // Convert percentage to decimal
        });
      }
    }
  }, [onChange, value]);

  /**
   * Handles withdrawal fee input change
   */
  const handleWithdrawalFeeChange = useCallback((newValue: string) => {
    setWithdrawalFeeError(null);

    // Allow empty input
    if (newValue === '') {
      setWithdrawalFeeInput('');
      return;
    }

    // Allow partial input
    if (/^\d*\.?\d*$/.test(newValue)) {
      setWithdrawalFeeInput(newValue);
      
      if (validateFeeInput(newValue)) {
        const parsed = parseFeeInput(newValue);
        onChange({
          ...value,
          withdrawalFee: parsed,
        });
      }
    }
  }, [onChange, value]);

  /**
   * Handles gas fee input change
   */
  const handleGasFeeChange = useCallback((newValue: string) => {
    setGasFeeError(null);

    // Allow empty input
    if (newValue === '') {
      setGasFeeInput('');
      return;
    }

    // Allow partial input
    if (/^\d*\.?\d*$/.test(newValue)) {
      setGasFeeInput(newValue);
      
      if (validateFeeInput(newValue)) {
        const parsed = parseFeeInput(newValue);
        onChange({
          ...value,
          gasFee: parsed,
        });
      }
    }
  }, [onChange, value]);

  /**
   * Handles buy fee blur - validate and format
   */
  const handleBuyFeeBlur = useCallback(() => {
    setFocusedField(null);

    if (buyFeeInput === '') {
      setBuyFeeError('Please enter a buy fee rate');
      setBuyFeeInput('0');
      onChange({ ...value, buyFeeRate: 0 });
      return;
    }

    if (!validateFeeInput(buyFeeInput)) {
      setBuyFeeError('Please enter a valid number');
      setBuyFeeInput('0');
      onChange({ ...value, buyFeeRate: 0 });
      return;
    }

    const parsed = parseFeeInput(buyFeeInput);

    // Check reasonable range (0-100%)
    if (parsed < 0) {
      setBuyFeeError('Fee rate cannot be negative');
      setBuyFeeInput('0');
      onChange({ ...value, buyFeeRate: 0 });
      return;
    }

    if (parsed > 100) {
      setBuyFeeError('Fee rate cannot exceed 100%');
      setBuyFeeInput('100');
      onChange({ ...value, buyFeeRate: 1 });
      return;
    }

    // Format the value
    const formatted = parsed.toString();
    setBuyFeeInput(formatted);
    onChange({ ...value, buyFeeRate: parsed / 100 });
  }, [buyFeeInput, onChange, value]);

  /**
   * Handles sell fee blur - validate and format
   */
  const handleSellFeeBlur = useCallback(() => {
    setFocusedField(null);

    if (sellFeeInput === '') {
      setSellFeeError('Please enter a sell fee rate');
      setSellFeeInput('0');
      onChange({ ...value, sellFeeRate: 0 });
      return;
    }

    if (!validateFeeInput(sellFeeInput)) {
      setSellFeeError('Please enter a valid number');
      setSellFeeInput('0');
      onChange({ ...value, sellFeeRate: 0 });
      return;
    }

    const parsed = parseFeeInput(sellFeeInput);

    if (parsed < 0) {
      setSellFeeError('Fee rate cannot be negative');
      setSellFeeInput('0');
      onChange({ ...value, sellFeeRate: 0 });
      return;
    }

    if (parsed > 100) {
      setSellFeeError('Fee rate cannot exceed 100%');
      setSellFeeInput('100');
      onChange({ ...value, sellFeeRate: 1 });
      return;
    }

    const formatted = parsed.toString();
    setSellFeeInput(formatted);
    onChange({ ...value, sellFeeRate: parsed / 100 });
  }, [sellFeeInput, onChange, value]);

  /**
   * Handles withdrawal fee blur - validate and format
   */
  const handleWithdrawalFeeBlur = useCallback(() => {
    setFocusedField(null);

    if (withdrawalFeeInput === '') {
      setWithdrawalFeeError('Please enter a withdrawal fee');
      setWithdrawalFeeInput('0');
      onChange({ ...value, withdrawalFee: 0 });
      return;
    }

    if (!validateFeeInput(withdrawalFeeInput)) {
      setWithdrawalFeeError('Please enter a valid number');
      setWithdrawalFeeInput('0');
      onChange({ ...value, withdrawalFee: 0 });
      return;
    }

    const parsed = parseFeeInput(withdrawalFeeInput);

    if (parsed < 0) {
      setWithdrawalFeeError('Fee cannot be negative');
      setWithdrawalFeeInput('0');
      onChange({ ...value, withdrawalFee: 0 });
      return;
    }

    const formatted = parsed.toString();
    setWithdrawalFeeInput(formatted);
    onChange({ ...value, withdrawalFee: parsed });
  }, [withdrawalFeeInput, onChange, value]);

  /**
   * Handles gas fee blur - validate and format
   */
  const handleGasFeeBlur = useCallback(() => {
    setFocusedField(null);

    if (gasFeeInput === '') {
      setGasFeeError('Please enter a gas fee');
      setGasFeeInput('0');
      onChange({ ...value, gasFee: 0 });
      return;
    }

    if (!validateFeeInput(gasFeeInput)) {
      setGasFeeError('Please enter a valid number');
      setGasFeeInput('0');
      onChange({ ...value, gasFee: 0 });
      return;
    }

    const parsed = parseFeeInput(gasFeeInput);

    if (parsed < 0) {
      setGasFeeError('Fee cannot be negative');
      setGasFeeInput('0');
      onChange({ ...value, gasFee: 0 });
      return;
    }

    const formatted = parsed.toString();
    setGasFeeInput(formatted);
    onChange({ ...value, gasFee: parsed });
  }, [gasFeeInput, onChange, value]);

  return (
    <div className={`w-full ${className}`}>
      {/* Form Title */}
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Fee Configuration
      </h3>

      {/* Form Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Buy Fee Rate */}
        <FeeInputField
          id={buyFeeId}
          label="Buy Fee Rate"
          value={buyFeeInput}
          onChange={handleBuyFeeChange}
          onBlur={handleBuyFeeBlur}
          onFocus={() => {
            setFocusedField('buyFee');
            setBuyFeeError(null);
          }}
          placeholder="0.1"
          suffix="%"
          disabled={disabled}
          error={buyFeeError}
          helpText="Trading fee when buying (e.g., 0.1 for 0.1%)"
        />

        {/* Sell Fee Rate */}
        <FeeInputField
          id={sellFeeId}
          label="Sell Fee Rate"
          value={sellFeeInput}
          onChange={handleSellFeeChange}
          onBlur={handleSellFeeBlur}
          onFocus={() => {
            setFocusedField('sellFee');
            setSellFeeError(null);
          }}
          placeholder="0.1"
          suffix="%"
          disabled={disabled}
          error={sellFeeError}
          helpText="Trading fee when selling (e.g., 0.1 for 0.1%)"
        />

        {/* Withdrawal Fee */}
        <FeeInputField
          id={withdrawalFeeId}
          label="Withdrawal Fee"
          value={withdrawalFeeInput}
          onChange={handleWithdrawalFeeChange}
          onBlur={handleWithdrawalFeeBlur}
          onFocus={() => {
            setFocusedField('withdrawalFee');
            setWithdrawalFeeError(null);
          }}
          placeholder="5.0"
          suffix="USDT"
          disabled={disabled}
          error={withdrawalFeeError}
          helpText="Fixed withdrawal fee in quote currency"
        />

        {/* Gas Fee */}
        <FeeInputField
          id={gasFeeId}
          label="Gas Fee"
          value={gasFeeInput}
          onChange={handleGasFeeChange}
          onBlur={handleGasFeeBlur}
          onFocus={() => {
            setFocusedField('gasFee');
            setGasFeeError(null);
          }}
          placeholder="2.0"
          suffix="USDT"
          disabled={disabled}
          error={gasFeeError}
          helpText="Estimated gas fee for blockchain transactions"
        />
      </div>

      {/* Info Box */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start">
          <svg
            className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Fee Configuration Tips</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Fee rates are percentages (e.g., 0.1% = 0.1)</li>
              <li>Withdrawal and gas fees are fixed amounts in quote currency</li>
              <li>Check your exchange's fee schedule for accurate rates</li>
              <li>Gas fees vary by network congestion</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FeeConfigForm;

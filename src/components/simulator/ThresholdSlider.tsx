'use client';

import React, { useCallback, useState, useEffect, useId } from 'react';

interface ThresholdSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
}

export function ThresholdSlider({
  value,
  onChange,
  min = 0.1,
  max = 10,
  step = 0.1,
  disabled = false,
  className = '',
}: ThresholdSliderProps) {
  const sliderId = useId();
  const displayId = useId();

  const [localValue, setLocalValue] = useState(value.toString());

  useEffect(() => {
    setLocalValue(value.toString());
  }, [value]);

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseFloat(e.target.value);
      setLocalValue(newValue.toString());
      onChange(newValue);
    },
    [onChange]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      setLocalValue(inputValue);

      const parsed = parseFloat(inputValue);
      if (!isNaN(parsed)) {
        const clampedValue = Math.max(min, Math.min(max, parsed));
        onChange(clampedValue);
      }
    },
    [onChange, min, max]
  );

  const handleBlur = useCallback(() => {
    const parsed = parseFloat(localValue);
    if (isNaN(parsed)) {
      setLocalValue(value.toString());
      return;
    }

    const clampedValue = Math.max(min, Math.min(max, parsed));
    const roundedValue = Math.round(clampedValue * 10) / 10;

    setLocalValue(roundedValue.toString());
    onChange(roundedValue);
  }, [localValue, value, min, max, onChange]);

  const handleReset = useCallback(() => {
    const defaultValue = 1.0;
    setLocalValue(defaultValue.toString());
    onChange(defaultValue);
  }, [onChange]);

  const percentFilled = ((value - min) / (max - min)) * 100;

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between items-center mb-2">
        <label htmlFor={sliderId} className="block text-sm font-medium text-gray-700">
          Alert Threshold
        </label>
        <span className="text-sm text-gray-500">Trigger alert when spread exceeds</span>
      </div>

      <div className="relative">
        <input
          id={sliderId}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleSliderChange}
          disabled={disabled}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={`Alert threshold slider: ${value}%`}
          aria-valuenow={value}
          aria-valuemin={min}
          aria-valuemax={max}
        />

        <div
          className="absolute top-0 left-0 h-2 bg-blue-600 rounded-lg pointer-events-none"
          style={{ width: `${percentFilled}%` }}
        />
      </div>

      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center space-x-2">
          <input
            type="number"
            id={displayId}
            value={localValue}
            onChange={handleInputChange}
            onBlur={handleBlur}
            disabled={disabled}
            step={step}
            min={min}
            max={max}
            className="w-20 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            aria-label="Alert threshold value"
          />
          <span className="text-sm font-medium text-gray-700">%</span>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-xs text-gray-500">
            Range: {min}% - {max}%
          </span>
          {!disabled && (
            <button
              onClick={handleReset}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Reset to default
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
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
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium">Alert Threshold</p>
            <p className="text-xs mt-1">
              You will receive a notification when spread exceeds {value.toFixed(1)}%. Lower
              thresholds mean more frequent alerts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ThresholdSlider;

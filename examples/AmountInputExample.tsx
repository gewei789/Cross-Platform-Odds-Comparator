'use client';

import React, { useState } from 'react';
import { AmountInput } from '../src/components/simulator/AmountInput';

/**
 * Example usage of the AmountInput component
 * 
 * This example demonstrates:
 * - Basic usage with default props
 * - Custom labels and currency
 * - Min/max validation
 * - Disabled state
 */
export default function AmountInputExample() {
  const [basicAmount, setBasicAmount] = useState(1000);
  const [btcAmount, setBtcAmount] = useState(0.5);
  const [limitedAmount, setLimitedAmount] = useState(500);
  const [disabledAmount, setDisabledAmount] = useState(100);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          AmountInput Component Examples
        </h1>

        <div className="space-y-8">
          {/* Basic Usage */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Basic Usage
            </h2>
            <AmountInput
              value={basicAmount}
              onChange={setBasicAmount}
            />
            <p className="mt-4 text-sm text-gray-600">
              Current value: <span className="font-mono font-semibold">{basicAmount}</span> USDT
            </p>
          </div>

          {/* Custom Currency */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Custom Currency (BTC)
            </h2>
            <AmountInput
              value={btcAmount}
              onChange={setBtcAmount}
              label="Bitcoin Amount"
              currency="BTC"
              placeholder="Enter BTC amount"
            />
            <p className="mt-4 text-sm text-gray-600">
              Current value: <span className="font-mono font-semibold">{btcAmount}</span> BTC
            </p>
          </div>

          {/* With Min/Max Limits */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              With Min/Max Limits
            </h2>
            <AmountInput
              value={limitedAmount}
              onChange={setLimitedAmount}
              label="Limited Amount"
              min={100}
              max={1000}
              currency="USDT"
            />
            <p className="mt-4 text-sm text-gray-600">
              Current value: <span className="font-mono font-semibold">{limitedAmount}</span> USDT
            </p>
            <p className="mt-2 text-xs text-gray-500">
              Try entering values below 100 or above 1000 and clicking outside the input
            </p>
          </div>

          {/* Disabled State */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Disabled State
            </h2>
            <AmountInput
              value={disabledAmount}
              onChange={setDisabledAmount}
              label="Disabled Input"
              disabled
            />
            <p className="mt-4 text-sm text-gray-600">
              This input is disabled and cannot be modified
            </p>
          </div>

          {/* Multiple Inputs in a Form */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Profit Simulator Form Example
            </h2>
            <div className="space-y-4">
              <AmountInput
                value={basicAmount}
                onChange={setBasicAmount}
                label="Trade Amount"
                currency="USDT"
                min={10}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <AmountInput
                  value={0.1}
                  onChange={() => {}}
                  label="Buy Fee Rate (%)"
                  currency="%"
                  min={0}
                  max={5}
                />
                <AmountInput
                  value={0.1}
                  onChange={() => {}}
                  label="Sell Fee Rate (%)"
                  currency="%"
                  min={0}
                  max={5}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <AmountInput
                  value={5}
                  onChange={() => {}}
                  label="Withdrawal Fee"
                  currency="USDT"
                  min={0}
                />
                <AmountInput
                  value={10}
                  onChange={() => {}}
                  label="Gas Fee"
                  currency="USDT"
                  min={0}
                />
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  This demonstrates how AmountInput can be used in a profit simulator form
                  with multiple inputs for different fee configurations.
                </p>
              </div>
            </div>
          </div>

          {/* Features Summary */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Features
            </h2>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>Numeric input validation - only accepts valid numbers</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>Increment/decrement buttons with smart step sizes</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>Min/max value validation with error messages</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>Decimal number support for precise amounts</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>Customizable currency display</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>Disabled state support</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>Accessible with ARIA labels and keyboard navigation</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>Real-time validation feedback</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

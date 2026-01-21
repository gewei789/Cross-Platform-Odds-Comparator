'use client';

import React from 'react';
import { ProfitResult } from '@/types';

interface ProfitDisplayProps {
  result: ProfitResult;
  tradeAmount: number;
  quoteCurrency?: string;
  className?: string;
}

interface ProfitItemProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  isNegative?: boolean;
  isHighlight?: boolean;
}

function ProfitItem({
  label,
  value,
  prefix = '',
  suffix = '',
  isNegative = false,
  isHighlight = false,
}: ProfitItemProps) {
  const formattedValue = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value));

  return (
    <div
      className={`flex justify-between items-center py-2 ${isHighlight ? 'border-t border-gray-200 mt-2 pt-3' : ''}`}
    >
      <span className={`text-sm ${isHighlight ? 'font-semibold' : 'text-gray-600'}`}>{label}</span>
      <span
        className={`font-mono font-medium ${
          isHighlight
            ? isNegative
              ? 'text-red-600 text-lg'
              : 'text-green-600 text-lg'
            : isNegative
              ? 'text-red-600'
              : 'text-gray-900'
        }`}
      >
        {prefix}
        {isNegative ? '-' : ''}
        {formattedValue}
        {suffix}
      </span>
    </div>
  );
}

export function ProfitDisplay({
  result,
  tradeAmount,
  quoteCurrency = 'USDT',
  className = '',
}: ProfitDisplayProps) {
  const { grossProfit, totalFees, netProfit, isProfitable } = result;

  return (
    <div className={`w-full bg-white rounded-lg border border-gray-200 ${className}`}>
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Profit Simulation Results</h3>
        <p className="text-sm text-gray-500 mt-1">
          Trade Amount:{' '}
          {new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(tradeAmount)}{' '}
          {quoteCurrency}
        </p>
      </div>

      <div className="p-4">
        <div className="space-y-1">
          <ProfitItem
            label="Gross Profit"
            value={grossProfit}
            prefix="+"
            suffix={` ${quoteCurrency}`}
            isNegative={grossProfit < 0}
          />

          <ProfitItem
            label="Total Fees"
            value={totalFees}
            prefix="-"
            suffix={` ${quoteCurrency}`}
            isNegative={true}
          />

          <div className="border-t border-gray-200 my-2" />

          <ProfitItem
            label="Net Profit"
            value={netProfit}
            suffix={` ${quoteCurrency}`}
            isNegative={netProfit < 0}
            isHighlight={true}
          />
        </div>

        <div
          className={`mt-4 p-3 rounded-lg text-center ${
            isProfitable ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}
        >
          <span className={`text-lg font-bold ${isProfitable ? 'text-green-700' : 'text-red-700'}`}>
            {isProfitable ? '✓ Profitable' : '✗ Unprofitable'}
          </span>
          <p className={`text-xs mt-1 ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
            {isProfitable
              ? 'This trade has positive expected profit after fees'
              : 'This trade would result in a loss after fees'}
          </p>
        </div>

        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-start">
            <svg
              className="h-5 w-5 text-gray-400 mt-0.5 mr-2 flex-shrink-0"
              xmlns="http://www.w3.org/2000/svg"
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
            <div className="text-xs text-gray-600">
              <p className="font-medium mb-1">Simulation Only</p>
              <p>
                This is a theoretical calculation based on current prices and configured fees.
                Actual profits may vary due to price movements, slippage, and network conditions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfitDisplay;

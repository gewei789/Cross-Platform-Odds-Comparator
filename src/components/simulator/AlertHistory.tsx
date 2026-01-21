'use client';

import React from 'react';
import { AlertRecord } from '@/types';

interface AlertHistoryProps {
  alerts: AlertRecord[];
  maxItems?: number;
  onAcknowledge?: (id: string) => void;
  onClearAll?: () => void;
  className?: string;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

function AlertItem({
  alert,
  onAcknowledge,
}: {
  alert: AlertRecord;
  onAcknowledge?: (id: string) => void;
}) {
  const { id, spread, estimatedProfit, triggeredAt, acknowledged } = alert;

  const isProfitable = estimatedProfit.isProfitable;

  return (
    <div
      className={`p-4 border rounded-lg mb-3 ${
        acknowledged
          ? 'bg-gray-50 border-gray-200'
          : isProfitable
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
      }`}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="font-semibold text-gray-900">{spread.pair.symbol}</span>
            <span
              className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                acknowledged
                  ? 'bg-gray-200 text-gray-700'
                  : isProfitable
                    ? 'bg-green-200 text-green-800'
                    : 'bg-red-200 text-red-800'
              }`}
            >
              {spread.spreadPercent.toFixed(2)}% spread
            </span>
            {!acknowledged && (
              <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                New
              </span>
            )}
          </div>

          <div className="text-sm text-gray-600 space-y-1">
            <p>
              <span className="font-medium">Buy:</span> {spread.buyExchange} @{' '}
              {spread.buyPrice.toFixed(2)}
            </p>
            <p>
              <span className="font-medium">Sell:</span> {spread.sellExchange} @{' '}
              {spread.sellPrice.toFixed(2)}
            </p>
            <p>
              <span className="font-medium">Est. Profit:</span>{' '}
              <span className={isProfitable ? 'text-green-600' : 'text-red-600'}>
                {estimatedProfit.netProfit.toFixed(2)} USDT
                {isProfitable ? ' (Profitable)' : ' (Unprofitable)'}
              </span>
            </p>
            <p className="text-xs text-gray-500 mt-1">{formatDate(triggeredAt)}</p>
          </div>
        </div>

        {onAcknowledge && !acknowledged && (
          <button
            onClick={() => onAcknowledge(id)}
            className="ml-4 px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 border border-blue-200 rounded hover:bg-blue-50"
          >
            Acknowledge
          </button>
        )}
      </div>
    </div>
  );
}

export function AlertHistory({
  alerts,
  maxItems = 50,
  onAcknowledge,
  onClearAll,
  className = '',
}: AlertHistoryProps) {
  const displayAlerts = alerts.slice(0, maxItems);
  const hasAlerts = displayAlerts.length > 0;
  const hasUnacknowledged = displayAlerts.some((alert) => !alert.acknowledged);

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Alert History</h3>
        <div className="flex items-center space-x-2">
          {hasAlerts && (
            <span className="text-sm text-gray-500">
              {alerts.length} {alerts.length === 1 ? 'alert' : 'alerts'}
              {alerts.length > maxItems && ` (showing ${maxItems})`}
            </span>
          )}
          {hasAlerts && onClearAll && (
            <button
              onClick={onClearAll}
              className="px-3 py-1 text-xs font-medium text-red-600 hover:text-red-800 border border-red-200 rounded hover:bg-red-50"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {hasAlerts ? (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {displayAlerts.map((alert) => (
            <AlertItem key={alert.id} alert={alert} onAcknowledge={onAcknowledge} />
          ))}
        </div>
      ) : (
        <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-lg">
          <svg
            className="h-12 w-12 text-gray-400 mx-auto mb-3"
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
          <p className="text-gray-500 mb-1">No alerts yet</p>
          <p className="text-sm text-gray-400">
            You will see alerts here when spread exceeds your threshold.
          </p>
        </div>
      )}

      {hasUnacknowledged && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <svg
              className="h-5 w-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0"
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
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Unacknowledged Alerts</p>
              <p className="text-xs mt-1">
                You have unacknowledged alerts. Click "Acknowledge" to mark them as read.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AlertHistory;

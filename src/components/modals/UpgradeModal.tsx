'use client';

import React, { useState, useCallback } from 'react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

export function UpgradeModal({ isOpen, onClose, onUpgrade }: UpgradeModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUpgrade = useCallback(async () => {
    setIsProcessing(true);
    try {
      await onUpgrade();
    } finally {
      setIsProcessing(false);
    }
  }, [onUpgrade]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />

        <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Upgrade to Pro</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white text-center mb-4">
                <p className="text-4xl font-bold mb-1">$4.99</p>
                <p className="text-blue-100">One-time payment</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <svg
                    className="h-5 w-5 text-green-500 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-gray-700">Unlimited trading pairs</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg
                    className="h-5 w-5 text-green-500 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-gray-700">Historical data simulation</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg
                    className="h-5 w-5 text-green-500 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-gray-700">Priority alerts & notifications</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg
                    className="h-5 w-5 text-green-500 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-gray-700">Advanced profit calculator</span>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 mb-4">
              <p className="text-sm text-gray-600 mb-2">Free Tier Limitations:</p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Only 1 trading pair</li>
                <li>• No historical data</li>
                <li>• Basic features only</li>
              </ul>
            </div>

            <button
              onClick={handleUpgrade}
              disabled={isProcessing}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50"
            >
              {isProcessing ? 'Processing...' : 'Upgrade Now - $4.99'}
            </button>

            <p className="text-xs text-gray-500 text-center mt-3">
              Secure payment via Stripe. Cancel anytime.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UpgradeModal;

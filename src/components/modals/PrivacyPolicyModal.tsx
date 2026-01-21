'use client';

import React, { useState, useCallback, useEffect } from 'react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function PrivacyPolicyModal({ isOpen, onClose, onConfirm }: PrivacyPolicyModalProps) {
  const [hasAccepted, setHasAccepted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setHasAccepted(false);
    }
  }, [isOpen]);

  const handleConfirm = useCallback(() => {
    if (hasAccepted) {
      onConfirm();
    }
  }, [hasAccepted, onConfirm]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 transition-opacity" />

        <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Privacy Policy & Disclaimer</h2>
          </div>

          <div className="p-6 overflow-y-auto flex-1">
            <div className="prose prose-sm max-w-none space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Important Disclaimer</h3>
                <p className="text-yellow-800">
                  This app provides simulation only, not investment advice. Users bear their own
                  trading risks. All calculations are theoretical and may not reflect actual trading
                  results.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">🔒 Privacy Policy</h3>
                <p className="text-gray-600">
                  Your privacy is important to us. This application operates entirely on the client
                  side, meaning:
                </p>
                <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
                  <li>All data processing happens in your browser</li>
                  <li>No personal information is collected or stored</li>
                  <li>No trading data is uploaded to any server</li>
                  <li>Configuration data is stored only in your browser's localStorage</li>
                  <li>You can clear all local data at any time from settings</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">📊 Data Usage</h3>
                <p className="text-gray-600">
                  The app uses the CoinGecko API to fetch real-time cryptocurrency prices. API calls
                  are made directly from your browser to CoinGecko's servers. We do not have access
                  to your IP address or API usage patterns.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">🍪 Cookies & Local Storage</h3>
                <p className="text-gray-600">
                  The app uses localStorage to store your preferences (selected exchanges, trading
                  pairs, fee configuration, and subscription status). This data never leaves your
                  device.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">⚡ Your Rights</h3>
                <p className="text-gray-600">You have the right to:</p>
                <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
                  <li>Clear all local data at any time</li>
                  <li>Opt out of browser notifications</li>
                  <li>Use the app without providing any personal information</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <label className="flex items-start gap-3 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={hasAccepted}
                onChange={(e) => setHasAccepted(e.target.checked)}
                className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">
                I have read and understood the privacy policy and disclaimer. I accept full
                responsibility for my trading decisions.
              </span>
            </label>

            <div className="flex gap-3">
              <button
                onClick={handleConfirm}
                disabled={!hasAccepted}
                className="flex-1 py-2 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                I Understand & Accept
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPolicyModal;

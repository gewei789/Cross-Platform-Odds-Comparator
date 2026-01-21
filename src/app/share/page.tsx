'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ScreenshotPreview } from '../../components/share/ScreenshotPreview';
import { ShareButtons } from '../../components/share/ShareButtons';
import { useAppContext } from '../../context/AppContext';
import { calculateProfit } from '../../services/profitSimulator';
import { generateScreenshot, downloadScreenshot } from '../../services/screenshotGenerator';
import { ProfitResult } from '../../types';

export default function SharePage() {
  const router = useRouter();
  const { state } = useAppContext();
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string | null>(null);
  const [profitResult, setProfitResult] = useState<ProfitResult | null>(null);

  const hasValidConfig = useMemo(() => {
    return state.selectedPairs.length > 0 && state.selectedExchanges.length >= 2;
  }, [state.selectedPairs, state.selectedExchanges]);

  useEffect(() => {
    if (!hasValidConfig) {
      router.push('/config');
    }
  }, [hasValidConfig, router]);

  useEffect(() => {
    if (state.spreadResults.length > 0 && state.priceData.length > 0) {
      const bestSpread = state.spreadResults[0];
      const result = calculateProfit(bestSpread, 1000, state.feeConfig);
      setProfitResult(result);
    }
  }, [state.spreadResults, state.priceData, state.feeConfig]);

  const handleGenerateScreenshot = useCallback(async () => {
    if (state.spreadResults.length === 0) {
      return;
    }

    const bestSpread = state.spreadResults[0];
    const profit = calculateProfit(bestSpread, 1000, state.feeConfig);

    try {
      const dataUrl = await generateScreenshot(bestSpread, profit, {
        elementId: 'share-content',
      });
      setScreenshotDataUrl(dataUrl);
    } catch (error) {
      console.error('Failed to generate screenshot:', error);
    }
  }, [state.spreadResults, state.feeConfig]);

  const handleDownload = useCallback(() => {
    if (!screenshotDataUrl) {
      return;
    }

    const filename = `arbitrage-${state.selectedPairs[0]?.symbol || 'opportunity'}-${Date.now()}.png`;
    downloadScreenshot(screenshotDataUrl, filename);
  }, [screenshotDataUrl, state.selectedPairs]);

  const handleBackToScanner = useCallback(() => {
    router.push('/scanner');
  }, [router]);

  const handleBackToSimulator = useCallback(() => {
    router.push('/simulator');
  }, [router]);

  if (!hasValidConfig) {
    return null;
  }

  const bestSpread = state.spreadResults[0];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Share Opportunity</h1>
              <p className="mt-1 text-sm text-gray-600">
                Generate screenshots and share arbitrage opportunities
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleBackToSimulator}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Simulator
              </button>
              <button
                onClick={handleBackToScanner}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Scanner
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {bestSpread && profitResult ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div id="share-content" className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Arbitrage Opportunity</h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Trading Pair</span>
                    <span className="font-semibold text-gray-900">{bestSpread.pair.symbol}</span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Buy Exchange</span>
                    <span className="font-semibold text-gray-900 capitalize">
                      {bestSpread.buyExchange}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Sell Exchange</span>
                    <span className="font-semibold text-gray-900 capitalize">
                      {bestSpread.sellExchange}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Buy Price</span>
                    <span className="font-semibold text-gray-900">
                      {bestSpread.buyPrice.toFixed(2)} USDT
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Sell Price</span>
                    <span className="font-semibold text-gray-900">
                      {bestSpread.sellPrice.toFixed(2)} USDT
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Spread</span>
                    <span className="font-semibold text-green-600">
                      {bestSpread.spreadPercent.toFixed(2)}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Est. Net Profit</span>
                    <span
                      className={`font-semibold ${
                        profitResult.isProfitable ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {profitResult.netProfit.toFixed(2)} USDT
                      {profitResult.isProfitable ? ' (Profitable)' : ' (Unprofitable)'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <span className="text-gray-600">Timestamp</span>
                    <span className="text-sm text-gray-500">{new Date().toLocaleString()}</span>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-800">
                    <strong>Disclaimer:</strong> This app provides simulation only, not investment
                    advice. Users bear their own trading risks. All data processing is completed
                    locally.
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 text-center">
                    Generated by Arbitrage Scanner - For reference only, not investment advice
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <ScreenshotPreview
                spread={bestSpread}
                profit={profitResult}
                screenshotDataUrl={screenshotDataUrl}
                onGenerate={handleGenerateScreenshot}
                onDownload={handleDownload}
              />

              <ShareButtons spread={bestSpread} profit={profitResult} />
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <svg
              className="mx-auto h-16 w-16 text-gray-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Opportunity Available</h3>
            <p className="text-gray-600 mb-4">
              Start scanning from the Scanner page to discover arbitrage opportunities.
            </p>
            <button
              onClick={handleBackToScanner}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Scanner
            </button>
          </div>
        )}

        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0"
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
            <p className="text-sm text-yellow-800">
              <strong>Disclaimer:</strong> This app provides simulation only, not investment advice.
              Users bear their own trading risks. All data processing is completed locally.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

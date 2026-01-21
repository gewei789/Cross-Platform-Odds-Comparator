'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AmountInput } from '../../components/simulator/AmountInput';
import { FeeConfigForm } from '../../components/simulator/FeeConfigForm';
import { ProfitDisplay } from '../../components/simulator/ProfitDisplay';
import { ThresholdSlider } from '../../components/simulator/ThresholdSlider';
import { AlertHistory } from '../../components/simulator/AlertHistory';
import { useAppContext } from '../../context/AppContext';
import { useAlerts } from '../../hooks/useAlerts';
import { calculateProfit } from '../../services/profitSimulator';
import { FeeConfig, ProfitResult } from '../../types';

const DEFAULT_FEE_CONFIG: FeeConfig = {
  buyFeeRate: 0.001,
  sellFeeRate: 0.001,
  withdrawalFee: 0,
  gasFee: 0,
};

export default function SimulatorPage() {
  const router = useRouter();
  const { state, dispatch } = useAppContext();
  const { alertHistory, setAlertThreshold, clearAlerts, acknowledgeAlert } = useAlerts();

  const [amount, setAmount] = useState<number>(1000);
  const [feeConfig, setFeeConfig] = useState<FeeConfig>(DEFAULT_FEE_CONFIG);
  const [threshold, setThreshold] = useState(1.0);
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
    dispatch({ type: 'SET_ALERT_THRESHOLD', payload: threshold });
  }, [threshold, dispatch]);

  const handleAmountChange = useCallback((value: number) => {
    setAmount(value);
  }, []);

  const handleFeeConfigChange = useCallback((config: FeeConfig) => {
    setFeeConfig(config);
  }, []);

  const handleThresholdChange = useCallback(
    (value: number) => {
      setThreshold(value);
      setAlertThreshold(value);
    },
    [setAlertThreshold]
  );

  const handleCalculateProfit = useCallback(() => {
    if (state.spreadResults.length === 0) {
      return;
    }

    const bestSpread = state.spreadResults[0];

    if (amount <= 0) {
      return;
    }

    const result = calculateProfit(bestSpread, amount, feeConfig);
    setProfitResult(result);
  }, [state.spreadResults, amount, feeConfig]);

  const handleAcknowledgeAlert = useCallback(
    (id: string) => {
      acknowledgeAlert(id);
    },
    [acknowledgeAlert]
  );

  const handleClearAllAlerts = useCallback(() => {
    clearAlerts();
  }, [clearAlerts]);

  const handleBackToScanner = useCallback(() => {
    router.push('/scanner');
  }, [router]);

  if (!hasValidConfig) {
    return null;
  }

  const isValidAmount = amount > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Profit Simulator</h1>
              <p className="mt-1 text-sm text-gray-600">
                Simulate profit after fees for {state.selectedPairs[0]?.symbol || 'selected pair'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleBackToScanner}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                Back to Scanner
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <AmountInput
              value={amount}
              onChange={handleAmountChange}
              disabled={state.spreadResults.length === 0}
            />

            <FeeConfigForm value={feeConfig} onChange={handleFeeConfigChange} />

            {profitResult && (
              <ProfitDisplay result={profitResult} tradeAmount={amount} quoteCurrency="USDT" />
            )}
          </div>

          <div className="space-y-6">
            <ThresholdSlider
              value={threshold}
              onChange={handleThresholdChange}
              min={0.1}
              max={10}
              step={0.1}
            />

            <AlertHistory
              alerts={alertHistory}
              maxItems={50}
              onAcknowledge={handleAcknowledgeAlert}
              onClearAll={handleClearAllAlerts}
            />
          </div>
        </div>

        {state.spreadResults.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0"
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
              <div>
                <p className="text-sm font-medium text-blue-800">Current Best Opportunity</p>
                <p className="text-sm text-blue-700 mt-1">
                  {state.spreadResults[0].pair.symbol}: Buy on {state.spreadResults[0].buyExchange}{' '}
                  @ {state.spreadResults[0].buyPrice.toFixed(2)}, Sell on{' '}
                  {state.spreadResults[0].sellExchange} @{' '}
                  {state.spreadResults[0].sellPrice.toFixed(2)}
                  <br />
                  Spread: {state.spreadResults[0].spreadPercent.toFixed(2)}%
                </p>
              </div>
            </div>
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

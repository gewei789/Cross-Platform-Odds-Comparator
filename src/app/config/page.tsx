'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { TradingPairSelector } from '../../components/config/TradingPairSelector';
import { ExchangeSelector, validateExchangeSelection } from '../../components/config/ExchangeSelector';
import { useAppContext, actions } from '../../context/AppContext';
import { useSubscription } from '../../hooks/useSubscription';
import { TradingPair, Exchange } from '../../types';

/**
 * UpgradePromptModal Component
 * Shows upgrade prompt for free users trying to add multiple pairs
 * Requirements: 1.5 - Display upgrade prompt for free users
 */
interface UpgradePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

function UpgradePromptModal({ isOpen, onClose, onUpgrade }: UpgradePromptModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        <div className="text-center">
          {/* Icon */}
          <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-yellow-600"
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
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Upgrade to Add More Pairs
          </h3>

          {/* Description */}
          <p className="text-gray-600 mb-6">
            Free tier is limited to 1 trading pair. Upgrade to the paid plan for just{' '}
            <span className="font-semibold text-gray-900">$4.99</span> to unlock:
          </p>

          {/* Features */}
          <ul className="text-left text-sm text-gray-600 mb-6 space-y-2">
            <li className="flex items-center gap-2">
              <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Multiple trading pairs monitoring
            </li>
            <li className="flex items-center gap-2">
              <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Historical data simulation
            </li>
            <li className="flex items-center gap-2">
              <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Priority support
            </li>
          </ul>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Maybe Later
            </button>
            <button
              onClick={onUpgrade}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Upgrade Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * StartScanButton Component
 * Disabled when validation fails, navigates to Scanner page on start
 * Requirements: 1.4, 1.5, 1.6
 */
interface StartScanButtonProps {
  disabled: boolean;
  validationErrors: string[];
  onClick: () => void;
}

function StartScanButton({ disabled, validationErrors, onClick }: StartScanButtonProps) {
  return (
    <div className="w-full">
      <button
        onClick={onClick}
        disabled={disabled}
        className={`w-full py-3 px-6 rounded-lg font-semibold text-lg transition-all ${
          disabled
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl'
        }`}
        aria-disabled={disabled}
      >
        {disabled ? (
          <span className="flex items-center justify-center gap-2">
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
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            Cannot Start Scan
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
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
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Start Scanning
          </span>
        )}
      </button>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm font-medium text-red-800 mb-1">Please fix the following:</p>
          <ul className="text-sm text-red-700 list-disc list-inside">
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * ConfigPage Component
 * Configuration Page (Page 1) - Trading pair and exchange selection
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
 * - Display trading pair input interface with common pairs as suggestions
 * - Validate format and add to monitoring list
 * - Provide exchange options with 2-3 selected by default
 * - Display error and prevent scanning when less than 2 exchanges selected
 * - Display upgrade prompt for free users adding multiple pairs
 * - Allow paid users to add multiple pairs
 */
export default function ConfigPage() {
  const router = useRouter();
  const { state, dispatch } = useAppContext();
  const { isPaidUser, maxPairs, upgradeToPaid } = useSubscription();
  
  // Local state for upgrade modal
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  /**
   * Handle trading pairs change
   */
  const handlePairsChange = useCallback(
    (pairs: TradingPair[]) => {
      dispatch(actions.setSelectedPairs(pairs));
    },
    [dispatch]
  );

  /**
   * Handle exchanges change
   */
  const handleExchangesChange = useCallback(
    (exchanges: Exchange[]) => {
      dispatch(actions.setSelectedExchanges(exchanges));
    },
    [dispatch]
  );

  /**
   * Handle upgrade request from TradingPairSelector
   * Requirements: 1.5 - Display upgrade prompt for free users
   */
  const handleUpgradeRequest = useCallback(() => {
    setShowUpgradeModal(true);
  }, []);

  /**
   * Handle upgrade confirmation
   */
  const handleUpgradeConfirm = useCallback(async () => {
    // In a real implementation, this would redirect to Stripe checkout
    // For now, we'll just upgrade the user (Task 15 will implement Stripe)
    await upgradeToPaid();
    setShowUpgradeModal(false);
  }, [upgradeToPaid]);

  /**
   * Validate configuration and compute validation errors
   */
  const validationResult = useMemo(() => {
    const errors: string[] = [];

    // Check trading pairs
    if (state.selectedPairs.length === 0) {
      errors.push('Select at least one trading pair');
    }

    // Check exchanges
    const exchangeValidation = validateExchangeSelection(state.selectedExchanges);
    if (!exchangeValidation.isValid && exchangeValidation.errorMessage) {
      errors.push(exchangeValidation.errorMessage);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [state.selectedPairs, state.selectedExchanges]);

  /**
   * Handle start scan button click
   * Requirements: 1.4 - Prevent scanning when validation fails
   */
  const handleStartScan = useCallback(() => {
    if (validationResult.isValid) {
      // Navigate to Scanner page
      router.push('/scanner');
    }
  }, [validationResult.isValid, router]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Crypto Arbitrage Scanner
          </h1>
          <p className="mt-1 text-gray-600">
            Configure your trading pairs and exchanges to start scanning for arbitrage opportunities
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Subscription Status Banner */}
        <div className={`mb-6 p-4 rounded-lg ${isPaidUser ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isPaidUser ? (
                <>
                  <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-green-800 font-medium">Premium Plan</span>
                </>
              ) : (
                <>
                  <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-blue-800 font-medium">Free Plan</span>
                  <span className="text-blue-600 text-sm">(Limited to {maxPairs} trading pair)</span>
                </>
              )}
            </div>
            {!isPaidUser && (
              <button
                onClick={handleUpgradeRequest}
                className="text-sm text-blue-700 font-medium hover:text-blue-900 underline"
              >
                Upgrade to Premium
              </button>
            )}
          </div>
        </div>

        {/* Configuration Cards */}
        <div className="space-y-6">
          {/* Trading Pairs Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <TradingPairSelector
              selectedPairs={state.selectedPairs}
              onPairsChange={handlePairsChange}
              maxPairs={maxPairs}
              showUpgradePrompt={!isPaidUser}
              onUpgradeRequest={handleUpgradeRequest}
            />
          </div>

          {/* Exchanges Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <ExchangeSelector
              selectedExchanges={state.selectedExchanges}
              onExchangesChange={handleExchangesChange}
            />
          </div>

          {/* Start Scan Button */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <StartScanButton
              disabled={!validationResult.isValid}
              validationErrors={validationResult.errors}
              onClick={handleStartScan}
            />
          </div>
        </div>

        {/* Disclaimer */}
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
              Users bear their own trading risks. All data processing is completed locally without 
              uploading user data to any server.
            </p>
          </div>
        </div>
      </main>

      {/* Upgrade Modal */}
      <UpgradePromptModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onUpgrade={handleUpgradeConfirm}
      />
    </div>
  );
}

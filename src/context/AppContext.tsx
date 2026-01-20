'use client';

import React, { createContext, useContext, useReducer, ReactNode, Dispatch } from 'react';
import {
  TradingPair,
  Exchange,
  FeeConfig,
  UserSubscription,
  PriceData,
  SpreadResult,
  AlertRecord,
} from '../types';

// ============================================================================
// State Interface
// ============================================================================

/**
 * Application state interface
 * Contains all global state for the crypto arbitrage scanner
 */
export interface AppState {
  // Configuration
  selectedPairs: TradingPair[];
  selectedExchanges: Exchange[];
  refreshInterval: number;      // 5-30 seconds
  alertThreshold: number;       // 0.1-10%
  feeConfig: FeeConfig;
  soundEnabled: boolean;
  subscription: UserSubscription;
  
  // Runtime data
  priceData: PriceData[];
  spreadResults: SpreadResult[];
  alertHistory: AlertRecord[];
  
  // UI state
  isScanning: boolean;
  lastUpdateTime: Date | null;
  error: string | null;
}

// ============================================================================
// Action Types
// ============================================================================

export type AppAction =
  | { type: 'SET_SELECTED_PAIRS'; payload: TradingPair[] }
  | { type: 'SET_SELECTED_EXCHANGES'; payload: Exchange[] }
  | { type: 'SET_REFRESH_INTERVAL'; payload: number }
  | { type: 'SET_ALERT_THRESHOLD'; payload: number }
  | { type: 'SET_FEE_CONFIG'; payload: FeeConfig }
  | { type: 'SET_SOUND_ENABLED'; payload: boolean }
  | { type: 'SET_SUBSCRIPTION'; payload: UserSubscription }
  | { type: 'UPDATE_PRICE_DATA'; payload: PriceData[] }
  | { type: 'UPDATE_SPREAD_RESULTS'; payload: SpreadResult[] }
  | { type: 'ADD_ALERT'; payload: AlertRecord }
  | { type: 'CLEAR_ALERTS' }
  | { type: 'SET_SCANNING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' };

// ============================================================================
// Initial State
// ============================================================================

/**
 * Default fee configuration
 */
const defaultFeeConfig: FeeConfig = {
  buyFeeRate: 0.001,      // 0.1%
  sellFeeRate: 0.001,     // 0.1%
  withdrawalFee: 0,       // No withdrawal fee by default
  gasFee: 0,              // No gas fee by default
};

/**
 * Default subscription (free tier)
 */
const defaultSubscription: UserSubscription = {
  isPaid: false,
};

/**
 * Initial application state
 */
export const initialState: AppState = {
  // Configuration defaults
  selectedPairs: [],
  selectedExchanges: ['binance', 'coinbase'],  // Default 2 exchanges selected
  refreshInterval: 10,                          // 10 seconds default
  alertThreshold: 1.0,                          // 1% default threshold
  feeConfig: defaultFeeConfig,
  soundEnabled: true,
  subscription: defaultSubscription,
  
  // Runtime data - empty initially
  priceData: [],
  spreadResults: [],
  alertHistory: [],
  
  // UI state
  isScanning: false,
  lastUpdateTime: null,
  error: null,
};

// ============================================================================
// Reducer
// ============================================================================

/**
 * Maximum number of alerts to keep in history
 * Requirements: 5.6 - Record most recent 50 alert history entries
 */
const MAX_ALERT_HISTORY = 50;

/**
 * App reducer - handles all state updates
 * @param state Current application state
 * @param action Action to perform
 * @returns Updated state
 */
export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_SELECTED_PAIRS':
      return {
        ...state,
        selectedPairs: action.payload,
      };

    case 'SET_SELECTED_EXCHANGES':
      return {
        ...state,
        selectedExchanges: action.payload,
      };

    case 'SET_REFRESH_INTERVAL':
      // Clamp refresh interval to valid range (5-30 seconds)
      const clampedInterval = Math.max(5, Math.min(30, action.payload));
      return {
        ...state,
        refreshInterval: clampedInterval,
      };

    case 'SET_ALERT_THRESHOLD':
      // Clamp threshold to valid range (0.1-10%)
      const clampedThreshold = Math.max(0.1, Math.min(10, action.payload));
      return {
        ...state,
        alertThreshold: clampedThreshold,
      };

    case 'SET_FEE_CONFIG':
      return {
        ...state,
        feeConfig: action.payload,
      };

    case 'SET_SOUND_ENABLED':
      return {
        ...state,
        soundEnabled: action.payload,
      };

    case 'SET_SUBSCRIPTION':
      return {
        ...state,
        subscription: action.payload,
      };

    case 'UPDATE_PRICE_DATA':
      return {
        ...state,
        priceData: action.payload,
        lastUpdateTime: new Date(),
      };

    case 'UPDATE_SPREAD_RESULTS':
      return {
        ...state,
        spreadResults: action.payload,
      };

    case 'ADD_ALERT':
      // Add new alert and maintain max history limit
      const newAlertHistory = [action.payload, ...state.alertHistory];
      return {
        ...state,
        alertHistory: newAlertHistory.slice(0, MAX_ALERT_HISTORY),
      };

    case 'CLEAR_ALERTS':
      return {
        ...state,
        alertHistory: [],
      };

    case 'SET_SCANNING':
      return {
        ...state,
        isScanning: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
}

// ============================================================================
// Context
// ============================================================================

/**
 * Context value interface
 */
interface AppContextValue {
  state: AppState;
  dispatch: Dispatch<AppAction>;
}

/**
 * App Context - provides global state access
 */
const AppContext = createContext<AppContextValue | undefined>(undefined);

// ============================================================================
// Provider Component
// ============================================================================

interface AppProviderProps {
  children: ReactNode;
  initialStateOverride?: Partial<AppState>;
}

/**
 * App Provider - wraps the application and provides state management
 * @param children Child components
 * @param initialStateOverride Optional partial state to override defaults (useful for testing)
 */
export function AppProvider({ children, initialStateOverride }: AppProviderProps) {
  const [state, dispatch] = useReducer(
    appReducer,
    initialStateOverride
      ? { ...initialState, ...initialStateOverride }
      : initialState
  );

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

// ============================================================================
// Custom Hook
// ============================================================================

/**
 * useAppContext - custom hook to access app state and dispatch
 * @throws Error if used outside of AppProvider
 * @returns AppContextValue with state and dispatch
 */
export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

// ============================================================================
// Action Creators (optional helpers)
// ============================================================================

/**
 * Action creators for common operations
 * These provide type-safe action creation
 */
export const actions = {
  setSelectedPairs: (pairs: TradingPair[]): AppAction => ({
    type: 'SET_SELECTED_PAIRS',
    payload: pairs,
  }),

  setSelectedExchanges: (exchanges: Exchange[]): AppAction => ({
    type: 'SET_SELECTED_EXCHANGES',
    payload: exchanges,
  }),

  setRefreshInterval: (interval: number): AppAction => ({
    type: 'SET_REFRESH_INTERVAL',
    payload: interval,
  }),

  setAlertThreshold: (threshold: number): AppAction => ({
    type: 'SET_ALERT_THRESHOLD',
    payload: threshold,
  }),

  setFeeConfig: (config: FeeConfig): AppAction => ({
    type: 'SET_FEE_CONFIG',
    payload: config,
  }),

  setSoundEnabled: (enabled: boolean): AppAction => ({
    type: 'SET_SOUND_ENABLED',
    payload: enabled,
  }),

  setSubscription: (subscription: UserSubscription): AppAction => ({
    type: 'SET_SUBSCRIPTION',
    payload: subscription,
  }),

  updatePriceData: (data: PriceData[]): AppAction => ({
    type: 'UPDATE_PRICE_DATA',
    payload: data,
  }),

  updateSpreadResults: (results: SpreadResult[]): AppAction => ({
    type: 'UPDATE_SPREAD_RESULTS',
    payload: results,
  }),

  addAlert: (alert: AlertRecord): AppAction => ({
    type: 'ADD_ALERT',
    payload: alert,
  }),

  clearAlerts: (): AppAction => ({
    type: 'CLEAR_ALERTS',
  }),

  setScanning: (isScanning: boolean): AppAction => ({
    type: 'SET_SCANNING',
    payload: isScanning,
  }),

  setError: (error: string): AppAction => ({
    type: 'SET_ERROR',
    payload: error,
  }),

  clearError: (): AppAction => ({
    type: 'CLEAR_ERROR',
  }),
};

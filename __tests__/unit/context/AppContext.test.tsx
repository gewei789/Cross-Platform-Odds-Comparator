import React from 'react';
import { renderHook, act } from '@testing-library/react';
import {
  AppProvider,
  useAppContext,
  appReducer,
  initialState,
  actions,
  AppState,
  AppAction,
} from '../../../src/context/AppContext';
import { TradingPair, Exchange, FeeConfig, UserSubscription, AlertRecord, SpreadResult, PriceData } from '../../../src/types';

// ============================================================================
// Reducer Tests
// ============================================================================

describe('appReducer', () => {
  describe('SET_SELECTED_PAIRS', () => {
    it('should update selected pairs', () => {
      const pairs: TradingPair[] = [
        { base: 'ETH', quote: 'USDT', symbol: 'ETH/USDT' },
        { base: 'BTC', quote: 'USD', symbol: 'BTC/USD' },
      ];
      const action: AppAction = { type: 'SET_SELECTED_PAIRS', payload: pairs };
      const newState = appReducer(initialState, action);
      
      expect(newState.selectedPairs).toEqual(pairs);
    });
  });

  describe('SET_SELECTED_EXCHANGES', () => {
    it('should update selected exchanges', () => {
      const exchanges: Exchange[] = ['binance', 'kraken'];
      const action: AppAction = { type: 'SET_SELECTED_EXCHANGES', payload: exchanges };
      const newState = appReducer(initialState, action);
      
      expect(newState.selectedExchanges).toEqual(exchanges);
    });
  });

  describe('SET_REFRESH_INTERVAL', () => {
    it('should update refresh interval within valid range', () => {
      const action: AppAction = { type: 'SET_REFRESH_INTERVAL', payload: 15 };
      const newState = appReducer(initialState, action);
      
      expect(newState.refreshInterval).toBe(15);
    });

    it('should clamp refresh interval to minimum 5 seconds', () => {
      const action: AppAction = { type: 'SET_REFRESH_INTERVAL', payload: 2 };
      const newState = appReducer(initialState, action);
      
      expect(newState.refreshInterval).toBe(5);
    });

    it('should clamp refresh interval to maximum 30 seconds', () => {
      const action: AppAction = { type: 'SET_REFRESH_INTERVAL', payload: 60 };
      const newState = appReducer(initialState, action);
      
      expect(newState.refreshInterval).toBe(30);
    });
  });

  describe('SET_ALERT_THRESHOLD', () => {
    it('should update alert threshold within valid range', () => {
      const action: AppAction = { type: 'SET_ALERT_THRESHOLD', payload: 2.5 };
      const newState = appReducer(initialState, action);
      
      expect(newState.alertThreshold).toBe(2.5);
    });

    it('should clamp threshold to minimum 0.1%', () => {
      const action: AppAction = { type: 'SET_ALERT_THRESHOLD', payload: 0.01 };
      const newState = appReducer(initialState, action);
      
      expect(newState.alertThreshold).toBe(0.1);
    });

    it('should clamp threshold to maximum 10%', () => {
      const action: AppAction = { type: 'SET_ALERT_THRESHOLD', payload: 15 };
      const newState = appReducer(initialState, action);
      
      expect(newState.alertThreshold).toBe(10);
    });
  });

  describe('SET_FEE_CONFIG', () => {
    it('should update fee configuration', () => {
      const feeConfig: FeeConfig = {
        buyFeeRate: 0.002,
        sellFeeRate: 0.002,
        withdrawalFee: 5,
        gasFee: 10,
      };
      const action: AppAction = { type: 'SET_FEE_CONFIG', payload: feeConfig };
      const newState = appReducer(initialState, action);
      
      expect(newState.feeConfig).toEqual(feeConfig);
    });
  });

  describe('SET_SOUND_ENABLED', () => {
    it('should enable sound', () => {
      const state = { ...initialState, soundEnabled: false };
      const action: AppAction = { type: 'SET_SOUND_ENABLED', payload: true };
      const newState = appReducer(state, action);
      
      expect(newState.soundEnabled).toBe(true);
    });

    it('should disable sound', () => {
      const action: AppAction = { type: 'SET_SOUND_ENABLED', payload: false };
      const newState = appReducer(initialState, action);
      
      expect(newState.soundEnabled).toBe(false);
    });
  });

  describe('SET_SUBSCRIPTION', () => {
    it('should update subscription to paid', () => {
      const subscription: UserSubscription = {
        isPaid: true,
        purchaseDate: new Date('2024-01-15'),
        stripeSessionId: 'sess_123',
      };
      const action: AppAction = { type: 'SET_SUBSCRIPTION', payload: subscription };
      const newState = appReducer(initialState, action);
      
      expect(newState.subscription).toEqual(subscription);
    });
  });

  describe('UPDATE_PRICE_DATA', () => {
    it('should update price data and set lastUpdateTime', () => {
      const priceData = [
        {
          pair: { base: 'ETH', quote: 'USDT', symbol: 'ETH/USDT' },
          exchange: 'binance' as Exchange,
          price: 2500,
          volume24h: 1000000,
          bidAskSpread: 0.01,
          timestamp: new Date(),
          isStale: false,
        },
      ];
      const action: AppAction = { type: 'UPDATE_PRICE_DATA', payload: priceData };
      const newState = appReducer(initialState, action);
      
      expect(newState.priceData).toEqual(priceData);
      expect(newState.lastUpdateTime).toBeInstanceOf(Date);
    });
  });

  describe('UPDATE_SPREAD_RESULTS', () => {
    it('should update spread results', () => {
      const spreadResults: SpreadResult[] = [
        {
          pair: { base: 'ETH', quote: 'USDT', symbol: 'ETH/USDT' },
          buyExchange: 'binance',
          sellExchange: 'coinbase',
          buyPrice: 2500,
          sellPrice: 2525,
          spreadPercent: 1.0,
          timestamp: new Date(),
        },
      ];
      const action: AppAction = { type: 'UPDATE_SPREAD_RESULTS', payload: spreadResults };
      const newState = appReducer(initialState, action);
      
      expect(newState.spreadResults).toEqual(spreadResults);
    });
  });

  describe('ADD_ALERT', () => {
    it('should add alert to history', () => {
      const alert: AlertRecord = {
        id: 'alert-1',
        spread: {
          pair: { base: 'ETH', quote: 'USDT', symbol: 'ETH/USDT' },
          buyExchange: 'binance',
          sellExchange: 'coinbase',
          buyPrice: 2500,
          sellPrice: 2550,
          spreadPercent: 2.0,
          timestamp: new Date(),
        },
        estimatedProfit: {
          grossProfit: 50,
          totalFees: 10,
          netProfit: 40,
          isProfitable: true,
        },
        triggeredAt: new Date(),
        acknowledged: false,
      };
      const action: AppAction = { type: 'ADD_ALERT', payload: alert };
      const newState = appReducer(initialState, action);
      
      expect(newState.alertHistory).toHaveLength(1);
      expect(newState.alertHistory[0]).toEqual(alert);
    });

    it('should prepend new alerts (most recent first)', () => {
      const alert1: AlertRecord = createMockAlert('alert-1');
      const alert2: AlertRecord = createMockAlert('alert-2');
      
      let state = appReducer(initialState, { type: 'ADD_ALERT', payload: alert1 });
      state = appReducer(state, { type: 'ADD_ALERT', payload: alert2 });
      
      expect(state.alertHistory[0].id).toBe('alert-2');
      expect(state.alertHistory[1].id).toBe('alert-1');
    });

    it('should maintain maximum 50 alerts in history', () => {
      let state = initialState;
      
      // Add 55 alerts
      for (let i = 0; i < 55; i++) {
        const alert = createMockAlert(`alert-${i}`);
        state = appReducer(state, { type: 'ADD_ALERT', payload: alert });
      }
      
      expect(state.alertHistory).toHaveLength(50);
      // Most recent alert should be first
      expect(state.alertHistory[0].id).toBe('alert-54');
      // Oldest kept alert should be alert-5 (alerts 0-4 were dropped)
      expect(state.alertHistory[49].id).toBe('alert-5');
    });
  });

  describe('CLEAR_ALERTS', () => {
    it('should clear all alerts from history', () => {
      const stateWithAlerts: AppState = {
        ...initialState,
        alertHistory: [createMockAlert('alert-1'), createMockAlert('alert-2')],
      };
      const action: AppAction = { type: 'CLEAR_ALERTS' };
      const newState = appReducer(stateWithAlerts, action);
      
      expect(newState.alertHistory).toHaveLength(0);
    });
  });

  describe('SET_SCANNING', () => {
    it('should set scanning to true', () => {
      const action: AppAction = { type: 'SET_SCANNING', payload: true };
      const newState = appReducer(initialState, action);
      
      expect(newState.isScanning).toBe(true);
    });

    it('should set scanning to false', () => {
      const state = { ...initialState, isScanning: true };
      const action: AppAction = { type: 'SET_SCANNING', payload: false };
      const newState = appReducer(state, action);
      
      expect(newState.isScanning).toBe(false);
    });
  });

  describe('SET_ERROR', () => {
    it('should set error message', () => {
      const action: AppAction = { type: 'SET_ERROR', payload: 'API request failed' };
      const newState = appReducer(initialState, action);
      
      expect(newState.error).toBe('API request failed');
    });
  });

  describe('CLEAR_ERROR', () => {
    it('should clear error message', () => {
      const stateWithError: AppState = { ...initialState, error: 'Some error' };
      const action: AppAction = { type: 'CLEAR_ERROR' };
      const newState = appReducer(stateWithError, action);
      
      expect(newState.error).toBeNull();
    });
  });

  describe('unknown action', () => {
    it('should return current state for unknown action', () => {
      const unknownAction = { type: 'UNKNOWN_ACTION' } as unknown as AppAction;
      const newState = appReducer(initialState, unknownAction);
      
      expect(newState).toBe(initialState);
    });
  });
});

// ============================================================================
// Context Tests
// ============================================================================

describe('AppContext', () => {
  describe('useAppContext', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        renderHook(() => useAppContext());
      }).toThrow('useAppContext must be used within an AppProvider');
      
      consoleSpy.mockRestore();
    });

    it('should provide state and dispatch when used within provider', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AppProvider>{children}</AppProvider>
      );
      
      const { result } = renderHook(() => useAppContext(), { wrapper });
      
      expect(result.current.state).toBeDefined();
      expect(result.current.dispatch).toBeDefined();
      expect(typeof result.current.dispatch).toBe('function');
    });

    it('should provide initial state', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AppProvider>{children}</AppProvider>
      );
      
      const { result } = renderHook(() => useAppContext(), { wrapper });
      
      expect(result.current.state.selectedPairs).toEqual([]);
      expect(result.current.state.selectedExchanges).toEqual(['binance', 'coinbase']);
      expect(result.current.state.refreshInterval).toBe(10);
      expect(result.current.state.alertThreshold).toBe(1.0);
      expect(result.current.state.isScanning).toBe(false);
    });

    it('should update state when dispatch is called', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AppProvider>{children}</AppProvider>
      );
      
      const { result } = renderHook(() => useAppContext(), { wrapper });
      
      act(() => {
        result.current.dispatch({ type: 'SET_SCANNING', payload: true });
      });
      
      expect(result.current.state.isScanning).toBe(true);
    });
  });

  describe('AppProvider with initialStateOverride', () => {
    it('should merge initial state override', () => {
      const override = {
        selectedExchanges: ['kraken'] as Exchange[],
        refreshInterval: 20,
      };
      
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AppProvider initialStateOverride={override}>{children}</AppProvider>
      );
      
      const { result } = renderHook(() => useAppContext(), { wrapper });
      
      expect(result.current.state.selectedExchanges).toEqual(['kraken']);
      expect(result.current.state.refreshInterval).toBe(20);
      // Other values should remain default
      expect(result.current.state.alertThreshold).toBe(1.0);
    });
  });
});

// ============================================================================
// Action Creators Tests
// ============================================================================

describe('action creators', () => {
  it('setSelectedPairs should create correct action', () => {
    const pairs: TradingPair[] = [{ base: 'ETH', quote: 'USDT', symbol: 'ETH/USDT' }];
    const action = actions.setSelectedPairs(pairs);
    
    expect(action).toEqual({ type: 'SET_SELECTED_PAIRS', payload: pairs });
  });

  it('setSelectedExchanges should create correct action', () => {
    const exchanges: Exchange[] = ['binance', 'kraken'];
    const action = actions.setSelectedExchanges(exchanges);
    
    expect(action).toEqual({ type: 'SET_SELECTED_EXCHANGES', payload: exchanges });
  });

  it('setRefreshInterval should create correct action', () => {
    const action = actions.setRefreshInterval(15);
    
    expect(action).toEqual({ type: 'SET_REFRESH_INTERVAL', payload: 15 });
  });

  it('setAlertThreshold should create correct action', () => {
    const action = actions.setAlertThreshold(2.5);
    
    expect(action).toEqual({ type: 'SET_ALERT_THRESHOLD', payload: 2.5 });
  });

  it('setFeeConfig should create correct action', () => {
    const config: FeeConfig = {
      buyFeeRate: 0.001,
      sellFeeRate: 0.001,
      withdrawalFee: 5,
      gasFee: 10,
    };
    const action = actions.setFeeConfig(config);
    
    expect(action).toEqual({ type: 'SET_FEE_CONFIG', payload: config });
  });

  it('setSoundEnabled should create correct action', () => {
    const action = actions.setSoundEnabled(false);
    
    expect(action).toEqual({ type: 'SET_SOUND_ENABLED', payload: false });
  });

  it('setSubscription should create correct action', () => {
    const subscription: UserSubscription = { isPaid: true };
    const action = actions.setSubscription(subscription);
    
    expect(action).toEqual({ type: 'SET_SUBSCRIPTION', payload: subscription });
  });

  it('updatePriceData should create correct action', () => {
    const data: PriceData[] = [];
    const action = actions.updatePriceData(data);
    
    expect(action).toEqual({ type: 'UPDATE_PRICE_DATA', payload: data });
  });

  it('updateSpreadResults should create correct action', () => {
    const results: SpreadResult[] = [];
    const action = actions.updateSpreadResults(results);
    
    expect(action).toEqual({ type: 'UPDATE_SPREAD_RESULTS', payload: results });
  });

  it('addAlert should create correct action', () => {
    const alert = createMockAlert('test');
    const action = actions.addAlert(alert);
    
    expect(action).toEqual({ type: 'ADD_ALERT', payload: alert });
  });

  it('clearAlerts should create correct action', () => {
    const action = actions.clearAlerts();
    
    expect(action).toEqual({ type: 'CLEAR_ALERTS' });
  });

  it('setScanning should create correct action', () => {
    const action = actions.setScanning(true);
    
    expect(action).toEqual({ type: 'SET_SCANNING', payload: true });
  });

  it('setError should create correct action', () => {
    const action = actions.setError('Error message');
    
    expect(action).toEqual({ type: 'SET_ERROR', payload: 'Error message' });
  });

  it('clearError should create correct action', () => {
    const action = actions.clearError();
    
    expect(action).toEqual({ type: 'CLEAR_ERROR' });
  });
});

// ============================================================================
// Helper Functions
// ============================================================================

function createMockAlert(id: string): AlertRecord {
  return {
    id,
    spread: {
      pair: { base: 'ETH', quote: 'USDT', symbol: 'ETH/USDT' },
      buyExchange: 'binance',
      sellExchange: 'coinbase',
      buyPrice: 2500,
      sellPrice: 2550,
      spreadPercent: 2.0,
      timestamp: new Date(),
    },
    estimatedProfit: {
      grossProfit: 50,
      totalFees: 10,
      netProfit: 40,
      isProfitable: true,
    },
    triggeredAt: new Date(),
    acknowledged: false,
  };
}

/**
 * Unit tests for useAlerts hook
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */

import { renderHook, act } from '@testing-library/react';
import React, { ReactNode } from 'react';
import { AppProvider, AppState } from '../../../src/context/AppContext';
import { useAlerts } from '../../../src/hooks/useAlerts';
import { ALERT_CONSTANTS } from '../../../src/services/alertSystem';
import { AlertRecord, SpreadResult, TradingPair } from '../../../src/types';

describe('useAlerts hook', () => {
  // Test wrapper with AppProvider
  const createWrapper = (initialStateOverride?: Partial<AppState>) => {
    const Wrapper = ({ children }: { children: ReactNode }) => (
      <AppProvider initialStateOverride={initialStateOverride}>
        {children}
      </AppProvider>
    );
    return Wrapper;
  };

  // Mock data
  const mockPair: TradingPair = { base: 'ETH', quote: 'USDT', symbol: 'ETH/USDT' };

  const createMockAlert = (id: string, spreadPercent: number = 2): AlertRecord => ({
    id,
    spread: {
      pair: mockPair,
      buyExchange: 'binance',
      sellExchange: 'coinbase',
      buyPrice: 2500,
      sellPrice: 2500 * (1 + spreadPercent / 100),
      spreadPercent,
      timestamp: new Date(),
    },
    estimatedProfit: {
      grossProfit: 15,
      totalFees: 5,
      netProfit: 10,
      isProfitable: true,
    },
    triggeredAt: new Date(),
    acknowledged: false,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('should return empty alert history initially', () => {
      const { result } = renderHook(() => useAlerts(), {
        wrapper: createWrapper(),
      });

      expect(result.current.alertHistory).toEqual([]);
    });

    it('should return default alert threshold', () => {
      const { result } = renderHook(() => useAlerts(), {
        wrapper: createWrapper(),
      });

      expect(result.current.alertThreshold).toBe(1.0);
    });

    it('should return sound enabled by default', () => {
      const { result } = renderHook(() => useAlerts(), {
        wrapper: createWrapper(),
      });

      expect(result.current.soundEnabled).toBe(true);
    });

    it('should return false for hasNotificationPermission in test environment', () => {
      const { result } = renderHook(() => useAlerts(), {
        wrapper: createWrapper(),
      });

      // In Node.js test environment, Notification API is not available
      expect(result.current.hasNotificationPermission).toBe(false);
    });
  });

  describe('setAlertThreshold', () => {
    /**
     * Requirements: 5.1 - Accept spread threshold values between 0.1% and 10%
     */
    it('should update alert threshold with valid value', () => {
      const { result } = renderHook(() => useAlerts(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setAlertThreshold(5);
      });

      expect(result.current.alertThreshold).toBe(5);
    });

    it('should accept minimum threshold (0.1%)', () => {
      const { result } = renderHook(() => useAlerts(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setAlertThreshold(0.1);
      });

      expect(result.current.alertThreshold).toBe(0.1);
    });

    it('should accept maximum threshold (10%)', () => {
      const { result } = renderHook(() => useAlerts(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setAlertThreshold(10);
      });

      expect(result.current.alertThreshold).toBe(10);
    });

    it('should clamp threshold below minimum to 0.1%', () => {
      const { result } = renderHook(() => useAlerts(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setAlertThreshold(0.05);
      });

      expect(result.current.alertThreshold).toBe(ALERT_CONSTANTS.MIN_THRESHOLD);
    });

    it('should clamp threshold above maximum to 10%', () => {
      const { result } = renderHook(() => useAlerts(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setAlertThreshold(15);
      });

      expect(result.current.alertThreshold).toBe(ALERT_CONSTANTS.MAX_THRESHOLD);
    });
  });

  describe('setSoundEnabled', () => {
    /**
     * Requirements: 5.4 - User can disable alert sound
     */
    it('should disable sound when set to false', () => {
      const { result } = renderHook(() => useAlerts(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setSoundEnabled(false);
      });

      expect(result.current.soundEnabled).toBe(false);
    });

    it('should enable sound when set to true', () => {
      const { result } = renderHook(() => useAlerts(), {
        wrapper: createWrapper({ soundEnabled: false }),
      });

      act(() => {
        result.current.setSoundEnabled(true);
      });

      expect(result.current.soundEnabled).toBe(true);
    });
  });

  describe('clearAlerts', () => {
    it('should clear all alerts from history', () => {
      const mockAlerts = [
        createMockAlert('alert_1'),
        createMockAlert('alert_2'),
      ];

      const { result } = renderHook(() => useAlerts(), {
        wrapper: createWrapper({ alertHistory: mockAlerts }),
      });

      expect(result.current.alertHistory.length).toBe(2);

      act(() => {
        result.current.clearAlerts();
      });

      expect(result.current.alertHistory).toEqual([]);
    });
  });

  describe('acknowledgeAlert', () => {
    it('should acknowledge a specific alert by ID', () => {
      const mockAlerts = [
        createMockAlert('alert_1'),
        createMockAlert('alert_2'),
      ];

      const { result } = renderHook(() => useAlerts(), {
        wrapper: createWrapper({ alertHistory: mockAlerts }),
      });

      act(() => {
        result.current.acknowledgeAlert('alert_1');
      });

      const acknowledgedAlert = result.current.alertHistory.find(a => a.id === 'alert_1');
      expect(acknowledgedAlert?.acknowledged).toBe(true);
    });

    it('should not affect other alerts when acknowledging one', () => {
      const mockAlerts = [
        createMockAlert('alert_1'),
        createMockAlert('alert_2'),
      ];

      const { result } = renderHook(() => useAlerts(), {
        wrapper: createWrapper({ alertHistory: mockAlerts }),
      });

      act(() => {
        result.current.acknowledgeAlert('alert_1');
      });

      const otherAlert = result.current.alertHistory.find(a => a.id === 'alert_2');
      expect(otherAlert?.acknowledged).toBe(false);
    });
  });

  describe('requestNotificationPermission', () => {
    /**
     * Requirements: 5.2 - Browser notification requires user permission
     */
    it('should return false in test environment (no Notification API)', async () => {
      const { result } = renderHook(() => useAlerts(), {
        wrapper: createWrapper(),
      });

      let permissionResult: boolean = true;
      await act(async () => {
        permissionResult = await result.current.requestNotificationPermission();
      });

      expect(permissionResult).toBe(false);
    });
  });

  describe('alert history with initial state', () => {
    /**
     * Requirements: 5.6 - Record the most recent 50 alert history entries
     */
    it('should preserve alert history from initial state', () => {
      const mockAlerts = [
        createMockAlert('alert_1'),
        createMockAlert('alert_2'),
        createMockAlert('alert_3'),
      ];

      const { result } = renderHook(() => useAlerts(), {
        wrapper: createWrapper({ alertHistory: mockAlerts }),
      });

      expect(result.current.alertHistory.length).toBe(3);
    });
  });

  describe('custom initial threshold', () => {
    it('should use custom initial threshold from state', () => {
      const { result } = renderHook(() => useAlerts(), {
        wrapper: createWrapper({ alertThreshold: 5 }),
      });

      expect(result.current.alertThreshold).toBe(5);
    });
  });

  describe('custom initial sound setting', () => {
    it('should use custom initial sound setting from state', () => {
      const { result } = renderHook(() => useAlerts(), {
        wrapper: createWrapper({ soundEnabled: false }),
      });

      expect(result.current.soundEnabled).toBe(false);
    });
  });
});

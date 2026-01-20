/**
 * Unit tests for useSubscription hook
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */

import { renderHook, act } from '@testing-library/react';
import React, { ReactNode } from 'react';
import { AppProvider, AppState } from '../../../src/context/AppContext';
import { useSubscription } from '../../../src/hooks/useSubscription';
import { SUBSCRIPTION_CONSTANTS } from '../../../src/services/subscriptionManager';
import { TradingPair, UserSubscription } from '../../../src/types';

// Mock localStorage
let localStorageStore: Record<string, string> = {};

const localStorageMock = {
  getItem: jest.fn((key: string) => localStorageStore[key] || null),
  setItem: jest.fn((key: string, value: string) => {
    localStorageStore[key] = value;
  }),
  removeItem: jest.fn((key: string) => {
    delete localStorageStore[key];
  }),
  clear: jest.fn(() => {
    localStorageStore = {};
  }),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('useSubscription hook', () => {
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

  const freeSubscription: UserSubscription = {
    isPaid: false,
  };

  const paidSubscription: UserSubscription = {
    isPaid: true,
    purchaseDate: new Date('2024-01-01'),
    stripeSessionId: 'stripe_session_123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageStore = {};
  });

  // Helper to set up localStorage with a subscription before rendering
  const setupLocalStorage = (subscription: UserSubscription) => {
    const serialized = JSON.stringify({
      isPaid: subscription.isPaid,
      purchaseDate: subscription.purchaseDate?.toISOString() ?? null,
      stripeSessionId: subscription.stripeSessionId ?? null,
    });
    localStorageStore[SUBSCRIPTION_CONSTANTS.STORAGE_KEY] = serialized;
  };

  describe('initial state', () => {
    it('should return free subscription by default', () => {
      const { result } = renderHook(() => useSubscription(), {
        wrapper: createWrapper(),
      });

      expect(result.current.subscription.isPaid).toBe(false);
    });

    it('should return isPaidUser as false for free subscription', () => {
      const { result } = renderHook(() => useSubscription(), {
        wrapper: createWrapper({ subscription: freeSubscription }),
      });

      expect(result.current.isPaidUser).toBe(false);
    });

    it('should return isPaidUser as true for paid subscription', () => {
      // Set up localStorage with paid subscription before rendering
      setupLocalStorage(paidSubscription);
      
      const { result } = renderHook(() => useSubscription(), {
        wrapper: createWrapper({ subscription: paidSubscription }),
      });

      expect(result.current.isPaidUser).toBe(true);
    });
  });

  describe('maxPairs', () => {
    /**
     * Requirements: 8.2, 8.3 - Free users limited to 1 pair, paid users get multiple
     */
    it('should return 1 for free users', () => {
      const { result } = renderHook(() => useSubscription(), {
        wrapper: createWrapper({ subscription: freeSubscription }),
      });

      expect(result.current.maxPairs).toBe(SUBSCRIPTION_CONSTANTS.FREE_TIER_MAX_PAIRS);
    });

    it('should return 10 for paid users', () => {
      // Set up localStorage with paid subscription before rendering
      setupLocalStorage(paidSubscription);
      
      const { result } = renderHook(() => useSubscription(), {
        wrapper: createWrapper({ subscription: paidSubscription }),
      });

      expect(result.current.maxPairs).toBe(SUBSCRIPTION_CONSTANTS.PAID_TIER_MAX_PAIRS);
    });
  });

  describe('canAccessHistoricalData', () => {
    /**
     * Requirements: 8.2, 8.3 - Free users cannot access, paid users can
     */
    it('should return false for free users', () => {
      const { result } = renderHook(() => useSubscription(), {
        wrapper: createWrapper({ subscription: freeSubscription }),
      });

      expect(result.current.canAccessHistoricalData).toBe(false);
    });

    it('should return true for paid users', () => {
      // Set up localStorage with paid subscription before rendering
      setupLocalStorage(paidSubscription);
      
      const { result } = renderHook(() => useSubscription(), {
        wrapper: createWrapper({ subscription: paidSubscription }),
      });

      expect(result.current.canAccessHistoricalData).toBe(true);
    });
  });

  describe('canAddMorePairs', () => {
    /**
     * Requirements: 8.2 - Enforce free tier limits
     */
    it('should return true for free user with 0 pairs', () => {
      const { result } = renderHook(() => useSubscription(), {
        wrapper: createWrapper({
          subscription: freeSubscription,
          selectedPairs: [],
        }),
      });

      expect(result.current.canAddMorePairs()).toBe(true);
    });

    it('should return false for free user with 1 pair', () => {
      const { result } = renderHook(() => useSubscription(), {
        wrapper: createWrapper({
          subscription: freeSubscription,
          selectedPairs: [mockPair],
        }),
      });

      expect(result.current.canAddMorePairs()).toBe(false);
    });

    it('should return true for paid user with multiple pairs', () => {
      // Set up localStorage with paid subscription before rendering
      setupLocalStorage(paidSubscription);
      
      const pairs = Array.from({ length: 5 }, (_, i) => ({
        base: `COIN${i}`,
        quote: 'USDT',
        symbol: `COIN${i}/USDT`,
      }));

      const { result } = renderHook(() => useSubscription(), {
        wrapper: createWrapper({
          subscription: paidSubscription,
          selectedPairs: pairs,
        }),
      });

      expect(result.current.canAddMorePairs()).toBe(true);
    });

    it('should return false for paid user at max pairs limit', () => {
      // Set up localStorage with paid subscription before rendering
      setupLocalStorage(paidSubscription);
      
      const pairs = Array.from({ length: 10 }, (_, i) => ({
        base: `COIN${i}`,
        quote: 'USDT',
        symbol: `COIN${i}/USDT`,
      }));

      const { result } = renderHook(() => useSubscription(), {
        wrapper: createWrapper({
          subscription: paidSubscription,
          selectedPairs: pairs,
        }),
      });

      expect(result.current.canAddMorePairs()).toBe(false);
    });
  });

  describe('upgradeToPaid', () => {
    /**
     * Requirements: 8.4, 8.5 - Upgrade to paid tier and persist to localStorage
     */
    it('should upgrade subscription to paid', async () => {
      const { result } = renderHook(() => useSubscription(), {
        wrapper: createWrapper({ subscription: freeSubscription }),
      });

      expect(result.current.isPaidUser).toBe(false);

      let upgradeResult: boolean = false;
      await act(async () => {
        upgradeResult = await result.current.upgradeToPaid('stripe_session_456');
      });

      expect(upgradeResult).toBe(true);
      expect(result.current.isPaidUser).toBe(true);
      expect(result.current.subscription.stripeSessionId).toBe('stripe_session_456');
    });

    it('should set purchase date when upgrading', async () => {
      const { result } = renderHook(() => useSubscription(), {
        wrapper: createWrapper({ subscription: freeSubscription }),
      });

      await act(async () => {
        await result.current.upgradeToPaid();
      });

      expect(result.current.subscription.purchaseDate).toBeInstanceOf(Date);
    });

    it('should update maxPairs after upgrade', async () => {
      const { result } = renderHook(() => useSubscription(), {
        wrapper: createWrapper({ subscription: freeSubscription }),
      });

      expect(result.current.maxPairs).toBe(1);

      await act(async () => {
        await result.current.upgradeToPaid();
      });

      expect(result.current.maxPairs).toBe(10);
    });

    it('should update canAccessHistoricalData after upgrade', async () => {
      const { result } = renderHook(() => useSubscription(), {
        wrapper: createWrapper({ subscription: freeSubscription }),
      });

      expect(result.current.canAccessHistoricalData).toBe(false);

      await act(async () => {
        await result.current.upgradeToPaid();
      });

      expect(result.current.canAccessHistoricalData).toBe(true);
    });
  });

  describe('reloadSubscription', () => {
    it('should reload subscription from localStorage', () => {
      // Set up localStorage with paid subscription
      const storedSubscription = {
        isPaid: true,
        purchaseDate: new Date().toISOString(),
        stripeSessionId: 'stored_session',
      };
      localStorageMock.setItem(
        SUBSCRIPTION_CONSTANTS.STORAGE_KEY,
        JSON.stringify(storedSubscription)
      );

      const { result } = renderHook(() => useSubscription(), {
        wrapper: createWrapper({ subscription: freeSubscription }),
      });

      act(() => {
        result.current.reloadSubscription();
      });

      // After reload, should have the stored subscription
      expect(result.current.isPaidUser).toBe(true);
    });
  });

  describe('subscription state persistence', () => {
    /**
     * Requirements: 8.5 - Store subscription status locally using localStorage
     */
    it('should persist subscription to localStorage on upgrade', async () => {
      const { result } = renderHook(() => useSubscription(), {
        wrapper: createWrapper({ subscription: freeSubscription }),
      });

      await act(async () => {
        await result.current.upgradeToPaid('test_session');
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        SUBSCRIPTION_CONSTANTS.STORAGE_KEY,
        expect.any(String)
      );
    });
  });

  describe('subscription object', () => {
    it('should return complete subscription object', () => {
      // Set up localStorage with paid subscription before rendering
      setupLocalStorage(paidSubscription);
      
      const { result } = renderHook(() => useSubscription(), {
        wrapper: createWrapper({ subscription: paidSubscription }),
      });

      expect(result.current.subscription.isPaid).toBe(true);
      expect(result.current.subscription.purchaseDate).toBeInstanceOf(Date);
      expect(result.current.subscription.stripeSessionId).toBe('stripe_session_123');
    });

    it('should include purchaseDate for paid users', () => {
      // Set up localStorage with paid subscription before rendering
      setupLocalStorage(paidSubscription);
      
      const { result } = renderHook(() => useSubscription(), {
        wrapper: createWrapper({ subscription: paidSubscription }),
      });

      expect(result.current.subscription.purchaseDate).toBeDefined();
    });

    it('should include stripeSessionId for paid users', () => {
      // Set up localStorage with paid subscription before rendering
      setupLocalStorage(paidSubscription);
      
      const { result } = renderHook(() => useSubscription(), {
        wrapper: createWrapper({ subscription: paidSubscription }),
      });

      expect(result.current.subscription.stripeSessionId).toBe('stripe_session_123');
    });
  });
});

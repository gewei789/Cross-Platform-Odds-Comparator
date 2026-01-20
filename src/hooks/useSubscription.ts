'use client';

/**
 * useSubscription Hook
 * Provides subscription state management functionality
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */

import { useCallback, useEffect, useRef } from 'react';
import { useAppContext, actions } from '../context/AppContext';
import { 
  SubscriptionManager,
  isPaidUser as checkIsPaidUser,
  getMaxPairs as getMaxPairsForSubscription,
  canAccessHistoricalData as checkCanAccessHistoricalData,
  canAddMorePairs as checkCanAddMorePairs,
  loadSubscription,
  SUBSCRIPTION_CONSTANTS,
} from '../services/subscriptionManager';
import { UserSubscription } from '../types';

/**
 * Return type for useSubscription hook
 */
export interface UseSubscriptionReturn {
  /** Current subscription state */
  subscription: UserSubscription;
  /** Whether the user is a paid user */
  isPaidUser: boolean;
  /** Maximum number of trading pairs allowed */
  maxPairs: number;
  /** Whether user can access historical data */
  canAccessHistoricalData: boolean;
  /** Check if user can add more trading pairs */
  canAddMorePairs: () => boolean;
  /** Upgrade to paid tier */
  upgradeToPaid: (stripeSessionId?: string) => Promise<boolean>;
  /** Reload subscription from localStorage */
  reloadSubscription: () => void;
}

/**
 * useSubscription hook
 * Manages subscription state and provides subscription-related utilities
 * 
 * @returns UseSubscriptionReturn object with subscription controls and data
 */
export function useSubscription(): UseSubscriptionReturn {
  const { state, dispatch } = useAppContext();
  const subscriptionManagerRef = useRef<SubscriptionManager | null>(null);

  // Initialize subscription manager and load from localStorage
  useEffect(() => {
    subscriptionManagerRef.current = new SubscriptionManager();
    
    // Load subscription from localStorage and sync with state
    const storedSubscription = loadSubscription();
    dispatch(actions.setSubscription(storedSubscription));

    return () => {
      subscriptionManagerRef.current = null;
    };
  }, [dispatch]);

  // Sync subscription manager with state changes
  useEffect(() => {
    if (subscriptionManagerRef.current) {
      subscriptionManagerRef.current.updateSubscription(state.subscription);
    }
  }, [state.subscription]);

  /**
   * Check if user is a paid user
   * Requirements: 8.1 - Distinguish between free and paid user permissions
   */
  const isPaidUser = checkIsPaidUser(state.subscription);

  /**
   * Get maximum number of trading pairs allowed
   * Requirements: 8.2, 8.3 - Free users limited to 1 pair, paid users get multiple
   */
  const maxPairs = getMaxPairsForSubscription(state.subscription);

  /**
   * Check if user can access historical data
   * Requirements: 8.2, 8.3 - Free users cannot access, paid users can
   */
  const canAccessHistoricalData = checkCanAccessHistoricalData(state.subscription);

  /**
   * Check if user can add more trading pairs
   * Requirements: 8.2 - Enforce free tier limits
   */
  const canAddMorePairs = useCallback((): boolean => {
    return checkCanAddMorePairs(state.subscription, state.selectedPairs.length);
  }, [state.subscription, state.selectedPairs.length]);

  /**
   * Upgrade to paid tier
   * Requirements: 8.4 - Integrate with Stripe for $4.99 one-time payment
   * Requirements: 8.5 - Store subscription status locally using localStorage
   * 
   * Note: This function updates the subscription state to paid.
   * The actual Stripe payment flow will be implemented in task 15.
   * 
   * @param stripeSessionId - Optional Stripe session ID from successful payment
   * @returns Promise resolving to true if upgrade was successful
   */
  const upgradeToPaid = useCallback(async (stripeSessionId?: string): Promise<boolean> => {
    try {
      const newSubscription: UserSubscription = {
        isPaid: true,
        purchaseDate: new Date(),
        stripeSessionId,
      };

      // Update state
      dispatch(actions.setSubscription(newSubscription));

      // Update subscription manager (which persists to localStorage)
      if (subscriptionManagerRef.current) {
        return subscriptionManagerRef.current.updateSubscription(newSubscription);
      }

      return true;
    } catch (error) {
      console.error('Failed to upgrade subscription:', error);
      return false;
    }
  }, [dispatch]);

  /**
   * Reload subscription from localStorage
   * Useful for syncing state after external changes
   */
  const reloadSubscription = useCallback(() => {
    if (subscriptionManagerRef.current) {
      subscriptionManagerRef.current.reloadFromStorage();
      const storedSubscription = loadSubscription();
      dispatch(actions.setSubscription(storedSubscription));
    }
  }, [dispatch]);

  return {
    subscription: state.subscription,
    isPaidUser,
    maxPairs,
    canAccessHistoricalData,
    canAddMorePairs,
    upgradeToPaid,
    reloadSubscription,
  };
}

export default useSubscription;

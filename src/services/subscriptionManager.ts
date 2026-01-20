/**
 * Subscription Manager Service
 * Manages free/paid user permissions and subscription state
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.5
 */

import { UserSubscription } from '../types';

/**
 * Constants for subscription management
 */
export const SUBSCRIPTION_CONSTANTS = {
  /** localStorage key for subscription data */
  STORAGE_KEY: 'arbitrage_scanner_subscription',
  /** Maximum trading pairs for free users */
  FREE_TIER_MAX_PAIRS: 1,
  /** Maximum trading pairs for paid users */
  PAID_TIER_MAX_PAIRS: 10,
  /** One-time payment price in USD */
  PAYMENT_PRICE: 4.99,
} as const;

/**
 * Default subscription state for new users
 */
export const DEFAULT_SUBSCRIPTION: UserSubscription = {
  isPaid: false,
  purchaseDate: undefined,
  stripeSessionId: undefined,
};

/**
 * Check if localStorage is available
 * @returns true if localStorage is available, false otherwise
 */
export function isLocalStorageAvailable(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Serialize subscription data for localStorage
 * Converts Date objects to ISO strings for JSON storage
 * @param subscription - The subscription to serialize
 * @returns JSON string representation
 */
export function serializeSubscription(subscription: UserSubscription): string {
  // Handle invalid dates gracefully
  let purchaseDateStr: string | null = null;
  if (subscription.purchaseDate instanceof Date && !isNaN(subscription.purchaseDate.getTime())) {
    purchaseDateStr = subscription.purchaseDate.toISOString();
  }
  
  const serializable = {
    isPaid: subscription.isPaid,
    purchaseDate: purchaseDateStr,
    stripeSessionId: subscription.stripeSessionId ?? null,
  };
  return JSON.stringify(serializable);
}

/**
 * Deserialize subscription data from localStorage
 * Converts ISO strings back to Date objects
 * @param data - JSON string from localStorage
 * @returns Parsed UserSubscription or null if invalid
 */
export function deserializeSubscription(data: string): UserSubscription | null {
  try {
    const parsed = JSON.parse(data);
    
    // Validate required fields
    if (typeof parsed.isPaid !== 'boolean') {
      return null;
    }
    
    const subscription: UserSubscription = {
      isPaid: parsed.isPaid,
    };
    
    // Parse optional purchaseDate
    if (parsed.purchaseDate && typeof parsed.purchaseDate === 'string') {
      const date = new Date(parsed.purchaseDate);
      if (!isNaN(date.getTime())) {
        subscription.purchaseDate = date;
      }
    }
    
    // Parse optional stripeSessionId
    if (parsed.stripeSessionId && typeof parsed.stripeSessionId === 'string') {
      subscription.stripeSessionId = parsed.stripeSessionId;
    }
    
    return subscription;
  } catch {
    return null;
  }
}

/**
 * Save subscription to localStorage
 * @param subscription - The subscription to save
 * @returns true if saved successfully, false otherwise
 */
export function saveSubscription(subscription: UserSubscription): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }
  
  try {
    const serialized = serializeSubscription(subscription);
    window.localStorage.setItem(SUBSCRIPTION_CONSTANTS.STORAGE_KEY, serialized);
    return true;
  } catch {
    return false;
  }
}

/**
 * Load subscription from localStorage
 * @returns The loaded subscription or default subscription if not found/invalid
 */
export function loadSubscription(): UserSubscription {
  if (!isLocalStorageAvailable()) {
    return { ...DEFAULT_SUBSCRIPTION };
  }
  
  try {
    const data = window.localStorage.getItem(SUBSCRIPTION_CONSTANTS.STORAGE_KEY);
    if (!data) {
      return { ...DEFAULT_SUBSCRIPTION };
    }
    
    const subscription = deserializeSubscription(data);
    return subscription ?? { ...DEFAULT_SUBSCRIPTION };
  } catch {
    return { ...DEFAULT_SUBSCRIPTION };
  }
}

/**
 * Clear subscription from localStorage
 * @returns true if cleared successfully, false otherwise
 */
export function clearSubscription(): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }
  
  try {
    window.localStorage.removeItem(SUBSCRIPTION_CONSTANTS.STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if user is a paid user
 * Requirements: 8.1 - Distinguish between free and paid user permissions
 * @param subscription - The user's subscription
 * @returns true if user is paid, false otherwise
 */
export function isPaidUser(subscription: UserSubscription): boolean {
  return subscription.isPaid === true;
}

/**
 * Get maximum number of trading pairs allowed
 * Requirements: 8.2, 8.3 - Free users limited to 1 pair, paid users get multiple
 * @param subscription - The user's subscription
 * @returns Maximum number of pairs allowed
 */
export function getMaxPairs(subscription: UserSubscription): number {
  return isPaidUser(subscription)
    ? SUBSCRIPTION_CONSTANTS.PAID_TIER_MAX_PAIRS
    : SUBSCRIPTION_CONSTANTS.FREE_TIER_MAX_PAIRS;
}

/**
 * Check if user can access historical data simulation
 * Requirements: 8.2, 8.3 - Free users cannot access, paid users can
 * @param subscription - The user's subscription
 * @returns true if user can access historical data, false otherwise
 */
export function canAccessHistoricalData(subscription: UserSubscription): boolean {
  return isPaidUser(subscription);
}

/**
 * Check if user can add more trading pairs
 * Requirements: 8.2 - Enforce free tier limits
 * @param subscription - The user's subscription
 * @param currentPairCount - Current number of trading pairs
 * @returns true if user can add more pairs, false otherwise
 */
export function canAddMorePairs(subscription: UserSubscription, currentPairCount: number): boolean {
  const maxPairs = getMaxPairs(subscription);
  return currentPairCount < maxPairs;
}

/**
 * Validate if a pair count is within subscription limits
 * @param subscription - The user's subscription
 * @param pairCount - Number of pairs to validate
 * @returns true if pair count is within limits, false otherwise
 */
export function isWithinPairLimit(subscription: UserSubscription, pairCount: number): boolean {
  const maxPairs = getMaxPairs(subscription);
  return pairCount <= maxPairs;
}

/**
 * Subscription Manager Interface
 * Provides methods for managing user subscription state
 */
export interface ISubscriptionManager {
  isPaidUser(): boolean;
  getMaxPairs(): number;
  canAccessHistoricalData(): boolean;
  canAddMorePairs(currentPairCount: number): boolean;
  getSubscription(): UserSubscription;
  updateSubscription(subscription: UserSubscription): boolean;
  initiatePayment(): Promise<void>;
  clearSubscription(): boolean;
}

/**
 * Subscription Manager Class
 * Manages subscription state with localStorage persistence
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.5
 */
export class SubscriptionManager implements ISubscriptionManager {
  private subscription: UserSubscription;
  
  /**
   * Create a new SubscriptionManager
   * @param initialSubscription - Optional initial subscription state (defaults to loading from localStorage)
   */
  constructor(initialSubscription?: UserSubscription) {
    if (initialSubscription) {
      this.subscription = { ...initialSubscription };
    } else {
      this.subscription = loadSubscription();
    }
  }
  
  /**
   * Check if current user is a paid user
   * Requirements: 8.1 - Distinguish between free and paid user permissions
   */
  isPaidUser(): boolean {
    return isPaidUser(this.subscription);
  }
  
  /**
   * Get maximum number of trading pairs allowed for current user
   * Requirements: 8.2, 8.3 - Free users limited to 1 pair, paid users get multiple
   */
  getMaxPairs(): number {
    return getMaxPairs(this.subscription);
  }
  
  /**
   * Check if current user can access historical data simulation
   * Requirements: 8.2, 8.3 - Free users cannot access, paid users can
   */
  canAccessHistoricalData(): boolean {
    return canAccessHistoricalData(this.subscription);
  }
  
  /**
   * Check if current user can add more trading pairs
   * Requirements: 8.2 - Enforce free tier limits
   */
  canAddMorePairs(currentPairCount: number): boolean {
    return canAddMorePairs(this.subscription, currentPairCount);
  }
  
  /**
   * Get current subscription state
   */
  getSubscription(): UserSubscription {
    return { ...this.subscription };
  }
  
  /**
   * Update subscription state and persist to localStorage
   * Requirements: 8.5 - Store subscription status locally using localStorage
   * @param subscription - New subscription state
   * @returns true if saved successfully, false otherwise
   */
  updateSubscription(subscription: UserSubscription): boolean {
    this.subscription = { ...subscription };
    return saveSubscription(this.subscription);
  }
  
  /**
   * Upgrade user to paid status
   * @param stripeSessionId - Optional Stripe session ID for the payment
   * @returns true if upgrade was successful, false otherwise
   */
  upgradeToPaid(stripeSessionId?: string): boolean {
    const newSubscription: UserSubscription = {
      isPaid: true,
      purchaseDate: new Date(),
      stripeSessionId,
    };
    return this.updateSubscription(newSubscription);
  }
  
  /**
   * Initiate payment process via Stripe
   * Requirements: 8.4 - Integrate with Stripe for $4.99 one-time payment
   * Note: This is a placeholder - actual Stripe integration will be implemented in task 15
   */
  async initiatePayment(): Promise<void> {
    // Placeholder for Stripe Checkout integration
    // Will be implemented in task 15.1 (UpgradeModal component)
    throw new Error('Payment integration not yet implemented. See task 15 for Stripe integration.');
  }
  
  /**
   * Clear subscription data from localStorage
   * @returns true if cleared successfully, false otherwise
   */
  clearSubscription(): boolean {
    this.subscription = { ...DEFAULT_SUBSCRIPTION };
    return clearSubscription();
  }
  
  /**
   * Reload subscription from localStorage
   * Useful for syncing state after external changes
   */
  reloadFromStorage(): void {
    this.subscription = loadSubscription();
  }
}

/**
 * Create a default SubscriptionManager instance
 * Loads subscription state from localStorage
 */
export function createSubscriptionManager(): SubscriptionManager {
  return new SubscriptionManager();
}

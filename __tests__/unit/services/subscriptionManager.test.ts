/**
 * Unit tests for Subscription Manager Service
 * Requirements: 8.1, 8.2, 8.3, 8.5
 */

import {
  SUBSCRIPTION_CONSTANTS,
  DEFAULT_SUBSCRIPTION,
  serializeSubscription,
  deserializeSubscription,
  isPaidUser,
  getMaxPairs,
  canAccessHistoricalData,
  canAddMorePairs,
  isWithinPairLimit,
  SubscriptionManager,
} from '../../../src/services/subscriptionManager';
import { UserSubscription } from '../../../src/types';

describe('Subscription Manager Service', () => {
  // Helper function to create a free subscription
  const createFreeSubscription = (): UserSubscription => ({
    isPaid: false,
  });

  // Helper function to create a paid subscription
  const createPaidSubscription = (
    purchaseDate: Date = new Date(),
    stripeSessionId?: string
  ): UserSubscription => ({
    isPaid: true,
    purchaseDate,
    stripeSessionId,
  });

  describe('SUBSCRIPTION_CONSTANTS', () => {
    it('should have correct storage key', () => {
      expect(SUBSCRIPTION_CONSTANTS.STORAGE_KEY).toBe('arbitrage_scanner_subscription');
    });

    it('should have correct free tier max pairs (1)', () => {
      expect(SUBSCRIPTION_CONSTANTS.FREE_TIER_MAX_PAIRS).toBe(1);
    });

    it('should have correct paid tier max pairs', () => {
      expect(SUBSCRIPTION_CONSTANTS.PAID_TIER_MAX_PAIRS).toBe(10);
    });

    it('should have correct payment price', () => {
      expect(SUBSCRIPTION_CONSTANTS.PAYMENT_PRICE).toBe(4.99);
    });
  });

  describe('DEFAULT_SUBSCRIPTION', () => {
    it('should default to free user', () => {
      expect(DEFAULT_SUBSCRIPTION.isPaid).toBe(false);
    });

    it('should have no purchase date', () => {
      expect(DEFAULT_SUBSCRIPTION.purchaseDate).toBeUndefined();
    });

    it('should have no stripe session ID', () => {
      expect(DEFAULT_SUBSCRIPTION.stripeSessionId).toBeUndefined();
    });
  });

  describe('serializeSubscription', () => {
    /**
     * Requirements: 8.5 - Store subscription status locally using localStorage
     */
    it('should serialize free subscription', () => {
      const subscription = createFreeSubscription();
      const serialized = serializeSubscription(subscription);
      const parsed = JSON.parse(serialized);

      expect(parsed.isPaid).toBe(false);
      expect(parsed.purchaseDate).toBeNull();
      expect(parsed.stripeSessionId).toBeNull();
    });

    it('should serialize paid subscription with all fields', () => {
      const purchaseDate = new Date('2024-01-15T10:30:00Z');
      const subscription = createPaidSubscription(purchaseDate, 'cs_test_123');
      const serialized = serializeSubscription(subscription);
      const parsed = JSON.parse(serialized);

      expect(parsed.isPaid).toBe(true);
      expect(parsed.purchaseDate).toBe('2024-01-15T10:30:00.000Z');
      expect(parsed.stripeSessionId).toBe('cs_test_123');
    });

    it('should handle subscription without optional fields', () => {
      const subscription: UserSubscription = { isPaid: true };
      const serialized = serializeSubscription(subscription);
      const parsed = JSON.parse(serialized);

      expect(parsed.isPaid).toBe(true);
      expect(parsed.purchaseDate).toBeNull();
      expect(parsed.stripeSessionId).toBeNull();
    });
  });

  describe('deserializeSubscription', () => {
    /**
     * Requirements: 8.5 - Store subscription status locally using localStorage
     */
    it('should deserialize free subscription', () => {
      const data = JSON.stringify({ isPaid: false, purchaseDate: null, stripeSessionId: null });
      const subscription = deserializeSubscription(data);

      expect(subscription).not.toBeNull();
      expect(subscription!.isPaid).toBe(false);
      expect(subscription!.purchaseDate).toBeUndefined();
      expect(subscription!.stripeSessionId).toBeUndefined();
    });

    it('should deserialize paid subscription with all fields', () => {
      const data = JSON.stringify({
        isPaid: true,
        purchaseDate: '2024-01-15T10:30:00.000Z',
        stripeSessionId: 'cs_test_123',
      });
      const subscription = deserializeSubscription(data);

      expect(subscription).not.toBeNull();
      expect(subscription!.isPaid).toBe(true);
      expect(subscription!.purchaseDate).toBeInstanceOf(Date);
      expect(subscription!.purchaseDate!.toISOString()).toBe('2024-01-15T10:30:00.000Z');
      expect(subscription!.stripeSessionId).toBe('cs_test_123');
    });

    it('should return null for invalid JSON', () => {
      const subscription = deserializeSubscription('not valid json');
      expect(subscription).toBeNull();
    });

    it('should return null for missing isPaid field', () => {
      const data = JSON.stringify({ purchaseDate: null });
      const subscription = deserializeSubscription(data);
      expect(subscription).toBeNull();
    });

    it('should return null for invalid isPaid type', () => {
      const data = JSON.stringify({ isPaid: 'yes' });
      const subscription = deserializeSubscription(data);
      expect(subscription).toBeNull();
    });

    it('should handle invalid date gracefully', () => {
      const data = JSON.stringify({
        isPaid: true,
        purchaseDate: 'not a date',
        stripeSessionId: null,
      });
      const subscription = deserializeSubscription(data);

      expect(subscription).not.toBeNull();
      expect(subscription!.isPaid).toBe(true);
      expect(subscription!.purchaseDate).toBeUndefined();
    });
  });

  describe('isPaidUser', () => {
    /**
     * Requirements: 8.1 - Distinguish between free and paid user permissions
     */
    it('should return false for free user', () => {
      const subscription = createFreeSubscription();
      expect(isPaidUser(subscription)).toBe(false);
    });

    it('should return true for paid user', () => {
      const subscription = createPaidSubscription();
      expect(isPaidUser(subscription)).toBe(true);
    });

    it('should return false for undefined isPaid', () => {
      const subscription = {} as UserSubscription;
      expect(isPaidUser(subscription)).toBe(false);
    });
  });

  describe('getMaxPairs', () => {
    /**
     * Requirements: 8.2, 8.3 - Free users limited to 1 pair, paid users get multiple
     */
    it('should return 1 for free user', () => {
      const subscription = createFreeSubscription();
      expect(getMaxPairs(subscription)).toBe(1);
    });

    it('should return 10 for paid user', () => {
      const subscription = createPaidSubscription();
      expect(getMaxPairs(subscription)).toBe(10);
    });
  });

  describe('canAccessHistoricalData', () => {
    /**
     * Requirements: 8.2, 8.3 - Free users cannot access, paid users can
     */
    it('should return false for free user', () => {
      const subscription = createFreeSubscription();
      expect(canAccessHistoricalData(subscription)).toBe(false);
    });

    it('should return true for paid user', () => {
      const subscription = createPaidSubscription();
      expect(canAccessHistoricalData(subscription)).toBe(true);
    });
  });

  describe('canAddMorePairs', () => {
    /**
     * Requirements: 8.2 - Enforce free tier limits
     */
    describe('free user', () => {
      it('should allow adding first pair (0 current)', () => {
        const subscription = createFreeSubscription();
        expect(canAddMorePairs(subscription, 0)).toBe(true);
      });

      it('should not allow adding more pairs when at limit (1 current)', () => {
        const subscription = createFreeSubscription();
        expect(canAddMorePairs(subscription, 1)).toBe(false);
      });

      it('should not allow adding more pairs when over limit', () => {
        const subscription = createFreeSubscription();
        expect(canAddMorePairs(subscription, 2)).toBe(false);
      });
    });

    describe('paid user', () => {
      it('should allow adding pairs when below limit', () => {
        const subscription = createPaidSubscription();
        expect(canAddMorePairs(subscription, 0)).toBe(true);
        expect(canAddMorePairs(subscription, 5)).toBe(true);
        expect(canAddMorePairs(subscription, 9)).toBe(true);
      });

      it('should not allow adding more pairs when at limit', () => {
        const subscription = createPaidSubscription();
        expect(canAddMorePairs(subscription, 10)).toBe(false);
      });
    });
  });

  describe('isWithinPairLimit', () => {
    /**
     * Requirements: 8.2, 8.3 - Validate pair count against subscription limits
     */
    describe('free user', () => {
      it('should return true for 0 pairs', () => {
        const subscription = createFreeSubscription();
        expect(isWithinPairLimit(subscription, 0)).toBe(true);
      });

      it('should return true for 1 pair (at limit)', () => {
        const subscription = createFreeSubscription();
        expect(isWithinPairLimit(subscription, 1)).toBe(true);
      });

      it('should return false for more than 1 pair', () => {
        const subscription = createFreeSubscription();
        expect(isWithinPairLimit(subscription, 2)).toBe(false);
        expect(isWithinPairLimit(subscription, 5)).toBe(false);
      });
    });

    describe('paid user', () => {
      it('should return true for pairs within limit', () => {
        const subscription = createPaidSubscription();
        expect(isWithinPairLimit(subscription, 0)).toBe(true);
        expect(isWithinPairLimit(subscription, 5)).toBe(true);
        expect(isWithinPairLimit(subscription, 10)).toBe(true);
      });

      it('should return false for pairs over limit', () => {
        const subscription = createPaidSubscription();
        expect(isWithinPairLimit(subscription, 11)).toBe(false);
        expect(isWithinPairLimit(subscription, 20)).toBe(false);
      });
    });
  });

  describe('SubscriptionManager class', () => {
    describe('constructor', () => {
      it('should initialize with provided subscription', () => {
        const subscription = createPaidSubscription();
        const manager = new SubscriptionManager(subscription);

        expect(manager.isPaidUser()).toBe(true);
      });

      it('should initialize with default subscription when none provided', () => {
        // In Node.js environment, localStorage is not available
        // so it should fall back to default subscription
        const manager = new SubscriptionManager();
        expect(manager.isPaidUser()).toBe(false);
      });
    });

    describe('isPaidUser', () => {
      /**
       * Requirements: 8.1 - Distinguish between free and paid user permissions
       */
      it('should return false for free user', () => {
        const manager = new SubscriptionManager(createFreeSubscription());
        expect(manager.isPaidUser()).toBe(false);
      });

      it('should return true for paid user', () => {
        const manager = new SubscriptionManager(createPaidSubscription());
        expect(manager.isPaidUser()).toBe(true);
      });
    });

    describe('getMaxPairs', () => {
      /**
       * Requirements: 8.2, 8.3 - Free users limited to 1 pair, paid users get multiple
       */
      it('should return 1 for free user', () => {
        const manager = new SubscriptionManager(createFreeSubscription());
        expect(manager.getMaxPairs()).toBe(1);
      });

      it('should return 10 for paid user', () => {
        const manager = new SubscriptionManager(createPaidSubscription());
        expect(manager.getMaxPairs()).toBe(10);
      });
    });

    describe('canAccessHistoricalData', () => {
      /**
       * Requirements: 8.2, 8.3 - Free users cannot access, paid users can
       */
      it('should return false for free user', () => {
        const manager = new SubscriptionManager(createFreeSubscription());
        expect(manager.canAccessHistoricalData()).toBe(false);
      });

      it('should return true for paid user', () => {
        const manager = new SubscriptionManager(createPaidSubscription());
        expect(manager.canAccessHistoricalData()).toBe(true);
      });
    });

    describe('canAddMorePairs', () => {
      /**
       * Requirements: 8.2 - Enforce free tier limits
       */
      it('should enforce free tier limit of 1 pair', () => {
        const manager = new SubscriptionManager(createFreeSubscription());

        expect(manager.canAddMorePairs(0)).toBe(true);
        expect(manager.canAddMorePairs(1)).toBe(false);
      });

      it('should allow paid users to add multiple pairs', () => {
        const manager = new SubscriptionManager(createPaidSubscription());

        expect(manager.canAddMorePairs(0)).toBe(true);
        expect(manager.canAddMorePairs(5)).toBe(true);
        expect(manager.canAddMorePairs(9)).toBe(true);
        expect(manager.canAddMorePairs(10)).toBe(false);
      });
    });

    describe('getSubscription', () => {
      it('should return a copy of the subscription', () => {
        const original = createPaidSubscription(new Date(), 'cs_test_123');
        const manager = new SubscriptionManager(original);

        const subscription1 = manager.getSubscription();
        const subscription2 = manager.getSubscription();

        // Should be equal but not the same reference
        expect(subscription1).toEqual(subscription2);
        expect(subscription1).not.toBe(subscription2);
      });

      it('should not allow external modification', () => {
        const manager = new SubscriptionManager(createFreeSubscription());
        const subscription = manager.getSubscription();

        // Modify the returned object
        subscription.isPaid = true;

        // Original should be unchanged
        expect(manager.isPaidUser()).toBe(false);
      });
    });

    describe('updateSubscription', () => {
      /**
       * Requirements: 8.5 - Store subscription status locally using localStorage
       */
      it('should update subscription state', () => {
        const manager = new SubscriptionManager(createFreeSubscription());
        expect(manager.isPaidUser()).toBe(false);

        manager.updateSubscription(createPaidSubscription());
        expect(manager.isPaidUser()).toBe(true);
      });

      it('should update in-memory state regardless of localStorage availability', () => {
        const manager = new SubscriptionManager(createFreeSubscription());
        manager.updateSubscription(createPaidSubscription());

        // State should be updated in memory
        expect(manager.isPaidUser()).toBe(true);
        expect(manager.getMaxPairs()).toBe(10);
        expect(manager.canAccessHistoricalData()).toBe(true);
      });
    });

    describe('upgradeToPaid', () => {
      it('should upgrade user to paid status', () => {
        const manager = new SubscriptionManager(createFreeSubscription());
        expect(manager.isPaidUser()).toBe(false);

        manager.upgradeToPaid('cs_test_123');

        expect(manager.isPaidUser()).toBe(true);
        const subscription = manager.getSubscription();
        expect(subscription.stripeSessionId).toBe('cs_test_123');
        expect(subscription.purchaseDate).toBeInstanceOf(Date);
      });

      it('should work without stripe session ID', () => {
        const manager = new SubscriptionManager(createFreeSubscription());
        manager.upgradeToPaid();

        expect(manager.isPaidUser()).toBe(true);
        const subscription = manager.getSubscription();
        expect(subscription.stripeSessionId).toBeUndefined();
      });
    });

    describe('initiatePayment', () => {
      /**
       * Requirements: 8.4 - Integrate with Stripe for $4.99 one-time payment
       * Note: This is a placeholder test - actual Stripe integration in task 15
       */
      it('should throw error indicating payment not yet implemented', async () => {
        const manager = new SubscriptionManager(createFreeSubscription());

        await expect(manager.initiatePayment()).rejects.toThrow(
          'Payment integration not yet implemented'
        );
      });
    });

    describe('clearSubscription', () => {
      it('should reset subscription to default state', () => {
        const manager = new SubscriptionManager(createPaidSubscription());
        expect(manager.isPaidUser()).toBe(true);

        manager.clearSubscription();

        expect(manager.isPaidUser()).toBe(false);
        const subscription = manager.getSubscription();
        expect(subscription.purchaseDate).toBeUndefined();
        expect(subscription.stripeSessionId).toBeUndefined();
      });
    });
  });

  describe('Serialization round-trip', () => {
    /**
     * Requirements: 8.5 - Subscription state persistence
     */
    it('should preserve free subscription through serialization', () => {
      const original = createFreeSubscription();
      const serialized = serializeSubscription(original);
      const deserialized = deserializeSubscription(serialized);

      expect(deserialized).not.toBeNull();
      expect(deserialized!.isPaid).toBe(original.isPaid);
    });

    it('should preserve paid subscription through serialization', () => {
      const original = createPaidSubscription(new Date('2024-01-15T10:30:00Z'), 'cs_test_123');
      const serialized = serializeSubscription(original);
      const deserialized = deserializeSubscription(serialized);

      expect(deserialized).not.toBeNull();
      expect(deserialized!.isPaid).toBe(original.isPaid);
      expect(deserialized!.purchaseDate!.toISOString()).toBe(original.purchaseDate!.toISOString());
      expect(deserialized!.stripeSessionId).toBe(original.stripeSessionId);
    });
  });
});

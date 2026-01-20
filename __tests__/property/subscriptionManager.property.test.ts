import * as fc from 'fast-check';
import {
  SUBSCRIPTION_CONSTANTS,
  getMaxPairs,
  canAddMorePairs,
  isWithinPairLimit,
  isPaidUser,
  serializeSubscription,
  deserializeSubscription,
} from '../../src/services/subscriptionManager';
import { UserSubscription } from '../../src/types';

/**
 * **Feature: crypto-arbitrage-scanner, Property 3: Subscription-Based Pair Limits**
 *
 * *For any* user subscription state, if the user is free, adding more than 1 trading pair
 * SHALL be blocked; if the user is paid, multiple pairs (up to the limit) SHALL be allowed.
 *
 * **Validates: Requirements 1.5, 1.6, 8.1, 8.2, 8.3**
 */
describe('Property 3: Subscription-Based Pair Limits', () => {
  const { FREE_TIER_MAX_PAIRS, PAID_TIER_MAX_PAIRS } = SUBSCRIPTION_CONSTANTS;

  // Arbitrary for free user subscription
  const freeUserSubscriptionArb: fc.Arbitrary<UserSubscription> = fc.record({
    isPaid: fc.constant(false),
    purchaseDate: fc.constant(undefined),
    stripeSessionId: fc.constant(undefined),
  });

  // Arbitrary for valid dates only (no NaN dates) - using integer timestamps to avoid invalid dates
  const validDateArb = fc.integer({
    min: new Date('2020-01-01').getTime(),
    max: new Date('2030-12-31').getTime(),
  }).map(timestamp => new Date(timestamp));

  // Arbitrary for paid user subscription
  const paidUserSubscriptionArb: fc.Arbitrary<UserSubscription> = fc.record({
    isPaid: fc.constant(true),
    purchaseDate: fc.option(validDateArb, { nil: undefined }),
    stripeSessionId: fc.option(fc.string({ minLength: 10, maxLength: 50 }), { nil: undefined }),
  });

  // Arbitrary for any user subscription (free or paid)
  const anySubscriptionArb: fc.Arbitrary<UserSubscription> = fc.oneof(
    freeUserSubscriptionArb,
    paidUserSubscriptionArb
  );

  // Arbitrary for pair counts within free tier limit (0 to FREE_TIER_MAX_PAIRS)
  const freeTierValidPairCountArb = fc.integer({ min: 0, max: FREE_TIER_MAX_PAIRS });

  // Arbitrary for pair counts exceeding free tier limit (> FREE_TIER_MAX_PAIRS)
  const freeTierExceedingPairCountArb = fc.integer({ min: FREE_TIER_MAX_PAIRS + 1, max: 100 });

  // Arbitrary for pair counts within paid tier limit (0 to PAID_TIER_MAX_PAIRS)
  const paidTierValidPairCountArb = fc.integer({ min: 0, max: PAID_TIER_MAX_PAIRS });

  // Arbitrary for pair counts exceeding paid tier limit (> PAID_TIER_MAX_PAIRS)
  const paidTierExceedingPairCountArb = fc.integer({ min: PAID_TIER_MAX_PAIRS + 1, max: 100 });

  // Arbitrary for any non-negative pair count
  const anyPairCountArb = fc.integer({ min: 0, max: 100 });

  /**
   * Property: Free users SHALL have getMaxPairs return FREE_TIER_MAX_PAIRS (1)
   * Validates: Requirements 8.2 - Free users limited to 1 pair
   */
  it('free users should have getMaxPairs return FREE_TIER_MAX_PAIRS (1)', () => {
    fc.assert(
      fc.property(freeUserSubscriptionArb, (subscription) => {
        const maxPairs = getMaxPairs(subscription);
        expect(maxPairs).toBe(FREE_TIER_MAX_PAIRS);
        expect(maxPairs).toBe(1);
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Paid users SHALL have getMaxPairs return PAID_TIER_MAX_PAIRS (10)
   * Validates: Requirements 8.3 - Paid users get multiple pairs
   */
  it('paid users should have getMaxPairs return PAID_TIER_MAX_PAIRS (10)', () => {
    fc.assert(
      fc.property(paidUserSubscriptionArb, (subscription) => {
        const maxPairs = getMaxPairs(subscription);
        expect(maxPairs).toBe(PAID_TIER_MAX_PAIRS);
        expect(maxPairs).toBe(10);
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Free users SHALL be blocked from adding more than 1 trading pair
   * Validates: Requirements 1.5 - Free user adding more than one pair SHALL be blocked
   */
  it('free users should be blocked from adding more than 1 trading pair', () => {
    fc.assert(
      fc.property(freeUserSubscriptionArb, freeTierExceedingPairCountArb, (subscription, pairCount) => {
        // When free user has 1 or more pairs, they cannot add more
        const canAdd = canAddMorePairs(subscription, pairCount);
        expect(canAdd).toBe(false);

        // isWithinPairLimit should also return false for counts > 1
        const isWithin = isWithinPairLimit(subscription, pairCount);
        expect(isWithin).toBe(false);

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Free users with 0 pairs SHALL be allowed to add 1 pair
   * Validates: Requirements 1.5, 8.2 - Free users can have up to 1 pair
   */
  it('free users with 0 pairs should be allowed to add 1 pair', () => {
    fc.assert(
      fc.property(freeUserSubscriptionArb, (subscription) => {
        // Free user with 0 pairs can add one more
        const canAdd = canAddMorePairs(subscription, 0);
        expect(canAdd).toBe(true);

        // 0 pairs is within limit
        const isWithinZero = isWithinPairLimit(subscription, 0);
        expect(isWithinZero).toBe(true);

        // 1 pair is within limit (the maximum for free)
        const isWithinOne = isWithinPairLimit(subscription, 1);
        expect(isWithinOne).toBe(true);

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Free users with exactly 1 pair SHALL NOT be allowed to add more
   * Validates: Requirements 1.5 - Free user adding more than one pair SHALL be blocked
   */
  it('free users with exactly 1 pair should NOT be allowed to add more', () => {
    fc.assert(
      fc.property(freeUserSubscriptionArb, (subscription) => {
        // Free user with 1 pair cannot add more
        const canAdd = canAddMorePairs(subscription, 1);
        expect(canAdd).toBe(false);

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Paid users SHALL be allowed to add multiple pairs up to the limit
   * Validates: Requirements 1.6, 8.3 - Paid users can monitor multiple pairs
   */
  it('paid users should be allowed to add multiple pairs up to the limit', () => {
    fc.assert(
      fc.property(
        paidUserSubscriptionArb,
        fc.integer({ min: 0, max: PAID_TIER_MAX_PAIRS - 1 }),
        (subscription, currentPairCount) => {
          // Paid user with less than max pairs can add more
          const canAdd = canAddMorePairs(subscription, currentPairCount);
          expect(canAdd).toBe(true);

          // Current count is within limit
          const isWithin = isWithinPairLimit(subscription, currentPairCount);
          expect(isWithin).toBe(true);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Paid users with exactly PAID_TIER_MAX_PAIRS SHALL NOT be allowed to add more
   * Validates: Requirements 8.3 - Paid users have a limit too
   */
  it('paid users with exactly PAID_TIER_MAX_PAIRS should NOT be allowed to add more', () => {
    fc.assert(
      fc.property(paidUserSubscriptionArb, (subscription) => {
        // Paid user at max pairs cannot add more
        const canAdd = canAddMorePairs(subscription, PAID_TIER_MAX_PAIRS);
        expect(canAdd).toBe(false);

        // But being at max is still within limit
        const isWithin = isWithinPairLimit(subscription, PAID_TIER_MAX_PAIRS);
        expect(isWithin).toBe(true);

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Paid users SHALL be blocked from exceeding PAID_TIER_MAX_PAIRS
   * Validates: Requirements 8.3 - Paid users have upper limit
   */
  it('paid users should be blocked from exceeding PAID_TIER_MAX_PAIRS', () => {
    fc.assert(
      fc.property(paidUserSubscriptionArb, paidTierExceedingPairCountArb, (subscription, pairCount) => {
        // Paid user cannot add more when already exceeding limit
        const canAdd = canAddMorePairs(subscription, pairCount);
        expect(canAdd).toBe(false);

        // Exceeding count is not within limit
        const isWithin = isWithinPairLimit(subscription, pairCount);
        expect(isWithin).toBe(false);

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: isPaidUser correctly identifies subscription status
   * Validates: Requirements 8.1 - Distinguish between free and paid user permissions
   */
  it('isPaidUser should correctly identify subscription status', () => {
    fc.assert(
      fc.property(anySubscriptionArb, (subscription) => {
        const isPaid = isPaidUser(subscription);
        expect(isPaid).toBe(subscription.isPaid);
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: getMaxPairs should be consistent with isPaidUser
   * Validates: Requirements 8.1, 8.2, 8.3 - Subscription determines limits
   */
  it('getMaxPairs should be consistent with isPaidUser', () => {
    fc.assert(
      fc.property(anySubscriptionArb, (subscription) => {
        const isPaid = isPaidUser(subscription);
        const maxPairs = getMaxPairs(subscription);

        if (isPaid) {
          expect(maxPairs).toBe(PAID_TIER_MAX_PAIRS);
        } else {
          expect(maxPairs).toBe(FREE_TIER_MAX_PAIRS);
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: canAddMorePairs should be consistent with isWithinPairLimit
   * canAddMorePairs(sub, n) === true implies isWithinPairLimit(sub, n+1) === true
   */
  it('canAddMorePairs should be consistent with isWithinPairLimit', () => {
    fc.assert(
      fc.property(anySubscriptionArb, anyPairCountArb, (subscription, currentPairCount) => {
        const canAdd = canAddMorePairs(subscription, currentPairCount);
        const wouldBeWithinLimit = isWithinPairLimit(subscription, currentPairCount + 1);

        // If we can add more pairs, then having one more pair should be within limit
        if (canAdd) {
          expect(wouldBeWithinLimit).toBe(true);
        }

        // If adding one more would exceed limit, we shouldn't be able to add
        if (!wouldBeWithinLimit) {
          expect(canAdd).toBe(false);
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Pair limit functions should be deterministic
   * Same input should always produce the same result
   */
  it('pair limit functions should be deterministic', () => {
    fc.assert(
      fc.property(anySubscriptionArb, anyPairCountArb, (subscription, pairCount) => {
        // Call each function multiple times
        const maxPairs1 = getMaxPairs(subscription);
        const maxPairs2 = getMaxPairs(subscription);
        expect(maxPairs1).toBe(maxPairs2);

        const canAdd1 = canAddMorePairs(subscription, pairCount);
        const canAdd2 = canAddMorePairs(subscription, pairCount);
        expect(canAdd1).toBe(canAdd2);

        const isWithin1 = isWithinPairLimit(subscription, pairCount);
        const isWithin2 = isWithinPairLimit(subscription, pairCount);
        expect(isWithin1).toBe(isWithin2);

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Free tier limit (1) should always be less than paid tier limit (10)
   * Validates: Requirements 8.2, 8.3 - Paid users get more than free users
   */
  it('free tier limit should always be less than paid tier limit', () => {
    fc.assert(
      fc.property(freeUserSubscriptionArb, paidUserSubscriptionArb, (freeSubscription, paidSubscription) => {
        const freeMaxPairs = getMaxPairs(freeSubscription);
        const paidMaxPairs = getMaxPairs(paidSubscription);

        expect(freeMaxPairs).toBeLessThan(paidMaxPairs);
        expect(freeMaxPairs).toBe(1);
        expect(paidMaxPairs).toBe(10);

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Zero pairs should always be within limit for any subscription
   */
  it('zero pairs should always be within limit for any subscription', () => {
    fc.assert(
      fc.property(anySubscriptionArb, (subscription) => {
        const isWithin = isWithinPairLimit(subscription, 0);
        expect(isWithin).toBe(true);

        const canAdd = canAddMorePairs(subscription, 0);
        expect(canAdd).toBe(true);

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Negative pair counts should be within limit (edge case handling)
   * Note: This tests the implementation's behavior with invalid inputs
   */
  it('negative pair counts should be handled gracefully', () => {
    fc.assert(
      fc.property(
        anySubscriptionArb,
        fc.integer({ min: -100, max: -1 }),
        (subscription, negativePairCount) => {
          // Negative counts should be considered within limit (less than max)
          const isWithin = isWithinPairLimit(subscription, negativePairCount);
          expect(isWithin).toBe(true);

          // Should be able to add more pairs when count is negative
          const canAdd = canAddMorePairs(subscription, negativePairCount);
          expect(canAdd).toBe(true);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Subscription with isPaid=true should always allow more pairs than isPaid=false
   * for any valid pair count less than FREE_TIER_MAX_PAIRS
   */
  it('paid subscription should always allow at least as many pairs as free subscription', () => {
    fc.assert(
      fc.property(
        freeUserSubscriptionArb,
        paidUserSubscriptionArb,
        fc.integer({ min: 0, max: FREE_TIER_MAX_PAIRS }),
        (freeSubscription, paidSubscription, pairCount) => {
          const freeCanAdd = canAddMorePairs(freeSubscription, pairCount);
          const paidCanAdd = canAddMorePairs(paidSubscription, pairCount);

          // If free user can add, paid user should definitely be able to add
          if (freeCanAdd) {
            expect(paidCanAdd).toBe(true);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * **Feature: crypto-arbitrage-scanner, Property 21: Subscription State Persistence Round-Trip**
 *
 * *For any* subscription state change, saving to localStorage and then reading back
 * SHALL produce the same subscription state.
 *
 * **Validates: Requirements 8.5**
 */
describe('Property 21: Subscription State Persistence Round-Trip', () => {
  // Arbitrary for free user subscription (no purchaseDate or stripeSessionId)
  const freeUserSubscriptionArb: fc.Arbitrary<UserSubscription> = fc.record({
    isPaid: fc.constant(false),
    purchaseDate: fc.constant(undefined),
    stripeSessionId: fc.constant(undefined),
  });

  // Arbitrary for valid dates only (no NaN dates) - using integer timestamps to avoid invalid dates
  const validDateArb = fc.integer({
    min: new Date('2020-01-01').getTime(),
    max: new Date('2030-12-31').getTime(),
  }).map(timestamp => new Date(timestamp));

  // Arbitrary for paid user subscription with optional fields
  const paidUserSubscriptionArb: fc.Arbitrary<UserSubscription> = fc.record({
    isPaid: fc.constant(true),
    purchaseDate: fc.option(validDateArb, { nil: undefined }),
    stripeSessionId: fc.option(
      fc.string({ minLength: 10, maxLength: 100 }).filter((s) => s.trim().length > 0),
      { nil: undefined }
    ),
  });

  // Arbitrary for any valid subscription state
  const anySubscriptionArb: fc.Arbitrary<UserSubscription> = fc.oneof(
    freeUserSubscriptionArb,
    paidUserSubscriptionArb
  );

  // Arbitrary for subscription with guaranteed purchaseDate (for date round-trip testing)
  const subscriptionWithDateArb: fc.Arbitrary<UserSubscription> = fc.record({
    isPaid: fc.boolean(),
    purchaseDate: validDateArb,
    stripeSessionId: fc.option(
      fc.string({ minLength: 10, maxLength: 100 }).filter((s) => s.trim().length > 0),
      { nil: undefined }
    ),
  });

  // Arbitrary for subscription with guaranteed stripeSessionId
  const subscriptionWithSessionIdArb: fc.Arbitrary<UserSubscription> = fc.record({
    isPaid: fc.boolean(),
    purchaseDate: fc.option(validDateArb, { nil: undefined }),
    stripeSessionId: fc.string({ minLength: 10, maxLength: 100 }).filter((s) => s.trim().length > 0),
  });

  /**
   * Property: Serialization followed by deserialization SHALL preserve isPaid status
   * Validates: Requirements 8.5 - Store subscription status locally using localStorage
   */
  it('serialization followed by deserialization should preserve isPaid status', () => {
    fc.assert(
      fc.property(anySubscriptionArb, (subscription) => {
        const serialized = serializeSubscription(subscription);
        const deserialized = deserializeSubscription(serialized);

        expect(deserialized).not.toBeNull();
        expect(deserialized!.isPaid).toBe(subscription.isPaid);

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Serialization followed by deserialization SHALL preserve purchaseDate
   * Validates: Requirements 8.5 - Store subscription status locally using localStorage
   */
  it('serialization followed by deserialization should preserve purchaseDate', () => {
    fc.assert(
      fc.property(subscriptionWithDateArb, (subscription) => {
        const serialized = serializeSubscription(subscription);
        const deserialized = deserializeSubscription(serialized);

        expect(deserialized).not.toBeNull();
        expect(deserialized!.purchaseDate).toBeDefined();
        // Compare timestamps since Date objects won't be strictly equal
        expect(deserialized!.purchaseDate!.getTime()).toBe(subscription.purchaseDate!.getTime());

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Serialization followed by deserialization SHALL preserve stripeSessionId
   * Validates: Requirements 8.5 - Store subscription status locally using localStorage
   */
  it('serialization followed by deserialization should preserve stripeSessionId', () => {
    fc.assert(
      fc.property(subscriptionWithSessionIdArb, (subscription) => {
        const serialized = serializeSubscription(subscription);
        const deserialized = deserializeSubscription(serialized);

        expect(deserialized).not.toBeNull();
        expect(deserialized!.stripeSessionId).toBe(subscription.stripeSessionId);

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Serialization followed by deserialization SHALL preserve undefined optional fields
   * Validates: Requirements 8.5 - Store subscription status locally using localStorage
   */
  it('serialization followed by deserialization should preserve undefined optional fields', () => {
    fc.assert(
      fc.property(freeUserSubscriptionArb, (subscription) => {
        const serialized = serializeSubscription(subscription);
        const deserialized = deserializeSubscription(serialized);

        expect(deserialized).not.toBeNull();
        expect(deserialized!.isPaid).toBe(false);
        expect(deserialized!.purchaseDate).toBeUndefined();
        expect(deserialized!.stripeSessionId).toBeUndefined();

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Complete round-trip SHALL produce equivalent subscription state
   * Validates: Requirements 8.5 - Store subscription status locally using localStorage
   */
  it('complete round-trip should produce equivalent subscription state', () => {
    fc.assert(
      fc.property(anySubscriptionArb, (subscription) => {
        const serialized = serializeSubscription(subscription);
        const deserialized = deserializeSubscription(serialized);

        expect(deserialized).not.toBeNull();

        // Check isPaid
        expect(deserialized!.isPaid).toBe(subscription.isPaid);

        // Check purchaseDate (compare timestamps if both defined)
        if (subscription.purchaseDate !== undefined) {
          expect(deserialized!.purchaseDate).toBeDefined();
          expect(deserialized!.purchaseDate!.getTime()).toBe(subscription.purchaseDate.getTime());
        } else {
          expect(deserialized!.purchaseDate).toBeUndefined();
        }

        // Check stripeSessionId
        if (subscription.stripeSessionId !== undefined) {
          expect(deserialized!.stripeSessionId).toBe(subscription.stripeSessionId);
        } else {
          expect(deserialized!.stripeSessionId).toBeUndefined();
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Serialization SHALL produce valid JSON
   * Validates: Requirements 8.5 - Store subscription status locally using localStorage
   */
  it('serialization should produce valid JSON', () => {
    fc.assert(
      fc.property(anySubscriptionArb, (subscription) => {
        const serialized = serializeSubscription(subscription);

        // Should not throw when parsing
        expect(() => JSON.parse(serialized)).not.toThrow();

        // Should be a non-empty string
        expect(typeof serialized).toBe('string');
        expect(serialized.length).toBeGreaterThan(0);

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Deserialization of invalid JSON SHALL return null
   * Validates: Requirements 8.5 - Graceful handling of corrupted data
   */
  it('deserialization of invalid JSON should return null', () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => {
          try {
            JSON.parse(s);
            return false; // Valid JSON, filter it out
          } catch {
            return true; // Invalid JSON, keep it
          }
        }),
        (invalidJson) => {
          const result = deserializeSubscription(invalidJson);
          expect(result).toBeNull();
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Deserialization of JSON without isPaid field SHALL return null
   * Validates: Requirements 8.5 - Validation of required fields
   */
  it('deserialization of JSON without isPaid field should return null', () => {
    fc.assert(
      fc.property(
        fc.record({
          purchaseDate: fc.option(fc.string(), { nil: null }),
          stripeSessionId: fc.option(fc.string(), { nil: null }),
        }),
        (partialData) => {
          const serialized = JSON.stringify(partialData);
          const result = deserializeSubscription(serialized);
          expect(result).toBeNull();
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Deserialization of JSON with non-boolean isPaid SHALL return null
   * Validates: Requirements 8.5 - Type validation
   */
  it('deserialization of JSON with non-boolean isPaid should return null', () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.string(), fc.integer(), fc.constant(null), fc.array(fc.anything())),
        (invalidIsPaid) => {
          const data = {
            isPaid: invalidIsPaid,
            purchaseDate: null,
            stripeSessionId: null,
          };
          const serialized = JSON.stringify(data);
          const result = deserializeSubscription(serialized);
          expect(result).toBeNull();
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Multiple round-trips SHALL be idempotent
   * Validates: Requirements 8.5 - Consistency of serialization
   */
  it('multiple round-trips should be idempotent', () => {
    fc.assert(
      fc.property(anySubscriptionArb, (subscription) => {
        // First round-trip
        const serialized1 = serializeSubscription(subscription);
        const deserialized1 = deserializeSubscription(serialized1);
        expect(deserialized1).not.toBeNull();

        // Second round-trip
        const serialized2 = serializeSubscription(deserialized1!);
        const deserialized2 = deserializeSubscription(serialized2);
        expect(deserialized2).not.toBeNull();

        // Results should be equivalent
        expect(deserialized2!.isPaid).toBe(deserialized1!.isPaid);

        if (deserialized1!.purchaseDate !== undefined) {
          expect(deserialized2!.purchaseDate).toBeDefined();
          expect(deserialized2!.purchaseDate!.getTime()).toBe(deserialized1!.purchaseDate!.getTime());
        } else {
          expect(deserialized2!.purchaseDate).toBeUndefined();
        }

        expect(deserialized2!.stripeSessionId).toBe(deserialized1!.stripeSessionId);

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Serialized output SHALL be deterministic for same input
   * Validates: Requirements 8.5 - Consistent serialization
   */
  it('serialized output should be deterministic for same input', () => {
    fc.assert(
      fc.property(anySubscriptionArb, (subscription) => {
        const serialized1 = serializeSubscription(subscription);
        const serialized2 = serializeSubscription(subscription);

        expect(serialized1).toBe(serialized2);

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Date precision SHALL be preserved through round-trip (millisecond precision)
   * Validates: Requirements 8.5 - Accurate date storage
   */
  it('date precision should be preserved through round-trip', () => {
    fc.assert(
      fc.property(
        fc.date({
          min: new Date('2020-01-01'),
          max: new Date('2030-12-31'),
        }),
        (purchaseDate) => {
          const subscription: UserSubscription = {
            isPaid: true,
            purchaseDate,
            stripeSessionId: 'test-session-id',
          };

          const serialized = serializeSubscription(subscription);
          const deserialized = deserializeSubscription(serialized);

          expect(deserialized).not.toBeNull();
          expect(deserialized!.purchaseDate).toBeDefined();

          // Millisecond precision should be preserved
          expect(deserialized!.purchaseDate!.getTime()).toBe(purchaseDate.getTime());

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Deserialization SHALL handle invalid date strings gracefully
   * Validates: Requirements 8.5 - Graceful error handling
   */
  it('deserialization should handle invalid date strings gracefully', () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => isNaN(new Date(s).getTime())),
        (invalidDateString) => {
          const data = {
            isPaid: true,
            purchaseDate: invalidDateString,
            stripeSessionId: null,
          };
          const serialized = JSON.stringify(data);
          const result = deserializeSubscription(serialized);

          // Should still deserialize successfully, but purchaseDate should be undefined
          expect(result).not.toBeNull();
          expect(result!.isPaid).toBe(true);
          expect(result!.purchaseDate).toBeUndefined();

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

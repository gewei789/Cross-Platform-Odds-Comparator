import {
  validateThreshold,
  isValidThreshold,
  generateAlertId,
  spreadExceedsThreshold,
  createAlertRecord,
  trimAlertHistory,
  addAlertsToHistory,
  formatNotificationContent,
  isNotificationSupported,
  hasNotificationPermission,
  isAudioSupported,
  createAudioContext,
  AlertSystem,
  ALERT_CONSTANTS,
} from '../../../src/services/alertSystem';
import { SpreadResult, ProfitResult, AlertRecord, TradingPair, Exchange } from '../../../src/types';

/**
 * Unit tests for Alert System Service
 * Requirements: 5.1, 5.2, 5.6
 */
describe('Alert System Service', () => {
  // Helper function to create mock SpreadResult
  const createSpreadResult = (
    spreadPercent: number,
    buyExchange: Exchange = 'binance',
    sellExchange: Exchange = 'coinbase',
    pair: TradingPair = { base: 'ETH', quote: 'USDT', symbol: 'ETH/USDT' }
  ): SpreadResult => ({
    pair,
    buyExchange,
    sellExchange,
    buyPrice: 2500,
    sellPrice: 2500 * (1 + spreadPercent / 100),
    spreadPercent,
    timestamp: new Date(),
  });

  // Helper function to create mock ProfitResult
  const createProfitResult = (netProfit: number = 10): ProfitResult => ({
    grossProfit: 15,
    totalFees: 5,
    netProfit,
    isProfitable: netProfit > 0,
  });

  // Helper function to create mock AlertRecord
  const createAlertRecord = (
    id: string = 'test_alert_1',
    spreadPercent: number = 2,
    triggeredAt: Date = new Date()
  ): AlertRecord => ({
    id,
    spread: createSpreadResult(spreadPercent),
    estimatedProfit: createProfitResult(),
    triggeredAt,
    acknowledged: false,
  });

  describe('ALERT_CONSTANTS', () => {
    it('should have correct threshold bounds', () => {
      expect(ALERT_CONSTANTS.MIN_THRESHOLD).toBe(0.1);
      expect(ALERT_CONSTANTS.MAX_THRESHOLD).toBe(10);
    });

    it('should have correct max history size', () => {
      expect(ALERT_CONSTANTS.MAX_HISTORY_SIZE).toBe(50);
    });
  });

  describe('validateThreshold', () => {
    /**
     * Requirements: 5.1 - Accept spread threshold values between 0.1% and 10%
     */
    it('should accept threshold at minimum bound (0.1%)', () => {
      expect(() => validateThreshold(0.1)).not.toThrow();
      expect(validateThreshold(0.1)).toBe(true);
    });

    it('should accept threshold at maximum bound (10%)', () => {
      expect(() => validateThreshold(10)).not.toThrow();
      expect(validateThreshold(10)).toBe(true);
    });

    it('should accept threshold within valid range', () => {
      expect(validateThreshold(1)).toBe(true);
      expect(validateThreshold(5)).toBe(true);
      expect(validateThreshold(0.5)).toBe(true);
    });

    it('should reject threshold below minimum (< 0.1%)', () => {
      expect(() => validateThreshold(0.05)).toThrow(
        `Threshold must be between ${ALERT_CONSTANTS.MIN_THRESHOLD}% and ${ALERT_CONSTANTS.MAX_THRESHOLD}%`
      );
      expect(() => validateThreshold(0)).toThrow();
      expect(() => validateThreshold(-1)).toThrow();
    });

    it('should reject threshold above maximum (> 10%)', () => {
      expect(() => validateThreshold(10.1)).toThrow(
        `Threshold must be between ${ALERT_CONSTANTS.MIN_THRESHOLD}% and ${ALERT_CONSTANTS.MAX_THRESHOLD}%`
      );
      expect(() => validateThreshold(15)).toThrow();
      expect(() => validateThreshold(100)).toThrow();
    });

    it('should reject non-number values', () => {
      expect(() => validateThreshold(NaN)).toThrow('Threshold must be a valid number');
      expect(() => validateThreshold(Infinity)).toThrow('Threshold must be a finite number');
      expect(() => validateThreshold(-Infinity)).toThrow('Threshold must be a finite number');
    });
  });

  describe('isValidThreshold', () => {
    /**
     * Requirements: 5.1 - Non-throwing validation
     */
    it('should return true for valid thresholds', () => {
      expect(isValidThreshold(0.1)).toBe(true);
      expect(isValidThreshold(5)).toBe(true);
      expect(isValidThreshold(10)).toBe(true);
    });

    it('should return false for invalid thresholds', () => {
      expect(isValidThreshold(0)).toBe(false);
      expect(isValidThreshold(0.05)).toBe(false);
      expect(isValidThreshold(10.1)).toBe(false);
      expect(isValidThreshold(NaN)).toBe(false);
      expect(isValidThreshold(Infinity)).toBe(false);
    });
  });

  describe('generateAlertId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateAlertId();
      const id2 = generateAlertId();
      expect(id1).not.toBe(id2);
    });

    it('should generate IDs with alert_ prefix', () => {
      const id = generateAlertId();
      expect(id.startsWith('alert_')).toBe(true);
    });
  });

  describe('spreadExceedsThreshold', () => {
    /**
     * Requirements: 5.2 - Trigger alert when spread exceeds threshold
     */
    it('should return true when spread exceeds threshold', () => {
      const spread = createSpreadResult(2.5);
      expect(spreadExceedsThreshold(spread, 2)).toBe(true);
    });

    it('should return false when spread equals threshold', () => {
      const spread = createSpreadResult(2);
      expect(spreadExceedsThreshold(spread, 2)).toBe(false);
    });

    it('should return false when spread is below threshold', () => {
      const spread = createSpreadResult(1.5);
      expect(spreadExceedsThreshold(spread, 2)).toBe(false);
    });

    it('should handle edge cases with small differences', () => {
      const spread = createSpreadResult(2.001);
      expect(spreadExceedsThreshold(spread, 2)).toBe(true);
    });
  });

  describe('trimAlertHistory', () => {
    /**
     * Requirements: 5.6 - Record the most recent 50 alert history entries
     */
    it('should not trim history below max size', () => {
      const history: AlertRecord[] = Array.from({ length: 30 }, (_, i) =>
        createAlertRecord(`alert_${i}`, 2, new Date(Date.now() - i * 1000))
      );

      const trimmed = trimAlertHistory(history, 50);
      expect(trimmed.length).toBe(30);
    });

    it('should trim history to max size', () => {
      const history: AlertRecord[] = Array.from({ length: 60 }, (_, i) =>
        createAlertRecord(`alert_${i}`, 2, new Date(Date.now() - i * 1000))
      );

      const trimmed = trimAlertHistory(history, 50);
      expect(trimmed.length).toBe(50);
    });

    it('should keep most recent entries when trimming', () => {
      const now = Date.now();
      const history: AlertRecord[] = [
        createAlertRecord('old_alert', 2, new Date(now - 10000)),
        createAlertRecord('new_alert', 2, new Date(now)),
      ];

      const trimmed = trimAlertHistory(history, 1);
      expect(trimmed.length).toBe(1);
      expect(trimmed[0].id).toBe('new_alert');
    });

    it('should handle empty history', () => {
      const trimmed = trimAlertHistory([], 50);
      expect(trimmed.length).toBe(0);
    });
  });

  describe('addAlertsToHistory', () => {
    /**
     * Requirements: 5.6 - Maintain alert history
     */
    it('should add new alerts to history', () => {
      const currentHistory: AlertRecord[] = [createAlertRecord('existing_1')];
      const newAlerts: AlertRecord[] = [createAlertRecord('new_1')];

      const updated = addAlertsToHistory(currentHistory, newAlerts, 50);
      expect(updated.length).toBe(2);
    });

    it('should maintain max size when adding alerts', () => {
      const currentHistory: AlertRecord[] = Array.from({ length: 50 }, (_, i) =>
        createAlertRecord(`existing_${i}`, 2, new Date(Date.now() - (i + 1) * 1000))
      );
      const newAlerts: AlertRecord[] = [
        createAlertRecord('new_1', 2, new Date()),
      ];

      const updated = addAlertsToHistory(currentHistory, newAlerts, 50);
      expect(updated.length).toBe(50);
      // New alert should be included (most recent)
      expect(updated.some((a) => a.id === 'new_1')).toBe(true);
    });

    it('should place new alerts at the beginning', () => {
      const currentHistory: AlertRecord[] = [
        createAlertRecord('existing_1', 2, new Date(Date.now() - 1000)),
      ];
      const newAlerts: AlertRecord[] = [
        createAlertRecord('new_1', 2, new Date()),
      ];

      const updated = addAlertsToHistory(currentHistory, newAlerts, 50);
      // After sorting by triggeredAt descending, new_1 should be first
      expect(updated[0].id).toBe('new_1');
    });
  });

  describe('AlertSystem class', () => {
    describe('constructor', () => {
      it('should initialize with default threshold', () => {
        const alertSystem = new AlertSystem();
        expect(alertSystem.getThreshold()).toBe(ALERT_CONSTANTS.DEFAULT_THRESHOLD);
      });

      it('should initialize with custom valid threshold', () => {
        const alertSystem = new AlertSystem(5);
        expect(alertSystem.getThreshold()).toBe(5);
      });

      it('should fall back to default for invalid initial threshold', () => {
        const alertSystem = new AlertSystem(0);
        expect(alertSystem.getThreshold()).toBe(ALERT_CONSTANTS.DEFAULT_THRESHOLD);
      });

      it('should initialize with empty alert history', () => {
        const alertSystem = new AlertSystem();
        expect(alertSystem.getAlertHistory().length).toBe(0);
      });
    });

    describe('setThreshold', () => {
      /**
       * Requirements: 5.1 - Accept spread threshold values between 0.1% and 10%
       */
      it('should set valid threshold', () => {
        const alertSystem = new AlertSystem();
        alertSystem.setThreshold(5);
        expect(alertSystem.getThreshold()).toBe(5);
      });

      it('should throw for invalid threshold', () => {
        const alertSystem = new AlertSystem();
        expect(() => alertSystem.setThreshold(0)).toThrow();
        expect(() => alertSystem.setThreshold(15)).toThrow();
      });

      it('should accept boundary values', () => {
        const alertSystem = new AlertSystem();
        
        alertSystem.setThreshold(0.1);
        expect(alertSystem.getThreshold()).toBe(0.1);
        
        alertSystem.setThreshold(10);
        expect(alertSystem.getThreshold()).toBe(10);
      });
    });

    describe('checkAndAlert', () => {
      /**
       * Requirements: 5.2 - Trigger alert when spread exceeds threshold
       */
      it('should trigger alerts for spreads exceeding threshold', () => {
        const alertSystem = new AlertSystem(2);
        const spreads: SpreadResult[] = [
          createSpreadResult(3), // Exceeds threshold
          createSpreadResult(1), // Below threshold
        ];

        const newAlerts = alertSystem.checkAndAlert(spreads);
        expect(newAlerts.length).toBe(1);
        expect(newAlerts[0].spread.spreadPercent).toBe(3);
      });

      it('should not trigger alerts for spreads at or below threshold', () => {
        const alertSystem = new AlertSystem(2);
        const spreads: SpreadResult[] = [
          createSpreadResult(2), // Equal to threshold
          createSpreadResult(1), // Below threshold
        ];

        const newAlerts = alertSystem.checkAndAlert(spreads);
        expect(newAlerts.length).toBe(0);
      });

      it('should add triggered alerts to history', () => {
        const alertSystem = new AlertSystem(2);
        const spreads: SpreadResult[] = [createSpreadResult(3)];

        alertSystem.checkAndAlert(spreads);
        const history = alertSystem.getAlertHistory();
        expect(history.length).toBe(1);
      });

      it('should calculate estimated profit for alerts', () => {
        const alertSystem = new AlertSystem(2);
        const spreads: SpreadResult[] = [createSpreadResult(3)];

        const newAlerts = alertSystem.checkAndAlert(spreads);
        expect(newAlerts[0].estimatedProfit).toBeDefined();
        expect(typeof newAlerts[0].estimatedProfit.netProfit).toBe('number');
      });

      it('should handle empty spreads array', () => {
        const alertSystem = new AlertSystem(2);
        const newAlerts = alertSystem.checkAndAlert([]);
        expect(newAlerts.length).toBe(0);
      });
    });

    describe('getAlertHistory', () => {
      /**
       * Requirements: 5.6 - Record the most recent 50 alert history entries
       */
      it('should return copy of alert history', () => {
        const alertSystem = new AlertSystem(2);
        const spreads: SpreadResult[] = [createSpreadResult(3)];
        alertSystem.checkAndAlert(spreads);

        const history1 = alertSystem.getAlertHistory();
        const history2 = alertSystem.getAlertHistory();
        expect(history1).not.toBe(history2);
        expect(history1).toEqual(history2);
      });

      it('should maintain max 50 entries', () => {
        const alertSystem = new AlertSystem(0.1); // Low threshold to trigger all
        
        // Generate 60 spreads that exceed threshold
        for (let i = 0; i < 60; i++) {
          const spreads: SpreadResult[] = [createSpreadResult(5)];
          alertSystem.checkAndAlert(spreads);
        }

        const history = alertSystem.getAlertHistory();
        expect(history.length).toBe(50);
      });
    });

    describe('clearAlertHistory', () => {
      it('should clear all alert history', () => {
        const alertSystem = new AlertSystem(2);
        const spreads: SpreadResult[] = [createSpreadResult(3)];
        alertSystem.checkAndAlert(spreads);

        expect(alertSystem.getAlertHistory().length).toBe(1);
        alertSystem.clearAlertHistory();
        expect(alertSystem.getAlertHistory().length).toBe(0);
      });
    });

    describe('acknowledgeAlert', () => {
      it('should acknowledge existing alert', () => {
        const alertSystem = new AlertSystem(2);
        const spreads: SpreadResult[] = [createSpreadResult(3)];
        const newAlerts = alertSystem.checkAndAlert(spreads);

        const alertId = newAlerts[0].id;
        const result = alertSystem.acknowledgeAlert(alertId);

        expect(result).toBe(true);
        const history = alertSystem.getAlertHistory();
        expect(history[0].acknowledged).toBe(true);
      });

      it('should return false for non-existent alert', () => {
        const alertSystem = new AlertSystem(2);
        const result = alertSystem.acknowledgeAlert('non_existent_id');
        expect(result).toBe(false);
      });
    });

    describe('sound toggle', () => {
      /**
       * Requirements: 5.4 - User can disable alert sound
       */
      it('should initialize with sound enabled by default', () => {
        const alertSystem = new AlertSystem();
        expect(alertSystem.isSoundEnabled()).toBe(true);
      });

      it('should initialize with custom sound setting', () => {
        const alertSystem = new AlertSystem(1, 50, false);
        expect(alertSystem.isSoundEnabled()).toBe(false);
      });

      it('should allow toggling sound on and off', () => {
        const alertSystem = new AlertSystem();
        
        alertSystem.setSoundEnabled(false);
        expect(alertSystem.isSoundEnabled()).toBe(false);
        
        alertSystem.setSoundEnabled(true);
        expect(alertSystem.isSoundEnabled()).toBe(true);
      });
    });
  });

  describe('formatNotificationContent', () => {
    /**
     * Requirements: 5.3 - Display: trading pair, spread percentage, estimated net profit, buy/sell exchanges
     */
    it('should format notification with all required content', () => {
      const alert = createAlertRecord('test_alert', 2.5);
      const { title, body } = formatNotificationContent(alert);

      // Title should contain trading pair
      expect(title).toContain('ETH/USDT');
      expect(title).toContain('Alert');

      // Body should contain spread percentage
      expect(body).toContain('Spread:');
      expect(body).toContain('2.50%');

      // Body should contain buy exchange
      expect(body).toContain('Buy:');
      expect(body).toContain('binance');

      // Body should contain sell exchange
      expect(body).toContain('Sell:');
      expect(body).toContain('coinbase');

      // Body should contain estimated net profit
      expect(body).toContain('Est. Net Profit:');
    });

    it('should format positive profit with plus sign', () => {
      const alert = createAlertRecord('test_alert', 2.5);
      const { body } = formatNotificationContent(alert);
      
      // Positive profit should have + sign
      expect(body).toMatch(/Est\. Net Profit: \+/);
    });

    it('should format negative profit without plus sign', () => {
      const alert: AlertRecord = {
        id: 'test_alert',
        spread: createSpreadResult(2.5),
        estimatedProfit: {
          grossProfit: 5,
          totalFees: 10,
          netProfit: -5,
          isProfitable: false,
        },
        triggeredAt: new Date(),
        acknowledged: false,
      };
      const { body } = formatNotificationContent(alert);
      
      // Negative profit should not have + sign
      expect(body).toMatch(/Est\. Net Profit: -/);
    });
  });

  describe('Browser API support checks', () => {
    /**
     * These tests verify the helper functions work correctly in Node.js environment
     * where browser APIs are not available
     */
    describe('isNotificationSupported', () => {
      it('should return false in Node.js environment', () => {
        // In Node.js, window is undefined
        expect(isNotificationSupported()).toBe(false);
      });
    });

    describe('hasNotificationPermission', () => {
      it('should return false when notifications not supported', () => {
        expect(hasNotificationPermission()).toBe(false);
      });
    });

    describe('isAudioSupported', () => {
      it('should return false in Node.js environment', () => {
        // In Node.js, AudioContext is undefined
        expect(isAudioSupported()).toBe(false);
      });
    });

    describe('createAudioContext', () => {
      it('should return null in Node.js environment', () => {
        expect(createAudioContext()).toBe(null);
      });
    });
  });

  describe('AlertSystem browser notification methods', () => {
    /**
     * Requirements: 5.2, 5.3, 5.4, 5.5
     */
    describe('sendBrowserNotification', () => {
      it('should return false when notifications not supported', () => {
        const alertSystem = new AlertSystem();
        const alert = createAlertRecord('test_alert', 2.5);
        
        // In Node.js environment, notifications are not supported
        const result = alertSystem.sendBrowserNotification(alert);
        expect(result).toBe(false);
      });
    });

    describe('requestNotificationPermission', () => {
      it('should return false when notifications not supported', async () => {
        const alertSystem = new AlertSystem();
        
        // In Node.js environment, notifications are not supported
        const result = await alertSystem.requestNotificationPermission();
        expect(result).toBe(false);
      });
    });

    describe('playAlertSound', () => {
      it('should not throw when audio not supported', () => {
        const alertSystem = new AlertSystem();
        
        // Should not throw even when AudioContext is not available
        expect(() => alertSystem.playAlertSound()).not.toThrow();
      });

      it('should not play sound when sound is disabled', () => {
        const alertSystem = new AlertSystem(1, 50, false);
        
        // Should not throw and should do nothing
        expect(() => alertSystem.playAlertSound()).not.toThrow();
      });
    });
  });

  describe('ALERT_CONSTANTS', () => {
    it('should have sound-related constants', () => {
      expect(ALERT_CONSTANTS.DEFAULT_SOUND_ENABLED).toBe(true);
      expect(ALERT_CONSTANTS.ALERT_SOUND_FREQUENCY).toBe(800);
      expect(ALERT_CONSTANTS.ALERT_SOUND_DURATION).toBe(200);
    });
  });
});

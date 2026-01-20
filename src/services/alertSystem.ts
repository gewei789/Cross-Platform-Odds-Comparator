// Alert System Service
// Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6

import { SpreadResult, ProfitResult, AlertRecord, FeeConfig } from '../types';
import { calculateProfit, createDefaultFeeConfig } from './profitSimulator';

/**
 * Interface for Alert System
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */
export interface IAlertSystem {
  setThreshold(threshold: number): void;
  getThreshold(): number;
  checkAndAlert(spreads: SpreadResult[], feeConfig?: FeeConfig, tradeAmount?: number): AlertRecord[];
  getAlertHistory(): AlertRecord[];
  clearAlertHistory(): void;
  acknowledgeAlert(alertId: string): boolean;
  requestNotificationPermission(): Promise<boolean>;
  sendBrowserNotification(alert: AlertRecord): boolean;
  setSoundEnabled(enabled: boolean): void;
  isSoundEnabled(): boolean;
  playAlertSound(): void;
}

/**
 * Constants for alert system
 */
export const ALERT_CONSTANTS = {
  MIN_THRESHOLD: 0.1,    // Minimum threshold: 0.1%
  MAX_THRESHOLD: 10,     // Maximum threshold: 10%
  MAX_HISTORY_SIZE: 50,  // Maximum alert history entries
  DEFAULT_THRESHOLD: 1,  // Default threshold: 1%
  DEFAULT_TRADE_AMOUNT: 1, // Default trade amount for profit calculation
  DEFAULT_SOUND_ENABLED: true, // Default sound enabled state
  ALERT_SOUND_FREQUENCY: 800, // Alert sound frequency in Hz
  ALERT_SOUND_DURATION: 200, // Alert sound duration in ms
};

/**
 * Validate threshold value
 * Requirements: 5.1 - Accept spread threshold values between 0.1% and 10%
 * 
 * @param threshold - Threshold value to validate
 * @returns true if valid
 * @throws Error if threshold is outside valid range
 */
export function validateThreshold(threshold: number): boolean {
  if (typeof threshold !== 'number' || isNaN(threshold)) {
    throw new Error('Threshold must be a valid number');
  }
  if (!isFinite(threshold)) {
    throw new Error('Threshold must be a finite number');
  }
  if (threshold < ALERT_CONSTANTS.MIN_THRESHOLD || threshold > ALERT_CONSTANTS.MAX_THRESHOLD) {
    throw new Error(
      `Threshold must be between ${ALERT_CONSTANTS.MIN_THRESHOLD}% and ${ALERT_CONSTANTS.MAX_THRESHOLD}%`
    );
  }
  return true;
}

/**
 * Check if a threshold value is within valid range (non-throwing version)
 * Requirements: 5.1
 * 
 * @param threshold - Threshold value to check
 * @returns true if threshold is valid, false otherwise
 */
export function isValidThreshold(threshold: number): boolean {
  if (typeof threshold !== 'number' || isNaN(threshold) || !isFinite(threshold)) {
    return false;
  }
  return threshold >= ALERT_CONSTANTS.MIN_THRESHOLD && threshold <= ALERT_CONSTANTS.MAX_THRESHOLD;
}

/**
 * Generate a unique ID for an alert
 * 
 * @returns Unique alert ID string
 */
export function generateAlertId(): string {
  return `alert_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Check if a spread exceeds the threshold
 * Requirements: 5.2 - Trigger alert when spread exceeds threshold
 * 
 * @param spread - Spread result to check
 * @param threshold - Threshold percentage
 * @returns true if spread exceeds threshold
 */
export function spreadExceedsThreshold(spread: SpreadResult, threshold: number): boolean {
  return spread.spreadPercent > threshold;
}

/**
 * Create an alert record from a spread result
 * Requirements: 5.6
 * 
 * @param spread - Spread result that triggered the alert
 * @param estimatedProfit - Calculated profit for the spread
 * @returns AlertRecord
 */
export function createAlertRecord(
  spread: SpreadResult,
  estimatedProfit: ProfitResult
): AlertRecord {
  return {
    id: generateAlertId(),
    spread,
    estimatedProfit,
    triggeredAt: new Date(),
    acknowledged: false,
  };
}

/**
 * Trim alert history to maximum size, keeping most recent entries
 * Requirements: 5.6 - Record the most recent 50 alert history entries
 * 
 * @param history - Current alert history
 * @param maxSize - Maximum number of entries to keep
 * @returns Trimmed alert history
 */
export function trimAlertHistory(
  history: AlertRecord[],
  maxSize: number = ALERT_CONSTANTS.MAX_HISTORY_SIZE
): AlertRecord[] {
  if (history.length <= maxSize) {
    return history;
  }
  // Sort by triggeredAt descending and keep only the most recent entries
  const sorted = [...history].sort(
    (a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime()
  );
  return sorted.slice(0, maxSize);
}

/**
 * Add new alerts to history while maintaining max size limit
 * Requirements: 5.6
 * 
 * @param currentHistory - Current alert history
 * @param newAlerts - New alerts to add
 * @param maxSize - Maximum history size
 * @returns Updated alert history
 */
export function addAlertsToHistory(
  currentHistory: AlertRecord[],
  newAlerts: AlertRecord[],
  maxSize: number = ALERT_CONSTANTS.MAX_HISTORY_SIZE
): AlertRecord[] {
  // Combine new alerts with existing history
  const combined = [...newAlerts, ...currentHistory];
  // Trim to max size
  return trimAlertHistory(combined, maxSize);
}

/**
 * Format alert content for browser notification
 * Requirements: 5.3 - Display: trading pair, spread percentage, estimated net profit, and buy/sell exchanges
 * 
 * @param alert - Alert record to format
 * @returns Object with title and body for notification
 */
export function formatNotificationContent(alert: AlertRecord): { title: string; body: string } {
  const { spread, estimatedProfit } = alert;
  const title = `🚨 Arbitrage Alert: ${spread.pair.symbol}`;
  const body = [
    `Spread: ${spread.spreadPercent.toFixed(2)}%`,
    `Buy: ${spread.buyExchange} @ ${spread.buyPrice.toFixed(2)}`,
    `Sell: ${spread.sellExchange} @ ${spread.sellPrice.toFixed(2)}`,
    `Est. Net Profit: ${estimatedProfit.netProfit >= 0 ? '+' : ''}${estimatedProfit.netProfit.toFixed(4)}`,
  ].join('\n');
  
  return { title, body };
}

/**
 * Check if browser notifications are supported
 * 
 * @returns true if Notification API is available
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Check if notification permission is granted
 * 
 * @returns true if permission is granted
 */
export function hasNotificationPermission(): boolean {
  if (!isNotificationSupported()) {
    return false;
  }
  return Notification.permission === 'granted';
}

/**
 * Check if Web Audio API is supported
 * 
 * @returns true if AudioContext is available
 */
export function isAudioSupported(): boolean {
  return typeof window !== 'undefined' && 
    (typeof AudioContext !== 'undefined' || typeof (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext !== 'undefined');
}

/**
 * Create an AudioContext instance (handles browser prefixes)
 * 
 * @returns AudioContext instance or null if not supported
 */
export function createAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  const AudioContextClass = window.AudioContext || 
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  
  if (!AudioContextClass) {
    return null;
  }
  
  return new AudioContextClass();
}

/**
 * AlertSystem class implementing IAlertSystem interface
 * Provides alert threshold management and triggering logic
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */
export class AlertSystem implements IAlertSystem {
  private threshold: number;
  private alertHistory: AlertRecord[];
  private maxHistorySize: number;
  private soundEnabled: boolean;
  private audioContext: AudioContext | null = null;

  constructor(
    initialThreshold: number = ALERT_CONSTANTS.DEFAULT_THRESHOLD,
    maxHistorySize: number = ALERT_CONSTANTS.MAX_HISTORY_SIZE,
    soundEnabled: boolean = ALERT_CONSTANTS.DEFAULT_SOUND_ENABLED
  ) {
    // Validate and set initial threshold
    if (isValidThreshold(initialThreshold)) {
      this.threshold = initialThreshold;
    } else {
      this.threshold = ALERT_CONSTANTS.DEFAULT_THRESHOLD;
    }
    this.alertHistory = [];
    this.maxHistorySize = maxHistorySize;
    this.soundEnabled = soundEnabled;
  }

  /**
   * Set the alert threshold
   * Requirements: 5.1 - Accept spread threshold values between 0.1% and 10%
   * 
   * @param threshold - New threshold value (0.1 to 10)
   * @throws Error if threshold is outside valid range
   */
  setThreshold(threshold: number): void {
    validateThreshold(threshold);
    this.threshold = threshold;
  }

  /**
   * Get the current threshold
   * 
   * @returns Current threshold value
   */
  getThreshold(): number {
    return this.threshold;
  }

  /**
   * Check spreads against threshold and trigger alerts
   * Requirements: 5.2 - Trigger alert when spread exceeds threshold
   * Requirements: 5.3 - Display alert content in notification
   * Requirements: 5.4 - Play alert sound
   * Requirements: 5.5 - Continue monitoring in background
   * Requirements: 5.6 - Record alert history
   * 
   * @param spreads - Array of spread results to check
   * @param feeConfig - Optional fee configuration for profit calculation
   * @param tradeAmount - Optional trade amount for profit calculation
   * @returns Array of new alert records that were triggered
   */
  checkAndAlert(
    spreads: SpreadResult[],
    feeConfig: FeeConfig = createDefaultFeeConfig(),
    tradeAmount: number = ALERT_CONSTANTS.DEFAULT_TRADE_AMOUNT
  ): AlertRecord[] {
    const newAlerts: AlertRecord[] = [];

    for (const spread of spreads) {
      if (spreadExceedsThreshold(spread, this.threshold)) {
        // Calculate estimated profit for the alert
        const estimatedProfit = calculateProfit(spread, tradeAmount, feeConfig);
        
        // Create alert record
        const alertRecord = createAlertRecord(spread, estimatedProfit);
        newAlerts.push(alertRecord);
        
        // Send browser notification (Requirements: 5.2, 5.3, 5.5)
        this.sendBrowserNotification(alertRecord);
        
        // Play alert sound if enabled (Requirement: 5.4)
        if (this.soundEnabled) {
          this.playAlertSound();
        }
      }
    }

    // Add new alerts to history
    if (newAlerts.length > 0) {
      this.alertHistory = addAlertsToHistory(
        this.alertHistory,
        newAlerts,
        this.maxHistorySize
      );
    }

    return newAlerts;
  }

  /**
   * Get the alert history
   * Requirements: 5.6 - Record the most recent 50 alert history entries
   * 
   * @returns Array of alert records
   */
  getAlertHistory(): AlertRecord[] {
    return [...this.alertHistory];
  }

  /**
   * Clear all alert history
   */
  clearAlertHistory(): void {
    this.alertHistory = [];
  }

  /**
   * Acknowledge an alert by ID
   * 
   * @param alertId - ID of the alert to acknowledge
   * @returns true if alert was found and acknowledged, false otherwise
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alertHistory.find((a) => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      return true;
    }
    return false;
  }

  /**
   * Request browser notification permission
   * Requirements: 5.2 - Browser notification requires user permission
   * 
   * @returns Promise resolving to true if permission granted, false otherwise
   */
  async requestNotificationPermission(): Promise<boolean> {
    // Check if Notification API is available (browser environment)
    if (!isNotificationSupported()) {
      return false;
    }

    // Check current permission status
    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    // Request permission
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch {
      return false;
    }
  }

  /**
   * Send a browser notification for an alert
   * Requirements: 5.2 - Trigger browser notification when spread exceeds threshold
   * Requirements: 5.3 - Display: trading pair, spread percentage, estimated net profit, buy/sell exchanges
   * Requirements: 5.5 - Continue sending notifications when app runs in background
   * 
   * @param alert - Alert record to send notification for
   * @returns true if notification was sent successfully, false otherwise
   */
  sendBrowserNotification(alert: AlertRecord): boolean {
    // Check if notifications are supported and permission is granted
    if (!hasNotificationPermission()) {
      return false;
    }

    try {
      const { title, body } = formatNotificationContent(alert);
      
      // Create notification with options for background support
      const notification = new Notification(title, {
        body,
        icon: '/favicon.ico', // Default icon
        badge: '/favicon.ico',
        tag: `arbitrage-alert-${alert.id}`, // Unique tag to prevent duplicate notifications
        requireInteraction: false, // Auto-dismiss after a while
        silent: this.soundEnabled ? false : true, // Let our custom sound play if enabled
      });

      // Handle notification click - focus the window
      notification.onclick = () => {
        if (typeof window !== 'undefined') {
          window.focus();
        }
        notification.close();
      };

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Set whether alert sound is enabled
   * Requirements: 5.4 - User can disable alert sound
   * 
   * @param enabled - Whether sound should be enabled
   */
  setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
  }

  /**
   * Check if alert sound is enabled
   * Requirements: 5.4
   * 
   * @returns true if sound is enabled
   */
  isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  /**
   * Play alert sound using Web Audio API
   * Requirements: 5.4 - Play alert sound when alert triggers
   * 
   * Uses Web Audio API to generate a simple beep sound.
   * This approach doesn't require external audio files.
   */
  playAlertSound(): void {
    if (!this.soundEnabled || !isAudioSupported()) {
      return;
    }

    try {
      // Create or reuse AudioContext
      if (!this.audioContext) {
        this.audioContext = createAudioContext();
      }

      if (!this.audioContext) {
        return;
      }

      // Resume AudioContext if suspended (required by browsers after user interaction)
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      // Create oscillator for the beep sound
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Configure the sound
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(
        ALERT_CONSTANTS.ALERT_SOUND_FREQUENCY,
        this.audioContext.currentTime
      );

      // Set volume and fade out
      gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        this.audioContext.currentTime + ALERT_CONSTANTS.ALERT_SOUND_DURATION / 1000
      );

      // Play the sound
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(
        this.audioContext.currentTime + ALERT_CONSTANTS.ALERT_SOUND_DURATION / 1000
      );
    } catch {
      // Silently fail if audio playback fails
      // This can happen due to browser autoplay policies
    }
  }
}

// Export a default instance for convenience
export const alertSystem = new AlertSystem();

'use client';

/**
 * useAlerts Hook
 * Provides alert management functionality
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */

import { useCallback, useEffect, useRef } from 'react';
import { useAppContext, actions } from '../context/AppContext';
import { 
  AlertSystem, 
  isValidThreshold,
  ALERT_CONSTANTS 
} from '../services/alertSystem';
import { AlertRecord } from '../types';

/**
 * Return type for useAlerts hook
 */
export interface UseAlertsReturn {
  /** Current alert history */
  alertHistory: AlertRecord[];
  /** Current alert threshold percentage */
  alertThreshold: number;
  /** Update the alert threshold */
  setAlertThreshold: (threshold: number) => void;
  /** Whether alert sound is enabled */
  soundEnabled: boolean;
  /** Toggle alert sound */
  setSoundEnabled: (enabled: boolean) => void;
  /** Clear all alert history */
  clearAlerts: () => void;
  /** Acknowledge a specific alert by ID */
  acknowledgeAlert: (alertId: string) => void;
  /** Request browser notification permission */
  requestNotificationPermission: () => Promise<boolean>;
  /** Check if notification permission is granted */
  hasNotificationPermission: boolean;
}

/**
 * useAlerts hook
 * Manages alert threshold, history, and notifications
 * 
 * @returns UseAlertsReturn object with alert controls and data
 */
export function useAlerts(): UseAlertsReturn {
  const { state, dispatch } = useAppContext();
  const alertSystemRef = useRef<AlertSystem | null>(null);
  const hasNotificationPermissionRef = useRef<boolean>(false);

  // Initialize alert system
  useEffect(() => {
    alertSystemRef.current = new AlertSystem(
      state.alertThreshold,
      ALERT_CONSTANTS.MAX_HISTORY_SIZE,
      state.soundEnabled
    );

    // Check initial notification permission
    if (typeof window !== 'undefined' && 'Notification' in window) {
      hasNotificationPermissionRef.current = Notification.permission === 'granted';
    }

    return () => {
      alertSystemRef.current = null;
    };
  }, []);

  // Sync alert system threshold with state
  useEffect(() => {
    if (alertSystemRef.current && isValidThreshold(state.alertThreshold)) {
      alertSystemRef.current.setThreshold(state.alertThreshold);
    }
  }, [state.alertThreshold]);

  // Sync alert system sound enabled with state
  useEffect(() => {
    if (alertSystemRef.current) {
      alertSystemRef.current.setSoundEnabled(state.soundEnabled);
    }
  }, [state.soundEnabled]);

  // Check spreads against threshold and trigger alerts when spread results change
  useEffect(() => {
    if (!alertSystemRef.current || state.spreadResults.length === 0) {
      return;
    }

    // Check spreads and trigger alerts
    const newAlerts = alertSystemRef.current.checkAndAlert(
      state.spreadResults,
      state.feeConfig,
      1 // Default trade amount for profit estimation
    );

    // Add new alerts to state
    for (const alert of newAlerts) {
      dispatch(actions.addAlert(alert));
    }
  }, [state.spreadResults, state.feeConfig, dispatch]);

  /**
   * Update the alert threshold
   * Requirements: 5.1 - Accept spread threshold values between 0.1% and 10%
   */
  const setAlertThreshold = useCallback((threshold: number) => {
    // Validate threshold before setting
    if (isValidThreshold(threshold)) {
      dispatch(actions.setAlertThreshold(threshold));
    } else {
      // Clamp to valid range
      const clampedThreshold = Math.max(
        ALERT_CONSTANTS.MIN_THRESHOLD,
        Math.min(ALERT_CONSTANTS.MAX_THRESHOLD, threshold)
      );
      dispatch(actions.setAlertThreshold(clampedThreshold));
    }
  }, [dispatch]);

  /**
   * Toggle alert sound
   * Requirements: 5.4 - User can disable alert sound
   */
  const setSoundEnabled = useCallback((enabled: boolean) => {
    dispatch(actions.setSoundEnabled(enabled));
  }, [dispatch]);

  /**
   * Clear all alert history
   */
  const clearAlerts = useCallback(() => {
    dispatch(actions.clearAlerts());
    if (alertSystemRef.current) {
      alertSystemRef.current.clearAlertHistory();
    }
  }, [dispatch]);

  /**
   * Acknowledge a specific alert by ID
   */
  const acknowledgeAlert = useCallback((alertId: string) => {
    // Update in alert system
    if (alertSystemRef.current) {
      alertSystemRef.current.acknowledgeAlert(alertId);
    }

    // Update in state - we need to dispatch an action to update the alert
    // Since there's no ACKNOWLEDGE_ALERT action, we'll update the entire alert history
    const updatedHistory = state.alertHistory.map(alert => 
      alert.id === alertId 
        ? { ...alert, acknowledged: true }
        : alert
    );

    // Clear and re-add all alerts (workaround since we don't have a specific action)
    dispatch(actions.clearAlerts());
    for (const alert of updatedHistory.reverse()) {
      dispatch(actions.addAlert(alert));
    }
  }, [state.alertHistory, dispatch]);

  /**
   * Request browser notification permission
   * Requirements: 5.2 - Browser notification requires user permission
   */
  const requestNotificationPermission = useCallback(async (): Promise<boolean> => {
    if (!alertSystemRef.current) {
      return false;
    }

    const granted = await alertSystemRef.current.requestNotificationPermission();
    hasNotificationPermissionRef.current = granted;
    return granted;
  }, []);

  // Check notification permission status
  const hasNotificationPermission = typeof window !== 'undefined' && 
    'Notification' in window && 
    Notification.permission === 'granted';

  return {
    alertHistory: state.alertHistory,
    alertThreshold: state.alertThreshold,
    setAlertThreshold,
    soundEnabled: state.soundEnabled,
    setSoundEnabled,
    clearAlerts,
    acknowledgeAlert,
    requestNotificationPermission,
    hasNotificationPermission,
  };
}

export default useAlerts;

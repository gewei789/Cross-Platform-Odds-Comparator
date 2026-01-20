/**
 * SpreadChart Component Example
 * 
 * This example demonstrates how to use the SpreadChart component
 * to visualize spread history over time with alert indicators.
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

'use client';

import React, { useState, useEffect } from 'react';
import { SpreadChart, TimeRange } from '../src/components/scanner/SpreadChart';
import { ChartDataPoint } from '../src/types';

/**
 * Example 1: Basic Usage
 * Shows a simple chart with static data
 */
export function BasicSpreadChartExample() {
  const dataPoints: ChartDataPoint[] = [
    {
      timestamp: new Date(Date.now() - 25 * 60 * 1000),
      spreadPercent: 1.2,
      isAlert: false,
    },
    {
      timestamp: new Date(Date.now() - 20 * 60 * 1000),
      spreadPercent: 1.8,
      isAlert: false,
    },
    {
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      spreadPercent: 2.5,
      isAlert: true, // Alert triggered
    },
    {
      timestamp: new Date(Date.now() - 10 * 60 * 1000),
      spreadPercent: 1.9,
      isAlert: false,
    },
    {
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      spreadPercent: 1.5,
      isAlert: false,
    },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Basic SpreadChart Example</h2>
      <SpreadChart dataPoints={dataPoints} />
    </div>
  );
}

/**
 * Example 2: With Time Range Control
 * Shows how to manage time range selection
 */
export function TimeRangeControlExample() {
  const [timeRange, setTimeRange] = useState<TimeRange>(30);

  // Generate sample data for the last hour
  const dataPoints: ChartDataPoint[] = Array.from({ length: 30 }, (_, i) => ({
    timestamp: new Date(Date.now() - (29 - i) * 2 * 60 * 1000),
    spreadPercent: 1.5 + Math.sin(i * 0.3) * 0.8,
    isAlert: Math.random() > 0.85, // Random alerts
  }));

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Time Range Control Example</h2>
      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          Current time range: <strong>{timeRange} minutes</strong>
        </p>
        <p className="text-xs text-blue-600 mt-1">
          Click the time range buttons to filter the data
        </p>
      </div>
      <SpreadChart
        dataPoints={dataPoints}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
      />
    </div>
  );
}

/**
 * Example 3: Real-time Simulation
 * Simulates real-time data updates
 */
export function RealTimeSimulationExample() {
  const [dataPoints, setDataPoints] = useState<ChartDataPoint[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>(30);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setDataPoints((prev) => {
        // Add new data point
        const newPoint: ChartDataPoint = {
          timestamp: new Date(),
          spreadPercent: 1.5 + Math.random() * 2, // Random spread 1.5-3.5%
          isAlert: Math.random() > 0.8, // 20% chance of alert
        };

        // Keep only last 60 minutes of data
        const cutoffTime = new Date(Date.now() - 60 * 60 * 1000);
        const filtered = prev.filter((p) => p.timestamp >= cutoffTime);

        return [...filtered, newPoint];
      });
    }, 2000); // Add new point every 2 seconds

    return () => clearInterval(interval);
  }, [isRunning]);

  const handleStart = () => {
    setIsRunning(true);
  };

  const handleStop = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setDataPoints([]);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Real-time Simulation Example</h2>
      
      {/* Controls */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={handleStart}
            disabled={isRunning}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Start Scanning
          </button>
          <button
            onClick={handleStop}
            disabled={!isRunning}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Stop Scanning
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Reset
          </button>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span
              className={`inline-block w-3 h-3 rounded-full ${
                isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              }`}
            />
            <span className="text-gray-700">
              Status: {isRunning ? 'Running' : 'Stopped'}
            </span>
          </div>
          <div className="text-gray-600">
            Data points: <strong>{dataPoints.length}</strong>
          </div>
          <div className="text-gray-600">
            Alerts: <strong>{dataPoints.filter((p) => p.isAlert).length}</strong>
          </div>
        </div>
      </div>

      {/* Chart */}
      <SpreadChart
        dataPoints={dataPoints}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        height={350}
      />
    </div>
  );
}

/**
 * Example 4: With Alert Threshold Visualization
 * Shows how to visualize alert thresholds
 */
export function AlertThresholdExample() {
  const [alertThreshold] = useState(2.0); // 2% threshold

  // Generate data with some points above threshold
  const dataPoints: ChartDataPoint[] = Array.from({ length: 20 }, (_, i) => {
    const spread = 1.0 + Math.sin(i * 0.5) * 1.5;
    return {
      timestamp: new Date(Date.now() - (19 - i) * 90 * 1000), // Every 90 seconds
      spreadPercent: spread,
      isAlert: spread > alertThreshold,
    };
  });

  const alertCount = dataPoints.filter((p) => p.isAlert).length;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Alert Threshold Example</h2>
      
      {/* Threshold Info */}
      <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-yellow-900">
              Alert Threshold: {alertThreshold}%
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              Points above this threshold are marked as alerts
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-yellow-900">{alertCount}</p>
            <p className="text-xs text-yellow-700">Alerts triggered</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <SpreadChart dataPoints={dataPoints} height={350} />

      {/* Alert List */}
      {alertCount > 0 && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-sm font-semibold text-red-900 mb-2">
            Alert Points
          </h3>
          <div className="space-y-1">
            {dataPoints
              .filter((p) => p.isAlert)
              .map((point, index) => (
                <div
                  key={index}
                  className="text-xs text-red-800 flex items-center justify-between"
                >
                  <span>
                    {point.timestamp.toLocaleTimeString()}
                  </span>
                  <span className="font-mono font-medium">
                    {point.spreadPercent.toFixed(3)}%
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Example 5: Empty State
 * Shows the empty state when no data is available
 */
export function EmptyStateExample() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Empty State Example</h2>
      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          This example shows what the chart looks like when no data is available.
        </p>
      </div>
      <SpreadChart dataPoints={[]} />
    </div>
  );
}

/**
 * Example 6: Custom Height
 * Shows how to customize chart height
 */
export function CustomHeightExample() {
  const dataPoints: ChartDataPoint[] = Array.from({ length: 15 }, (_, i) => ({
    timestamp: new Date(Date.now() - (14 - i) * 2 * 60 * 1000),
    spreadPercent: 1.5 + Math.random() * 1.5,
    isAlert: Math.random() > 0.85,
  }));

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Custom Height Example</h2>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Small (200px)</h3>
          <SpreadChart dataPoints={dataPoints} height={200} />
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Medium (300px - default)</h3>
          <SpreadChart dataPoints={dataPoints} height={300} />
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Large (500px)</h3>
          <SpreadChart dataPoints={dataPoints} height={500} />
        </div>
      </div>
    </div>
  );
}

/**
 * Main Example Component
 * Combines all examples with navigation
 */
export default function SpreadChartExamples() {
  const [activeExample, setActiveExample] = useState<string>('basic');

  const examples = [
    { id: 'basic', name: 'Basic Usage', component: BasicSpreadChartExample },
    { id: 'timerange', name: 'Time Range Control', component: TimeRangeControlExample },
    { id: 'realtime', name: 'Real-time Simulation', component: RealTimeSimulationExample },
    { id: 'threshold', name: 'Alert Threshold', component: AlertThresholdExample },
    { id: 'empty', name: 'Empty State', component: EmptyStateExample },
    { id: 'height', name: 'Custom Height', component: CustomHeightExample },
  ];

  const ActiveComponent = examples.find((ex) => ex.id === activeExample)?.component || BasicSpreadChartExample;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            SpreadChart Component Examples
          </h1>
          <div className="flex flex-wrap gap-2">
            {examples.map((example) => (
              <button
                key={example.id}
                onClick={() => setActiveExample(example.id)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeExample === example.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {example.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Active Example */}
      <div className="py-8">
        <ActiveComponent />
      </div>
    </div>
  );
}

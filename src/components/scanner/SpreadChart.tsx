'use client';

import React, { useMemo, useRef, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  TooltipItem,
  ChartData,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { ChartDataPoint } from '../../types';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

/**
 * Time range options for chart display
 */
export type TimeRange = 5 | 15 | 30;

/**
 * Props for SpreadChart component
 */
interface SpreadChartProps {
  /** Historical spread data points */
  dataPoints: ChartDataPoint[];
  /** Selected time range in minutes (5, 15, or 30) */
  timeRange?: TimeRange;
  /** Callback when time range changes */
  onTimeRangeChange?: (range: TimeRange) => void;
  /** Chart height in pixels */
  height?: number;
}

/**
 * Filter data points to only include those within the specified time window
 * Property 17: Chart Data Time Window
 * Requirements: 6.2 - Show last 30 minutes of data
 * 
 * @param dataPoints All available data points
 * @param minutes Time window in minutes
 * @returns Filtered data points within the time window
 */
export function filterDataByTimeWindow(
  dataPoints: ChartDataPoint[],
  minutes: number
): ChartDataPoint[] {
  if (dataPoints.length === 0) {
    return [];
  }

  const now = new Date();
  const cutoffTime = new Date(now.getTime() - minutes * 60 * 1000);

  return dataPoints.filter((point) => point.timestamp >= cutoffTime);
}

/**
 * Format timestamp for chart labels
 */
function formatChartTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * SpreadChart Component
 * 
 * Real-time line chart displaying spread history over time.
 * Shows last 30 minutes of data with configurable time ranges.
 * Marks alert points with red indicators.
 * Provides zoom and time range selection (5/15/30 min).
 * Displays detailed information on hover.
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 * - Property 17: Chart Data Time Window - only shows data within selected time range
 * - Property 18: Chart Alert Marking - red indicators for alert points
 */
export function SpreadChart({
  dataPoints,
  timeRange = 30,
  onTimeRangeChange,
  height = 300,
}: SpreadChartProps) {
  const chartRef = useRef<ChartJS<'line'>>(null);

  /**
   * Filter data points based on selected time range
   * Property 17: Chart Data Time Window
   * Requirements: 6.2
   */
  const filteredData = useMemo(() => {
    return filterDataByTimeWindow(dataPoints, timeRange);
  }, [dataPoints, timeRange]);

  /**
   * Prepare chart data
   * Requirements: 6.1, 6.3
   */
  const chartData: ChartData<'line'> = useMemo(() => {
    // Sort by timestamp to ensure proper line rendering
    const sortedData = [...filteredData].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );

    // Separate normal points and alert points
    const normalPoints = sortedData.filter((point) => !point.isAlert);
    const alertPoints = sortedData.filter((point) => point.isAlert);

    return {
      labels: sortedData.map((point) => formatChartTime(point.timestamp)),
      datasets: [
        // Main spread line
        {
          label: 'Spread %',
          data: sortedData.map((point) => point.spreadPercent),
          borderColor: 'rgb(59, 130, 246)', // blue-500
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          pointRadius: sortedData.map((point) => (point.isAlert ? 0 : 3)),
          pointHoverRadius: 5,
          pointBackgroundColor: 'rgb(59, 130, 246)',
          pointBorderColor: '#fff',
          pointBorderWidth: 1,
          tension: 0.3, // Smooth curve
          fill: true,
        },
        // Alert points overlay - Property 18: Chart Alert Marking
        // Requirements: 6.3 - Mark alert points with red indicators
        {
          label: 'Alerts',
          data: sortedData.map((point) =>
            point.isAlert ? point.spreadPercent : null
          ),
          borderColor: 'transparent',
          backgroundColor: 'transparent',
          pointRadius: sortedData.map((point) => (point.isAlert ? 6 : 0)),
          pointHoverRadius: 8,
          pointBackgroundColor: 'rgb(239, 68, 68)', // red-500
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointStyle: 'circle',
          showLine: false, // Don't connect alert points
        },
      ],
    };
  }, [filteredData]);

  /**
   * Chart options with tooltip configuration
   * Requirements: 6.5 - Display detailed price information on hover
   */
  const chartOptions: ChartOptions<'line'> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          display: true,
          position: 'top' as const,
          labels: {
            usePointStyle: true,
            padding: 15,
            font: {
              size: 12,
            },
          },
        },
        title: {
          display: false,
        },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: 'rgba(255, 255, 255, 0.2)',
          borderWidth: 1,
          padding: 12,
          displayColors: true,
          callbacks: {
            // Requirements: 6.5 - Display detailed information on hover
            title: (tooltipItems: TooltipItem<'line'>[]) => {
              const index = tooltipItems[0]?.dataIndex;
              if (index !== undefined && filteredData[index]) {
                const point = filteredData[index];
                return formatChartTime(point.timestamp);
              }
              return '';
            },
            label: (context: TooltipItem<'line'>) => {
              const index = context.dataIndex;
              const point = filteredData[index];
              
              if (!point) {
                return '';
              }

              const lines: string[] = [];
              
              if (context.dataset.label === 'Spread %') {
                lines.push(`Spread: ${point.spreadPercent.toFixed(3)}%`);
                if (point.isAlert) {
                  lines.push('⚠️ Alert triggered');
                }
              } else if (context.dataset.label === 'Alerts' && point.isAlert) {
                lines.push(`Alert: ${point.spreadPercent.toFixed(3)}%`);
              }
              
              return lines;
            },
          },
        },
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: 'Time',
            font: {
              size: 12,
            },
          },
          ticks: {
            maxRotation: 45,
            minRotation: 45,
            autoSkip: true,
            maxTicksLimit: 10,
            font: {
              size: 10,
            },
          },
          grid: {
            display: true,
            color: 'rgba(0, 0, 0, 0.05)',
          },
        },
        y: {
          display: true,
          title: {
            display: true,
            text: 'Spread %',
            font: {
              size: 12,
            },
          },
          ticks: {
            callback: (value) => `${value}%`,
            font: {
              size: 10,
            },
          },
          grid: {
            display: true,
            color: 'rgba(0, 0, 0, 0.05)',
          },
        },
      },
    }),
    [filteredData]
  );

  /**
   * Handle time range button click
   * Requirements: 6.4 - Time range selection
   */
  const handleTimeRangeClick = (range: TimeRange) => {
    onTimeRangeChange?.(range);
  };

  /**
   * Get button style based on selection state
   */
  const getButtonClass = (range: TimeRange): string => {
    const isSelected = range === timeRange;
    return `
      px-3 py-1.5 text-sm font-medium rounded-md transition-colors
      ${
        isSelected
          ? 'bg-blue-600 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }
    `;
  };

  return (
    <div className="w-full">
      {/* Header with Time Range Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Spread History
        </h3>

        {/* Time Range Selection - Requirements: 6.4 */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 mr-2">Time range:</span>
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              onClick={() => handleTimeRangeClick(5)}
              className={getButtonClass(5)}
              aria-label="Show last 5 minutes"
            >
              5 min
            </button>
            <button
              type="button"
              onClick={() => handleTimeRangeClick(15)}
              className={getButtonClass(15)}
              aria-label="Show last 15 minutes"
            >
              15 min
            </button>
            <button
              type="button"
              onClick={() => handleTimeRangeClick(30)}
              className={getButtonClass(30)}
              aria-label="Show last 30 minutes"
            >
              30 min
            </button>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        {filteredData.length === 0 ? (
          // Empty state
          <div
            className="flex flex-col items-center justify-center text-gray-500"
            style={{ height: `${height}px` }}
          >
            <svg
              className="w-16 h-16 text-gray-300 mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
              />
            </svg>
            <p className="font-medium">No chart data available</p>
            <p className="text-sm mt-1">
              Spread history will appear here as data is collected.
            </p>
          </div>
        ) : (
          // Chart display
          <div style={{ height: `${height}px` }}>
            <Line ref={chartRef} data={chartData} options={chartOptions} />
          </div>
        )}
      </div>

      {/* Chart Legend/Info */}
      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-blue-500"></span>
          <span>Spread percentage</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-red-500 border-2 border-white"></span>
          <span>Alert triggered</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-400">•</span>
          <span>
            Showing {filteredData.length} data{' '}
            {filteredData.length === 1 ? 'point' : 'points'} from last{' '}
            {timeRange} minutes
          </span>
        </div>
      </div>
    </div>
  );
}

export default SpreadChart;

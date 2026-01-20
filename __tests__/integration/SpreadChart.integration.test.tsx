import React, { useState } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SpreadChart, TimeRange } from '../../src/components/scanner/SpreadChart';
import { ChartDataPoint } from '../../src/types';

// Mock Chart.js
jest.mock('react-chartjs-2', () => ({
  Line: ({ data }: any) => (
    <div data-testid="mock-chart">
      <div data-testid="chart-labels">{JSON.stringify(data.labels)}</div>
      <div data-testid="chart-datasets">{JSON.stringify(data.datasets)}</div>
    </div>
  ),
}));

/**
 * Integration Tests for SpreadChart Component
 * 
 * These tests verify the component works correctly with realistic data flows
 * and user interactions.
 */
describe('SpreadChart Integration Tests', () => {
  // Helper to create realistic data points
  const createRealisticDataPoints = (count: number): ChartDataPoint[] => {
    const points: ChartDataPoint[] = [];
    const now = Date.now();
    
    for (let i = 0; i < count; i++) {
      const minutesAgo = i * 2; // Every 2 minutes
      const baseSpread = 1.5;
      const variation = Math.sin(i * 0.5) * 0.5; // Simulate fluctuation
      const isAlert = (baseSpread + variation) > 2.0; // Alert if > 2%
      
      points.push({
        timestamp: new Date(now - minutesAgo * 60 * 1000),
        spreadPercent: baseSpread + variation,
        isAlert,
      });
    }
    
    return points.reverse(); // Oldest first
  };

  describe('Real-time Data Updates', () => {
    it('should update chart when new data points are added', () => {
      const TestComponent = () => {
        const [dataPoints, setDataPoints] = useState<ChartDataPoint[]>([
          {
            timestamp: new Date(Date.now() - 10 * 60 * 1000),
            spreadPercent: 1.5,
            isAlert: false,
          },
        ]);

        const addDataPoint = () => {
          setDataPoints([
            ...dataPoints,
            {
              timestamp: new Date(),
              spreadPercent: 2.5,
              isAlert: true,
            },
          ]);
        };

        return (
          <div>
            <SpreadChart dataPoints={dataPoints} />
            <button onClick={addDataPoint}>Add Data Point</button>
          </div>
        );
      };

      render(<TestComponent />);

      // Initially 1 data point
      expect(screen.getByText(/Showing 1 data point/)).toBeInTheDocument();

      // Add new data point
      fireEvent.click(screen.getByText('Add Data Point'));

      // Should now show 2 data points
      expect(screen.getByText(/Showing 2 data points/)).toBeInTheDocument();
    });

    it('should handle rapid data updates', () => {
      const TestComponent = () => {
        const [dataPoints, setDataPoints] = useState<ChartDataPoint[]>([]);

        const addMultiplePoints = () => {
          const newPoints = createRealisticDataPoints(10);
          setDataPoints(newPoints);
        };

        return (
          <div>
            <SpreadChart dataPoints={dataPoints} />
            <button onClick={addMultiplePoints}>Add 10 Points</button>
          </div>
        );
      };

      render(<TestComponent />);

      // Initially empty
      expect(screen.getByText('No chart data available')).toBeInTheDocument();

      // Add multiple points at once
      fireEvent.click(screen.getByText('Add 10 Points'));

      // Should show all points
      expect(screen.getByText(/Showing 10 data points/)).toBeInTheDocument();
      expect(screen.getByTestId('mock-chart')).toBeInTheDocument();
    });
  });

  describe('Time Range Filtering with Real Data', () => {
    it('should filter 30 minutes of data correctly', () => {
      // Create 60 minutes worth of data (30 points, 2 min apart)
      const dataPoints = createRealisticDataPoints(30);

      render(<SpreadChart dataPoints={dataPoints} timeRange={30} />);

      // Should show only last 30 minutes (approximately 15-16 points depending on timing)
      expect(screen.getByText(/Showing \d+ data points from last 30 minutes/)).toBeInTheDocument();
      
      // Verify it's filtering - should be less than total
      const text = screen.getByText(/Showing \d+ data points from last 30 minutes/).textContent;
      const match = text?.match(/Showing (\d+) data points/);
      const displayedPoints = match ? parseInt(match[1]) : 0;
      expect(displayedPoints).toBeLessThan(30);
      expect(displayedPoints).toBeGreaterThan(10);
    });

    it('should dynamically filter when time range changes', () => {
      const dataPoints = createRealisticDataPoints(30); // 60 minutes of data

      const TestComponent = () => {
        const [timeRange, setTimeRange] = useState<TimeRange>(30);

        return (
          <SpreadChart
            dataPoints={dataPoints}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
          />
        );
      };

      render(<TestComponent />);

      // Initially 30 min range (15 points)
      expect(screen.getByText(/Showing 15 data points from last 30 minutes/)).toBeInTheDocument();

      // Switch to 15 min range
      fireEvent.click(screen.getByLabelText('Show last 15 minutes'));

      // Should show fewer points (7-8 points)
      expect(screen.getByText(/Showing \d+ data points from last 15 minutes/)).toBeInTheDocument();

      // Switch to 5 min range
      fireEvent.click(screen.getByLabelText('Show last 5 minutes'));

      // Should show even fewer points (2-3 points)
      expect(screen.getByText(/Showing \d+ data points from last 5 minutes/)).toBeInTheDocument();
    });
  });

  describe('Alert Point Visualization', () => {
    it('should correctly identify and display alert points', () => {
      const dataPoints: ChartDataPoint[] = [
        {
          timestamp: new Date(Date.now() - 20 * 60 * 1000),
          spreadPercent: 1.5,
          isAlert: false,
        },
        {
          timestamp: new Date(Date.now() - 15 * 60 * 1000),
          spreadPercent: 2.8,
          isAlert: true, // Alert point
        },
        {
          timestamp: new Date(Date.now() - 10 * 60 * 1000),
          spreadPercent: 1.8,
          isAlert: false,
        },
        {
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
          spreadPercent: 3.2,
          isAlert: true, // Alert point
        },
      ];

      render(<SpreadChart dataPoints={dataPoints} />);

      const chartDatasets = screen.getByTestId('chart-datasets');
      const datasets = JSON.parse(chartDatasets.textContent || '[]');

      // Should have alert dataset
      const alertDataset = datasets.find((ds: any) => ds.label === 'Alerts');
      expect(alertDataset).toBeDefined();

      // Alert dataset should have data only for alert points
      const alertData = alertDataset.data.filter((val: any) => val !== null);
      expect(alertData).toHaveLength(2);
      expect(alertData).toContain(2.8);
      expect(alertData).toContain(3.2);
    });

    it('should handle data with no alerts', () => {
      const dataPoints: ChartDataPoint[] = [
        {
          timestamp: new Date(Date.now() - 20 * 60 * 1000),
          spreadPercent: 1.5,
          isAlert: false,
        },
        {
          timestamp: new Date(Date.now() - 10 * 60 * 1000),
          spreadPercent: 1.8,
          isAlert: false,
        },
      ];

      render(<SpreadChart dataPoints={dataPoints} />);

      const chartDatasets = screen.getByTestId('chart-datasets');
      const datasets = JSON.parse(chartDatasets.textContent || '[]');

      // Alert dataset should exist but have no non-null values
      const alertDataset = datasets.find((ds: any) => ds.label === 'Alerts');
      expect(alertDataset).toBeDefined();
      
      const alertData = alertDataset.data.filter((val: any) => val !== null);
      expect(alertData).toHaveLength(0);
    });

    it('should handle data with all alerts', () => {
      const dataPoints: ChartDataPoint[] = [
        {
          timestamp: new Date(Date.now() - 20 * 60 * 1000),
          spreadPercent: 3.5,
          isAlert: true,
        },
        {
          timestamp: new Date(Date.now() - 10 * 60 * 1000),
          spreadPercent: 4.2,
          isAlert: true,
        },
      ];

      render(<SpreadChart dataPoints={dataPoints} />);

      const chartDatasets = screen.getByTestId('chart-datasets');
      const datasets = JSON.parse(chartDatasets.textContent || '[]');

      // All points should be in alert dataset
      const alertDataset = datasets.find((ds: any) => ds.label === 'Alerts');
      const alertData = alertDataset.data.filter((val: any) => val !== null);
      expect(alertData).toHaveLength(2);
    });
  });

  describe('Chart Data Sorting and Ordering', () => {
    it('should maintain chronological order even with unsorted input', () => {
      // Create data points in random order
      const dataPoints: ChartDataPoint[] = [
        {
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
          spreadPercent: 1.5,
          isAlert: false,
        },
        {
          timestamp: new Date(Date.now() - 20 * 60 * 1000),
          spreadPercent: 2.0,
          isAlert: false,
        },
        {
          timestamp: new Date(Date.now() - 10 * 60 * 1000),
          spreadPercent: 1.8,
          isAlert: false,
        },
      ];

      render(<SpreadChart dataPoints={dataPoints} />);

      const chartDatasets = screen.getByTestId('chart-datasets');
      const datasets = JSON.parse(chartDatasets.textContent || '[]');

      // Data should be sorted chronologically (oldest to newest)
      const spreadData = datasets[0].data;
      expect(spreadData).toEqual([2.0, 1.8, 1.5]);
    });
  });

  describe('Empty and Edge Cases', () => {
    it('should handle transition from empty to populated', () => {
      const TestComponent = () => {
        const [dataPoints, setDataPoints] = useState<ChartDataPoint[]>([]);

        const populateData = () => {
          setDataPoints(createRealisticDataPoints(5));
        };

        return (
          <div>
            <SpreadChart dataPoints={dataPoints} />
            <button onClick={populateData}>Populate</button>
          </div>
        );
      };

      render(<TestComponent />);

      // Initially empty
      expect(screen.getByText('No chart data available')).toBeInTheDocument();

      // Populate with data
      fireEvent.click(screen.getByText('Populate'));

      // Should show chart
      expect(screen.queryByText('No chart data available')).not.toBeInTheDocument();
      expect(screen.getByTestId('mock-chart')).toBeInTheDocument();
    });

    it('should handle transition from populated to empty', () => {
      const TestComponent = () => {
        const [dataPoints, setDataPoints] = useState<ChartDataPoint[]>(
          createRealisticDataPoints(5)
        );

        const clearData = () => {
          setDataPoints([]);
        };

        return (
          <div>
            <SpreadChart dataPoints={dataPoints} />
            <button onClick={clearData}>Clear</button>
          </div>
        );
      };

      render(<TestComponent />);

      // Initially has data
      expect(screen.getByTestId('mock-chart')).toBeInTheDocument();

      // Clear data
      fireEvent.click(screen.getByText('Clear'));

      // Should show empty state
      expect(screen.getByText('No chart data available')).toBeInTheDocument();
      expect(screen.queryByTestId('mock-chart')).not.toBeInTheDocument();
    });

    it('should handle single data point', () => {
      const dataPoints: ChartDataPoint[] = [
        {
          timestamp: new Date(),
          spreadPercent: 1.5,
          isAlert: false,
        },
      ];

      render(<SpreadChart dataPoints={dataPoints} />);

      expect(screen.getByText(/Showing 1 data point/)).toBeInTheDocument();
      expect(screen.getByTestId('mock-chart')).toBeInTheDocument();
    });
  });

  describe('Performance with Large Datasets', () => {
    it('should handle large dataset efficiently', () => {
      // Create 100 data points (over 3 hours of data)
      const dataPoints = createRealisticDataPoints(100);

      const { rerender } = render(
        <SpreadChart dataPoints={dataPoints} timeRange={30} />
      );

      // Should only show last 30 minutes
      expect(screen.getByText(/from last 30 minutes/)).toBeInTheDocument();

      // Should be able to re-render without issues
      rerender(<SpreadChart dataPoints={dataPoints} timeRange={15} />);
      expect(screen.getByText(/from last 15 minutes/)).toBeInTheDocument();

      rerender(<SpreadChart dataPoints={dataPoints} timeRange={5} />);
      expect(screen.getByText(/from last 5 minutes/)).toBeInTheDocument();
    });
  });
});

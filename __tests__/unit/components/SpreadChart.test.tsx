import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SpreadChart, filterDataByTimeWindow, TimeRange } from '../../../src/components/scanner/SpreadChart';
import { ChartDataPoint } from '../../../src/types';

// Mock Chart.js to avoid canvas rendering issues in tests
jest.mock('react-chartjs-2', () => ({
  Line: ({ data, options }: any) => (
    <div data-testid="mock-chart">
      <div data-testid="chart-data">{JSON.stringify(data)}</div>
      <div data-testid="chart-options">{JSON.stringify(options)}</div>
    </div>
  ),
}));

describe('SpreadChart Component', () => {
  // Helper to create test data points
  const createDataPoint = (
    minutesAgo: number,
    spreadPercent: number,
    isAlert: boolean = false
  ): ChartDataPoint => ({
    timestamp: new Date(Date.now() - minutesAgo * 60 * 1000),
    spreadPercent,
    isAlert,
  });

  describe('Component Rendering', () => {
    it('should render with empty data', () => {
      render(<SpreadChart dataPoints={[]} />);
      
      expect(screen.getByText('Spread History')).toBeInTheDocument();
      expect(screen.getByText('No chart data available')).toBeInTheDocument();
    });

    it('should render time range buttons', () => {
      render(<SpreadChart dataPoints={[]} />);
      
      expect(screen.getByLabelText('Show last 5 minutes')).toBeInTheDocument();
      expect(screen.getByLabelText('Show last 15 minutes')).toBeInTheDocument();
      expect(screen.getByLabelText('Show last 30 minutes')).toBeInTheDocument();
    });

    it('should highlight selected time range button', () => {
      render(<SpreadChart dataPoints={[]} timeRange={15} />);
      
      const button15 = screen.getByLabelText('Show last 15 minutes');
      expect(button15).toHaveClass('bg-blue-600');
    });

    it('should render chart when data is available', () => {
      const dataPoints = [
        createDataPoint(5, 1.5),
        createDataPoint(10, 2.0),
      ];
      
      render(<SpreadChart dataPoints={dataPoints} />);
      
      expect(screen.getByTestId('mock-chart')).toBeInTheDocument();
      expect(screen.queryByText('No chart data available')).not.toBeInTheDocument();
    });

    it('should display data point count', () => {
      const dataPoints = [
        createDataPoint(5, 1.5),
        createDataPoint(10, 2.0),
        createDataPoint(15, 1.8),
      ];
      
      render(<SpreadChart dataPoints={dataPoints} timeRange={30} />);
      
      expect(screen.getByText(/Showing 3 data points from last 30 minutes/)).toBeInTheDocument();
    });

    it('should use singular "point" for single data point', () => {
      const dataPoints = [createDataPoint(5, 1.5)];
      
      render(<SpreadChart dataPoints={dataPoints} timeRange={30} />);
      
      expect(screen.getByText(/Showing 1 data point from last 30 minutes/)).toBeInTheDocument();
    });
  });

  describe('Time Range Selection', () => {
    it('should call onTimeRangeChange when 5 min button is clicked', () => {
      const handleChange = jest.fn();
      render(
        <SpreadChart
          dataPoints={[]}
          timeRange={30}
          onTimeRangeChange={handleChange}
        />
      );
      
      fireEvent.click(screen.getByLabelText('Show last 5 minutes'));
      
      expect(handleChange).toHaveBeenCalledWith(5);
    });

    it('should call onTimeRangeChange when 15 min button is clicked', () => {
      const handleChange = jest.fn();
      render(
        <SpreadChart
          dataPoints={[]}
          timeRange={30}
          onTimeRangeChange={handleChange}
        />
      );
      
      fireEvent.click(screen.getByLabelText('Show last 15 minutes'));
      
      expect(handleChange).toHaveBeenCalledWith(15);
    });

    it('should call onTimeRangeChange when 30 min button is clicked', () => {
      const handleChange = jest.fn();
      render(
        <SpreadChart
          dataPoints={[]}
          timeRange={5}
          onTimeRangeChange={handleChange}
        />
      );
      
      fireEvent.click(screen.getByLabelText('Show last 30 minutes'));
      
      expect(handleChange).toHaveBeenCalledWith(30);
    });

    it('should not crash if onTimeRangeChange is not provided', () => {
      render(<SpreadChart dataPoints={[]} timeRange={30} />);
      
      expect(() => {
        fireEvent.click(screen.getByLabelText('Show last 5 minutes'));
      }).not.toThrow();
    });
  });

  describe('Chart Data Preparation', () => {
    it('should include alert points in chart data', () => {
      const dataPoints = [
        createDataPoint(5, 1.5, false),
        createDataPoint(10, 2.5, true), // Alert point
        createDataPoint(15, 1.8, false),
      ];
      
      render(<SpreadChart dataPoints={dataPoints} />);
      
      const chartData = screen.getByTestId('chart-data');
      const data = JSON.parse(chartData.textContent || '{}');
      
      // Should have two datasets: main line and alerts
      expect(data.datasets).toHaveLength(2);
      expect(data.datasets[0].label).toBe('Spread %');
      expect(data.datasets[1].label).toBe('Alerts');
    });

    it('should mark alert points with red color', () => {
      const dataPoints = [
        createDataPoint(5, 1.5, false),
        createDataPoint(10, 2.5, true), // Alert point
      ];
      
      render(<SpreadChart dataPoints={dataPoints} />);
      
      const chartData = screen.getByTestId('chart-data');
      const data = JSON.parse(chartData.textContent || '{}');
      
      // Alert dataset should have red color (rgb(239, 68, 68) is red-500)
      const alertDataset = data.datasets[1];
      expect(alertDataset.pointBackgroundColor).toBe('rgb(239, 68, 68)');
    });

    it('should sort data points by timestamp', () => {
      // Create points in random order
      const dataPoints = [
        createDataPoint(15, 1.8),
        createDataPoint(5, 1.5),
        createDataPoint(10, 2.0),
      ];
      
      render(<SpreadChart dataPoints={dataPoints} />);
      
      const chartData = screen.getByTestId('chart-data');
      const data = JSON.parse(chartData.textContent || '{}');
      
      // Data should be sorted by time (oldest to newest)
      const spreadValues = data.datasets[0].data;
      expect(spreadValues).toEqual([1.8, 2.0, 1.5]);
    });
  });

  describe('Custom Height', () => {
    it('should use default height of 300px', () => {
      const dataPoints = [createDataPoint(5, 1.5)];
      const { container } = render(<SpreadChart dataPoints={dataPoints} />);
      
      const chartContainer = container.querySelector('[style*="height"]');
      expect(chartContainer).toHaveStyle({ height: '300px' });
    });

    it('should use custom height when provided', () => {
      const dataPoints = [createDataPoint(5, 1.5)];
      const { container } = render(
        <SpreadChart dataPoints={dataPoints} height={400} />
      );
      
      const chartContainer = container.querySelector('[style*="height"]');
      expect(chartContainer).toHaveStyle({ height: '400px' });
    });

    it('should apply height to empty state', () => {
      const { container } = render(<SpreadChart dataPoints={[]} height={250} />);
      
      const emptyState = container.querySelector('[style*="height"]');
      expect(emptyState).toHaveStyle({ height: '250px' });
    });
  });

  describe('Legend Display', () => {
    it('should show legend items', () => {
      render(<SpreadChart dataPoints={[]} />);
      
      expect(screen.getByText('Spread percentage')).toBeInTheDocument();
      expect(screen.getByText('Alert triggered')).toBeInTheDocument();
    });
  });
});

describe('filterDataByTimeWindow', () => {
  const createDataPoint = (
    minutesAgo: number,
    spreadPercent: number,
    isAlert: boolean = false
  ): ChartDataPoint => ({
    timestamp: new Date(Date.now() - minutesAgo * 60 * 1000),
    spreadPercent,
    isAlert,
  });

  describe('Property 17: Chart Data Time Window', () => {
    it('should return empty array for empty input', () => {
      const result = filterDataByTimeWindow([], 30);
      expect(result).toEqual([]);
    });

    it('should filter data to last 5 minutes', () => {
      const dataPoints = [
        createDataPoint(2, 1.5),   // Within 5 min
        createDataPoint(4, 2.0),   // Within 5 min
        createDataPoint(6, 1.8),   // Outside 5 min
        createDataPoint(10, 2.2),  // Outside 5 min
      ];
      
      const result = filterDataByTimeWindow(dataPoints, 5);
      
      expect(result).toHaveLength(2);
      expect(result[0].spreadPercent).toBe(1.5);
      expect(result[1].spreadPercent).toBe(2.0);
    });

    it('should filter data to last 15 minutes', () => {
      const dataPoints = [
        createDataPoint(5, 1.5),   // Within 15 min
        createDataPoint(10, 2.0),  // Within 15 min
        createDataPoint(14, 1.8),  // Within 15 min
        createDataPoint(16, 2.2),  // Outside 15 min
        createDataPoint(20, 1.9),  // Outside 15 min
      ];
      
      const result = filterDataByTimeWindow(dataPoints, 15);
      
      expect(result).toHaveLength(3);
      expect(result.map(p => p.spreadPercent)).toEqual([1.5, 2.0, 1.8]);
    });

    it('should filter data to last 30 minutes', () => {
      const dataPoints = [
        createDataPoint(5, 1.5),   // Within 30 min
        createDataPoint(15, 2.0),  // Within 30 min
        createDataPoint(25, 1.8),  // Within 30 min
        createDataPoint(29, 2.2),  // Within 30 min
        createDataPoint(31, 1.9),  // Outside 30 min
        createDataPoint(40, 2.5),  // Outside 30 min
      ];
      
      const result = filterDataByTimeWindow(dataPoints, 30);
      
      expect(result).toHaveLength(4);
      expect(result.map(p => p.spreadPercent)).toEqual([1.5, 2.0, 1.8, 2.2]);
    });

    it('should include data points exactly at the cutoff time', () => {
      const now = new Date();
      const exactly30MinAgo = new Date(now.getTime() - 30 * 60 * 1000);
      
      const dataPoints: ChartDataPoint[] = [
        {
          timestamp: exactly30MinAgo,
          spreadPercent: 1.5,
          isAlert: false,
        },
        {
          timestamp: new Date(now.getTime() - 29 * 60 * 1000),
          spreadPercent: 2.0,
          isAlert: false,
        },
      ];
      
      const result = filterDataByTimeWindow(dataPoints, 30);
      
      // Point exactly at 30 minutes should be included
      expect(result).toHaveLength(2);
    });

    it('should preserve alert flags when filtering', () => {
      const dataPoints = [
        createDataPoint(5, 1.5, false),
        createDataPoint(10, 2.5, true),  // Alert point
        createDataPoint(15, 1.8, false),
      ];
      
      const result = filterDataByTimeWindow(dataPoints, 30);
      
      expect(result).toHaveLength(3);
      expect(result[0].isAlert).toBe(false);
      expect(result[1].isAlert).toBe(true);
      expect(result[2].isAlert).toBe(false);
    });

    it('should handle all data points being outside time window', () => {
      const dataPoints = [
        createDataPoint(35, 1.5),
        createDataPoint(40, 2.0),
        createDataPoint(45, 1.8),
      ];
      
      const result = filterDataByTimeWindow(dataPoints, 30);
      
      expect(result).toEqual([]);
    });

    it('should handle all data points being within time window', () => {
      const dataPoints = [
        createDataPoint(5, 1.5),
        createDataPoint(10, 2.0),
        createDataPoint(15, 1.8),
      ];
      
      const result = filterDataByTimeWindow(dataPoints, 30);
      
      expect(result).toHaveLength(3);
      expect(result).toEqual(dataPoints);
    });

    it('should work with custom time windows', () => {
      const dataPoints = [
        createDataPoint(1, 1.5),
        createDataPoint(2, 2.0),
        createDataPoint(3, 1.8),
        createDataPoint(5, 2.2),
      ];
      
      // Test with 2-minute window
      const result = filterDataByTimeWindow(dataPoints, 2);
      
      expect(result).toHaveLength(2);
      expect(result.map(p => p.spreadPercent)).toEqual([1.5, 2.0]);
    });
  });
});

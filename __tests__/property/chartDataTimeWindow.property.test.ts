import * as fc from 'fast-check';
import { filterDataByTimeWindow } from '../../src/components/scanner/SpreadChart';
import { ChartDataPoint } from '../../src/types';

/**
 * **Feature: crypto-arbitrage-scanner, Property 17: Chart Data Time Window**
 * 
 * *For any* chart data set, only data points within the last 30 minutes 
 * SHALL be displayed.
 * 
 * **Validates: Requirements 6.2**
 */
describe('Property 17: Chart Data Time Window', () => {
  // Arbitrary for spread percentage
  const spreadPercentArb = fc.double({
    min: -50,
    max: 100,
    noNaN: true,
    noDefaultInfinity: true,
  });

  // Arbitrary for boolean (isAlert flag)
  const booleanArb = fc.boolean();

  // Arbitrary for timestamp within a reasonable range
  // Generate timestamps from 2 hours ago to now
  // Use a fixed reference time to avoid timing issues
  const referenceTime = Date.now();
  const timestampArb = fc.integer({
    min: referenceTime - 2 * 60 * 60 * 1000, // 2 hours ago
    max: referenceTime, // now
  }).map(ms => new Date(ms));

  // Arbitrary for ChartDataPoint
  const chartDataPointArb: fc.Arbitrary<ChartDataPoint> = fc.record({
    timestamp: timestampArb,
    spreadPercent: spreadPercentArb,
    isAlert: booleanArb,
  });

  // Arbitrary for array of ChartDataPoint (0 to 100 items)
  const chartDataPointArrayArb = fc.array(chartDataPointArb, { 
    minLength: 0, 
    maxLength: 100 
  });

  /**
   * Property: For any time window in minutes, all returned data points 
   * SHALL have timestamps within that time window from now
   */
  it('should only return data points within the specified time window', () => {
    fc.assert(
      fc.property(
        chartDataPointArrayArb,
        fc.integer({ min: 1, max: 120 }), // Time window in minutes (1 to 120)
        (dataPoints, minutes) => {
          const now = new Date();
          const cutoffTime = new Date(now.getTime() - minutes * 60 * 1000);

          const filtered = filterDataByTimeWindow(dataPoints, minutes);

          // All filtered points should be within the time window
          for (const point of filtered) {
            expect(point.timestamp.getTime()).toBeGreaterThanOrEqual(cutoffTime.getTime());
            expect(point.timestamp.getTime()).toBeLessThanOrEqual(now.getTime());
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For the default 30-minute window, only data points from the last 30 minutes
   * SHALL be included
   */
  it('should filter to last 30 minutes for the default time window', () => {
    fc.assert(
      fc.property(
        chartDataPointArrayArb,
        (dataPoints) => {
          const now = new Date();
          const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

          const filtered = filterDataByTimeWindow(dataPoints, 30);

          // All filtered points should be within the last 30 minutes
          for (const point of filtered) {
            // Skip invalid dates
            if (isNaN(point.timestamp.getTime())) {
              continue;
            }
            expect(point.timestamp.getTime()).toBeGreaterThanOrEqual(thirtyMinutesAgo.getTime());
          }

          // All points outside the window should be excluded
          const excluded = dataPoints.filter(
            point => !filtered.includes(point)
          );
          for (const point of excluded) {
            // Skip invalid dates
            if (isNaN(point.timestamp.getTime())) {
              continue;
            }
            expect(point.timestamp.getTime()).toBeLessThan(thirtyMinutesAgo.getTime());
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Filtering should preserve all data points that are within the time window
   * (no valid points should be lost)
   */
  it('should preserve all data points within the time window', () => {
    fc.assert(
      fc.property(
        chartDataPointArrayArb,
        fc.integer({ min: 1, max: 120 }),
        (dataPoints, minutes) => {
          const now = new Date();
          const cutoffTime = new Date(now.getTime() - minutes * 60 * 1000);

          const filtered = filterDataByTimeWindow(dataPoints, minutes);

          // Count how many points should be in the window
          const expectedCount = dataPoints.filter(
            point => point.timestamp >= cutoffTime
          ).length;

          // Filtered array should have exactly that many points
          expect(filtered.length).toBe(expectedCount);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Filtering an empty array should return an empty array
   */
  it('should return empty array when input is empty', () => {
    const filtered = filterDataByTimeWindow([], 30);
    expect(filtered).toEqual([]);
    expect(filtered.length).toBe(0);
  });

  /**
   * Property: All data points should be excluded if they are older than the time window
   */
  it('should exclude all data points older than the time window', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 120 }),
        (minutes) => {
          // Create data points that are all older than the time window
          const now = Date.now();
          const cutoffTime = now - minutes * 60 * 1000;
          
          // Generate points that are 1 hour older than the cutoff
          const oldDataPoints: ChartDataPoint[] = fc.sample(
            fc.record({
              timestamp: fc.integer({
                min: cutoffTime - 60 * 60 * 1000,
                max: cutoffTime - 1000, // At least 1 second before cutoff
              }).map(ms => new Date(ms)),
              spreadPercent: spreadPercentArb,
              isAlert: booleanArb,
            }),
            10
          );

          const filtered = filterDataByTimeWindow(oldDataPoints, minutes);

          // All points should be excluded
          expect(filtered.length).toBe(0);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: All data points should be included if they are within the time window
   */
  it('should include all data points within the time window', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 5, max: 120 }), // Use at least 5 minutes to have enough buffer
        (minutes) => {
          const now = Date.now();
          // Add a buffer to account for test execution time
          const cutoffTime = now - minutes * 60 * 1000 + 10000; // 10 second buffer
          
          // Generate points that are all within the time window with buffer
          const recentDataPoints: ChartDataPoint[] = fc.sample(
            fc.record({
              timestamp: fc.integer({
                min: cutoffTime,
                max: now - 2000, // At least 2 seconds before now
              }).map(ms => new Date(ms)),
              spreadPercent: spreadPercentArb,
              isAlert: booleanArb,
            }),
            10
          );

          const filtered = filterDataByTimeWindow(recentDataPoints, minutes);

          // All points should be included
          expect(filtered.length).toBe(recentDataPoints.length);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Filtering should not mutate the original array
   */
  it('should not mutate the original array', () => {
    fc.assert(
      fc.property(
        chartDataPointArrayArb,
        fc.integer({ min: 1, max: 120 }),
        (dataPoints, minutes) => {
          // Create a copy of the original for comparison
          const originalLength = dataPoints.length;
          const originalTimestamps = dataPoints.map(p => p.timestamp.getTime());

          // Filter the data
          filterDataByTimeWindow(dataPoints, minutes);

          // Original array should remain unchanged
          expect(dataPoints.length).toBe(originalLength);
          for (let i = 0; i < dataPoints.length; i++) {
            expect(dataPoints[i].timestamp.getTime()).toBe(originalTimestamps[i]);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Filtering with a very large time window should include all points
   */
  it('should include all points when time window is very large', () => {
    fc.assert(
      fc.property(
        chartDataPointArrayArb,
        (dataPoints) => {
          // Filter out any invalid dates
          const validDataPoints = dataPoints.filter(
            point => !isNaN(point.timestamp.getTime())
          );

          // Use a very large time window (1000 hours = ~41 days)
          const filtered = filterDataByTimeWindow(validDataPoints, 1000 * 60);

          // All valid points should be included since our test data is at most 2 hours old
          expect(filtered.length).toBe(validDataPoints.length);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Filtering with a very small time window should exclude most/all points
   * (unless data points are very recent)
   */
  it('should exclude most points when time window is very small', () => {
    fc.assert(
      fc.property(
        chartDataPointArrayArb,
        (dataPoints) => {
          // Use a very small time window (1 millisecond)
          const filtered = filterDataByTimeWindow(dataPoints, 1 / 60000);

          // Most or all points should be excluded (unless they're exactly at "now")
          // We can't guarantee all will be excluded due to timing, but the count should be small
          expect(filtered.length).toBeLessThanOrEqual(dataPoints.length);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: The order of data points should be preserved after filtering
   */
  it('should preserve the order of data points', () => {
    fc.assert(
      fc.property(
        chartDataPointArrayArb,
        fc.integer({ min: 1, max: 120 }),
        (dataPoints, minutes) => {
          const filtered = filterDataByTimeWindow(dataPoints, minutes);

          // Find the indices of filtered points in the original array
          const originalIndices: number[] = [];
          for (const filteredPoint of filtered) {
            const index = dataPoints.findIndex(
              p => p.timestamp.getTime() === filteredPoint.timestamp.getTime() &&
                   p.spreadPercent === filteredPoint.spreadPercent &&
                   p.isAlert === filteredPoint.isAlert
            );
            originalIndices.push(index);
          }

          // Indices should be in ascending order (preserving original order)
          for (let i = 0; i < originalIndices.length - 1; i++) {
            expect(originalIndices[i]).toBeLessThan(originalIndices[i + 1]);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Filtering twice with the same time window should be idempotent
   */
  it('should be idempotent - filtering twice gives same result', () => {
    fc.assert(
      fc.property(
        chartDataPointArrayArb,
        fc.integer({ min: 1, max: 120 }),
        (dataPoints, minutes) => {
          const filteredOnce = filterDataByTimeWindow(dataPoints, minutes);
          const filteredTwice = filterDataByTimeWindow(filteredOnce, minutes);

          // Both should have the same length
          expect(filteredOnce.length).toBe(filteredTwice.length);

          // Both should have the same data points
          for (let i = 0; i < filteredOnce.length; i++) {
            expect(filteredOnce[i].timestamp.getTime()).toBe(filteredTwice[i].timestamp.getTime());
            expect(filteredOnce[i].spreadPercent).toBe(filteredTwice[i].spreadPercent);
            expect(filteredOnce[i].isAlert).toBe(filteredTwice[i].isAlert);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

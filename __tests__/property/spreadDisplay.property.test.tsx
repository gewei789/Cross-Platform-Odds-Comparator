import * as fc from 'fast-check';
import { render, screen } from '@testing-library/react';
import { SpreadList, getSpreadColorClass } from '../../src/components/scanner/SpreadList';
import { SpreadResult, Exchange } from '../../src/types';

/**
 * **Feature: crypto-arbitrage-scanner, Property 8: Spread Display Completeness**
 * 
 * *For any* SpreadResult object displayed, the display SHALL include: 
 * buyExchange, sellExchange, buyPrice, sellPrice, and spreadPercent.
 * 
 * **Validates: Requirements 3.4**
 */
describe('Property 8: Spread Display Completeness', () => {
  // Arbitrary for Exchange type
  const exchangeArb = fc.constantFrom<Exchange>('binance', 'coinbase', 'kraken');

  // Arbitrary for TradingPair
  const tradingPairArb = fc.record({
    base: fc.constantFrom('ETH', 'BTC', 'SOL', 'DOGE', 'XRP'),
    quote: fc.constantFrom('USDT', 'USD', 'EUR', 'BTC'),
  }).map(({ base, quote }) => ({
    base,
    quote,
    symbol: `${base}/${quote}`,
  }));

  // Arbitrary for positive prices
  const positivePriceArb = fc.double({
    min: 0.00000001,
    max: 100000,
    noNaN: true,
    noDefaultInfinity: true,
  });

  // Arbitrary for spread percentage (can be negative, zero, or positive)
  const spreadPercentArb = fc.double({
    min: -50,
    max: 100,
    noNaN: true,
    noDefaultInfinity: true,
  });

  // Arbitrary for SpreadResult
  const spreadResultArb: fc.Arbitrary<SpreadResult> = fc.record({
    pair: tradingPairArb,
    buyExchange: exchangeArb,
    sellExchange: exchangeArb,
    buyPrice: positivePriceArb,
    sellPrice: positivePriceArb,
    spreadPercent: spreadPercentArb,
    timestamp: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-01-01') }),
  });

  /**
   * Exchange display names mapping (must match component implementation)
   */
  const EXCHANGE_DISPLAY_NAMES: Record<Exchange, string> = {
    binance: 'Binance',
    coinbase: 'Coinbase',
    kraken: 'Kraken',
  };

  /**
   * Format price to match component's formatting logic
   */
  function formatPrice(price: number): string {
    if (price >= 1000) {
      return price.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    } else if (price >= 1) {
      return price.toLocaleString('en-US', {
        minimumFractionDigits: 4,
        maximumFractionDigits: 4,
      });
    } else {
      return price.toLocaleString('en-US', {
        minimumFractionDigits: 6,
        maximumFractionDigits: 8,
      });
    }
  }

  /**
   * Format spread percentage to match component's formatting logic
   */
  function formatSpreadPercent(percent: number): string {
    return percent.toFixed(3);
  }

  /**
   * Property: For any SpreadResult, the display SHALL include all required fields:
   * - buyExchange
   * - sellExchange
   * - buyPrice
   * - sellPrice
   * - spreadPercent
   */
  it('should display all required fields for any SpreadResult', () => {
    fc.assert(
      fc.property(
        spreadResultArb,
        (spreadResult) => {
          // Render the component with a single spread result
          const { container, unmount } = render(<SpreadList spreadResults={[spreadResult]} />);

          // Verify buyExchange is displayed
          const buyExchangeText = EXCHANGE_DISPLAY_NAMES[spreadResult.buyExchange];
          const buyExchangeElements = screen.getAllByText(buyExchangeText);
          expect(buyExchangeElements.length).toBeGreaterThan(0);

          // Verify sellExchange is displayed
          const sellExchangeText = EXCHANGE_DISPLAY_NAMES[spreadResult.sellExchange];
          const sellExchangeElements = screen.getAllByText(sellExchangeText);
          expect(sellExchangeElements.length).toBeGreaterThan(0);

          // Verify buyPrice is displayed (formatted with $)
          const buyPriceText = `$${formatPrice(spreadResult.buyPrice)}`;
          expect(container.textContent).toContain(buyPriceText);

          // Verify sellPrice is displayed (formatted with $)
          const sellPriceText = `$${formatPrice(spreadResult.sellPrice)}`;
          expect(container.textContent).toContain(sellPriceText);

          // Verify spreadPercent is displayed (formatted with % and optional +)
          const spreadPercentFormatted = formatSpreadPercent(spreadResult.spreadPercent);
          const spreadPercentText = spreadResult.spreadPercent > 0 
            ? `+${spreadPercentFormatted}%` 
            : `${spreadPercentFormatted}%`;
          expect(container.textContent).toContain(spreadPercentText);

          // Clean up after each test
          unmount();

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For any array of SpreadResults, each result SHALL display all required fields
   */
  it('should display all required fields for multiple SpreadResults', () => {
    fc.assert(
      fc.property(
        fc.array(spreadResultArb, { minLength: 1, maxLength: 10 }),
        (spreadResults) => {
          // Render the component with multiple spread results
          const { container, unmount } = render(<SpreadList spreadResults={spreadResults} />);

          // Verify each spread result has all required fields displayed
          spreadResults.forEach((spreadResult) => {
            // Verify buyExchange is displayed
            const buyExchangeText = EXCHANGE_DISPLAY_NAMES[spreadResult.buyExchange];
            expect(container.textContent).toContain(buyExchangeText);

            // Verify sellExchange is displayed
            const sellExchangeText = EXCHANGE_DISPLAY_NAMES[spreadResult.sellExchange];
            expect(container.textContent).toContain(sellExchangeText);

            // Verify buyPrice is displayed
            const buyPriceText = `$${formatPrice(spreadResult.buyPrice)}`;
            expect(container.textContent).toContain(buyPriceText);

            // Verify sellPrice is displayed
            const sellPriceText = `$${formatPrice(spreadResult.sellPrice)}`;
            expect(container.textContent).toContain(sellPriceText);

            // Verify spreadPercent is displayed
            const spreadPercentFormatted = formatSpreadPercent(spreadResult.spreadPercent);
            const spreadPercentText = spreadResult.spreadPercent > 0 
              ? `+${spreadPercentFormatted}%` 
              : `${spreadPercentFormatted}%`;
            expect(container.textContent).toContain(spreadPercentText);
          });

          // Clean up after each test
          unmount();

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: The trading pair symbol SHALL be displayed for any SpreadResult
   */
  it('should display the trading pair symbol', () => {
    fc.assert(
      fc.property(
        spreadResultArb,
        (spreadResult) => {
          const { container, unmount } = render(<SpreadList spreadResults={[spreadResult]} />);

          // Verify the trading pair symbol is displayed
          expect(container.textContent).toContain(spreadResult.pair.symbol);

          // Clean up after each test
          unmount();

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Empty spread results array should display appropriate message
   */
  it('should display appropriate message when no spread results are available', () => {
    render(<SpreadList spreadResults={[]} />);

    // Verify empty state message is displayed
    expect(screen.getByText('No spread data available')).toBeInTheDocument();
    expect(screen.getByText('Start scanning to calculate arbitrage opportunities.')).toBeInTheDocument();
  });

  /**
   * Property: All required fields SHALL be present in the DOM structure
   * This verifies the completeness at the DOM level
   */
  it('should have all required fields in the DOM structure', () => {
    fc.assert(
      fc.property(
        spreadResultArb,
        (spreadResult) => {
          const { container, unmount } = render(<SpreadList spreadResults={[spreadResult]} />);

          // Verify table structure exists
          const table = container.querySelector('table');
          expect(table).toBeInTheDocument();

          // Verify table has the correct headers
          const headers = container.querySelectorAll('th');
          const headerTexts = Array.from(headers).map(h => h.textContent);
          
          expect(headerTexts).toContain('Buy Exchange');
          expect(headerTexts).toContain('Sell Exchange');
          expect(headerTexts).toContain('Buy Price');
          expect(headerTexts).toContain('Sell Price');
          expect(headerTexts).toContain('Spread %');

          // Verify at least one row exists in tbody
          const tbody = table?.querySelector('tbody');
          expect(tbody).toBeInTheDocument();
          expect(tbody?.children.length).toBeGreaterThan(0);

          // Clean up after each test
          unmount();

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: The spread percent badge SHALL have the correct data attributes
   * for testing and styling purposes
   */
  it('should have correct data attributes on spread percent badge', () => {
    fc.assert(
      fc.property(
        spreadResultArb,
        (spreadResult) => {
          const { container } = render(<SpreadList spreadResults={[spreadResult]} />);

          // Find the spread percent badge
          const spreadBadge = container.querySelector('[data-testid="spread-percent"]');
          expect(spreadBadge).toBeInTheDocument();

          // Verify data-spread-positive attribute matches the spread sign
          const isPositive = spreadResult.spreadPercent > 0;
          expect(spreadBadge?.getAttribute('data-spread-positive')).toBe(String(isPositive));

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For any SpreadResult with different buy and sell exchanges,
   * both exchanges SHALL be displayed distinctly
   */
  it('should display different buy and sell exchanges distinctly', () => {
    fc.assert(
      fc.property(
        spreadResultArb.filter(
          (result) => result.buyExchange !== result.sellExchange
        ),
        (spreadResult) => {
          const { container, unmount } = render(<SpreadList spreadResults={[spreadResult]} />);

          // Both exchanges should be present
          const buyExchangeText = EXCHANGE_DISPLAY_NAMES[spreadResult.buyExchange];
          const sellExchangeText = EXCHANGE_DISPLAY_NAMES[spreadResult.sellExchange];

          expect(container.textContent).toContain(buyExchangeText);
          expect(container.textContent).toContain(sellExchangeText);

          // Clean up after each test
          unmount();

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For any SpreadResult, the row SHALL have an accessible label
   * containing all key information
   */
  it('should have accessible label with all key information', () => {
    fc.assert(
      fc.property(
        spreadResultArb,
        (spreadResult) => {
          const { container } = render(<SpreadList spreadResults={[spreadResult]} />);

          // Find the table row
          const row = container.querySelector('tbody tr');
          expect(row).toBeInTheDocument();

          // Verify aria-label contains key information
          const ariaLabel = row?.getAttribute('aria-label');
          expect(ariaLabel).toBeTruthy();

          // Verify aria-label contains all required information
          expect(ariaLabel).toContain(spreadResult.pair.symbol);
          expect(ariaLabel).toContain(EXCHANGE_DISPLAY_NAMES[spreadResult.buyExchange]);
          expect(ariaLabel).toContain(EXCHANGE_DISPLAY_NAMES[spreadResult.sellExchange]);
          expect(ariaLabel).toContain(formatPrice(spreadResult.buyPrice));
          expect(ariaLabel).toContain(formatPrice(spreadResult.sellPrice));
          expect(ariaLabel).toContain(formatSpreadPercent(spreadResult.spreadPercent));

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: crypto-arbitrage-scanner, Property 9: Spread Color Coding**
 * 
 * *For any* SpreadResult, if spreadPercent > 0 then display color SHALL be green; 
 * if spreadPercent <= 0 then display color SHALL be gray.
 * 
 * **Validates: Requirements 3.5**
 */
describe('Property 9: Spread Color Coding', () => {
  // Arbitrary for Exchange type
  const exchangeArb = fc.constantFrom<Exchange>('binance', 'coinbase', 'kraken');

  // Arbitrary for TradingPair
  const tradingPairArb = fc.record({
    base: fc.constantFrom('ETH', 'BTC', 'SOL', 'DOGE', 'XRP'),
    quote: fc.constantFrom('USDT', 'USD', 'EUR', 'BTC'),
  }).map(({ base, quote }) => ({
    base,
    quote,
    symbol: `${base}/${quote}`,
  }));

  // Arbitrary for positive prices
  const positivePriceArb = fc.double({
    min: 0.00000001,
    max: 100000,
    noNaN: true,
    noDefaultInfinity: true,
  });

  // Arbitrary for positive spread percentage (> 0)
  const positiveSpreadArb = fc.double({
    min: 0.00000001,
    max: 100,
    noNaN: true,
    noDefaultInfinity: true,
  });

  // Arbitrary for non-positive spread percentage (<= 0)
  const nonPositiveSpreadArb = fc.double({
    min: -50,
    max: 0,
    noNaN: true,
    noDefaultInfinity: true,
  });

  // Arbitrary for SpreadResult with positive spread
  const positiveSpreadResultArb: fc.Arbitrary<SpreadResult> = fc.record({
    pair: tradingPairArb,
    buyExchange: exchangeArb,
    sellExchange: exchangeArb,
    buyPrice: positivePriceArb,
    sellPrice: positivePriceArb,
    spreadPercent: positiveSpreadArb,
    timestamp: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-01-01') }),
  });

  // Arbitrary for SpreadResult with non-positive spread
  const nonPositiveSpreadResultArb: fc.Arbitrary<SpreadResult> = fc.record({
    pair: tradingPairArb,
    buyExchange: exchangeArb,
    sellExchange: exchangeArb,
    buyPrice: positivePriceArb,
    sellPrice: positivePriceArb,
    spreadPercent: nonPositiveSpreadArb,
    timestamp: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-01-01') }),
  });

  /**
   * Property: For any SpreadResult with spreadPercent > 0, 
   * the display color SHALL be green
   */
  it('should display green color for positive spread percentages', () => {
    fc.assert(
      fc.property(
        positiveSpreadResultArb,
        (spreadResult) => {
          // Verify spreadPercent is positive
          expect(spreadResult.spreadPercent).toBeGreaterThan(0);

          // Render the component
          const { container } = render(<SpreadList spreadResults={[spreadResult]} />);

          // Find the table row
          const row = container.querySelector('tbody tr');
          expect(row).toBeInTheDocument();

          // Verify row has green background classes
          expect(row?.className).toContain('bg-green-50');
          expect(row?.className).toContain('hover:bg-green-100');

          // Find the spread percent badge
          const spreadBadge = container.querySelector('[data-testid="spread-percent"]');
          expect(spreadBadge).toBeInTheDocument();

          // Verify badge has green color classes
          expect(spreadBadge?.className).toContain('bg-green-100');
          expect(spreadBadge?.className).toContain('text-green-800');

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For any SpreadResult with spreadPercent <= 0, 
   * the display color SHALL be gray
   */
  it('should display gray color for non-positive spread percentages', () => {
    fc.assert(
      fc.property(
        nonPositiveSpreadResultArb,
        (spreadResult) => {
          // Verify spreadPercent is non-positive
          expect(spreadResult.spreadPercent).toBeLessThanOrEqual(0);

          // Render the component
          const { container } = render(<SpreadList spreadResults={[spreadResult]} />);

          // Find the table row
          const row = container.querySelector('tbody tr');
          expect(row).toBeInTheDocument();

          // Verify row has gray background classes
          expect(row?.className).toContain('bg-gray-50');
          expect(row?.className).toContain('hover:bg-gray-100');

          // Find the spread percent badge
          const spreadBadge = container.querySelector('[data-testid="spread-percent"]');
          expect(spreadBadge).toBeInTheDocument();

          // Verify badge has gray color classes
          expect(spreadBadge?.className).toContain('bg-gray-100');
          expect(spreadBadge?.className).toContain('text-gray-600');

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: The getSpreadColorClass helper function SHALL return green classes
   * for any positive spread percentage
   */
  it('should return green color classes for positive spread percentages', () => {
    fc.assert(
      fc.property(
        positiveSpreadArb,
        (spreadPercent) => {
          // Verify spreadPercent is positive
          expect(spreadPercent).toBeGreaterThan(0);

          // Get color classes
          const colorClass = getSpreadColorClass(spreadPercent);

          // Verify green classes are returned
          expect(colorClass.row).toBe('bg-green-50 hover:bg-green-100');
          expect(colorClass.text).toBe('text-green-700');
          expect(colorClass.badge).toBe('bg-green-100 text-green-800');

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: The getSpreadColorClass helper function SHALL return gray classes
   * for any non-positive spread percentage
   */
  it('should return gray color classes for non-positive spread percentages', () => {
    fc.assert(
      fc.property(
        nonPositiveSpreadArb,
        (spreadPercent) => {
          // Verify spreadPercent is non-positive
          expect(spreadPercent).toBeLessThanOrEqual(0);

          // Get color classes
          const colorClass = getSpreadColorClass(spreadPercent);

          // Verify gray classes are returned
          expect(colorClass.row).toBe('bg-gray-50 hover:bg-gray-100');
          expect(colorClass.text).toBe('text-gray-600');
          expect(colorClass.badge).toBe('bg-gray-100 text-gray-600');

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For any array of SpreadResults with mixed positive and non-positive spreads,
   * each result SHALL have the correct color coding
   */
  it('should apply correct color coding to mixed spread results', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.oneof(positiveSpreadResultArb, nonPositiveSpreadResultArb),
          { minLength: 2, maxLength: 10 }
        ),
        (spreadResults) => {
          // Render the component
          const { container } = render(<SpreadList spreadResults={spreadResults} />);

          // Find all table rows
          const rows = container.querySelectorAll('tbody tr');
          expect(rows.length).toBe(spreadResults.length);

          // Verify each row has the correct color coding
          rows.forEach((row, index) => {
            // Note: rows are sorted by spreadPercent descending, so we need to find the matching result
            const spreadBadge = row.querySelector('[data-testid="spread-percent"]');
            const isPositive = spreadBadge?.getAttribute('data-spread-positive') === 'true';

            if (isPositive) {
              // Verify green classes
              expect(row.className).toContain('bg-green-50');
              expect(row.className).toContain('hover:bg-green-100');
              expect(spreadBadge?.className).toContain('bg-green-100');
              expect(spreadBadge?.className).toContain('text-green-800');
            } else {
              // Verify gray classes
              expect(row.className).toContain('bg-gray-50');
              expect(row.className).toContain('hover:bg-gray-100');
              expect(spreadBadge?.className).toContain('bg-gray-100');
              expect(spreadBadge?.className).toContain('text-gray-600');
            }
          });

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: The boundary case of spreadPercent = 0 SHALL be treated as gray (non-positive)
   */
  it('should display gray color for zero spread percentage', () => {
    // Create a SpreadResult with exactly 0 spread
    const zeroSpreadResult: SpreadResult = {
      pair: { base: 'ETH', quote: 'USDT', symbol: 'ETH/USDT' },
      buyExchange: 'binance',
      sellExchange: 'coinbase',
      buyPrice: 2500,
      sellPrice: 2500,
      spreadPercent: 0,
      timestamp: new Date(),
    };

    // Render the component
    const { container } = render(<SpreadList spreadResults={[zeroSpreadResult]} />);

    // Find the table row
    const row = container.querySelector('tbody tr');
    expect(row).toBeInTheDocument();

    // Verify row has gray background classes (not green)
    expect(row?.className).toContain('bg-gray-50');
    expect(row?.className).toContain('hover:bg-gray-100');
    expect(row?.className).not.toContain('bg-green-50');

    // Find the spread percent badge
    const spreadBadge = container.querySelector('[data-testid="spread-percent"]');
    expect(spreadBadge).toBeInTheDocument();

    // Verify badge has gray color classes (not green)
    expect(spreadBadge?.className).toContain('bg-gray-100');
    expect(spreadBadge?.className).toContain('text-gray-600');
    expect(spreadBadge?.className).not.toContain('text-green-800');

    // Verify data attribute shows not positive
    expect(spreadBadge?.getAttribute('data-spread-positive')).toBe('false');
  });

  /**
   * Property: Very small positive spread percentages (> 0 but close to 0)
   * SHALL still be displayed as green
   */
  it('should display green color for very small positive spread percentages', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.00000001, max: 0.009999999, noNaN: true, noDefaultInfinity: true }),
        (spreadPercent) => {
          // Verify spreadPercent is positive but very small
          expect(spreadPercent).toBeGreaterThan(0);
          expect(spreadPercent).toBeLessThanOrEqual(0.01);

          // Get color classes
          const colorClass = getSpreadColorClass(spreadPercent);

          // Verify green classes are returned (not gray)
          expect(colorClass.row).toBe('bg-green-50 hover:bg-green-100');
          expect(colorClass.badge).toBe('bg-green-100 text-green-800');

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Very small negative spread percentages (< 0 but close to 0)
   * SHALL be displayed as gray
   */
  it('should display gray color for very small negative spread percentages', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -0.009999999, max: -0.00000001, noNaN: true, noDefaultInfinity: true }),
        (spreadPercent) => {
          // Verify spreadPercent is negative but very small
          expect(spreadPercent).toBeLessThan(0);
          expect(spreadPercent).toBeGreaterThanOrEqual(-0.01);

          // Get color classes
          const colorClass = getSpreadColorClass(spreadPercent);

          // Verify gray classes are returned (not green)
          expect(colorClass.row).toBe('bg-gray-50 hover:bg-gray-100');
          expect(colorClass.badge).toBe('bg-gray-100 text-gray-600');

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

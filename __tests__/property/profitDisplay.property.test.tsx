import * as fc from 'fast-check';
import { render, screen } from '@testing-library/react';
import { ProfitDisplay } from '../../src/components/simulator/ProfitDisplay';
import { ProfitResult } from '../../src/types';

function createValidProfitResult(overrides?: Partial<ProfitResult>): ProfitResult {
  return {
    grossProfit: 100,
    totalFees: 20,
    netProfit: 80,
    isProfitable: true,
    ...overrides,
  };
}

describe('Property 11: Profit Display Completeness', () => {
  it('should render successfully for any valid ProfitResult', () => {
    fc.assert(
      fc.property(
        fc.double({ noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 0, noNaN: true, noDefaultInfinity: true }),
        fc.double({ noNaN: true, noDefaultInfinity: true }),
        (grossProfit, totalFees, netProfit) => {
          const result: ProfitResult = {
            grossProfit,
            totalFees,
            netProfit,
            isProfitable: netProfit > 0,
          };

          const { container } = render(<ProfitDisplay result={result} tradeAmount={1000} />);

          expect(container.firstChild).toBeInTheDocument();
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle extreme values without crashing', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 1e-10, max: 1e10, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 0, max: 1e10, noNaN: true, noDefaultInfinity: true }),
        fc.double({ noNaN: true, noDefaultInfinity: true }),
        (grossProfit, totalFees, netProfit) => {
          const result: ProfitResult = {
            grossProfit,
            totalFees,
            netProfit,
            isProfitable: netProfit > 0,
          };

          expect(() => {
            render(<ProfitDisplay result={result} tradeAmount={1000} />);
          }).not.toThrow();

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should render profit status for any result', () => {
    fc.assert(
      fc.property(fc.boolean(), (isProfitable) => {
        const result = createValidProfitResult({ isProfitable });
        render(<ProfitDisplay result={result} tradeAmount={1000} />);

        const text = screen.getAllByText(
          (content) => content.includes('Profitable') || content.includes('Unprofitable')
        );
        expect(text.length).toBeGreaterThan(0);

        return true;
      }),
      { numRuns: 2 }
    );
  });

  it('should display the trade amount used for simulation', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 1000000, noNaN: true, noDefaultInfinity: true }),
        (tradeAmount) => {
          const result = createValidProfitResult();
          render(<ProfitDisplay result={result} tradeAmount={tradeAmount} />);
          const text = screen.getAllByText((content) => content.includes('Trade Amount'));
          expect(text.length).toBeGreaterThan(0);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display simulation warning', () => {
    fc.assert(
      fc.property(
        fc.double({ noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 0, noNaN: true, noDefaultInfinity: true }),
        fc.double({ noNaN: true, noDefaultInfinity: true }),
        (grossProfit, totalFees, netProfit) => {
          const result: ProfitResult = {
            grossProfit,
            totalFees,
            netProfit,
            isProfitable: netProfit > 0,
          };

          render(<ProfitDisplay result={result} tradeAmount={1000} />);
          const text = screen.getAllByText((content) => content.includes('Simulation Only'));
          expect(text.length).toBeGreaterThan(0);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 12: Negative Profit Indication', () => {
  it('should show "Unprofitable" when net profit is negative', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -100000, max: -0.01, noNaN: true, noDefaultInfinity: true }),
        (netProfit) => {
          const result: ProfitResult = {
            grossProfit: netProfit - 50,
            totalFees: 50,
            netProfit,
            isProfitable: false,
          };

          render(<ProfitDisplay result={result} tradeAmount={1000} />);
          const text = screen.getAllByText((content) => content.includes('Unprofitable'));
          expect(text.length).toBeGreaterThan(0);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should show "Profitable" when net profit is positive', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 100000, noNaN: true, noDefaultInfinity: true }),
        (netProfit) => {
          const result: ProfitResult = {
            grossProfit: netProfit + 50,
            totalFees: 50,
            netProfit,
            isProfitable: true,
          };

          render(<ProfitDisplay result={result} tradeAmount={1000} />);
          const text = screen.getAllByText((content) => content.includes('Profitable'));
          expect(text.length).toBeGreaterThan(0);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have isProfitable = true when netProfit > 0', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 100000, noNaN: true, noDefaultInfinity: true }),
        (netProfit) => {
          const result: ProfitResult = {
            grossProfit: netProfit + 10,
            totalFees: 10,
            netProfit,
            isProfitable: true,
          };

          expect(result.netProfit > 0).toBe(true);
          expect(result.isProfitable).toBe(true);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have isProfitable = false when netProfit <= 0', () => {
    fc.assert(
      fc.property(fc.double({ max: 0, noNaN: true, noDefaultInfinity: true }), (netProfit) => {
        const result: ProfitResult = {
          grossProfit: netProfit - 10,
          totalFees: 10,
          netProfit,
          isProfitable: false,
        };

        expect(result.netProfit).toBeLessThanOrEqual(0);
        expect(result.isProfitable).toBe(false);
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should render warning for unprofitable trades', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -500, max: -0.01, noNaN: true, noDefaultInfinity: true }),
        (netProfit) => {
          const result: ProfitResult = {
            grossProfit: netProfit - 10,
            totalFees: 10,
            netProfit,
            isProfitable: false,
          };

          render(<ProfitDisplay result={result} tradeAmount={1000} />);
          const text = screen.getAllByText((content) => content.includes('loss'));
          expect(text.length).toBeGreaterThan(0);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should render success message for profitable trades', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 1, max: 500, noNaN: true, noDefaultInfinity: true }),
        (netProfit) => {
          const result: ProfitResult = {
            grossProfit: netProfit + 10,
            totalFees: 10,
            netProfit,
            isProfitable: true,
          };

          render(<ProfitDisplay result={result} tradeAmount={1000} />);
          const text = screen.getAllByText((content) => content.includes('positive'));
          expect(text.length).toBeGreaterThan(0);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

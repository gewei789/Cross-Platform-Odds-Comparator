import { render, screen, fireEvent } from '@testing-library/react';
import { SpreadList, formatPrice, formatSpreadPercent, getSpreadColorClass, EXCHANGE_DISPLAY_NAMES } from '../../../src/components/scanner/SpreadList';
import { SpreadResult, TradingPair, Exchange } from '../../../src/types';

// Helper to create a mock SpreadResult
function createMockSpreadResult(overrides: Partial<SpreadResult> = {}): SpreadResult {
  const defaultPair: TradingPair = {
    base: 'ETH',
    quote: 'USDT',
    symbol: 'ETH/USDT',
  };

  return {
    pair: defaultPair,
    buyExchange: 'binance' as Exchange,
    sellExchange: 'coinbase' as Exchange,
    buyPrice: 2450.00,
    sellPrice: 2475.00,
    spreadPercent: 1.02,
    timestamp: new Date('2024-01-15T10:30:00Z'),
    ...overrides,
  };
}

describe('SpreadList Component', () => {
  describe('Empty State', () => {
    it('should display empty state message when no spread results', () => {
      render(<SpreadList spreadResults={[]} />);
      
      expect(screen.getByText('No spread data available')).toBeInTheDocument();
      expect(screen.getByText('Start scanning to calculate arbitrage opportunities.')).toBeInTheDocument();
    });

    it('should display the header even when empty', () => {
      render(<SpreadList spreadResults={[]} />);
      
      expect(screen.getByText('Arbitrage Opportunities')).toBeInTheDocument();
    });
  });

  describe('Display Completeness (Property 8)', () => {
    it('should display all required fields for each spread result', () => {
      const mockResult = createMockSpreadResult();
      render(<SpreadList spreadResults={[mockResult]} />);

      // Check pair symbol is displayed
      expect(screen.getByText('ETH/USDT')).toBeInTheDocument();

      // Check buy exchange is displayed
      expect(screen.getByText('Binance')).toBeInTheDocument();

      // Check sell exchange is displayed
      expect(screen.getByText('Coinbase')).toBeInTheDocument();

      // Check buy price is displayed (formatted - prices >= 1000 use 2 decimal places)
      expect(screen.getByText(/\$.*2,450\.00/)).toBeInTheDocument();

      // Check sell price is displayed (formatted)
      expect(screen.getByText(/\$.*2,475\.00/)).toBeInTheDocument();

      // Check spread percent is displayed (text may be split across elements)
      expect(screen.getByTestId('spread-percent')).toHaveTextContent('+1.020%');
    });

    it('should display all exchange names correctly', () => {
      const results: SpreadResult[] = [
        createMockSpreadResult({ buyExchange: 'binance', sellExchange: 'coinbase' }),
        createMockSpreadResult({ buyExchange: 'kraken', sellExchange: 'binance', spreadPercent: 0.5 }),
      ];
      render(<SpreadList spreadResults={results} />);

      expect(screen.getAllByText('Binance').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Coinbase').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Kraken').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Sorting (Property 7)', () => {
    it('should sort results by spreadPercent in descending order', () => {
      const results: SpreadResult[] = [
        createMockSpreadResult({ spreadPercent: 0.5 }),
        createMockSpreadResult({ spreadPercent: 2.5 }),
        createMockSpreadResult({ spreadPercent: 1.0 }),
      ];
      render(<SpreadList spreadResults={results} />);

      const spreadElements = screen.getAllByTestId('spread-percent');
      
      // First should be highest (2.5%)
      expect(spreadElements[0]).toHaveTextContent('+2.500%');
      // Second should be middle (1.0%)
      expect(spreadElements[1]).toHaveTextContent('+1.000%');
      // Third should be lowest (0.5%)
      expect(spreadElements[2]).toHaveTextContent('+0.500%');
    });

    it('should handle negative spreads in sorting', () => {
      const results: SpreadResult[] = [
        createMockSpreadResult({ spreadPercent: -0.5 }),
        createMockSpreadResult({ spreadPercent: 1.0 }),
        createMockSpreadResult({ spreadPercent: 0 }),
      ];
      render(<SpreadList spreadResults={results} />);

      const spreadElements = screen.getAllByTestId('spread-percent');
      
      // First should be highest (1.0%)
      expect(spreadElements[0]).toHaveTextContent('+1.000%');
      // Second should be zero
      expect(spreadElements[1]).toHaveTextContent('0.000%');
      // Third should be negative (-0.5%)
      expect(spreadElements[2]).toHaveTextContent('-0.500%');
    });
  });

  describe('Color Coding (Property 9)', () => {
    it('should apply green styling for positive spread', () => {
      const mockResult = createMockSpreadResult({ spreadPercent: 1.5 });
      render(<SpreadList spreadResults={[mockResult]} />);

      const spreadElement = screen.getByTestId('spread-percent');
      expect(spreadElement).toHaveAttribute('data-spread-positive', 'true');
      expect(spreadElement).toHaveClass('bg-green-100', 'text-green-800');
    });

    it('should apply gray styling for zero spread', () => {
      const mockResult = createMockSpreadResult({ spreadPercent: 0 });
      render(<SpreadList spreadResults={[mockResult]} />);

      const spreadElement = screen.getByTestId('spread-percent');
      expect(spreadElement).toHaveAttribute('data-spread-positive', 'false');
      expect(spreadElement).toHaveClass('bg-gray-100', 'text-gray-600');
    });

    it('should apply gray styling for negative spread', () => {
      const mockResult = createMockSpreadResult({ spreadPercent: -0.5 });
      render(<SpreadList spreadResults={[mockResult]} />);

      const spreadElement = screen.getByTestId('spread-percent');
      expect(spreadElement).toHaveAttribute('data-spread-positive', 'false');
      expect(spreadElement).toHaveClass('bg-gray-100', 'text-gray-600');
    });
  });

  describe('Interaction', () => {
    it('should call onSpreadClick when a row is clicked', () => {
      const mockResult = createMockSpreadResult();
      const handleClick = jest.fn();
      render(<SpreadList spreadResults={[mockResult]} onSpreadClick={handleClick} />);

      const row = screen.getByRole('button');
      fireEvent.click(row);

      expect(handleClick).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledWith(mockResult);
    });

    it('should call onSpreadClick when Enter key is pressed on a row', () => {
      const mockResult = createMockSpreadResult();
      const handleClick = jest.fn();
      render(<SpreadList spreadResults={[mockResult]} onSpreadClick={handleClick} />);

      const row = screen.getByRole('button');
      fireEvent.keyDown(row, { key: 'Enter' });

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should call onSpreadClick when Space key is pressed on a row', () => {
      const mockResult = createMockSpreadResult();
      const handleClick = jest.fn();
      render(<SpreadList spreadResults={[mockResult]} onSpreadClick={handleClick} />);

      const row = screen.getByRole('button');
      fireEvent.keyDown(row, { key: ' ' });

      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Count Display', () => {
    it('should display singular "opportunity" for one result', () => {
      const mockResult = createMockSpreadResult();
      render(<SpreadList spreadResults={[mockResult]} />);

      expect(screen.getByText(/1 opportunity found/)).toBeInTheDocument();
    });

    it('should display plural "opportunities" for multiple results', () => {
      const results = [
        createMockSpreadResult({ spreadPercent: 1.0 }),
        createMockSpreadResult({ spreadPercent: 0.5 }),
      ];
      render(<SpreadList spreadResults={results} />);

      expect(screen.getByText(/2 opportunities found/)).toBeInTheDocument();
    });
  });
});

describe('Helper Functions', () => {
  describe('formatPrice', () => {
    it('should format large prices with 2 decimal places', () => {
      expect(formatPrice(1234.5678)).toBe('1,234.57');
      expect(formatPrice(50000)).toBe('50,000.00');
    });

    it('should format medium prices with 4 decimal places', () => {
      expect(formatPrice(123.456789)).toBe('123.4568');
      expect(formatPrice(1.5)).toBe('1.5000');
    });

    it('should format small prices with up to 8 decimal places', () => {
      expect(formatPrice(0.00012345)).toBe('0.00012345');
      expect(formatPrice(0.5)).toBe('0.500000');
    });
  });

  describe('formatSpreadPercent', () => {
    it('should format spread with 3 decimal places', () => {
      expect(formatSpreadPercent(1.23456)).toBe('1.235');
      expect(formatSpreadPercent(0)).toBe('0.000');
      expect(formatSpreadPercent(-0.5)).toBe('-0.500');
    });
  });

  describe('getSpreadColorClass', () => {
    it('should return green classes for positive spread', () => {
      const result = getSpreadColorClass(1.5);
      expect(result.row).toContain('green');
      expect(result.text).toContain('green');
      expect(result.badge).toContain('green');
    });

    it('should return gray classes for zero spread', () => {
      const result = getSpreadColorClass(0);
      expect(result.row).toContain('gray');
      expect(result.text).toContain('gray');
      expect(result.badge).toContain('gray');
    });

    it('should return gray classes for negative spread', () => {
      const result = getSpreadColorClass(-0.5);
      expect(result.row).toContain('gray');
      expect(result.text).toContain('gray');
      expect(result.badge).toContain('gray');
    });

    it('should return green classes for very small positive spread', () => {
      const result = getSpreadColorClass(0.001);
      expect(result.row).toContain('green');
    });
  });

  describe('EXCHANGE_DISPLAY_NAMES', () => {
    it('should have display names for all exchanges', () => {
      expect(EXCHANGE_DISPLAY_NAMES.binance).toBe('Binance');
      expect(EXCHANGE_DISPLAY_NAMES.coinbase).toBe('Coinbase');
      expect(EXCHANGE_DISPLAY_NAMES.kraken).toBe('Kraken');
    });
  });
});

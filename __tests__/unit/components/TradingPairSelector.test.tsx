import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  TradingPairSelector,
  validateTradingPair,
  parseTradingPair,
} from '../../../src/components/config/TradingPairSelector';
import { TradingPair } from '../../../src/types';

/**
 * Unit tests for TradingPairSelector component
 * Requirements: 1.1, 1.2
 */
describe('TradingPairSelector', () => {
  // Default props for testing
  const defaultProps = {
    selectedPairs: [] as TradingPair[],
    onPairsChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateTradingPair', () => {
    it('should accept valid BASE/QUOTE format', () => {
      expect(validateTradingPair('ETH/USDT')).toBe(true);
      expect(validateTradingPair('BTC/USD')).toBe(true);
      expect(validateTradingPair('DOGE/BTC')).toBe(true);
    });

    it('should accept lowercase input (converts to uppercase)', () => {
      expect(validateTradingPair('eth/usdt')).toBe(true);
      expect(validateTradingPair('Btc/Usd')).toBe(true);
    });

    it('should accept alphanumeric symbols', () => {
      expect(validateTradingPair('USDC2/ETH')).toBe(true);
      expect(validateTradingPair('1INCH/USDT')).toBe(true);
    });

    it('should reject invalid formats', () => {
      expect(validateTradingPair('ETHUSDT')).toBe(false);
      expect(validateTradingPair('ETH-USDT')).toBe(false);
      expect(validateTradingPair('ETH_USDT')).toBe(false);
      expect(validateTradingPair('ETH:USDT')).toBe(false);
      expect(validateTradingPair('/USDT')).toBe(false);
      expect(validateTradingPair('ETH/')).toBe(false);
      expect(validateTradingPair('/')).toBe(false);
      expect(validateTradingPair('')).toBe(false);
    });

    it('should reject null and undefined', () => {
      expect(validateTradingPair(null as unknown as string)).toBe(false);
      expect(validateTradingPair(undefined as unknown as string)).toBe(false);
    });

    it('should handle whitespace', () => {
      expect(validateTradingPair('  ETH/USDT  ')).toBe(true);
      expect(validateTradingPair('ETH / USDT')).toBe(false);
    });
  });

  describe('parseTradingPair', () => {
    it('should parse valid trading pair string', () => {
      const result = parseTradingPair('ETH/USDT');
      expect(result).toEqual({
        base: 'ETH',
        quote: 'USDT',
        symbol: 'ETH/USDT',
      });
    });

    it('should convert to uppercase', () => {
      const result = parseTradingPair('eth/usdt');
      expect(result).toEqual({
        base: 'ETH',
        quote: 'USDT',
        symbol: 'ETH/USDT',
      });
    });

    it('should return null for invalid input', () => {
      expect(parseTradingPair('ETHUSDT')).toBeNull();
      expect(parseTradingPair('')).toBeNull();
      expect(parseTradingPair('invalid')).toBeNull();
    });
  });

  describe('Component Rendering', () => {
    it('should render the component with title', () => {
      render(<TradingPairSelector {...defaultProps} />);
      expect(screen.getByText('Trading Pairs')).toBeInTheDocument();
    });

    it('should render input field with placeholder', () => {
      render(<TradingPairSelector {...defaultProps} />);
      expect(screen.getByPlaceholderText('Enter pair (e.g., ETH/USDT)')).toBeInTheDocument();
    });

    it('should render Add button', () => {
      render(<TradingPairSelector {...defaultProps} />);
      expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
    });

    it('should render common pairs suggestions', () => {
      render(<TradingPairSelector {...defaultProps} />);
      expect(screen.getByText('Common pairs:')).toBeInTheDocument();
      expect(screen.getByText('ETH/USDT')).toBeInTheDocument();
      expect(screen.getByText('BTC/USD')).toBeInTheDocument();
      expect(screen.getByText('BTC/USDT')).toBeInTheDocument();
      expect(screen.getByText('ETH/BTC')).toBeInTheDocument();
    });

    it('should show "No pairs selected" when empty', () => {
      render(<TradingPairSelector {...defaultProps} />);
      expect(screen.getByText('No pairs selected')).toBeInTheDocument();
    });

    it('should display selected pairs', () => {
      const selectedPairs: TradingPair[] = [
        { base: 'ETH', quote: 'USDT', symbol: 'ETH/USDT' },
        { base: 'BTC', quote: 'USD', symbol: 'BTC/USD' },
      ];
      render(<TradingPairSelector {...defaultProps} selectedPairs={selectedPairs} />);
      
      // Check for selected pairs in the list (not the suggestions)
      const selectedSection = screen.getByText(/Selected pairs/);
      expect(selectedSection).toBeInTheDocument();
      expect(screen.getByText('Selected pairs (2):')).toBeInTheDocument();
    });
  });

  describe('Adding Pairs', () => {
    it('should add a valid pair when submitted', async () => {
      const onPairsChange = jest.fn();
      render(<TradingPairSelector {...defaultProps} onPairsChange={onPairsChange} />);

      const input = screen.getByPlaceholderText('Enter pair (e.g., ETH/USDT)');
      const addButton = screen.getByRole('button', { name: /add/i });

      await userEvent.type(input, 'SOL/USDT');
      await userEvent.click(addButton);

      expect(onPairsChange).toHaveBeenCalledWith([
        { base: 'SOL', quote: 'USDT', symbol: 'SOL/USDT' },
      ]);
    });

    it('should add pair when pressing Enter', async () => {
      const onPairsChange = jest.fn();
      render(<TradingPairSelector {...defaultProps} onPairsChange={onPairsChange} />);

      const input = screen.getByPlaceholderText('Enter pair (e.g., ETH/USDT)');
      await userEvent.type(input, 'SOL/USDT{enter}');

      expect(onPairsChange).toHaveBeenCalledWith([
        { base: 'SOL', quote: 'USDT', symbol: 'SOL/USDT' },
      ]);
    });

    it('should clear input after adding pair', async () => {
      const onPairsChange = jest.fn();
      render(<TradingPairSelector {...defaultProps} onPairsChange={onPairsChange} />);

      const input = screen.getByPlaceholderText('Enter pair (e.g., ETH/USDT)') as HTMLInputElement;
      await userEvent.type(input, 'SOL/USDT{enter}');

      expect(input.value).toBe('');
    });

    it('should convert input to uppercase', async () => {
      const onPairsChange = jest.fn();
      render(<TradingPairSelector {...defaultProps} onPairsChange={onPairsChange} />);

      const input = screen.getByPlaceholderText('Enter pair (e.g., ETH/USDT)');
      await userEvent.type(input, 'sol/usdt{enter}');

      expect(onPairsChange).toHaveBeenCalledWith([
        { base: 'SOL', quote: 'USDT', symbol: 'SOL/USDT' },
      ]);
    });

    it('should add pair when clicking suggestion', async () => {
      const onPairsChange = jest.fn();
      render(<TradingPairSelector {...defaultProps} onPairsChange={onPairsChange} />);

      // Find the ETH/USDT suggestion button (not the one in selected pairs)
      const suggestionButtons = screen.getAllByRole('button', { name: /ETH\/USDT/i });
      const suggestionButton = suggestionButtons.find(btn => btn.textContent === 'ETH/USDT');
      
      if (suggestionButton) {
        await userEvent.click(suggestionButton);
      }

      expect(onPairsChange).toHaveBeenCalledWith([
        { base: 'ETH', quote: 'USDT', symbol: 'ETH/USDT' },
      ]);
    });
  });

  describe('Validation Errors', () => {
    it('should show error for invalid format', async () => {
      render(<TradingPairSelector {...defaultProps} />);

      const input = screen.getByPlaceholderText('Enter pair (e.g., ETH/USDT)');
      await userEvent.type(input, 'INVALID{enter}');

      expect(screen.getByText('Invalid format. Use BASE/QUOTE (e.g., ETH/USDT)')).toBeInTheDocument();
    });

    it('should show error for duplicate pair', async () => {
      const selectedPairs: TradingPair[] = [
        { base: 'ETH', quote: 'USDT', symbol: 'ETH/USDT' },
      ];
      render(<TradingPairSelector {...defaultProps} selectedPairs={selectedPairs} />);

      const input = screen.getByPlaceholderText('Enter pair (e.g., ETH/USDT)');
      await userEvent.type(input, 'ETH/USDT{enter}');

      expect(screen.getByText('This pair is already added')).toBeInTheDocument();
    });

    it('should clear error when typing', async () => {
      render(<TradingPairSelector {...defaultProps} />);

      const input = screen.getByPlaceholderText('Enter pair (e.g., ETH/USDT)');
      await userEvent.type(input, 'INVALID{enter}');

      expect(screen.getByText('Invalid format. Use BASE/QUOTE (e.g., ETH/USDT)')).toBeInTheDocument();

      await userEvent.type(input, 'A');

      expect(screen.queryByText('Invalid format. Use BASE/QUOTE (e.g., ETH/USDT)')).not.toBeInTheDocument();
    });
  });

  describe('Removing Pairs', () => {
    it('should remove pair when clicking remove button', async () => {
      const selectedPairs: TradingPair[] = [
        { base: 'ETH', quote: 'USDT', symbol: 'ETH/USDT' },
        { base: 'BTC', quote: 'USD', symbol: 'BTC/USD' },
      ];
      const onPairsChange = jest.fn();
      render(
        <TradingPairSelector
          {...defaultProps}
          selectedPairs={selectedPairs}
          onPairsChange={onPairsChange}
        />
      );

      const removeButton = screen.getByRole('button', { name: /remove ETH\/USDT/i });
      await userEvent.click(removeButton);

      expect(onPairsChange).toHaveBeenCalledWith([
        { base: 'BTC', quote: 'USD', symbol: 'BTC/USD' },
      ]);
    });
  });

  describe('Max Pairs Limit', () => {
    it('should show error when max pairs reached', async () => {
      const selectedPairs: TradingPair[] = [
        { base: 'ETH', quote: 'USDT', symbol: 'ETH/USDT' },
      ];
      render(
        <TradingPairSelector
          {...defaultProps}
          selectedPairs={selectedPairs}
          maxPairs={1}
        />
      );

      const input = screen.getByPlaceholderText('Enter pair (e.g., ETH/USDT)');
      await userEvent.type(input, 'BTC/USD{enter}');

      expect(screen.getByText('Maximum 1 pair(s) allowed. Upgrade for more.')).toBeInTheDocument();
    });

    it('should call onUpgradeRequest when limit reached and showUpgradePrompt is true', async () => {
      const selectedPairs: TradingPair[] = [
        { base: 'ETH', quote: 'USDT', symbol: 'ETH/USDT' },
      ];
      const onUpgradeRequest = jest.fn();
      render(
        <TradingPairSelector
          {...defaultProps}
          selectedPairs={selectedPairs}
          maxPairs={1}
          showUpgradePrompt={true}
          onUpgradeRequest={onUpgradeRequest}
        />
      );

      const input = screen.getByPlaceholderText('Enter pair (e.g., ETH/USDT)');
      await userEvent.type(input, 'BTC/USD{enter}');

      expect(onUpgradeRequest).toHaveBeenCalled();
    });

    it('should show upgrade prompt banner when at limit', () => {
      const selectedPairs: TradingPair[] = [
        { base: 'ETH', quote: 'USDT', symbol: 'ETH/USDT' },
      ];
      const onUpgradeRequest = jest.fn();
      render(
        <TradingPairSelector
          {...defaultProps}
          selectedPairs={selectedPairs}
          maxPairs={1}
          showUpgradePrompt={true}
          onUpgradeRequest={onUpgradeRequest}
        />
      );

      expect(screen.getByText(/Free tier is limited to 1 trading pair/)).toBeInTheDocument();
      expect(screen.getByText(/Upgrade to add more/)).toBeInTheDocument();
    });

    it('should display pair count with max', () => {
      const selectedPairs: TradingPair[] = [
        { base: 'ETH', quote: 'USDT', symbol: 'ETH/USDT' },
      ];
      render(
        <TradingPairSelector
          {...defaultProps}
          selectedPairs={selectedPairs}
          maxPairs={3}
        />
      );

      expect(screen.getByText('Selected pairs (1/3):')).toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('should disable input when disabled prop is true', () => {
      render(<TradingPairSelector {...defaultProps} disabled={true} />);

      const input = screen.getByPlaceholderText('Enter pair (e.g., ETH/USDT)');
      expect(input).toBeDisabled();
    });

    it('should disable Add button when disabled', () => {
      render(<TradingPairSelector {...defaultProps} disabled={true} />);

      const addButton = screen.getByRole('button', { name: /add/i });
      expect(addButton).toBeDisabled();
    });

    it('should disable suggestion buttons when disabled', () => {
      render(<TradingPairSelector {...defaultProps} disabled={true} />);

      const suggestionButtons = screen.getAllByRole('button').filter(
        btn => btn.textContent?.includes('ETH/USDT') || 
               btn.textContent?.includes('BTC/USD') ||
               btn.textContent?.includes('BTC/USDT') ||
               btn.textContent?.includes('ETH/BTC')
      );

      suggestionButtons.forEach(btn => {
        expect(btn).toBeDisabled();
      });
    });
  });

  describe('Suggestion Button States', () => {
    it('should mark suggestion as selected when pair is in selectedPairs', () => {
      const selectedPairs: TradingPair[] = [
        { base: 'ETH', quote: 'USDT', symbol: 'ETH/USDT' },
      ];
      render(<TradingPairSelector {...defaultProps} selectedPairs={selectedPairs} />);

      // Find the suggestion button that shows checkmark
      const suggestionWithCheck = screen.getByRole('button', { name: /ETH\/USDT ✓/i });
      expect(suggestionWithCheck).toBeInTheDocument();
    });

    it('should disable suggestion button when pair is already selected', () => {
      const selectedPairs: TradingPair[] = [
        { base: 'ETH', quote: 'USDT', symbol: 'ETH/USDT' },
      ];
      render(<TradingPairSelector {...defaultProps} selectedPairs={selectedPairs} />);

      const suggestionButton = screen.getByRole('button', { name: /ETH\/USDT ✓/i });
      expect(suggestionButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-label on input', () => {
      render(<TradingPairSelector {...defaultProps} />);
      expect(screen.getByLabelText('Trading pair input')).toBeInTheDocument();
    });

    it('should have aria-invalid when there is an error', async () => {
      render(<TradingPairSelector {...defaultProps} />);

      const input = screen.getByPlaceholderText('Enter pair (e.g., ETH/USDT)');
      await userEvent.type(input, 'INVALID{enter}');

      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('should have role="alert" on error message', async () => {
      render(<TradingPairSelector {...defaultProps} />);

      const input = screen.getByPlaceholderText('Enter pair (e.g., ETH/USDT)');
      await userEvent.type(input, 'INVALID{enter}');

      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toBeInTheDocument();
    });

    it('should have aria-label on remove buttons', () => {
      const selectedPairs: TradingPair[] = [
        { base: 'ETH', quote: 'USDT', symbol: 'ETH/USDT' },
      ];
      render(<TradingPairSelector {...defaultProps} selectedPairs={selectedPairs} />);

      expect(screen.getByRole('button', { name: /remove ETH\/USDT/i })).toBeInTheDocument();
    });
  });
});

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ExchangeSelector,
  validateExchangeSelection,
  AVAILABLE_EXCHANGES,
  DEFAULT_EXCHANGES,
  MIN_EXCHANGES_REQUIRED,
} from '../../../src/components/config/ExchangeSelector';
import { Exchange } from '../../../src/types';

/**
 * Unit tests for ExchangeSelector component
 * Requirements: 1.3, 1.4
 * Property 2: Exchange Selection Validation
 */
describe('ExchangeSelector', () => {
  // Default props for testing
  const defaultProps = {
    selectedExchanges: [] as Exchange[],
    onExchangesChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateExchangeSelection', () => {
    it('should accept selection with 2 or more exchanges', () => {
      expect(validateExchangeSelection(['binance', 'coinbase'])).toEqual({
        isValid: true,
        errorMessage: null,
      });
      expect(validateExchangeSelection(['binance', 'coinbase', 'kraken'])).toEqual({
        isValid: true,
        errorMessage: null,
      });
    });

    it('should reject selection with less than 2 exchanges', () => {
      const result = validateExchangeSelection(['binance']);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain('at least 2 exchanges');
    });

    it('should reject empty selection', () => {
      const result = validateExchangeSelection([]);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain('at least 2 exchanges');
    });

    it('should reject invalid exchange values', () => {
      const result = validateExchangeSelection(['binance', 'invalid' as Exchange]);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain('Invalid exchange');
    });

    it('should reject non-array input', () => {
      const result = validateExchangeSelection(null as unknown as Exchange[]);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain('Invalid exchange selection');
    });

    it('should accept exactly 2 exchanges (minimum)', () => {
      const result = validateExchangeSelection(['binance', 'kraken']);
      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeNull();
    });
  });

  describe('Constants', () => {
    it('should have 3 available exchanges', () => {
      expect(AVAILABLE_EXCHANGES).toHaveLength(3);
      expect(AVAILABLE_EXCHANGES.map(e => e.id)).toEqual(['binance', 'coinbase', 'kraken']);
    });

    it('should have 2 default exchanges selected', () => {
      expect(DEFAULT_EXCHANGES).toHaveLength(2);
      expect(DEFAULT_EXCHANGES).toContain('binance');
      expect(DEFAULT_EXCHANGES).toContain('coinbase');
    });

    it('should require minimum 2 exchanges', () => {
      expect(MIN_EXCHANGES_REQUIRED).toBe(2);
    });
  });

  describe('Component Rendering', () => {
    it('should render the component with title', () => {
      render(<ExchangeSelector {...defaultProps} />);
      expect(screen.getByText('Exchanges')).toBeInTheDocument();
    });

    it('should render all available exchanges as checkboxes', () => {
      render(<ExchangeSelector {...defaultProps} />);
      
      expect(screen.getByText('Binance')).toBeInTheDocument();
      expect(screen.getByText('Coinbase')).toBeInTheDocument();
      expect(screen.getByText('Kraken')).toBeInTheDocument();
    });

    it('should render exchange descriptions', () => {
      render(<ExchangeSelector {...defaultProps} />);
      
      expect(screen.getByText("World's largest crypto exchange")).toBeInTheDocument();
      expect(screen.getByText('US-based regulated exchange')).toBeInTheDocument();
      expect(screen.getByText('Established European exchange')).toBeInTheDocument();
    });

    it('should render Select All and Clear All buttons', () => {
      render(<ExchangeSelector {...defaultProps} />);
      
      expect(screen.getByText('Select All')).toBeInTheDocument();
      expect(screen.getByText('Clear All')).toBeInTheDocument();
    });

    it('should show selection count', () => {
      render(<ExchangeSelector {...defaultProps} selectedExchanges={['binance', 'coinbase']} />);
      expect(screen.getByText('Selected: 2 of 3 exchanges')).toBeInTheDocument();
    });

    it('should show info message about minimum exchanges', () => {
      render(<ExchangeSelector {...defaultProps} />);
      expect(screen.getByText(/Select at least 2 exchanges/)).toBeInTheDocument();
    });
  });

  describe('Checkbox Selection', () => {
    it('should show checkboxes as checked for selected exchanges', () => {
      render(<ExchangeSelector {...defaultProps} selectedExchanges={['binance', 'coinbase']} />);
      
      const checkboxes = screen.getAllByRole('checkbox');
      const binanceCheckbox = checkboxes.find(cb => cb.getAttribute('aria-describedby') === 'binance-description');
      const coinbaseCheckbox = checkboxes.find(cb => cb.getAttribute('aria-describedby') === 'coinbase-description');
      const krakenCheckbox = checkboxes.find(cb => cb.getAttribute('aria-describedby') === 'kraken-description');
      
      expect(binanceCheckbox).toBeChecked();
      expect(coinbaseCheckbox).toBeChecked();
      expect(krakenCheckbox).not.toBeChecked();
    });

    it('should call onExchangesChange when toggling an exchange on', async () => {
      const onExchangesChange = jest.fn();
      render(
        <ExchangeSelector
          {...defaultProps}
          selectedExchanges={['binance']}
          onExchangesChange={onExchangesChange}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      const coinbaseCheckbox = checkboxes.find(cb => cb.getAttribute('aria-describedby') === 'coinbase-description');
      
      await userEvent.click(coinbaseCheckbox!);

      expect(onExchangesChange).toHaveBeenCalledWith(['binance', 'coinbase']);
    });

    it('should call onExchangesChange when toggling an exchange off', async () => {
      const onExchangesChange = jest.fn();
      render(
        <ExchangeSelector
          {...defaultProps}
          selectedExchanges={['binance', 'coinbase']}
          onExchangesChange={onExchangesChange}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      const binanceCheckbox = checkboxes.find(cb => cb.getAttribute('aria-describedby') === 'binance-description');
      
      await userEvent.click(binanceCheckbox!);

      expect(onExchangesChange).toHaveBeenCalledWith(['coinbase']);
    });
  });

  describe('Select All / Clear All', () => {
    it('should select all exchanges when clicking Select All', async () => {
      const onExchangesChange = jest.fn();
      render(
        <ExchangeSelector
          {...defaultProps}
          selectedExchanges={['binance']}
          onExchangesChange={onExchangesChange}
        />
      );

      await userEvent.click(screen.getByText('Select All'));

      expect(onExchangesChange).toHaveBeenCalledWith(['binance', 'coinbase', 'kraken']);
    });

    it('should clear all exchanges when clicking Clear All', async () => {
      const onExchangesChange = jest.fn();
      render(
        <ExchangeSelector
          {...defaultProps}
          selectedExchanges={['binance', 'coinbase']}
          onExchangesChange={onExchangesChange}
        />
      );

      await userEvent.click(screen.getByText('Clear All'));

      expect(onExchangesChange).toHaveBeenCalledWith([]);
    });

    it('should disable Select All when all exchanges are selected', () => {
      render(
        <ExchangeSelector
          {...defaultProps}
          selectedExchanges={['binance', 'coinbase', 'kraken']}
        />
      );

      const selectAllButton = screen.getByText('Select All');
      expect(selectAllButton).toHaveClass('disabled:text-gray-400');
    });

    it('should disable Clear All when no exchanges are selected', () => {
      render(<ExchangeSelector {...defaultProps} selectedExchanges={[]} />);

      const clearAllButton = screen.getByText('Clear All');
      expect(clearAllButton).toHaveClass('disabled:text-gray-400');
    });
  });

  describe('Validation Error Display', () => {
    it('should show error when less than 2 exchanges selected', () => {
      render(<ExchangeSelector {...defaultProps} selectedExchanges={['binance']} />);
      
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/Please select at least 2 exchanges/)).toBeInTheDocument();
    });

    it('should show error when no exchanges selected', () => {
      render(<ExchangeSelector {...defaultProps} selectedExchanges={[]} />);
      
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/Please select at least 2 exchanges/)).toBeInTheDocument();
    });

    it('should not show error when 2 or more exchanges selected', () => {
      render(<ExchangeSelector {...defaultProps} selectedExchanges={['binance', 'coinbase']} />);
      
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should not show error when all exchanges selected', () => {
      render(
        <ExchangeSelector
          {...defaultProps}
          selectedExchanges={['binance', 'coinbase', 'kraken']}
        />
      );
      
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('should disable all checkboxes when disabled prop is true', () => {
      render(<ExchangeSelector {...defaultProps} disabled={true} />);

      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach(checkbox => {
        expect(checkbox).toBeDisabled();
      });
    });

    it('should disable Select All button when disabled', () => {
      render(<ExchangeSelector {...defaultProps} disabled={true} />);

      const selectAllButton = screen.getByText('Select All');
      expect(selectAllButton).toHaveClass('disabled:cursor-not-allowed');
    });

    it('should disable Clear All button when disabled', () => {
      render(<ExchangeSelector {...defaultProps} disabled={true} />);

      const clearAllButton = screen.getByText('Clear All');
      expect(clearAllButton).toHaveClass('disabled:cursor-not-allowed');
    });

    it('should apply opacity to exchange cards when disabled', () => {
      render(<ExchangeSelector {...defaultProps} disabled={true} />);

      const labels = screen.getAllByText(/Binance|Coinbase|Kraken/).map(el => el.closest('label'));
      labels.forEach(label => {
        expect(label).toHaveClass('opacity-50');
      });
    });
  });

  describe('Visual States', () => {
    it('should highlight selected exchange cards', () => {
      render(<ExchangeSelector {...defaultProps} selectedExchanges={['binance']} />);

      const binanceLabel = screen.getByText('Binance').closest('label');
      expect(binanceLabel).toHaveClass('bg-blue-50');
      expect(binanceLabel).toHaveClass('border-blue-300');
    });

    it('should show checkmark icon for selected exchanges', () => {
      render(<ExchangeSelector {...defaultProps} selectedExchanges={['binance']} />);

      // The checkmark SVG should be present for selected exchanges
      const binanceLabel = screen.getByText('Binance').closest('label');
      const svg = binanceLabel?.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should not show checkmark icon for unselected exchanges', () => {
      render(<ExchangeSelector {...defaultProps} selectedExchanges={['binance']} />);

      const krakenLabel = screen.getByText('Kraken').closest('label');
      // Only the checkbox should be present, not the checkmark icon
      const svgs = krakenLabel?.querySelectorAll('svg');
      expect(svgs?.length).toBe(0);
    });
  });

  describe('Accessibility', () => {
    it('should have aria-describedby linking checkbox to description', () => {
      render(<ExchangeSelector {...defaultProps} />);

      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach(checkbox => {
        const describedBy = checkbox.getAttribute('aria-describedby');
        expect(describedBy).toBeTruthy();
        expect(screen.getByText(AVAILABLE_EXCHANGES.find(e => `${e.id}-description` === describedBy)?.description || '')).toBeInTheDocument();
      });
    });

    it('should have role="alert" on error message', () => {
      render(<ExchangeSelector {...defaultProps} selectedExchanges={[]} />);

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it('should have aria-live="polite" on error container', () => {
      render(<ExchangeSelector {...defaultProps} selectedExchanges={[]} />);

      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid toggling', async () => {
      const onExchangesChange = jest.fn();
      render(
        <ExchangeSelector
          {...defaultProps}
          selectedExchanges={[]}
          onExchangesChange={onExchangesChange}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      
      // Rapidly click multiple checkboxes
      await userEvent.click(checkboxes[0]);
      await userEvent.click(checkboxes[1]);
      await userEvent.click(checkboxes[2]);

      expect(onExchangesChange).toHaveBeenCalledTimes(3);
    });

    it('should maintain order when adding exchanges', async () => {
      const onExchangesChange = jest.fn();
      render(
        <ExchangeSelector
          {...defaultProps}
          selectedExchanges={['kraken']}
          onExchangesChange={onExchangesChange}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      const binanceCheckbox = checkboxes.find(cb => cb.getAttribute('aria-describedby') === 'binance-description');
      
      await userEvent.click(binanceCheckbox!);

      expect(onExchangesChange).toHaveBeenCalledWith(['kraken', 'binance']);
    });
  });
});

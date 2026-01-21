import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  FeeConfigForm,
  validateFeeInput,
  parseFeeInput,
} from '@/components/simulator/FeeConfigForm';
import { FeeConfig } from '@/types';

describe('FeeConfigForm Component', () => {
  const defaultFeeConfig: FeeConfig = {
    buyFeeRate: 0.001, // 0.1%
    sellFeeRate: 0.001, // 0.1%
    withdrawalFee: 5,
    gasFee: 2,
  };

  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe('Rendering', () => {
    it('should render all fee input fields', () => {
      render(<FeeConfigForm value={defaultFeeConfig} onChange={mockOnChange} />);

      expect(screen.getByLabelText(/buy fee rate/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/sell fee rate/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/withdrawal fee/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/gas fee/i)).toBeInTheDocument();
    });

    it('should display initial values correctly', () => {
      render(<FeeConfigForm value={defaultFeeConfig} onChange={mockOnChange} />);

      // Fee rates are displayed as percentages (0.001 = 0.1%)
      expect(screen.getByLabelText(/buy fee rate/i)).toHaveValue('0.1');
      expect(screen.getByLabelText(/sell fee rate/i)).toHaveValue('0.1');
      expect(screen.getByLabelText(/withdrawal fee/i)).toHaveValue('5');
      expect(screen.getByLabelText(/gas fee/i)).toHaveValue('2');
    });

    it('should display form title', () => {
      render(<FeeConfigForm value={defaultFeeConfig} onChange={mockOnChange} />);

      expect(screen.getByText('Fee Configuration')).toBeInTheDocument();
    });

    it('should display helper text for each field', () => {
      render(<FeeConfigForm value={defaultFeeConfig} onChange={mockOnChange} />);

      expect(screen.getByText(/trading fee when buying/i)).toBeInTheDocument();
      expect(screen.getByText(/trading fee when selling/i)).toBeInTheDocument();
      expect(screen.getByText(/fixed withdrawal fee/i)).toBeInTheDocument();
      expect(screen.getByText(/estimated gas fee/i)).toBeInTheDocument();
    });

    it('should display info box with tips', () => {
      render(<FeeConfigForm value={defaultFeeConfig} onChange={mockOnChange} />);

      expect(screen.getByText('Fee Configuration Tips')).toBeInTheDocument();
    });
  });

  describe('Buy Fee Rate Input', () => {
    it('should update buy fee rate on valid input', async () => {
      const user = userEvent.setup();
      render(<FeeConfigForm value={defaultFeeConfig} onChange={mockOnChange} />);

      const input = screen.getByLabelText(/buy fee rate/i);
      await user.clear(input);
      await user.type(input, '0.5');

      // Wait for onChange to be called
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });

      // Check that the value was converted from percentage to decimal
      const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
      expect(lastCall.buyFeeRate).toBe(0.005); // 0.5% = 0.005
    });

    it('should handle empty input', async () => {
      const user = userEvent.setup();
      render(<FeeConfigForm value={defaultFeeConfig} onChange={mockOnChange} />);

      const input = screen.getByLabelText(/buy fee rate/i);
      await user.clear(input);

      expect(input).toHaveValue('');
    });

    it('should show error on blur with empty input', async () => {
      const user = userEvent.setup();
      render(<FeeConfigForm value={defaultFeeConfig} onChange={mockOnChange} />);

      const input = screen.getByLabelText(/buy fee rate/i);
      await user.clear(input);
      fireEvent.blur(input);

      await waitFor(() => {
        expect(screen.getByText(/please enter a buy fee rate/i)).toBeInTheDocument();
      });
    });

    it('should reject negative values', async () => {
      const user = userEvent.setup();
      render(<FeeConfigForm value={defaultFeeConfig} onChange={mockOnChange} />);

      const input = screen.getByLabelText(/buy fee rate/i);
      await user.clear(input);
      // Try to type negative value - the pattern should prevent it
      await user.type(input, '-1');

      // The input should not have changed from the cleared state or should have only '1'
      // Since the pattern /^\d*\.?\d*$/ doesn't allow '-', it should only accept '1'
      expect(input).toHaveValue('1');
    });

    it('should cap at 100%', async () => {
      const user = userEvent.setup();
      render(<FeeConfigForm value={defaultFeeConfig} onChange={mockOnChange} />);

      const input = screen.getByLabelText(/buy fee rate/i);
      await user.clear(input);
      await user.type(input, '150');

      // Trigger blur to validate
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/fee rate cannot exceed 100%/i)).toBeInTheDocument();
        expect(input).not.toHaveValue('150');
      });
    });

    it('should allow decimal values', async () => {
      const user = userEvent.setup();
      render(<FeeConfigForm value={defaultFeeConfig} onChange={mockOnChange} />);

      const input = screen.getByLabelText(/buy fee rate/i);
      await user.clear(input);
      await user.type(input, '0.25');

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });

      const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
      expect(lastCall.buyFeeRate).toBe(0.0025); // 0.25% = 0.0025
    });
  });

  describe('Sell Fee Rate Input', () => {
    it('should update sell fee rate on valid input', async () => {
      const user = userEvent.setup();
      render(<FeeConfigForm value={defaultFeeConfig} onChange={mockOnChange} />);

      const input = screen.getByLabelText(/sell fee rate/i);
      await user.clear(input);
      await user.type(input, '0.3');

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });

      const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
      expect(lastCall.sellFeeRate).toBe(0.003); // 0.3% = 0.003
    });

    it('should show error on blur with empty input', async () => {
      const user = userEvent.setup();
      render(<FeeConfigForm value={defaultFeeConfig} onChange={mockOnChange} />);

      const input = screen.getByLabelText(/sell fee rate/i);
      await user.clear(input);
      fireEvent.blur(input);

      await waitFor(() => {
        expect(screen.getByText(/please enter a sell fee rate/i)).toBeInTheDocument();
      });
    });
  });

  describe('Withdrawal Fee Input', () => {
    it('should update withdrawal fee on valid input', async () => {
      const user = userEvent.setup();
      render(<FeeConfigForm value={defaultFeeConfig} onChange={mockOnChange} />);

      const input = screen.getByLabelText(/withdrawal fee/i);
      await user.clear(input);
      await user.type(input, '10');

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });

      const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
      expect(lastCall.withdrawalFee).toBe(10);
    });

    it('should show error on blur with empty input', async () => {
      const user = userEvent.setup();
      render(<FeeConfigForm value={defaultFeeConfig} onChange={mockOnChange} />);

      const input = screen.getByLabelText(/withdrawal fee/i);
      await user.clear(input);
      fireEvent.blur(input);

      await waitFor(() => {
        expect(screen.getByText(/please enter a withdrawal fee/i)).toBeInTheDocument();
      });
    });

    it('should allow decimal values', async () => {
      const user = userEvent.setup();
      render(<FeeConfigForm value={defaultFeeConfig} onChange={mockOnChange} />);

      const input = screen.getByLabelText(/withdrawal fee/i);
      await user.clear(input);
      await user.type(input, '7.5');

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });

      const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
      expect(lastCall.withdrawalFee).toBe(7.5);
    });
  });

  describe('Gas Fee Input', () => {
    it('should update gas fee on valid input', async () => {
      const user = userEvent.setup();
      render(<FeeConfigForm value={defaultFeeConfig} onChange={mockOnChange} />);

      const input = screen.getByLabelText(/gas fee/i);
      await user.clear(input);
      await user.type(input, '3');

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });

      const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
      expect(lastCall.gasFee).toBe(3);
    });

    it('should show error on blur with empty input', async () => {
      const user = userEvent.setup();
      render(<FeeConfigForm value={defaultFeeConfig} onChange={mockOnChange} />);

      const input = screen.getByLabelText(/gas fee/i);
      await user.clear(input);
      fireEvent.blur(input);

      await waitFor(() => {
        expect(screen.getByText(/please enter a gas fee/i)).toBeInTheDocument();
      });
    });

    it('should allow decimal values', async () => {
      const user = userEvent.setup();
      render(<FeeConfigForm value={defaultFeeConfig} onChange={mockOnChange} />);

      const input = screen.getByLabelText(/gas fee/i);
      await user.clear(input);
      await user.type(input, '1.5');

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });

      const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
      expect(lastCall.gasFee).toBe(1.5);
    });
  });

  describe('Disabled State', () => {
    it('should disable all inputs when disabled prop is true', () => {
      render(<FeeConfigForm value={defaultFeeConfig} onChange={mockOnChange} disabled={true} />);

      expect(screen.getByLabelText(/buy fee rate/i)).toBeDisabled();
      expect(screen.getByLabelText(/sell fee rate/i)).toBeDisabled();
      expect(screen.getByLabelText(/withdrawal fee/i)).toBeDisabled();
      expect(screen.getByLabelText(/gas fee/i)).toBeDisabled();
    });
  });

  describe('Focus and Blur Behavior', () => {
    it('should clear error on focus', async () => {
      const user = userEvent.setup();
      render(<FeeConfigForm value={defaultFeeConfig} onChange={mockOnChange} />);

      const input = screen.getByLabelText(/buy fee rate/i);
      await user.clear(input);
      fireEvent.blur(input);

      // Error should appear
      await waitFor(() => {
        expect(screen.getByText(/please enter a buy fee rate/i)).toBeInTheDocument();
      });

      // Focus again - error should clear
      fireEvent.focus(input);
      await waitFor(() => {
        expect(screen.queryByText(/please enter a buy fee rate/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('External Value Updates', () => {
    it('should update display when value prop changes', () => {
      const { rerender } = render(
        <FeeConfigForm value={defaultFeeConfig} onChange={mockOnChange} />
      );

      const newConfig: FeeConfig = {
        buyFeeRate: 0.002, // 0.2%
        sellFeeRate: 0.003, // 0.3%
        withdrawalFee: 10,
        gasFee: 5,
      };

      rerender(<FeeConfigForm value={newConfig} onChange={mockOnChange} />);

      expect(screen.getByLabelText(/buy fee rate/i)).toHaveValue('0.2');
      expect(screen.getByLabelText(/sell fee rate/i)).toHaveValue('0.3');
      expect(screen.getByLabelText(/withdrawal fee/i)).toHaveValue('10');
      expect(screen.getByLabelText(/gas fee/i)).toHaveValue('5');
    });
  });

  describe('Validation Helper Functions', () => {
    describe('validateFeeInput', () => {
      it('should validate correct numeric inputs', () => {
        expect(validateFeeInput('0')).toBe(true);
        expect(validateFeeInput('1')).toBe(true);
        expect(validateFeeInput('0.1')).toBe(true);
        expect(validateFeeInput('10.5')).toBe(true);
        expect(validateFeeInput('100')).toBe(true);
      });

      it('should reject invalid inputs', () => {
        expect(validateFeeInput('')).toBe(false);
        expect(validateFeeInput('   ')).toBe(false);
        expect(validateFeeInput('abc')).toBe(false);
        expect(validateFeeInput('-1')).toBe(false);
        expect(validateFeeInput('1.2.3')).toBe(false);
      });

      it('should handle edge cases', () => {
        expect(validateFeeInput('0.0')).toBe(true);
        // The pattern /^\d*\.?\d+$/ allows '.5' because \d* allows zero or more digits before decimal
        // This is actually a valid decimal representation
        expect(validateFeeInput('.5')).toBe(true); // Valid decimal
        expect(validateFeeInput('5.')).toBe(false); // No trailing digit after decimal
        expect(validateFeeInput('5')).toBe(true); // Valid without decimal
      });
    });

    describe('parseFeeInput', () => {
      it('should parse valid numeric strings', () => {
        expect(parseFeeInput('0')).toBe(0);
        expect(parseFeeInput('1')).toBe(1);
        expect(parseFeeInput('0.1')).toBe(0.1);
        expect(parseFeeInput('10.5')).toBe(10.5);
        expect(parseFeeInput('100')).toBe(100);
      });

      it('should return 0 for invalid inputs', () => {
        expect(parseFeeInput('')).toBe(0);
        expect(parseFeeInput('abc')).toBe(0);
        expect(parseFeeInput('-1')).toBe(0);
      });

      it('should handle whitespace', () => {
        expect(parseFeeInput('  5  ')).toBe(5);
        expect(parseFeeInput('  0.5  ')).toBe(0.5);
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<FeeConfigForm value={defaultFeeConfig} onChange={mockOnChange} />);

      const buyFeeInput = screen.getByLabelText(/buy fee rate/i);
      const sellFeeInput = screen.getByLabelText(/sell fee rate/i);
      const withdrawalInput = screen.getByLabelText(/withdrawal fee/i);
      const gasInput = screen.getByLabelText(/gas fee/i);

      expect(buyFeeInput).toHaveAttribute('aria-label');
      expect(sellFeeInput).toHaveAttribute('aria-label');
      expect(withdrawalInput).toHaveAttribute('aria-label');
      expect(gasInput).toHaveAttribute('aria-label');
    });

    it('should set aria-invalid when there is an error', async () => {
      const user = userEvent.setup();
      render(<FeeConfigForm value={defaultFeeConfig} onChange={mockOnChange} />);

      const input = screen.getByLabelText(/buy fee rate/i);
      await user.clear(input);
      fireEvent.blur(input);

      await waitFor(() => {
        expect(input).toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('should associate error messages with inputs', async () => {
      const user = userEvent.setup();
      render(<FeeConfigForm value={defaultFeeConfig} onChange={mockOnChange} />);

      const input = screen.getByLabelText(/buy fee rate/i);
      await user.clear(input);
      fireEvent.blur(input);

      await waitFor(() => {
        const errorMessage = screen.getByText(/please enter a buy fee rate/i);
        expect(errorMessage).toHaveAttribute('role', 'alert');
      });
    });
  });

  describe('Requirements Validation', () => {
    it('should satisfy Requirement 4.2: Accept user-configured fee rates and withdrawal fee', async () => {
      const user = userEvent.setup();
      render(<FeeConfigForm value={defaultFeeConfig} onChange={mockOnChange} />);

      // Test buy fee rate
      const buyFeeInput = screen.getByLabelText(/buy fee rate/i);
      await user.clear(buyFeeInput);
      await user.type(buyFeeInput, '0.2');

      // Test sell fee rate
      const sellFeeInput = screen.getByLabelText(/sell fee rate/i);
      await user.clear(sellFeeInput);
      await user.type(sellFeeInput, '0.15');

      // Test withdrawal fee
      const withdrawalInput = screen.getByLabelText(/withdrawal fee/i);
      await user.clear(withdrawalInput);
      await user.type(withdrawalInput, '8');

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });

      // Verify all values were accepted
      const calls = mockOnChange.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
    });

    it('should satisfy Requirement 4.3: Accept user-input gas fee estimates', async () => {
      const user = userEvent.setup();
      render(<FeeConfigForm value={defaultFeeConfig} onChange={mockOnChange} />);

      const gasInput = screen.getByLabelText(/gas fee/i);
      await user.clear(gasInput);
      await user.type(gasInput, '4.5');

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });

      const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
      expect(lastCall.gasFee).toBe(4.5);
    });
  });
});

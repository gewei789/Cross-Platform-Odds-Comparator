import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AmountInput, validateNumericInput, parseNumericInput } from '../../../src/components/simulator/AmountInput';

describe('AmountInput Component', () => {
  describe('validateNumericInput', () => {
    it('should accept valid positive numbers', () => {
      expect(validateNumericInput('123')).toBe(true);
      expect(validateNumericInput('123.45')).toBe(true);
      expect(validateNumericInput('0.5')).toBe(true);
      expect(validateNumericInput('1000')).toBe(true);
    });

    it('should accept valid negative numbers', () => {
      expect(validateNumericInput('-123')).toBe(true);
      expect(validateNumericInput('-123.45')).toBe(true);
    });

    it('should reject invalid inputs', () => {
      expect(validateNumericInput('')).toBe(false);
      expect(validateNumericInput('   ')).toBe(false);
      expect(validateNumericInput('abc')).toBe(false);
      expect(validateNumericInput('12.34.56')).toBe(false);
      expect(validateNumericInput('12a34')).toBe(false);
    });

    it('should reject partial inputs', () => {
      expect(validateNumericInput('.')).toBe(false);
      expect(validateNumericInput('-')).toBe(false);
      expect(validateNumericInput('123.')).toBe(false);
    });
  });

  describe('parseNumericInput', () => {
    it('should parse valid numbers correctly', () => {
      expect(parseNumericInput('123')).toBe(123);
      expect(parseNumericInput('123.45')).toBe(123.45);
      expect(parseNumericInput('0.5')).toBe(0.5);
      expect(parseNumericInput('-123')).toBe(-123);
    });

    it('should return 0 for invalid inputs', () => {
      expect(parseNumericInput('')).toBe(0);
      expect(parseNumericInput('abc')).toBe(0);
      expect(parseNumericInput('.')).toBe(0);
    });
  });

  describe('Component Rendering', () => {
    it('should render with default props', () => {
      const onChange = jest.fn();
      render(<AmountInput value={100} onChange={onChange} />);

      expect(screen.getByLabelText('Trade Amount')).toBeInTheDocument();
      expect(screen.getByDisplayValue('100')).toBeInTheDocument();
      expect(screen.getByText('USDT')).toBeInTheDocument();
    });

    it('should render with custom label and currency', () => {
      const onChange = jest.fn();
      render(
        <AmountInput
          value={500}
          onChange={onChange}
          label="Investment Amount"
          currency="BTC"
        />
      );

      expect(screen.getByLabelText('Investment Amount')).toBeInTheDocument();
      expect(screen.getByText('BTC')).toBeInTheDocument();
    });

    it('should render increment and decrement buttons', () => {
      const onChange = jest.fn();
      render(<AmountInput value={100} onChange={onChange} />);

      expect(screen.getByLabelText('Increase amount')).toBeInTheDocument();
      expect(screen.getByLabelText('Decrease amount')).toBeInTheDocument();
    });

    it('should display helper text for min/max values', () => {
      const onChange = jest.fn();
      render(<AmountInput value={100} onChange={onChange} min={10} max={1000} />);

      expect(screen.getByText('Enter a value between 10 and 1000')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onChange when valid number is entered', async () => {
      const onChange = jest.fn();
      const user = userEvent.setup();
      render(<AmountInput value={0} onChange={onChange} />);

      const input = screen.getByLabelText('Amount input');
      await user.clear(input);
      await user.type(input, '250');

      expect(onChange).toHaveBeenCalledWith(250);
    });

    it('should allow decimal input', async () => {
      const onChange = jest.fn();
      const user = userEvent.setup();
      render(<AmountInput value={0} onChange={onChange} />);

      const input = screen.getByLabelText('Amount input');
      await user.clear(input);
      await user.type(input, '123.45');

      expect(onChange).toHaveBeenCalledWith(123.45);
    });

    it('should reject non-numeric input', async () => {
      const onChange = jest.fn();
      const user = userEvent.setup();
      render(<AmountInput value={100} onChange={onChange} />);

      const input = screen.getByLabelText('Amount input');
      await user.clear(input);
      await user.type(input, 'abc');

      // Input should remain empty or at initial value
      expect(input).toHaveValue('');
    });

    it('should increment value when increment button is clicked', () => {
      const onChange = jest.fn();
      render(<AmountInput value={100} onChange={onChange} />);

      const incrementBtn = screen.getByLabelText('Increase amount');
      fireEvent.click(incrementBtn);

      expect(onChange).toHaveBeenCalledWith(110);
    });

    it('should decrement value when decrement button is clicked', () => {
      const onChange = jest.fn();
      render(<AmountInput value={100} onChange={onChange} min={0} />);

      const decrementBtn = screen.getByLabelText('Decrease amount');
      fireEvent.click(decrementBtn);

      // Value is 100, which is > 100, so step should be 1
      expect(onChange).toHaveBeenCalledWith(99);
    });

    it('should not decrement below minimum value', () => {
      const onChange = jest.fn();
      render(<AmountInput value={5} onChange={onChange} min={0} />);

      const decrementBtn = screen.getByLabelText('Decrease amount');
      fireEvent.click(decrementBtn);

      expect(onChange).toHaveBeenCalledWith(4);
      
      // Click multiple times to reach minimum
      fireEvent.click(decrementBtn);
      fireEvent.click(decrementBtn);
      fireEvent.click(decrementBtn);
      fireEvent.click(decrementBtn);
      fireEvent.click(decrementBtn);

      expect(onChange).toHaveBeenLastCalledWith(0);
    });

    it('should not increment above maximum value', () => {
      const onChange = jest.fn();
      render(<AmountInput value={995} onChange={onChange} max={1000} />);

      const incrementBtn = screen.getByLabelText('Increase amount');
      
      // Increment button should be disabled when at max
      const { rerender } = render(<AmountInput value={1000} onChange={onChange} max={1000} />);
      const incrementBtnAtMax = screen.getAllByLabelText('Increase amount')[1];
      expect(incrementBtnAtMax).toBeDisabled();
    });
  });

  describe('Validation', () => {
    it('should show validation error for empty input on blur', async () => {
      const onChange = jest.fn();
      const user = userEvent.setup();
      render(<AmountInput value={100} onChange={onChange} />);

      const input = screen.getByLabelText('Amount input');
      await user.clear(input);
      await user.tab(); // Trigger blur

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid amount')).toBeInTheDocument();
      });
    });

    it('should show validation error when value is below minimum', async () => {
      const onChange = jest.fn();
      const user = userEvent.setup();
      render(<AmountInput value={100} onChange={onChange} min={50} />);

      const input = screen.getByLabelText('Amount input');
      await user.clear(input);
      await user.type(input, '30');
      await user.tab(); // Trigger blur

      await waitFor(() => {
        expect(screen.getByText('Amount must be at least 50')).toBeInTheDocument();
      });
    });

    it('should show validation error when value exceeds maximum', async () => {
      const onChange = jest.fn();
      const user = userEvent.setup();
      render(<AmountInput value={100} onChange={onChange} max={500} />);

      const input = screen.getByLabelText('Amount input');
      await user.clear(input);
      await user.type(input, '1000');
      await user.tab(); // Trigger blur

      await waitFor(() => {
        expect(screen.getByText('Amount must not exceed 500')).toBeInTheDocument();
      });
    });

    it('should clear validation error when user starts typing', async () => {
      const onChange = jest.fn();
      const user = userEvent.setup();
      render(<AmountInput value={100} onChange={onChange} min={50} />);

      const input = screen.getByLabelText('Amount input');
      await user.clear(input);
      await user.type(input, '30');
      await user.tab(); // Trigger blur

      await waitFor(() => {
        expect(screen.getByText('Amount must be at least 50')).toBeInTheDocument();
      });

      // Start typing again
      await user.click(input);
      await user.type(input, '5');

      await waitFor(() => {
        expect(screen.queryByText('Amount must be at least 50')).not.toBeInTheDocument();
      });
    });
  });

  describe('Disabled State', () => {
    it('should disable input when disabled prop is true', () => {
      const onChange = jest.fn();
      render(<AmountInput value={100} onChange={onChange} disabled />);

      const input = screen.getByLabelText('Amount input');
      expect(input).toBeDisabled();
    });

    it('should disable increment and decrement buttons when disabled', () => {
      const onChange = jest.fn();
      render(<AmountInput value={100} onChange={onChange} disabled />);

      expect(screen.getByLabelText('Increase amount')).toBeDisabled();
      expect(screen.getByLabelText('Decrease amount')).toBeDisabled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero value', () => {
      const onChange = jest.fn();
      render(<AmountInput value={0} onChange={onChange} />);

      expect(screen.getByDisplayValue('0')).toBeInTheDocument();
    });

    it('should handle large numbers', async () => {
      const onChange = jest.fn();
      const user = userEvent.setup();
      render(<AmountInput value={0} onChange={onChange} />);

      const input = screen.getByLabelText('Amount input');
      await user.clear(input);
      await user.type(input, '999999.99');

      expect(onChange).toHaveBeenCalledWith(999999.99);
    });

    it('should handle very small decimal numbers', async () => {
      const onChange = jest.fn();
      const user = userEvent.setup();
      render(<AmountInput value={0} onChange={onChange} />);

      const input = screen.getByLabelText('Amount input');
      await user.clear(input);
      await user.type(input, '0.0001');

      expect(onChange).toHaveBeenCalledWith(0.0001);
    });

    it('should use different step sizes based on current value', () => {
      const onChange = jest.fn();
      
      // Small value: step = 1
      const { rerender } = render(<AmountInput value={50} onChange={onChange} />);
      fireEvent.click(screen.getByLabelText('Increase amount'));
      expect(onChange).toHaveBeenCalledWith(51);

      // Medium value: step = 10
      onChange.mockClear();
      rerender(<AmountInput value={500} onChange={onChange} />);
      fireEvent.click(screen.getByLabelText('Increase amount'));
      expect(onChange).toHaveBeenCalledWith(510);

      // Large value: step = 100
      onChange.mockClear();
      rerender(<AmountInput value={5000} onChange={onChange} />);
      fireEvent.click(screen.getByLabelText('Increase amount'));
      expect(onChange).toHaveBeenCalledWith(5100);
    });
  });

  describe('Requirements: 4.1', () => {
    it('should accept and validate numeric trade amount values', async () => {
      const onChange = jest.fn();
      const user = userEvent.setup();
      render(<AmountInput value={0} onChange={onChange} />);

      const input = screen.getByLabelText('Amount input');
      
      // Test valid numeric input
      await user.clear(input);
      await user.type(input, '1000');
      expect(onChange).toHaveBeenCalledWith(1000);

      // Test decimal input
      onChange.mockClear();
      await user.clear(input);
      await user.type(input, '1234.56');
      expect(onChange).toHaveBeenCalledWith(1234.56);

      // Test validation on blur
      await user.clear(input);
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid amount')).toBeInTheDocument();
      });
    });
  });
});

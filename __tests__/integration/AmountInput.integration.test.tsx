import React, { useState } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AmountInput } from '../../src/components/simulator/AmountInput';

/**
 * Integration tests for AmountInput component
 * Tests the component in realistic usage scenarios
 */

describe('AmountInput Integration Tests', () => {
  /**
   * Mock Profit Simulator Form
   * Simulates how AmountInput would be used in the actual Simulator page
   */
  function ProfitSimulatorForm() {
    const [tradeAmount, setTradeAmount] = useState(1000);
    const [buyFeeRate, setBuyFeeRate] = useState(0.1);
    const [sellFeeRate, setSellFeeRate] = useState(0.1);
    const [withdrawalFee, setWithdrawalFee] = useState(5);
    const [gasFee, setGasFee] = useState(10);

    // Calculate profit (simplified)
    const calculateProfit = () => {
      const buyAmount = tradeAmount * (1 + buyFeeRate / 100);
      const sellAmount = tradeAmount * 1.02; // Assume 2% spread
      const netProfit = sellAmount * (1 - sellFeeRate / 100) - buyAmount - withdrawalFee - gasFee;
      return netProfit;
    };

    const profit = calculateProfit();

    return (
      <div>
        <h2>Profit Simulator</h2>
        
        <AmountInput
          value={tradeAmount}
          onChange={setTradeAmount}
          label="Trade Amount"
          currency="USDT"
          min={10}
          max={100000}
        />

        <AmountInput
          value={buyFeeRate}
          onChange={setBuyFeeRate}
          label="Buy Fee Rate"
          currency="%"
          min={0}
          max={5}
        />

        <AmountInput
          value={sellFeeRate}
          onChange={setSellFeeRate}
          label="Sell Fee Rate"
          currency="%"
          min={0}
          max={5}
        />

        <AmountInput
          value={withdrawalFee}
          onChange={setWithdrawalFee}
          label="Withdrawal Fee"
          currency="USDT"
          min={0}
        />

        <AmountInput
          value={gasFee}
          onChange={setGasFee}
          label="Gas Fee"
          currency="USDT"
          min={0}
        />

        <div data-testid="profit-result">
          Net Profit: {profit.toFixed(2)} USDT
        </div>
      </div>
    );
  }

  describe('Profit Simulator Form Integration', () => {
    it('should render all amount inputs in a form', () => {
      render(<ProfitSimulatorForm />);

      expect(screen.getByLabelText('Trade Amount')).toBeInTheDocument();
      expect(screen.getByLabelText('Buy Fee Rate')).toBeInTheDocument();
      expect(screen.getByLabelText('Sell Fee Rate')).toBeInTheDocument();
      expect(screen.getByLabelText('Withdrawal Fee')).toBeInTheDocument();
      expect(screen.getByLabelText('Gas Fee')).toBeInTheDocument();
    });

    it('should update profit calculation when trade amount changes', async () => {
      const user = userEvent.setup();
      render(<ProfitSimulatorForm />);

      const tradeAmountInput = screen.getByLabelText('Trade Amount');
      const profitResult = screen.getByTestId('profit-result');

      // Get initial profit
      const initialProfit = profitResult.textContent;

      // Change trade amount
      await user.clear(tradeAmountInput);
      await user.type(tradeAmountInput, '2000');

      // Profit should update
      await waitFor(() => {
        expect(profitResult.textContent).not.toBe(initialProfit);
      });
    });

    it('should update profit calculation when fees change', async () => {
      const user = userEvent.setup();
      render(<ProfitSimulatorForm />);

      const buyFeeInput = screen.getByLabelText('Buy Fee Rate');
      const profitResult = screen.getByTestId('profit-result');

      // Get initial profit
      const initialProfit = profitResult.textContent;

      // Change buy fee
      await user.clear(buyFeeInput);
      await user.type(buyFeeInput, '0.5');

      // Profit should update
      await waitFor(() => {
        expect(profitResult.textContent).not.toBe(initialProfit);
      });
    });

    it('should handle multiple inputs being changed in sequence', async () => {
      const user = userEvent.setup();
      render(<ProfitSimulatorForm />);

      const tradeAmountInput = screen.getByLabelText('Trade Amount');
      const withdrawalFeeInput = screen.getByLabelText('Withdrawal Fee');
      const gasFeeInput = screen.getByLabelText('Gas Fee');

      // Change multiple inputs
      await user.clear(tradeAmountInput);
      await user.type(tradeAmountInput, '5000');

      await user.clear(withdrawalFeeInput);
      await user.type(withdrawalFeeInput, '10');

      await user.clear(gasFeeInput);
      await user.type(gasFeeInput, '20');

      // All inputs should have updated values
      expect(tradeAmountInput).toHaveValue('5000');
      expect(withdrawalFeeInput).toHaveValue('10');
      expect(gasFeeInput).toHaveValue('20');
    });

    it('should respect validation constraints across all inputs', async () => {
      const user = userEvent.setup();
      render(<ProfitSimulatorForm />);

      const tradeAmountInput = screen.getByLabelText('Trade Amount');
      const buyFeeInput = screen.getByLabelText('Buy Fee Rate');

      // Try to set trade amount below minimum
      await user.clear(tradeAmountInput);
      await user.type(tradeAmountInput, '5');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('Amount must be at least 10')).toBeInTheDocument();
      });

      // Try to set fee rate above maximum
      await user.clear(buyFeeInput);
      await user.type(buyFeeInput, '10');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('Amount must not exceed 5')).toBeInTheDocument();
      });
    });
  });

  describe('Multiple AmountInput Instances', () => {
    function MultipleInputsForm() {
      const [amount1, setAmount1] = useState(100);
      const [amount2, setAmount2] = useState(200);
      const [amount3, setAmount3] = useState(300);

      return (
        <div>
          <AmountInput
            value={amount1}
            onChange={setAmount1}
            label="Amount 1"
          />
          <AmountInput
            value={amount2}
            onChange={setAmount2}
            label="Amount 2"
          />
          <AmountInput
            value={amount3}
            onChange={setAmount3}
            label="Amount 3"
          />
          <div data-testid="total">
            Total: {amount1 + amount2 + amount3}
          </div>
        </div>
      );
    }

    it('should maintain independent state for multiple instances', async () => {
      const user = userEvent.setup();
      render(<MultipleInputsForm />);

      const input1 = screen.getByLabelText('Amount 1');
      const input2 = screen.getByLabelText('Amount 2');
      const input3 = screen.getByLabelText('Amount 3');

      expect(input1).toHaveValue('100');
      expect(input2).toHaveValue('200');
      expect(input3).toHaveValue('300');

      // Change first input
      await user.clear(input1);
      await user.type(input1, '500');

      // Other inputs should remain unchanged
      expect(input1).toHaveValue('500');
      expect(input2).toHaveValue('200');
      expect(input3).toHaveValue('300');
    });

    it('should update total when any input changes', async () => {
      const user = userEvent.setup();
      render(<MultipleInputsForm />);

      const input1 = screen.getByLabelText('Amount 1');
      const total = screen.getByTestId('total');

      expect(total).toHaveTextContent('Total: 600');

      await user.clear(input1);
      await user.type(input1, '1000');

      await waitFor(() => {
        expect(total).toHaveTextContent('Total: 1500');
      });
    });
  });

  describe('Accessibility Integration', () => {
    it('should support keyboard navigation between multiple inputs', async () => {
      const user = userEvent.setup();
      render(<ProfitSimulatorForm />);

      const tradeAmountInput = screen.getByLabelText('Trade Amount');
      const buyFeeInput = screen.getByLabelText('Buy Fee Rate');

      // Focus first input
      tradeAmountInput.focus();
      expect(tradeAmountInput).toHaveFocus();

      // Tab to next input
      await user.tab();
      
      // Should skip increment button and focus on next input
      await user.tab();
      await user.tab();
      
      expect(buyFeeInput).toHaveFocus();
    });

    it('should announce validation errors to screen readers', async () => {
      const user = userEvent.setup();
      render(<ProfitSimulatorForm />);

      const tradeAmountInput = screen.getByLabelText('Trade Amount');

      // Trigger validation error
      await user.clear(tradeAmountInput);
      await user.tab();

      await waitFor(() => {
        const errorMessage = screen.getByRole('alert');
        expect(errorMessage).toBeInTheDocument();
        expect(tradeAmountInput).toHaveAttribute('aria-invalid', 'true');
      });
    });
  });

  describe('Real-world Usage Scenarios', () => {
    it('should handle rapid input changes without losing data', async () => {
      const user = userEvent.setup();
      render(<ProfitSimulatorForm />);

      const tradeAmountInput = screen.getByLabelText('Trade Amount');

      // Rapidly change values
      await user.clear(tradeAmountInput);
      await user.type(tradeAmountInput, '1');
      await user.type(tradeAmountInput, '2');
      await user.type(tradeAmountInput, '3');
      await user.type(tradeAmountInput, '4');
      await user.type(tradeAmountInput, '5');

      expect(tradeAmountInput).toHaveValue('12345');
    });

    it('should handle decimal inputs for precise calculations', async () => {
      const user = userEvent.setup();
      render(<ProfitSimulatorForm />);

      const buyFeeInput = screen.getByLabelText('Buy Fee Rate');

      await user.clear(buyFeeInput);
      await user.type(buyFeeInput, '0.15');

      expect(buyFeeInput).toHaveValue('0.15');
    });

    it('should persist values when switching between inputs', async () => {
      const user = userEvent.setup();
      render(<ProfitSimulatorForm />);

      const tradeAmountInput = screen.getByLabelText('Trade Amount');
      const buyFeeInput = screen.getByLabelText('Buy Fee Rate');

      // Set first value
      await user.clear(tradeAmountInput);
      await user.type(tradeAmountInput, '5000');

      // Switch to second input
      await user.click(buyFeeInput);
      await user.clear(buyFeeInput);
      await user.type(buyFeeInput, '0.2');

      // First value should still be there
      expect(tradeAmountInput).toHaveValue('5000');
      expect(buyFeeInput).toHaveValue('0.2');
    });
  });
});

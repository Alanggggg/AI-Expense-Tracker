import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExpenseProvider, useExpenses } from '../ExpenseContext';
import { Transaction, TransactionType } from '../../types';

// Helper component to consume context
const TestComponent = () => {
  const { transactions, addTransaction, summary, deleteTransaction } = useExpenses();
  
  return (
    <div>
      <div data-testid="balance">{summary.balance}</div>
      <div data-testid="count">{transactions.length}</div>
      <button 
        onClick={() => addTransaction({
          id: '1',
          amount: 100,
          category: 'Food',
          note: 'Test',
          date: new Date().toISOString(),
          type: TransactionType.Expense
        })}
      >
        Add Expense
      </button>
      <button onClick={() => deleteTransaction('1')}>Delete</button>
    </div>
  );
};

describe('ExpenseContext', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('should initialize with empty transactions', () => {
    render(
      <ExpenseProvider>
        <TestComponent />
      </ExpenseProvider>
    );
    expect(screen.getByTestId('count')).toHaveTextContent('0');
    expect(screen.getByTestId('balance')).toHaveTextContent('0');
  });

  it('should update balance when adding an expense', async () => {
    render(
      <ExpenseProvider>
        <TestComponent />
      </ExpenseProvider>
    );

    const btn = screen.getByText('Add Expense');
    
    await act(async () => {
      btn.click();
    });

    expect(screen.getByTestId('count')).toHaveTextContent('1');
    expect(screen.getByTestId('balance')).toHaveTextContent('-100');
  });

  it('should restore balance when deleting a transaction', async () => {
    render(
      <ExpenseProvider>
        <TestComponent />
      </ExpenseProvider>
    );

    const addBtn = screen.getByText('Add Expense');
    const delBtn = screen.getByText('Delete');
    
    await act(async () => {
      addBtn.click();
    });
    
    expect(screen.getByTestId('balance')).toHaveTextContent('-100');

    await act(async () => {
      delBtn.click();
    });

    expect(screen.getByTestId('count')).toHaveTextContent('0');
    expect(screen.getByTestId('balance')).toHaveTextContent('0');
  });
});

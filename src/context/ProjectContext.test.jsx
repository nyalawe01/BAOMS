import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectProvider, useProject } from './ProjectContext';

vi.mock('../firebase/firebase', () => ({
  auth: {},
  db: {},
  isFirebaseConfigured: false,
}));

vi.mock('./AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'u1', uid: 'u1', role: 'HR Officer', personalDetails: { name: 'Test HR' }, email: 'hr@test.com' },
    isFirebaseConfigured: false,
  }),
}));

function OnboardingProbe() {
  const { users, addUser } = useProject();
  const pm = users.find(u => u.role === 'Project Manager');
  return (
    <div>
      <button onClick={() => addUser({ firstName: 'Paul', surname: 'Manager', email: 'pm@test.com', role: 'Project Manager' })}>
        onboard
      </button>
      <div data-testid="pm-permissions">{pm ? pm.permissions.join(',') : 'none'}</div>
    </div>
  );
}

function ExpenseApprovalProbe() {
  const { projects, budgets, expenses, addProject, addBudgetLedgerItem, addExpense, updateExpenseStatus } = useProject();
  const project = projects[0];
  const budget = budgets.find(b => b.projectId === project?.id);
  const hasLineItem = budget?.items?.length > 0;
  const expense = expenses[0];
  const spentTotal = budget ? budget.items.reduce((sum, i) => sum + i.spent, 0) : 0;

  return (
    <div>
      <button onClick={() => addProject({ name: 'Test Project', description: '', budget: 1000, startDate: '2026-01-01', endDate: '2026-12-31' })}>
        create-project
      </button>
      <button
        disabled={!project}
        onClick={() => addBudgetLedgerItem(project.id, 'Office supplies line', 'Operations', 500)}
      >
        add-line-item
      </button>
      <button
        disabled={!hasLineItem}
        onClick={() => addExpense(project.id, 100, 'Office supplies')}
      >
        submit-expense
      </button>
      <button
        disabled={!expense}
        onClick={() => updateExpenseStatus(expense.id, 'Approved')}
      >
        approve
      </button>
      <div data-testid="spent-total">{spentTotal}</div>
      <div data-testid="expense-status">{expense ? expense.status : 'none'}</div>
    </div>
  );
}

describe('ProjectContext (local fallback mode)', () => {
  it('assigns default role-based permissions when onboarding a new user', async () => {
    const user = userEvent.setup();
    render(
      <ProjectProvider>
        <OnboardingProbe />
      </ProjectProvider>
    );

    await user.click(screen.getByText('onboard'));

    await waitFor(() =>
      expect(screen.getByTestId('pm-permissions')).toHaveTextContent('create_project')
    );
    expect(screen.getByTestId('pm-permissions')).toHaveTextContent('manage_projects');
  });

  it('does not double-count budget spend when an expense is approved twice', async () => {
    const user = userEvent.setup();
    render(
      <ProjectProvider>
        <ExpenseApprovalProbe />
      </ProjectProvider>
    );

    await user.click(screen.getByText('create-project'));
    await waitFor(() => expect(screen.getByText('add-line-item')).not.toBeDisabled());

    await user.click(screen.getByText('add-line-item'));
    await waitFor(() => expect(screen.getByText('submit-expense')).not.toBeDisabled());

    await user.click(screen.getByText('submit-expense'));
    await waitFor(() => expect(screen.getByText('approve')).not.toBeDisabled());

    // Approve the same expense twice in a row.
    await user.click(screen.getByText('approve'));
    await waitFor(() => expect(screen.getByTestId('expense-status')).toHaveTextContent('Approved'));
    await user.click(screen.getByText('approve'));

    // Budget should reflect the 100-unit expense exactly once, not twice.
    await waitFor(() => expect(screen.getByTestId('spent-total')).toHaveTextContent('100'));
  });
});

import React from 'react';
import {
  FinanceDashboardView, FinanceTransactionsView, FinanceIncomeView,
  FinanceExpensesView, FinanceAccountsView, FinanceProjectsView,
  FinanceBudgetsView, FinancePayrollView, FinanceInvoicesView,
  FinanceApprovalsView, FinanceSettingsView
} from '../../views/FinanceOfficerViews';
import { FinanceOfficerView } from '../../views/RoleSpecificViews/FinanceOfficerView';

const Denied = () => <div className="p-8 text-slate-500 font-medium">Access Denied.</div>;

export default function FinanceRouter({ activeTab, role }) {
  if (role !== 'Finance Officer') return <Denied />;

  switch (activeTab) {
    case 'fin_dashboard': return <FinanceDashboardView />;
    case 'fin_transactions': return <FinanceTransactionsView />;
    case 'fin_income': return <FinanceIncomeView />;
    case 'fin_expenses': return <FinanceExpensesView />;
    case 'fin_accounts': return <FinanceAccountsView />;
    case 'fin_projects': return <FinanceProjectsView />;
    case 'fin_budgets': return <FinanceBudgetsView />;
    case 'fin_payroll': return <FinancePayrollView />;
    case 'fin_invoices': return <FinanceInvoicesView />;
    case 'fin_approvals': return <FinanceApprovalsView />;
    case 'fin_settings': return <FinanceSettingsView />;
    case 'finance_panel': return <FinanceOfficerView />;
    default: return <div className="p-8 text-slate-500 font-semibold">View not found.</div>;
  }
}

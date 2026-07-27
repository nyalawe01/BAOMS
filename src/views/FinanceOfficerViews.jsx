import React, { useState, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, Users, Plus, Send, FileText, Briefcase, FileSpreadsheet, 
  Calendar, Clipboard, BookOpen, Shield, Trash2, ChevronRight, 
  Search, Check, X, ChevronDown, Bell, Upload, Download, Eye, 
  AlertCircle, MapPin, Mail, Phone, ShieldAlert, FileClock, DollarSign, 
  ExternalLink, Layers, Clock, Settings, Package, Activity, Info, TrendingUp
} from 'lucide-react';
import Swal from 'sweetalert2';
import { Avatar } from '@/components/base/avatar/avatar';

// Helper to download text reports
const downloadTxtFile = (filename, content) => {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// ============================================================================
// 1. FINANCE DASHBOARD VIEW
// ============================================================================
export function FinanceDashboardView() {
  const { projects, expenses, transactions, addTransaction, addExpense } = useProject();

  // Calculations derived from transaction database
  const approvedTx = transactions.filter(t => t.status === 'Approved');
  const totalIncome = approvedTx.filter(t => t.type === 'Income').reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const totalExpenses = approvedTx.filter(t => t.type === 'Expense').reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const cashOnHand = totalIncome - totalExpenses;

  const budgetSpent = projects.reduce((acc, curr) => {
    // Sum approved transactions for this project
    const projExpenses = approvedTx.filter(t => t.projectId === curr.id && t.type === 'Expense');
    return acc + projExpenses.reduce((sum, tx) => sum + tx.amount, 0);
  }, 0);
  const budgetUtilization = totalIncome > 0 ? Math.round((budgetSpent / totalIncome) * 100) : 0;

  const activeGrants = projects.filter(p => p.status === 'In Progress').length;
  const pendingApprovalsCount = expenses.filter(e => e.status === 'Pending').length;

  // Calculators State
  const [vatAmount, setVatAmount] = useState('');
  const [vatRate, setVatRate] = useState(18);
  const [vatResult, setVatResult] = useState(null);

  const [grossSalary, setGrossSalary] = useState('');
  const [netSalaryResult, setNetSalaryResult] = useState(null);

  const [loanPrincipal, setLoanPrincipal] = useState('');
  const [loanInterest, setLoanInterest] = useState('');
  const [loanPeriod, setLoanPeriod] = useState('');
  const [loanResult, setLoanResult] = useState(null);

  const handleCalculateVat = () => {
    const amt = parseFloat(vatAmount) || 0;
    const rate = parseFloat(vatRate) || 0;
    const vat = amt * (rate / 100);
    setVatResult({ vat, total: amt + vat });
  };

  const handleCalculateNetSalary = () => {
    const gross = parseFloat(grossSalary) || 0;
    const nssf = gross * 0.06; // Standard 6%
    const nhif = gross * 0.025; // Standard 2.5%
    const paye = (gross - nssf) * 0.30; // Flat 30% tax bracket simulation
    const net = gross - nssf - nhif - paye;
    setNetSalaryResult({ nssf, nhif, paye, net });
  };

  const handleCalculateLoan = () => {
    const p = parseFloat(loanPrincipal) || 0;
    const r = (parseFloat(loanInterest) || 0) / 100 / 12;
    const n = parseInt(loanPeriod, 10) || 12;
    if (r === 0) {
      setLoanResult({ monthly: p / n, total: p });
      return;
    }
    const monthly = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    setLoanResult({ monthly, total: monthly * n });
  };

  return (
    <div className="space-y-8 animate-fadeIn font-normal text-xs text-slate-700 select-none">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-8 border border-slate-200">
        <h2 className="text-lg font-normal flex items-center gap-2">
          <FileSpreadsheet className="text-slate-400" />
          <span>NGO Finance Console</span>
        </h2>
        <p className="text-slate-400 text-xs mt-1 font-normal">Derive transactions, ledger sheets, expected donor grants, and approval routing from the database.</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Cash Flow on Hand', value: `TZS ${cashOnHand.toLocaleString()}` },
          { label: 'Total Database Income', value: `TZS ${totalIncome.toLocaleString()}` },
          { label: 'Total Approved Expenses', value: `TZS ${totalExpenses.toLocaleString()}` },
          { label: 'Budget Utilization %', value: `${budgetUtilization}%` },
          { label: 'Active Grants', value: activeGrants },
          { label: 'Pending Approvals', value: pendingApprovalsCount },
          { label: 'Available Bank Balance', value: `TZS ${cashOnHand.toLocaleString()}` }
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between hover:border-slate-350 transition-all">
            <span className="text-[10px] font-normal text-slate-400 uppercase tracking-widest">{kpi.label}</span>
            <span className="text-2xl font-normal text-slate-800 mt-4 block">{kpi.value}</span>
          </div>
        ))}
      </div>

      {/* Quick Action Buttons */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-normal">Dashboard Quick Actions</span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Record Expense', action: 'Route to Expenses module to request spending approval.' },
            { label: 'Record Income', action: 'Route to Income module to record incoming donor seed funding.' },
            { label: 'Create Invoice', action: 'Route to Invoices module to draft client invoice records.' },
            { label: 'Pay Staff', action: 'Route to Payroll module to approve and generate staff wages.' },
            { label: 'Bank Transfer', action: 'Route to Bank Accounts to manage cross-ledger checks.' },
            { label: 'New Budget', action: 'Route to Budgets control module.' }
          ].map((act, idx) => (
            <button
              key={idx}
              onClick={() => Swal.fire('Operational Router', act.action, 'info')}
              className="py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 transition-all text-center text-xs font-normal"
            >
              + {act.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Top Spending & Lists */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="font-normal text-slate-850 text-sm border-b border-slate-100 pb-2">
              Top Spending Projects
            </h3>
            <div className="space-y-4 font-normal">
              {projects.map((p, idx) => {
                const projectExps = approvedTx.filter(t => t.projectId === p.id && t.type === 'Expense');
                const spent = projectExps.reduce((sum, tx) => sum + tx.amount, 0);
                const percent = p.budget > 0 ? Math.round((spent / p.budget) * 100) : 0;
                
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-normal text-slate-700">
                      <span>{p.name}</span>
                      <span>TZS {spent.toLocaleString()} spent ({percent}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-slate-500 h-full" style={{ width: `${Math.min(percent, 100)}%` }}></div>
                    </div>
                  </div>
                );
              })}
              {projects.length === 0 && (
                <p className="text-center py-6 text-slate-400 italic">No project portfolios logged in database.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right: Calculators */}
        <div className="space-y-8">
          {/* VAT Calculator */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 font-normal">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-normal border-b border-slate-100 pb-1.5">VAT Calculator</span>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase mb-1">Amount</label>
                <input 
                  type="number" 
                  value={vatAmount}
                  onChange={(e) => setVatAmount(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white text-xs" 
                  placeholder="e.g. 5000"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={handleCalculateVat} className="w-full py-1.5 bg-slate-900 text-white rounded font-normal hover:bg-slate-800">Calculate</button>
              </div>
              {vatResult && (
                <div className="bg-slate-50 p-2.5 border border-slate-200 rounded space-y-1 text-slate-600">
                  <div>VAT: TZS {vatResult.vat.toFixed(2)}</div>
                  <div>Total: TZS {vatResult.total.toFixed(2)}</div>
                </div>
              )}
            </div>
          </div>

          {/* Salary Calculator */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 font-normal">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-normal border-b border-slate-100 pb-1.5">Salary Tax Calculator</span>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase mb-1">Gross Salary</label>
                <input 
                  type="number" 
                  value={grossSalary}
                  onChange={(e) => setGrossSalary(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white text-xs" 
                  placeholder="e.g. 80000"
                />
              </div>
              <button onClick={handleCalculateNetSalary} className="w-full py-1.5 bg-slate-900 text-white rounded font-normal hover:bg-slate-800">Calculate Net</button>
              {netSalaryResult && (
                <div className="bg-slate-50 p-2.5 border border-slate-200 rounded space-y-1 text-slate-600">
                  <div>NSSF (6%): TZS {netSalaryResult.nssf.toFixed(2)}</div>
                  <div>NHIF (2.5%): TZS {netSalaryResult.nhif.toFixed(2)}</div>
                  <div>PAYE (30%): TZS {netSalaryResult.paye.toFixed(2)}</div>
                  <div>Net Salary: TZS {netSalaryResult.net.toFixed(2)}</div>
                </div>
              )}
            </div>
          </div>

          {/* Loan Calculator */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 font-normal">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-normal border-b border-slate-100 pb-1.5">Loan Repayment Calculator</span>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase mb-1">Principal</label>
                  <input type="number" value={loanPrincipal} onChange={(e) => setLoanPrincipal(e.target.value)} className="w-full px-2 py-1 border border-slate-200 rounded" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase mb-1">Interest %</label>
                  <input type="number" value={loanInterest} onChange={(e) => setLoanInterest(e.target.value)} className="w-full px-2 py-1 border border-slate-200 rounded" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 uppercase mb-1">Period (months)</label>
                <input type="number" value={loanPeriod} onChange={(e) => setLoanPeriod(e.target.value)} className="w-full px-2 py-1 border border-slate-200 rounded" />
              </div>
              <button onClick={handleCalculateLoan} className="w-full py-1.5 bg-slate-900 text-white rounded font-normal hover:bg-slate-800">Calculate Monthly</button>
              {loanResult && (
                <div className="bg-slate-50 p-2.5 border border-slate-200 rounded space-y-1 text-slate-600">
                  <div>Monthly Paid: TZS {loanResult.monthly.toFixed(2)}</div>
                  <div>Total Payments: TZS {loanResult.total.toFixed(2)}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 2. MASTER TRANSACTIONS VIEW
// ============================================================================
export function FinanceTransactionsView() {
  const { transactions } = useProject();
  const [filter, setFilter] = useState('All');

  const filtered = filter === 'All' 
    ? transactions 
    : filter === 'Income' 
    ? transactions.filter(t => t.type === 'Income')
    : filter === 'Expense'
    ? transactions.filter(t => t.type === 'Expense')
    : transactions.filter(t => t.status === filter);

  return (
    <div className="space-y-6 animate-fadeIn font-normal text-xs text-slate-700">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-sm font-normal text-slate-805">Master General Ledger Transactions</h2>
          <p className="text-xs text-slate-400 font-normal">Spreadsheet-like record of all incoming grants and outgoing expense allocations.</p>
        </div>
        <div className="flex gap-2">
          {['All', 'Income', 'Expense', 'Pending', 'Approved'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 border rounded font-normal transition-all ${
                filter === f ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-normal text-slate-400 uppercase tracking-wider">
                <th className="p-3">Date</th>
                <th className="p-3">Reference</th>
                <th className="p-3">Description</th>
                <th className="p-3">Category</th>
                <th className="p-3">Project Workspace</th>
                <th className="p-3">Bank Account</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150">
              {filtered.map((t, idx) => (
                <tr key={t.id || idx} className="hover:bg-slate-50/50">
                  <td className="p-3 font-mono text-[10px] text-slate-400">{t.date}</td>
                  <td className="p-3 font-mono text-[10px] text-slate-500">{t.ref}</td>
                  <td className="p-3 font-normal text-slate-808">{t.description}</td>
                  <td className="p-3 text-slate-600">{t.category}</td>
                  <td className="p-3 text-slate-600">{t.projectName}</td>
                  <td className="p-3 text-slate-600 font-mono text-[10px]">{t.bankAccount || 'CRDB'}</td>
                  <td className="p-3 font-normal text-slate-800">
                    {t.type === 'Income' ? `+` : `-`} TZS {t.amount?.toLocaleString()}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[8px] font-normal border uppercase bg-slate-50 text-slate-600 border-slate-200">
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-slate-400 italic">No general ledger transactions registered in this context.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 3. INCOME MODULE (connected to Transaction Engine)
// ============================================================================
export function FinanceIncomeView() {
  const { projects, transactions, addTransaction } = useProject();
  
  const [source, setSource] = useState('Grant');
  const [donor, setDonor] = useState('');
  const [amount, setAmount] = useState('');
  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [bankAccount, setBankAccount] = useState('CRDB');

  const incomes = transactions.filter(t => t.type === 'Income');

  const handleRecordIncome = async (e) => {
    e.preventDefault();
    if (!donor || !amount) return;

    const proj = projects.find(p => p.id === projectId);
    
    await addTransaction({
      date: new Date().toISOString().substring(0,10),
      ref: `GRANT-${Date.now().toString().slice(-4)}`,
      description: `Grant funding deposit by ${donor}`,
      type: 'Income',
      category: source,
      projectId,
      projectName: proj ? proj.name : 'General Operations',
      amount: parseFloat(amount),
      status: 'Approved',
      bankAccount
    });

    setDonor('');
    setAmount('');
    Swal.fire('Income Deposited', 'Incoming grant registered and cash balance updated.', 'success');
  };

  return (
    <div className="space-y-8 animate-fadeIn font-normal text-xs text-slate-700">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-sm font-normal text-slate-800">Income Ledger Register</h2>
        <p className="text-xs text-slate-400 font-normal">Record incoming sponsorships, donations, grants, and fundraising returns.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Income Form */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4 h-fit">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-1.5">Record Incoming Funds</span>
          <form onSubmit={handleRecordIncome} className="space-y-3 font-normal">
            <div>
              <label className="block text-[10px] text-slate-400 uppercase mb-1">Source Type</label>
              <select value={source} onChange={(e) => setSource(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white">
                <option value="Grant">Grant</option>
                <option value="Donation">Donation</option>
                <option value="Fundraising">Fundraising</option>
                <option value="Service Revenue">Service Revenue</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 uppercase mb-1">Donor / Customer Name</label>
              <input type="text" required value={donor} onChange={(e) => setDonor(e.target.value)} placeholder="e.g. USAID Africa" className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase mb-1">Amount (TZS)</label>
                <input type="number" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 50000" className="w-full px-2 py-1.5 border border-slate-200 rounded bg-white" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 uppercase mb-1">Bank Wallet</label>
                <select value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded bg-white">
                  <option value="CRDB">CRDB</option>
                  <option value="NMB">NMB</option>
                  <option value="M-Pesa">M-Pesa</option>
                  <option value="Airtel Money">Airtel Money</option>
                  <option value="NBC">NBC</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 uppercase mb-1">Link to Project Workspace</label>
              <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white">
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="w-full py-2 bg-slate-900 text-white rounded font-normal hover:bg-slate-800">Log Income Transaction</button>
          </form>
        </div>

        {/* Income List */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-1.5">Logged Deposits</span>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-normal text-slate-400 uppercase tracking-wider">
                  <th className="p-3">Date</th>
                  <th className="p-3">Donor / Category</th>
                  <th className="p-3">Project Link</th>
                  <th className="p-3">Bank Account</th>
                  <th className="p-3">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {incomes.map((inc, idx) => (
                  <tr key={inc.id || idx}>
                    <td className="p-3 font-mono text-[10px] text-slate-400">{inc.date}</td>
                    <td className="p-3 font-normal text-slate-808">{inc.description} ({inc.category})</td>
                    <td className="p-3 text-slate-600">{inc.projectName}</td>
                    <td className="p-3 font-mono text-[10px] text-slate-500">{inc.bankAccount || 'CRDB'}</td>
                    <td className="p-3 font-normal text-slate-700">TZS {inc.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 4. EXPENSES MODULE (connected to Transaction Engine)
// ============================================================================
export function FinanceExpensesView() {
  const { expenses, addExpense, projects } = useProject();

  const [desc, setDesc] = useState('');
  const [amt, setAmt] = useState('');
  const [cat, setCat] = useState('Office');
  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [bankAccount, setBankAccount] = useState('CRDB');

  const handleRecordExpense = async (e) => {
    e.preventDefault();
    if (!desc || !amt) return;

    await addExpense(projectId, amt, desc, cat, 'receipt_upload.jpg', bankAccount);

    setDesc('');
    setAmt('');
    Swal.fire('Expense Registered', 'Voucher created. Placed in approvals pipeline.', 'success');
  };

  return (
    <div className="space-y-8 animate-fadeIn font-normal text-xs text-slate-700">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-sm font-normal text-slate-800">Operational Expenses Router</h2>
        <p className="text-xs text-slate-400 font-normal">Log operational costs, upload receipts, and check transaction clearance.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Expense Form */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4 h-fit">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-1.5">Record Operational Expense</span>
          <form onSubmit={handleRecordExpense} className="space-y-3 font-normal">
            <div>
              <label className="block text-[10px] text-slate-400 uppercase mb-1">Expense Item Description</label>
              <input type="text" required value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="e.g. Travel tickets to Mwanza" className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase mb-1">Category</label>
                <select value={cat} onChange={(e) => setCat(e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded bg-white">
                  <option value="Office">Office</option>
                  <option value="Transport">Transport</option>
                  <option value="Fuel">Fuel</option>
                  <option value="Training">Training</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Salary">Salary</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 uppercase mb-1">Amount (TZS)</label>
                <input type="number" required value={amt} onChange={(e) => setAmt(e.target.value)} placeholder="e.g. 1500" className="w-full px-2 py-1 border border-slate-200 rounded bg-white" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase mb-1">Project Link</label>
                <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white">
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 uppercase mb-1">Bank Wallet</label>
                <select value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white">
                  <option value="CRDB">CRDB</option>
                  <option value="NMB">NMB</option>
                  <option value="M-Pesa">M-Pesa</option>
                  <option value="Airtel Money">Airtel Money</option>
                  <option value="NBC">NBC</option>
                </select>
              </div>
            </div>
            <button type="submit" className="w-full py-2 bg-slate-900 text-white rounded font-normal hover:bg-slate-800">Log Expense Voucher</button>
          </form>
        </div>

        {/* Expenses List */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-1.5">Registered Transactions</span>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-normal text-slate-400 uppercase tracking-wider">
                  <th className="p-3">Expense Voucher</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Bank Wallet</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {expenses.map((exp, idx) => (
                  <tr key={exp.id || idx}>
                    <td className="p-3 font-normal text-slate-808">{exp.description}</td>
                    <td className="p-3 text-slate-500 font-normal">{exp.category || 'Operations'}</td>
                    <td className="p-3 font-normal text-slate-707">TZS {exp.amount.toLocaleString()}</td>
                    <td className="p-3 font-mono text-[10px] text-slate-500">{exp.bankAccount || 'CRDB'}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[8px] font-normal border uppercase bg-slate-50 text-slate-600 border-slate-200">
                        {exp.status || 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 5. BUDGET MODULE
// ============================================================================
export function FinanceBudgetsView() {
  const { projects, transactions } = useProject();

  return (
    <div className="space-y-8 animate-fadeIn font-normal text-xs text-slate-700 select-none">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-sm font-normal text-slate-805">Budget Limit Control Dashboard</h2>
        <p className="text-xs text-slate-400 font-normal font-normal">Compare project allocations vs actual spent expenditures. Flags warnings at 80%, 90%, and exceeded targets.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {projects.map(proj => {
          const approvedTx = transactions.filter(t => t.projectId === proj.id && t.type === 'Expense' && t.status === 'Approved');
          const totalSpent = approvedTx.reduce((acc, curr) => acc + (curr.amount || 0), 0);
          const totalBudget = proj.budget || 2000;
          const ratio = Math.round((totalSpent / totalBudget) * 100);
          const remaining = totalBudget - totalSpent;

          // Alert logic
          const isExceeded = totalSpent > totalBudget;
          const isWarning = ratio >= 80;

          return (
            <div key={proj.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-start border-b border-slate-100 pb-2.5">
                <div>
                  <h4 className="font-normal text-slate-800 text-sm">{proj.name}</h4>
                  <span className="text-[10px] text-slate-400 block font-normal">Donor: {proj.donor || 'UNICEF'}</span>
                </div>
                <div className="text-right">
                  <span className={`px-2.5 py-0.5 rounded text-[8px] font-normal uppercase border ${
                    isExceeded ? 'bg-slate-200 text-slate-808 border-slate-300' :
                    isWarning ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-50 text-slate-500'
                  }`}>
                    {isExceeded ? 'Exceeded limit' : isWarning ? 'Warning 80%+' : 'Within limit'}
                  </span>
                  <span className="block text-[10px] font-normal text-slate-600 mt-1">{ratio}% utilized</span>
                </div>
              </div>

              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-slate-500 h-full" style={{ width: `${Math.min(ratio, 100)}%` }}></div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center text-xs font-normal">
                <div className="p-2.5 bg-slate-50 border border-slate-150 rounded">
                  <span className="text-[9px] text-slate-400 uppercase font-normal block">Allocated Limit</span>
                  <span className="font-normal text-slate-750">TZS {totalBudget.toLocaleString()}</span>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-150 rounded">
                  <span className="text-[9px] text-slate-400 uppercase font-normal block">Total Spent</span>
                  <span className="font-normal text-slate-750">TZS {totalSpent.toLocaleString()}</span>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-150 rounded">
                  <span className="text-[9px] text-slate-400 uppercase font-normal block">Remaining</span>
                  <span className="font-normal text-slate-750">TZS {remaining.toLocaleString()}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// 6. PROJECTS FINANCE
// ============================================================================
export function FinanceProjectsView() {
  const { projects, transactions } = useProject();

  return (
    <div className="space-y-8 animate-fadeIn font-normal text-xs text-slate-700 select-none">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-sm font-normal text-slate-800">Project Workspace Portfolios</h2>
        <p className="text-xs text-slate-400 font-normal">Consolidated budget, expense allocations, and net balances categorized per project.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 font-normal text-slate-400 uppercase tracking-wider">
              <th className="p-3">Project Workspace</th>
              <th className="p-3">Total Allocation Limit</th>
              <th className="p-3">Expenses Logged</th>
              <th className="p-3">Remaining Budget</th>
              <th className="p-3">Overall Progress</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-150">
            {projects.map(proj => {
              const approvedTx = transactions.filter(t => t.projectId === proj.id && t.type === 'Expense' && t.status === 'Approved');
              const spent = approvedTx.reduce((acc, curr) => acc + (curr.amount || 0), 0);
              const remaining = (proj.budget || 0) - spent;

              return (
                <tr key={proj.id} className="hover:bg-slate-50/50">
                  <td className="p-3 font-normal text-slate-808">{proj.name}</td>
                  <td className="p-3 font-normal text-slate-700">TZS {proj.budget?.toLocaleString() || 0}</td>
                  <td className="p-3 font-normal text-slate-700">TZS {spent.toLocaleString()}</td>
                  <td className="p-3 font-normal text-slate-700">TZS {remaining.toLocaleString()}</td>
                  <td className="p-3 font-normal text-slate-600">{proj.progress || 0}% Complete</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// 7. PAYROLL (connected to Transaction Engine)
// ============================================================================
export function FinancePayrollView() {
  const { users, transactions, addTransaction } = useProject();
  const [isDisbursing, setIsDisbursing] = useState(false);

  const currentPeriod = new Date().toISOString().substring(0, 7); // YYYY-MM
  const alreadyDisbursedCount = transactions.filter(
    t => t.category === 'Salary' && t.payPeriod === currentPeriod
  ).length;

  const runDisbursement = async () => {
    setIsDisbursing(true);
    try {
      for (const u of users) {
        const baseSalary = u.role === 'Executive Director' ? 180000 : u.role === 'HR Officer' ? 95000 : 75000;
        const transportAllowance = 5000;
        const paye = baseSalary * 0.30;
        const nssf = baseSalary * 0.06;
        const netSalary = baseSalary + transportAllowance - paye - nssf;

        await addTransaction({
          date: new Date().toISOString().substring(0, 10),
          ref: `PAY-${Date.now().toString().slice(-4)}`,
          description: `Net salary payout for staff: ${u.name}`,
          type: 'Expense',
          category: 'Salary',
          payPeriod: currentPeriod,
          amount: netSalary,
          status: 'Approved',
          bankAccount: 'CRDB'
        });
      }
      Swal.fire('Payroll Executed', 'Successfully approved salary disbursements and generated ledger expenses.', 'success');
    } finally {
      setIsDisbursing(false);
    }
  };

  const handleApprovePayroll = () => {
    if (isDisbursing) return;

    if (alreadyDisbursedCount > 0) {
      Swal.fire({
        title: `Payroll for ${currentPeriod} already run`,
        text: `${alreadyDisbursedCount} salary transaction(s) already exist for this period. Running it again will pay staff a second time. Continue anyway?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Yes, disburse again'
      }).then((result) => {
        if (result.isConfirmed) runDisbursement();
      });
      return;
    }

    Swal.fire({
      title: `Disburse payroll for ${currentPeriod}?`,
      text: `This will pay all ${users.length} staff members. This cannot be undone.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, disburse'
    }).then((result) => {
      if (result.isConfirmed) runDisbursement();
    });
  };

  return (
    <div className="space-y-8 animate-fadeIn font-normal text-xs text-slate-700 select-none">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-sm font-normal text-slate-808">Staff Directory Payroll ledgers</h2>
          <p className="text-xs text-slate-400 font-normal">Generate base salary calculations, allocate allowances, and deduct tax/social security contributions.</p>
        </div>
        <div className="flex flex-col items-end gap-1 text-xs">
          <button
            onClick={handleApprovePayroll}
            disabled={isDisbursing}
            className="px-3 py-1.5 bg-slate-900 text-white rounded hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDisbursing ? 'Disbursing...' : 'Approve & Disburse Payroll'}
          </button>
          {alreadyDisbursedCount > 0 && (
            <span className="text-[10px] text-amber-600 font-semibold">
              {alreadyDisbursedCount} payment(s) already recorded for {currentPeriod}
            </span>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-normal text-slate-400 uppercase tracking-wider">
                <th className="p-3">Staff Name</th>
                <th className="p-3">Designation</th>
                <th className="p-3">Base Salary</th>
                <th className="p-3">Allowances</th>
                <th className="p-3">PAYE Tax</th>
                <th className="p-3">NSSF/NHIF</th>
                <th className="p-3">Net Salary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 font-normal">
              {users.map((u, idx) => {
                const baseSalary = u.role === 'Executive Director' ? 180000 : u.role === 'HR Officer' ? 95000 : 75000;
                const transportAllowance = 5000;
                const paye = baseSalary * 0.30;
                const nssf = baseSalary * 0.06;
                const netSalary = baseSalary + transportAllowance - paye - nssf;

                return (
                  <tr key={u.id || idx} className="hover:bg-slate-50/50">
                    <td className="p-3 font-normal text-slate-808">{u.name}</td>
                    <td className="p-3 text-slate-500 font-normal">{u.officeDetails?.position || u.role}</td>
                    <td className="p-3">TZS {baseSalary.toLocaleString()}</td>
                    <td className="p-3">TZS {transportAllowance.toLocaleString()}</td>
                    <td className="p-3">TZS {paye.toLocaleString()}</td>
                    <td className="p-3">TZS {nssf.toLocaleString()}</td>
                    <td className="p-3 font-normal text-slate-800">TZS {netSalary.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 8. INVOICES MODULE (connected to Transaction Engine)
// ============================================================================
export function FinanceInvoicesView() {
  const { invoices, addInvoice, updateInvoiceStatus, deleteInvoice, addTransaction, projects } = useProject();

  const [client, setClient] = useState('');
  const [amount, setAmount] = useState('');
  const [projectId, setProjectId] = useState('');
  const [dueDate, setDueDate] = useState('');

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    if (!client || !amount) return;

    await addInvoice({
      clientName: client,
      projectId,
      amount: parseFloat(amount),
      dueDate
    });

    setClient('');
    setAmount('');
    setProjectId('');
    setDueDate('');
    Swal.fire('Invoice Generated', 'Successfully created and dispatched client invoice record.', 'success');
  };

  const handlePayInvoice = async (invId) => {
    const inv = invoices.find(i => i.id === invId);
    if (!inv) return;

    await addTransaction({
      date: new Date().toISOString().substring(0, 10),
      ref: `PMT-${Date.now().toString().slice(-4)}`,
      description: `Invoiced receipt from ${inv.clientName}`,
      type: 'Income',
      category: 'Service Revenue',
      amount: inv.amount,
      status: 'Approved',
      bankAccount: 'CRDB'
    });

    await updateInvoiceStatus(invId, 'Paid');
    Swal.fire('Payment Logged', 'Invoice marked as paid and transaction entered in ledger.', 'success');
  };

  const handleVoidInvoice = async (invId) => {
    const result = await Swal.fire({
      title: 'Void this invoice?',
      text: 'This will permanently remove the invoice record.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Void Invoice',
      confirmButtonColor: '#0f172a'
    });
    if (!result.isConfirmed) return;

    await deleteInvoice(invId);
    Swal.fire('Invoice Voided', 'The invoice record has been removed.', 'success');
  };

  return (
    <div className="space-y-8 animate-fadeIn font-normal text-xs text-slate-700">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-sm font-normal text-slate-808">Client Invoicing ledgers</h2>
          <p className="text-xs text-slate-400 font-normal">Generate invoices, track expected donor disbursements, and update payment balances.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4 h-fit">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-1.5 font-normal">Create New Invoice</span>
          <form onSubmit={handleCreateInvoice} className="space-y-3 font-normal">
            <div>
              <label className="block text-[10px] text-slate-400 uppercase mb-1">Client Organization</label>
              <input type="text" required value={client} onChange={(e) => setClient(e.target.value)} placeholder="e.g. UNICEF Somalia" className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white" />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 uppercase mb-1">Total Billing Amount (TZS)</label>
              <input type="number" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 50000" className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white" />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 uppercase mb-1">Related Project (Optional)</label>
              <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white">
                <option value="">None</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 uppercase mb-1">Due Date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white" />
            </div>
            <button type="submit" className="w-full py-2 bg-slate-900 text-white rounded font-normal hover:bg-slate-800">Generate Invoice</button>
          </form>
        </div>

        {/* List */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-1.5">Dispatched Invoices</span>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-normal text-slate-400 uppercase tracking-wider">
                  <th className="p-3">Invoice ID</th>
                  <th className="p-3">Client</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {invoices.map((inv, idx) => (
                  <tr key={inv.id || idx}>
                    <td className="p-3 font-mono text-[10px] text-slate-400">{inv.invoiceNumber}</td>
                    <td className="p-3 font-normal text-slate-808">{inv.clientName}</td>
                    <td className="p-3 font-mono text-[10px] text-slate-400">{inv.issuedDate}</td>
                    <td className="p-3 font-normal text-slate-700">TZS {(inv.amount || 0).toLocaleString()}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[8px] font-normal border uppercase bg-slate-50 text-slate-600 border-slate-200">
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      {inv.status !== 'Paid' && (
                        <button
                          onClick={() => handlePayInvoice(inv.id)}
                          className="px-2 py-1 bg-slate-900 text-white rounded hover:bg-slate-800 font-normal text-[10px]"
                        >
                          Receive Payment
                        </button>
                      )}
                      <button
                        onClick={() => handleVoidInvoice(inv.id)}
                        className="px-2 py-1 bg-white text-red-600 border border-red-200 rounded hover:bg-red-50 font-normal text-[10px]"
                      >
                        Void
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 9. REPORTS MODULE
// ============================================================================
export function FinanceReportsView() {
  const { projects, transactions } = useProject();

  const handleCompileFinancialReport = () => {
    const approvedTx = transactions.filter(t => t.status === 'Approved');
    const totalIncome = approvedTx.filter(t => t.type === 'Income').reduce((a, c) => a + c.amount, 0);
    const totalSpent = approvedTx.filter(t => t.type === 'Expense').reduce((a, c) => a + c.amount, 0);

    const reportContent = `
BAOMS GENERAL FINANCIAL LEDGER STATEMENT
Generated On: ${new Date().toLocaleDateString()}
-----------------------------------------
1. INCOME STATEMENT SUMMARY
Total Grants Received: TZS ${totalIncome.toLocaleString()}
Total Expenses Approved: TZS ${totalSpent.toLocaleString()}
Net Cash Reserve: TZS ${(totalIncome - totalSpent).toLocaleString()}

2. EXPENDITURES BREAKDOWN BY PROJECT:
${projects.map(p => {
  const projExps = approvedTx.filter(t => t.projectId === p.id && t.type === 'Expense');
  const spent = projExps.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  return `- ${p.name}: TZS ${spent.toLocaleString()} spent out of TZS ${p.budget?.toLocaleString() || 0}`;
}).join('\n')}
-----------------------------------------
EOF
`;
    downloadTxtFile(`BAOMS_Financial_Statement_2026.txt`, reportContent);
    Swal.fire('Financial Statement Compiled', 'Downloading summary text file.', 'success');
  };

  return (
    <div className="space-y-6 animate-fadeIn font-normal text-xs text-slate-700">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-sm font-normal text-slate-805">Financial Reports Compiler</h2>
        <p className="text-xs text-slate-400 font-normal">Generate Income Statements, Balance Sheets, Cash Flow statements, and audit ledgers directly from active project records.</p>
      </div>

      <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-xl p-8 shadow-sm space-y-4 font-normal">
        <h3 className="font-normal text-slate-808 text-sm border-b border-slate-100 pb-2 flex items-center gap-2">
          <FileText size={16} className="text-slate-400" />
          <span>General Ledger Compiler</span>
        </h3>
        <p className="text-xs text-slate-500 font-normal font-normal">Compile ledger reports utilizing values currently in the Firestore database.</p>
        <button
          onClick={handleCompileFinancialReport}
          className="w-full py-2.5 bg-slate-900 text-white rounded hover:bg-slate-800 transition-all font-normal"
        >
          Compile & Generate Financial Statement
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// 10. BANK ACCOUNTS MODULE (connected to Transaction Engine)
// ============================================================================
export function FinanceAccountsView() {
  const { transactions } = useProject();

  const getBalance = (bankName) => {
    const approvedTx = transactions.filter(t => t.status === 'Approved' && t.bankAccount === bankName);
    const income = approvedTx.filter(t => t.type === 'Income').reduce((a, c) => a + c.amount, 0);
    const expenses = approvedTx.filter(t => t.type === 'Expense').reduce((a, c) => a + c.amount, 0);
    return income - expenses;
  };

  const bankAccountsList = [
    { name: 'CRDB Bank Account', code: 'CRDB-8890', balance: getBalance('CRDB') },
    { name: 'NMB Bank Account', code: 'NMB-2331', balance: getBalance('NMB') },
    { name: 'M-Pesa Corporate Wallet', code: 'MPESA-9908', balance: getBalance('M-Pesa') },
    { name: 'Airtel Money Wallet', code: 'AIRTEL-4311', balance: getBalance('Airtel Money') },
    { name: 'NBC Bank Account', code: 'NBC-1120', balance: getBalance('NBC') }
  ];

  return (
    <div className="space-y-6 animate-fadeIn font-normal text-xs text-slate-700 select-none">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-sm font-normal text-slate-800">Operational Bank Accounts & Reconciliations</h2>
        <p className="text-xs text-slate-400 font-normal">Track deposits, withdrawals, and ledger allocations across multiple checking accounts.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-normal">
        {bankAccountsList.map((acc, idx) => (
          <div key={idx} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 hover:border-slate-350 transition-all">
            <div>
              <h4 className="font-normal text-slate-800 text-sm">{acc.name}</h4>
              <span className="text-[10px] text-slate-400 block font-normal font-mono">Code: {acc.code}</span>
            </div>
            <div className="border-t border-slate-100 pt-3">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-normal">Available Balance</span>
              <span className="text-lg font-normal text-slate-800 mt-1 block">
                TZS {acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// 11. APPROVALS MODULE
// ============================================================================
export function FinanceApprovalsView() {
  const { expenses, updateExpenseStatus } = useProject();

  const pendingExpenses = expenses.filter(e => e.status === 'Pending');

  const handleAction = async (id, status) => {
    await updateExpenseStatus(id, status);
    Swal.fire('Approvals Updated', `Expense status marked as ${status}.`, 'success');
  };

  return (
    <div className="space-y-6 animate-fadeIn font-normal text-xs text-slate-700">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-sm font-normal text-slate-850">Operational Approvals Queue</h2>
        <p className="text-xs text-slate-400 font-normal">Verify operational expenses, check receipt uploads, and clear budget items.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">
        <h3 className="font-normal text-slate-808 text-sm border-b border-slate-100 pb-2">
          Vouchers Pending Financial Clearance
        </h3>

        <div className="space-y-3 font-normal">
          {pendingExpenses.map((exp, idx) => (
            <div key={exp.id || idx} className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="font-normal text-slate-808 text-xs block">{exp.description}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Amount requested: TZS {exp.amount.toLocaleString()} • Category: {exp.category || 'Operations'} • Wallet: {exp.bankAccount || 'CRDB'}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleAction(exp.id, 'Approved')} className="px-3 py-1.5 bg-slate-900 text-white rounded font-normal hover:bg-slate-800 text-xs">Approve Clearance</button>
                <button onClick={() => handleAction(exp.id, 'Rejected')} className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded hover:bg-slate-300 text-xs">Reject Voucher</button>
              </div>
            </div>
          ))}
          {pendingExpenses.length === 0 && (
            <p className="text-center py-8 text-slate-400 italic">No vouchers awaiting approval.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 12. SETTINGS MODULE
// ============================================================================
export function FinanceSettingsView() {
  return (
    <div className="space-y-6 animate-fadeIn font-normal text-xs text-slate-700">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-sm font-normal text-slate-805">Finance Configurations</h2>
        <p className="text-xs text-slate-400 font-normal">Manage tax rates, currency conversion ratios, and transaction rules.</p>
      </div>

      <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4 font-normal">
        <h3 className="font-normal text-slate-808 text-xs uppercase tracking-wider border-b border-slate-100 pb-2">VAT & Corporate Tax Defaults</h3>
        <div className="space-y-3 font-normal text-xs">
          <div>
            <span className="text-slate-400 block mb-1">Standard VAT Rate</span>
            <span className="font-normal text-slate-700 block bg-slate-50 p-2.5 rounded border border-slate-200">16% (Applicable on local invoices)</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-1">Default Base Currency</span>
            <span className="font-normal text-slate-700 block bg-slate-50 p-2.5 rounded border border-slate-200">Kenyan Shilling (TZS)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  DollarSign, Users, FileText, TrendingDown, UserCheck,
  Plus, History, LayoutTemplate, BarChart3, User, ChevronRight,
  CheckCircle2, AlertCircle, Circle, Zap, Shield
} from 'lucide-react';
import { usePayrollStore } from '../../db/payroll-store';
import { VoiceAuth } from '../../components/voice-auth';

const QUICK_ACTIONS = [
  { icon: <Plus size={20} />, label: 'Generate Payroll', to: '/payroll/generate', color: 'from-primary to-primary-light', desc: 'Create new payslip' },
  { icon: <FileText size={20} />, label: 'View Payslips', to: '/payroll/history', color: 'from-violet-500 to-purple-600', desc: 'Browse all payslips' },
  { icon: <History size={20} />, label: 'Payroll History', to: '/payroll/history', color: 'from-indigo-500 to-blue-600', desc: 'Past payroll records' },
  { icon: <LayoutTemplate size={20} />, label: 'Salary Templates', to: '/payroll/templates', color: 'from-emerald-500 to-teal-600', desc: 'Manage templates' },
  { icon: <BarChart3 size={20} />, label: 'Export Reports', to: '/payroll/reports', color: 'from-amber-500 to-orange-500', desc: 'Generate reports' },
  { icon: <User size={20} />, label: 'Employee Profiles', to: '/payroll/history', color: 'from-rose-500 to-pink-600', desc: 'Payroll profiles' },
];

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: <Circle size={10} /> },
  generated: { label: 'Generated', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: <CheckCircle2 size={10} /> },
  paid: { label: 'Paid', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle2 size={10} /> },
};

interface PayrollDashboardProps {
  onNavigate?: (view: 'dashboard' | 'generate' | 'history' | 'templates' | 'company', recordId?: string) => void;
}

const ACTION_KEYS: Record<string, 'generate' | 'history' | 'templates' | 'company'> = {
  'Generate Payroll': 'generate',
  'View Payslips': 'history',
  'Payroll History': 'history',
  'Salary Templates': 'templates',
  'Export Reports': 'history',
  'Employee Profiles': 'history',
};

export const PayrollDashboard: React.FC<PayrollDashboardProps> = ({ onNavigate }) => {
  const navigate = useNavigate();
  const { getPayrollStats, records, filterRecords, voiceAuth } = usePayrollStore();
  const [showVoiceEnroll, setShowVoiceEnroll] = useState(false);
  const stats = getPayrollStats();
  const recentRecords = filterRecords({}).slice(0, 5);
  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  const statCards = [
    {
      label: 'Total Employees',
      value: stats.totalEmployees,
      icon: <Users size={22} />,
      color: 'text-primary',
      bg: 'bg-primary/10',
      suffix: '',
    },
    {
      label: 'Payroll Generated',
      value: stats.totalGenerated,
      icon: <CheckCircle2 size={22} />,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      suffix: '',
    },
    {
      label: 'Pending Payroll',
      value: stats.totalPending,
      icon: <AlertCircle size={22} />,
      color: 'text-amber-500',
      bg: 'bg-amber-50',
      suffix: '',
    },
    {
      label: 'Monthly Expense',
      value: stats.monthlyExpense,
      icon: <DollarSign size={22} />,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      isCurrency: true,
    },
    {
      label: 'Total Deductions',
      value: stats.totalDeductions,
      icon: <TrendingDown size={22} />,
      color: 'text-rose-500',
      bg: 'bg-rose-50',
      isCurrency: true,
    },
    {
      label: 'Active Workforce',
      value: stats.activeWorkforce,
      icon: <UserCheck size={22} />,
      color: 'text-teal-600',
      bg: 'bg-teal-50',
      suffix: '',
    },
  ];

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="min-h-screen pb-28 md:pb-8 pt-6 px-4 md:px-8 relative overflow-x-hidden">
      {/* Background orbs */}
      <div className="absolute top-[-60px] left-[-60px] fluid-orb-indigo pointer-events-none z-0" />
      <div className="absolute bottom-[30%] right-[-80px] fluid-orb-emerald pointer-events-none z-0" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-gradient-to-tr from-primary to-primary-light rounded-lg flex items-center justify-center text-white">
                <DollarSign size={16} />
              </div>
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Payroll Module</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Payroll Dashboard</h1>
            <p className="text-slate-500 text-sm mt-1 font-medium">{currentMonth} • VyessHRMS Payroll Engine</p>
          </div>
          <div className="flex items-center gap-3">
            {!voiceAuth.isEnrolled ? (
              <button
                onClick={() => setShowVoiceEnroll(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-50 transition-all"
              >
                <Shield size={15} />
                Setup Voice Auth
              </button>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200">
                <Shield size={13} />
                Voice Protected
              </div>
            )}
            {onNavigate ? (
              <button
                onClick={() => onNavigate('generate')}
                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-tr from-primary to-primary-light text-white text-sm font-extrabold rounded-2xl shadow-premium hover:scale-[1.02] active:scale-[0.98] transition-all border border-white/10"
              >
                <Plus size={16} />
                Generate Payroll
              </button>
            ) : (
              <Link
                to="/payroll/generate"
                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-tr from-primary to-primary-light text-white text-sm font-extrabold rounded-2xl shadow-premium hover:scale-[1.02] active:scale-[0.98] transition-all border border-white/10"
              >
                <Plus size={16} />
                Generate Payroll
              </Link>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {statCards.map((card) => (
            <div key={card.label} className="glass-card rounded-2xl p-4 flex flex-col gap-3 hover:shadow-glass-hover transition-all duration-300">
              <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center ${card.color}`}>
                {card.icon}
              </div>
              <div>
                <div className={`text-xl font-black ${card.color}`}>
                  {card.isCurrency ? formatCurrency(card.value) : card.value}
                </div>
                <div className="text-xs font-semibold text-slate-400 leading-tight mt-0.5">{card.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="glass-card rounded-3xl p-6">
              <h2 className="text-lg font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                <Zap size={18} className="text-primary" />
                Quick Actions
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {QUICK_ACTIONS.map((action) => {
                  const key = ACTION_KEYS[action.label] || 'generate';
                  return onNavigate ? (
                    <button
                      key={action.label}
                      onClick={() => onNavigate(key)}
                      className="group flex flex-col items-center gap-2 p-3 rounded-2xl border border-slate-100 hover:border-primary/30 hover:bg-primary/5 hover:text-primary transition-all duration-200 text-center w-full"
                    >
                      <div className={`w-10 h-10 bg-gradient-to-tr ${action.color} rounded-xl flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform duration-200 mx-auto`}>
                        {action.icon}
                      </div>
                      <span className="text-[11px] font-extrabold text-slate-700 leading-tight mt-1">{action.label}</span>
                    </button>
                  ) : (
                    <Link
                      key={action.label}
                      to={action.to}
                      className="group flex flex-col items-center gap-2 p-3 rounded-2xl border border-slate-100 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 text-center"
                    >
                      <div className={`w-10 h-10 bg-gradient-to-tr ${action.color} rounded-xl flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform duration-200 mx-auto`}>
                        {action.icon}
                      </div>
                      <span className="text-[11px] font-extrabold text-slate-700 leading-tight mt-1">{action.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recent Payroll Records */}
          <div className="lg:col-span-2">
            <div className="glass-card rounded-3xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-extrabold text-slate-900">Recent Payroll</h2>
                {onNavigate ? (
                  <button
                    onClick={() => onNavigate('history')}
                    className="text-xs font-bold text-primary hover:text-primary-dark bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-xl transition-all"
                  >
                    View All
                  </button>
                ) : (
                  <Link to="/payroll/history" className="text-xs font-bold text-primary hover:text-primary-dark bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-xl transition-all">
                    View All
                  </Link>
                )}
              </div>

              {recentRecords.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                    <FileText size={28} className="text-slate-400" />
                  </div>
                  <p className="font-bold text-slate-700 mb-1">No payroll records yet</p>
                  <p className="text-xs text-slate-400 mb-4">Start by generating your first payslip</p>
                  {onNavigate ? (
                    <button
                      onClick={() => onNavigate('generate')}
                      className="px-4 py-2.5 bg-gradient-to-tr from-primary to-primary-light text-white text-sm font-bold rounded-xl shadow-md"
                    >
                      Generate First Payroll
                    </button>
                  ) : (
                    <Link to="/payroll/generate"
                      className="px-4 py-2.5 bg-gradient-to-tr from-primary to-primary-light text-white text-sm font-bold rounded-xl shadow-md">
                      Generate First Payroll
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {recentRecords.map((record) => {
                    const statusCfg = STATUS_CONFIG[record.status];
                    return (
                      <div
                        key={record.id}
                        onClick={() => {
                          if (onNavigate) {
                            onNavigate('generate', record.id);
                          } else {
                            navigate(`/payroll/generate/${record.id}`);
                          }
                        }}
                        className="flex items-center gap-4 p-3.5 rounded-2xl border border-slate-100 hover:border-primary/20 hover:bg-primary/5 cursor-pointer transition-all duration-200 group"
                      >
                        <div className="w-10 h-10 bg-gradient-to-tr from-primary/10 to-primary-light/10 rounded-xl flex items-center justify-center text-primary font-extrabold text-sm flex-shrink-0">
                          {record.employee.employeeName.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-extrabold text-slate-800 text-sm truncate">{record.employee.employeeName || 'Employee'}</div>
                          <div className="text-xs text-slate-400 font-semibold">{record.payrollMonth} • {record.employee.designation || record.employee.department}</div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="font-extrabold text-slate-800 text-sm">
                            ₹{record.calculation.netSalary.toLocaleString('en-IN')}
                          </span>
                          <span className={`text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded border flex items-center gap-1 ${statusCfg.color}`}>
                            {statusCfg.icon}
                            {statusCfg.label}
                          </span>
                        </div>
                        <ChevronRight size={14} className="text-slate-300 group-hover:text-primary transition-colors" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Payroll Status Overview */}
        <div className="glass-card rounded-3xl p-6 mb-8">
          <h2 className="text-lg font-extrabold text-slate-900 mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-primary" />
            Payroll Status Overview
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {(['draft', 'generated', 'paid'] as const).map((status) => {
              const count = records.filter((r) => r.status === status).length;
              const pct = records.length > 0 ? Math.round((count / records.length) * 100) : 0;
              const cfg = STATUS_CONFIG[status];
              return (
                <div key={status} className="text-center">
                  <div className={`text-3xl font-black ${status === 'draft' ? 'text-amber-500' : status === 'generated' ? 'text-blue-600' : 'text-emerald-600'} mb-1`}>
                    {count}
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${status === 'draft' ? 'bg-amber-400' : status === 'generated' ? 'bg-blue-500' : 'bg-emerald-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className={`text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded border ${cfg.color}`}>
                    {cfg.label}
                  </span>
                  <div className="text-xs text-slate-400 font-semibold mt-1">{pct}% of total</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Security Notice */}
        <div className="glass-primary rounded-2xl p-4 flex items-start gap-3">
          <Shield size={18} className="text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-extrabold text-primary">Payroll Security Active</p>
            <p className="text-xs text-primary/70 mt-0.5">
              All payslip PDFs are automatically password-protected. Employee name (uppercase, no spaces) is required to open each payslip.
            </p>
          </div>
        </div>
      </div>

      {/* Voice Enrollment Modal */}
      {showVoiceEnroll && (
        <VoiceAuth
          mode="enroll"
          onSuccess={() => setShowVoiceEnroll(false)}
          onCancel={() => setShowVoiceEnroll(false)}
        />
      )}
    </div>
  );
};

export default PayrollDashboard;

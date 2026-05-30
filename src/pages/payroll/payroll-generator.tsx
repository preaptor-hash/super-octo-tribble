import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ChevronDown, ChevronUp, Plus, Trash2, Calculator, Download,
  Save, ArrowLeft, User, Calendar, IndianRupee, FileText,
  Briefcase, CreditCard, AlertCircle, CheckCircle2, LayoutTemplate, Loader2
} from 'lucide-react';
import {
  usePayrollStore,
  defaultEarnings,
  defaultDeductions,
  generatePayrollId
} from '../../db/payroll-store';
import { generateVyessPayslipPDF, downloadBlob } from '../../lib/pdf-engine';
import type {
  EarningRow,
  DeductionRow,
  LoanDetail,
  PaymentDetail,
  AttendanceData,
  EmployeePayrollDetails,
  PayrollCalculation
} from '../../payroll-types';

// ─── Section Accordion ────────────────────────────────────────────
const Section: React.FC<{
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  badge?: string;
  children: React.ReactNode;
}> = ({ title, icon, isOpen, onToggle, badge, children }) => (
  <div className="glass-card rounded-2xl overflow-hidden mb-4">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-gradient-to-tr from-primary/10 to-primary-light/10 rounded-xl flex items-center justify-center text-primary">
          {icon}
        </div>
        <span className="font-extrabold text-slate-800 text-sm">{title}</span>
        {badge && (
          <span className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded-full font-bold">{badge}</span>
        )}
      </div>
      <div className="text-slate-400">{isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</div>
    </button>
    {isOpen && <div className="px-5 pb-5 border-t border-slate-100 pt-4">{children}</div>}
  </div>
);

// ─── Form Input ───────────────────────────────────────────────────
const FormInput: React.FC<{
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
  required?: boolean;
}> = ({ label, value, onChange, placeholder, type = 'text', className = '', required }) => (
  <div className={`space-y-1 ${className}`}>
    <label className="text-xs font-bold text-slate-600 block">
      {label}{required && <span className="text-rose-400 ml-0.5">*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder || label}
      className="w-full h-10 border border-slate-200 rounded-xl px-3 text-sm focus:border-primary focus:outline-none bg-white transition-colors"
    />
  </div>
);

const genRowId = () => `row_${Date.now()}_${Math.random().toString(36).slice(2)}`;

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const CURRENT_YEAR = new Date().getFullYear();

interface PayrollGeneratorProps {
  id?: string;
  onBack?: () => void;
}

export const PayrollGenerator: React.FC<PayrollGeneratorProps> = ({ id: propId, onBack }) => {
  const navigate = useNavigate();
  const { id: routeId } = useParams<{ id?: string }>();
  const id = propId || routeId;
  const { savePayroll, updatePayroll, getPayroll, templates, company } = usePayrollStore();

  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(id || null);
  const [showPreview, setShowPreview] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfPassword, setPdfPassword] = useState('');

  // Section open states
  const [openSections, setOpenSections] = useState({
    employee: true, attendance: true, earnings: true,
    deductions: true, loans: false, payment: false,
  });

  // Payroll month/year
  const [payrollMonth, setPayrollMonth] = useState(MONTHS[new Date().getMonth()]);
  const [payrollYear, setPayrollYear] = useState(CURRENT_YEAR);

  // Employee details
  const [emp, setEmp] = useState<EmployeePayrollDetails>({
    employeeName: '', employeeId: generatePayrollId('EMP'),
    designation: '', department: '', workLocation: '',
    grade: '', dateOfJoining: '', bankName: '', bankAccountNo: '',
    panNumber: '', uanNumber: '', pfNumber: '', esicNumber: '',
  });

  // Attendance
  const [att, setAtt] = useState<AttendanceData>({
    totalWorkingDays: 26, presentDays: 26, absentDays: 0,
    leaveDays: 0, phWeo: 0, overtimeHours: 0, overtimeRate: 0,
  });

  // Earnings & Deductions
  const [earnings, setEarnings] = useState<EarningRow[]>(defaultEarnings());
  const [deductions, setDeductions] = useState<DeductionRow[]>(defaultDeductions());

  // Loans
  const [loans, setLoans] = useState<LoanDetail[]>([]);

  // Payment
  const [payment, setPayment] = useState<PaymentDetail>({
    mode: '', disbursementDate: '', bank: '', accountNo: '', amount: 0, notes: '',
  });

  // Load existing record
  useEffect(() => {
    if (id) {
      const record = getPayroll(id);
      if (record) {
        Promise.resolve().then(() => {
          setEmp(record.employee);
          setAtt(record.attendance);
          setEarnings(record.earnings);
          setDeductions(record.deductions);
          setLoans(record.loans);
          setPayment(record.payment);
          const [month, year] = record.payrollMonth.split(' ');
          setPayrollMonth(month);
          setPayrollYear(parseInt(year));
          setSavedId(id);
        });
      }
    }
  }, [id, getPayroll]);

  // Toggle section
  const toggleSection = (key: keyof typeof openSections) =>
    setOpenSections((s) => ({ ...s, [key]: !s[key] }));

  // ── Calculations ───────────────────────────────────────────────
  const calc = useCallback((): PayrollCalculation => {
    const basicRow = earnings.find((e) => e.name.toLowerCase().includes('basic'));
    const basicSalary = basicRow?.amount || 0;
    const perDaySalary = att.totalWorkingDays > 0 ? basicSalary / att.totalWorkingDays : 0;
    const presentEarnings = perDaySalary * att.presentDays;
    const absentDeduction = perDaySalary * att.absentDays;
    const overtimeAmount = att.overtimeHours * att.overtimeRate;

    // Auto-update OT in earnings if exists
    const otRow = earnings.find((e) => e.name.toLowerCase().includes('overtime'));
    if (otRow && overtimeAmount > 0) otRow.amount = overtimeAmount;

    const grossEarnings = earnings.reduce((s, e) => s + (e.amount || 0), 0);

    // Auto-calc PF and ESI
    const pfRow = deductions.find((d) => d.name.toLowerCase().includes('provident') || d.name.toLowerCase() === 'pf');
    if (pfRow && pfRow.rate === '12%') {
      pfRow.amount = Math.round(basicSalary * 0.12);
    }
    const esiRow = deductions.find((d) => d.name.toLowerCase() === 'esi' || d.name.toLowerCase().includes('esic'));
    if (esiRow && esiRow.rate === '0.75%') {
      esiRow.amount = Math.round(grossEarnings * 0.0075);
    }

    const totalDeductions = deductions.reduce((s, d) => s + (d.amount || 0), 0);
    const netSalary = Math.max(0, grossEarnings - totalDeductions);

    return { perDaySalary, presentEarnings, absentDeduction, overtimeAmount, grossEarnings, totalDeductions, netSalary };
  }, [earnings, deductions, att]);

  const calculation = calc();

  const formatINR = (v: number) => `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

  // ── Earnings Row Handlers ─────────────────────────────────────
  const addEarning = () => setEarnings((e) => [...e, { id: genRowId(), name: '', rate: '', amount: 0 }]);
  const removeEarning = (id: string) => setEarnings((e) => e.filter((r) => r.id !== id));
  const updateEarning = (id: string, field: keyof EarningRow, value: string | number) =>
    setEarnings((e) => e.map((r) => (r.id === id ? { ...r, [field]: value } : r)));

  // ── Deduction Row Handlers ────────────────────────────────────
  const addDeduction = () => setDeductions((d) => [...d, { id: genRowId(), name: '', rate: '', amount: 0 }]);
  const removeDeduction = (id: string) => setDeductions((d) => d.filter((r) => r.id !== id));
  const updateDeduction = (id: string, field: keyof DeductionRow, value: string | number) =>
    setDeductions((d) => d.map((r) => (r.id === id ? { ...r, [field]: value } : r)));

  // ── Loan Handlers ─────────────────────────────────────────────
  const addLoan = () => setLoans((l) => [...l, { id: genRowId(), name: '', loanAmount: 0, balanceAmount: 0, installmentAmount: 0 }]);
  const removeLoan = (id: string) => setLoans((l) => l.filter((r) => r.id !== id));
  const updateLoan = (id: string, field: keyof LoanDetail, value: string | number) =>
    setLoans((l) => l.map((r) => (r.id === id ? { ...r, [field]: value } : r)));

  // ── Apply Template ────────────────────────────────────────────
  const applyTemplate = (templateId: string) => {
    const tpl = templates.find((t) => t.id === templateId);
    if (!tpl) return;
    setEarnings(tpl.earnings.map((e) => ({ ...e, id: genRowId() })));
    setDeductions(tpl.deductions.map((d) => ({ ...d, id: genRowId() })));
  };

  // ── Build Record ──────────────────────────────────────────────
  const buildRecord = (status: 'draft' | 'generated') => ({
    payrollMonth: `${payrollMonth} ${payrollYear}`,
    payrollYear,
    status,
    employee: emp,
    attendance: att,
    earnings: earnings.filter((e) => e.name.trim() || e.amount > 0),
    deductions: deductions.filter((d) => d.name.trim() || d.amount > 0),
    loans: loans.filter((l) => l.name.trim() || l.loanAmount > 0),
    payment,
    calculation,
  });

  // ── Save Draft ────────────────────────────────────────────────
  const handleSave = async () => {
    setIsSaving(true);
    const data = buildRecord('draft');
    if (savedId) {
      await updatePayroll(savedId, data);
    } else {
      const record = await savePayroll(data);
      setSavedId(record.id);
      if (!onBack) {
        navigate(`/payroll/generate/${record.id}`, { replace: true });
      }
    }
    setIsSaving(false);
  };

  // ── Generate PDF ──────────────────────────────────────────────
  const handleGeneratePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const data = buildRecord('generated');
      let recordId = savedId;
      if (!recordId) {
        const record = await savePayroll(data);
        recordId = record.id;
        setSavedId(record.id);
        if (!onBack) {
          navigate(`/payroll/generate/${record.id}`, { replace: true });
        }
      } else {
        await updatePayroll(recordId, data);
      }
      const fullRecord = { ...data, id: recordId!, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      const result = await generateVyessPayslipPDF(fullRecord as PayrollRecord, company);
      setPdfBlob(result.blob);
      setPdfPassword(result.password);
      setShowPreview(true);
    } catch (err) {
      console.error('PDF generation error:', err);
    }
    setIsGeneratingPDF(false);
  };

  // ── Download PDF ──────────────────────────────────────────────
  const handleDownload = async () => {
    if (pdfBlob && emp.employeeName) {
      const monthLabel = `${payrollMonth}_${payrollYear}`;
      downloadBlob(pdfBlob, `${emp.employeeName.replace(/\s+/g, '_')}_Payslip_${monthLabel}.pdf`);
    }
  };

  return (
    <div className="min-h-screen pb-28 md:pb-8 pt-6 px-4 md:px-6 relative overflow-x-hidden">
      <div className="absolute top-0 right-0 fluid-orb-indigo pointer-events-none z-0 opacity-50" />

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {onBack ? (
              <button onClick={onBack}
                className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary/30 transition-all cursor-pointer">
                <ArrowLeft size={16} />
              </button>
            ) : (
              <Link to="/payroll"
                className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary/30 transition-all">
                <ArrowLeft size={16} />
              </Link>
            )}
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">
                {id ? 'Edit Payroll' : 'Generate Payroll'}
              </h1>
              <p className="text-xs text-slate-400 font-semibold">VYESS Payroll Engine • Manual Entry</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleSave} disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-50 transition-all">
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save Draft
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Form */}
          <div className="lg:col-span-2 space-y-0">
            {/* Month/Year selector + Template */}
            <div className="glass-card rounded-2xl p-5 mb-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Payroll Month</label>
                  <select value={payrollMonth} onChange={(e) => setPayrollMonth(e.target.value)}
                    className="w-full h-10 border border-slate-200 rounded-xl px-3 text-sm focus:border-primary focus:outline-none bg-white">
                    {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Year</label>
                  <select value={payrollYear} onChange={(e) => setPayrollYear(parseInt(e.target.value))}
                    className="w-full h-10 border border-slate-200 rounded-xl px-3 text-sm focus:border-primary focus:outline-none bg-white">
                    {[CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-600 block mb-1 flex items-center gap-1">
                    <LayoutTemplate size={11} />Apply Salary Template
                  </label>
                  <select onChange={(e) => e.target.value && applyTemplate(e.target.value)} defaultValue=""
                    className="w-full h-10 border border-slate-200 rounded-xl px-3 text-sm focus:border-primary focus:outline-none bg-white">
                    <option value="">— Choose Template —</option>
                    {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* 1. Employee Details */}
            <Section title="Employee Details" icon={<User size={16} />}
              isOpen={openSections.employee} onToggle={() => toggleSection('employee')}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormInput label="Employee Name" value={emp.employeeName}
                  onChange={(v) => setEmp((e) => ({ ...e, employeeName: v }))} required />
                <FormInput label="Employee ID" value={emp.employeeId}
                  onChange={(v) => setEmp((e) => ({ ...e, employeeId: v }))} />
                <FormInput label="Designation" value={emp.designation}
                  onChange={(v) => setEmp((e) => ({ ...e, designation: v }))} />
                <FormInput label="Department" value={emp.department}
                  onChange={(v) => setEmp((e) => ({ ...e, department: v }))} />
                <FormInput label="Work Location" value={emp.workLocation}
                  onChange={(v) => setEmp((e) => ({ ...e, workLocation: v }))} />
                <FormInput label="Grade" value={emp.grade}
                  onChange={(v) => setEmp((e) => ({ ...e, grade: v }))} />
                <FormInput label="Date of Joining" type="date" value={emp.dateOfJoining}
                  onChange={(v) => setEmp((e) => ({ ...e, dateOfJoining: v }))} />
                <FormInput label="Bank Name" value={emp.bankName}
                  onChange={(v) => setEmp((e) => ({ ...e, bankName: v }))} />
                <FormInput label="Bank Account No." value={emp.bankAccountNo}
                  onChange={(v) => setEmp((e) => ({ ...e, bankAccountNo: v }))} />
                <FormInput label="PAN Number" value={emp.panNumber}
                  onChange={(v) => setEmp((e) => ({ ...e, panNumber: v }))} />
                <FormInput label="UAN Number" value={emp.uanNumber}
                  onChange={(v) => setEmp((e) => ({ ...e, uanNumber: v }))} />
                <FormInput label="PF Number" value={emp.pfNumber}
                  onChange={(v) => setEmp((e) => ({ ...e, pfNumber: v }))} />
                <FormInput label="ESIC Number" value={emp.esicNumber}
                  onChange={(v) => setEmp((e) => ({ ...e, esicNumber: v }))} />
              </div>
            </Section>

            {/* 2. Attendance */}
            <Section title="Attendance Details" icon={<Calendar size={16} />}
              isOpen={openSections.attendance} onToggle={() => toggleSection('attendance')}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { label: 'Total Working Days', field: 'totalWorkingDays' },
                  { label: 'Present Days', field: 'presentDays' },
                  { label: 'Absent Days', field: 'absentDays' },
                  { label: 'Leave Days', field: 'leaveDays' },
                  { label: 'PH / WEO', field: 'phWeo' },
                  { label: 'Overtime Hours', field: 'overtimeHours' },
                ].map(({ label, field }) => (
                  <FormInput key={field} label={label} type="number"
                    value={att[field as keyof AttendanceData]}
                    onChange={(v) => setAtt((a) => ({ ...a, [field]: parseFloat(v) || 0 }))} />
                ))}
                <FormInput label="Overtime Rate (₹/hr)" type="number"
                  value={att.overtimeRate}
                  onChange={(v) => setAtt((a) => ({ ...a, overtimeRate: parseFloat(v) || 0 }))} />
                <div className="md:col-span-2 bg-primary/5 rounded-xl p-3 text-xs">
                  <span className="font-bold text-primary">Per Day Salary: </span>
                  <span className="text-slate-700 font-semibold">{formatINR(calculation.perDaySalary)}</span>
                  <span className="mx-2 text-slate-300">|</span>
                  <span className="font-bold text-primary">OT Amount: </span>
                  <span className="text-slate-700 font-semibold">{formatINR(calculation.overtimeAmount)}</span>
                </div>
              </div>
            </Section>

            {/* 3. Earnings */}
            <Section title="Earnings" icon={<IndianRupee size={16} />}
              isOpen={openSections.earnings} onToggle={() => toggleSection('earnings')}
              badge={`${earnings.filter(e => e.amount > 0).length} active`}>
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-1">
                  <span className="col-span-6">Component</span>
                  <span className="col-span-3">Rate</span>
                  <span className="col-span-2">Amount (₹)</span>
                  <span className="col-span-1"></span>
                </div>
                {earnings.map((row) => (
                  <div key={row.id} className="grid grid-cols-12 gap-2 items-center">
                    <input value={row.name} onChange={(e) => updateEarning(row.id, 'name', e.target.value)}
                      placeholder="Earning name" className="col-span-6 h-9 border border-slate-200 rounded-xl px-2.5 text-xs focus:border-primary focus:outline-none" />
                    <input value={row.rate} onChange={(e) => updateEarning(row.id, 'rate', e.target.value)}
                      placeholder="e.g. 40%" className="col-span-3 h-9 border border-slate-200 rounded-xl px-2.5 text-xs focus:border-primary focus:outline-none" />
                    <input type="number" value={row.amount || ''}
                      onChange={(e) => updateEarning(row.id, 'amount', parseFloat(e.target.value) || 0)}
                      placeholder="0.00" className="col-span-2 h-9 border border-slate-200 rounded-xl px-2.5 text-xs focus:border-primary focus:outline-none font-mono" />
                    <button onClick={() => removeEarning(row.id)}
                      className="col-span-1 w-8 h-8 flex items-center justify-center text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
                <button onClick={addEarning}
                  className="flex items-center gap-2 text-xs font-bold text-primary hover:text-primary-dark bg-primary/5 hover:bg-primary/10 px-3 py-2 rounded-xl transition-all mt-2">
                  <Plus size={13} />
                  Add Earning Component
                </button>
              </div>
            </Section>

            {/* 4. Deductions */}
            <Section title="Deductions" icon={<TrendingDownIcon />}
              isOpen={openSections.deductions} onToggle={() => toggleSection('deductions')}
              badge={`${deductions.filter(d => d.amount > 0).length} active`}>
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-1">
                  <span className="col-span-6">Deduction</span>
                  <span className="col-span-3">Rate</span>
                  <span className="col-span-2">Amount (₹)</span>
                  <span className="col-span-1"></span>
                </div>
                {deductions.map((row) => (
                  <div key={row.id} className="grid grid-cols-12 gap-2 items-center">
                    <input value={row.name} onChange={(e) => updateDeduction(row.id, 'name', e.target.value)}
                      placeholder="Deduction name" className="col-span-6 h-9 border border-slate-200 rounded-xl px-2.5 text-xs focus:border-primary focus:outline-none" />
                    <input value={row.rate} onChange={(e) => updateDeduction(row.id, 'rate', e.target.value)}
                      placeholder="e.g. 12%" className="col-span-3 h-9 border border-slate-200 rounded-xl px-2.5 text-xs focus:border-primary focus:outline-none" />
                    <input type="number" value={row.amount || ''}
                      onChange={(e) => updateDeduction(row.id, 'amount', parseFloat(e.target.value) || 0)}
                      placeholder="0.00" className="col-span-2 h-9 border border-slate-200 rounded-xl px-2.5 text-xs focus:border-primary focus:outline-none font-mono" />
                    <button onClick={() => removeDeduction(row.id)}
                      className="col-span-1 w-8 h-8 flex items-center justify-center text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
                <button onClick={addDeduction}
                  className="flex items-center gap-2 text-xs font-bold text-primary hover:text-primary-dark bg-primary/5 hover:bg-primary/10 px-3 py-2 rounded-xl transition-all mt-2">
                  <Plus size={13} />
                  Add Deduction
                </button>
              </div>
            </Section>

            {/* 5. Loan Details */}
            <Section title="Loan Details" icon={<CreditCard size={16} />}
              isOpen={openSections.loans} onToggle={() => toggleSection('loans')}
              badge={loans.length > 0 ? `${loans.length}` : undefined}>
              {loans.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-xs text-slate-400 mb-3">No loan details added</p>
                  <button onClick={addLoan}
                    className="flex items-center gap-2 text-xs font-bold text-primary bg-primary/5 hover:bg-primary/10 px-4 py-2 rounded-xl mx-auto transition-all">
                    <Plus size={13} />
                    Add Loan
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-1">
                    <span className="col-span-3">Loan Name</span>
                    <span className="col-span-3">Loan Amt</span>
                    <span className="col-span-3">Balance</span>
                    <span className="col-span-2">Installment</span>
                    <span className="col-span-1"></span>
                  </div>
                  {loans.map((row) => (
                    <div key={row.id} className="grid grid-cols-12 gap-2 items-center">
                      <input value={row.name} onChange={(e) => updateLoan(row.id, 'name', e.target.value)}
                        placeholder="Loan name" className="col-span-3 h-9 border border-slate-200 rounded-xl px-2.5 text-xs focus:border-primary focus:outline-none" />
                      <input type="number" value={row.loanAmount || ''}
                        onChange={(e) => updateLoan(row.id, 'loanAmount', parseFloat(e.target.value) || 0)}
                        placeholder="0.00" className="col-span-3 h-9 border border-slate-200 rounded-xl px-2.5 text-xs focus:border-primary focus:outline-none font-mono" />
                      <input type="number" value={row.balanceAmount || ''}
                        onChange={(e) => updateLoan(row.id, 'balanceAmount', parseFloat(e.target.value) || 0)}
                        placeholder="0.00" className="col-span-3 h-9 border border-slate-200 rounded-xl px-2.5 text-xs focus:border-primary focus:outline-none font-mono" />
                      <input type="number" value={row.installmentAmount || ''}
                        onChange={(e) => updateLoan(row.id, 'installmentAmount', parseFloat(e.target.value) || 0)}
                        placeholder="0.00" className="col-span-2 h-9 border border-slate-200 rounded-xl px-2.5 text-xs focus:border-primary focus:outline-none font-mono" />
                      <button onClick={() => removeLoan(row.id)}
                        className="col-span-1 w-8 h-8 flex items-center justify-center text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                  <button onClick={addLoan}
                    className="flex items-center gap-2 text-xs font-bold text-primary bg-primary/5 hover:bg-primary/10 px-3 py-2 rounded-xl mt-2 transition-all">
                    <Plus size={13} />Add Loan
                  </button>
                </div>
              )}
            </Section>

            {/* 6. Payment Details */}
            <Section title="Payment Details" icon={<Briefcase size={16} />}
              isOpen={openSections.payment} onToggle={() => toggleSection('payment')}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Payment Mode</label>
                  <select value={payment.mode} onChange={(e) => setPayment((p) => ({ ...p, mode: e.target.value }))}
                    className="w-full h-10 border border-slate-200 rounded-xl px-3 text-sm focus:border-primary focus:outline-none bg-white">
                    <option value="">Select Mode</option>
                    <option>Bank Transfer</option>
                    <option>Cash</option>
                    <option>Cheque</option>
                    <option>UPI</option>
                    <option>NEFT</option>
                    <option>RTGS</option>
                  </select>
                </div>
                <FormInput label="Disbursement Date" type="date" value={payment.disbursementDate}
                  onChange={(v) => setPayment((p) => ({ ...p, disbursementDate: v }))} />
                <FormInput label="Employee Bank" value={payment.bank}
                  onChange={(v) => setPayment((p) => ({ ...p, bank: v }))} />
                <FormInput label="Account No." value={payment.accountNo}
                  onChange={(v) => setPayment((p) => ({ ...p, accountNo: v }))} />
                <FormInput label="Amount" type="number" value={payment.amount || ''}
                  onChange={(v) => setPayment((p) => ({ ...p, amount: parseFloat(v) || 0 }))} />
                <FormInput label="Transaction Notes" value={payment.notes}
                  onChange={(v) => setPayment((p) => ({ ...p, notes: v }))} />
              </div>
            </Section>
          </div>

          {/* Right: Calculation Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* Live Calculation */}
              <div className="glass-card rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Calculator size={16} className="text-primary" />
                  <h3 className="font-extrabold text-slate-800 text-sm">Live Calculation</h3>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Per Day Salary', value: calculation.perDaySalary, color: 'text-slate-700' },
                    { label: 'OT Amount', value: calculation.overtimeAmount, color: 'text-blue-600' },
                    { label: 'Gross Earnings', value: calculation.grossEarnings, color: 'text-emerald-600', bold: true },
                    { label: 'Total Deductions', value: calculation.totalDeductions, color: 'text-rose-500' },
                  ].map(({ label, value, color, bold }) => (
                    <div key={label} className="flex justify-between items-center py-1.5 border-b border-slate-100 last:border-0">
                      <span className="text-xs font-semibold text-slate-500">{label}</span>
                      <span className={`text-sm font-${bold ? 'extrabold' : 'bold'} ${color}`}>
                        {formatINR(value)}
                      </span>
                    </div>
                  ))}
                </div>
                {/* Net Pay highlight */}
                <div className="mt-4 bg-gradient-to-tr from-primary to-primary-light rounded-2xl p-4 text-white text-center">
                  <div className="text-xs font-bold opacity-80 mb-1">NET PAY</div>
                  <div className="text-2xl font-black">
                    {formatINR(calculation.netSalary)}
                  </div>
                </div>
              </div>

              {/* Password Info */}
              {emp.employeeName && company.enablePasswordProtection && (
                <div className="glass-warning rounded-2xl p-4">
                  <p className="text-xs font-bold text-amber-800 mb-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    PDF Password
                  </p>
                  <p className="text-lg font-black text-amber-900 font-mono">
                    {emp.employeeName.replace(/\s+/g, '').toUpperCase()}
                  </p>
                  <p className="text-[10px] text-amber-700 mt-1">Employee name • no spaces • uppercase</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2">
                <button onClick={handleGeneratePDF} disabled={isGeneratingPDF || !emp.employeeName}
                  className="w-full py-3 bg-gradient-to-tr from-primary to-primary-light text-white font-extrabold rounded-2xl shadow-premium hover:scale-[1.02] active:scale-[0.98] transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  {isGeneratingPDF ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                  {isGeneratingPDF ? 'Generating...' : 'Generate Payslip PDF'}
                </button>
                <button onClick={handleSave} disabled={isSaving}
                  className="w-full py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-all">
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Save Draft
                </button>
                 {onBack ? (
                  <button onClick={onBack} className="w-full py-2.5 text-slate-400 text-sm font-semibold text-center block hover:text-slate-600 transition-colors cursor-pointer">
                    Back to Dashboard
                  </button>
                ) : (
                  <Link to="/payroll" className="w-full py-2.5 text-slate-400 text-sm font-semibold text-center block hover:text-slate-600 transition-colors">
                    Back to Dashboard
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PDF Preview Modal */}
      {showPreview && pdfBlob && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-slide-up">
            <div className="bg-gradient-to-tr from-primary to-primary-light p-6 text-white">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle2 size={20} />
                <h3 className="font-extrabold text-lg">Payslip Generated!</h3>
              </div>
              <p className="text-white/80 text-sm">Your VYESS payslip PDF is ready to download.</p>
            </div>
            <div className="p-6 space-y-4">
              {/* Password info */}
              {pdfPassword && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-800 text-sm">🔒 PDF is Password Protected</p>
                      <p className="text-amber-700 text-xs mt-1">
                        Your payslip PDF is password protected. Use your employee name without spaces to open the document.
                      </p>
                      <div className="mt-2 bg-amber-100 rounded-xl px-3 py-2">
                        <span className="text-xs font-bold text-amber-700">Password: </span>
                        <span className="font-black text-amber-900 font-mono text-sm">{pdfPassword}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Employee summary */}
              <div className="bg-slate-50 rounded-2xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Employee</span>
                  <span className="font-bold text-slate-800">{emp.employeeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Month</span>
                  <span className="font-bold text-slate-800">{payrollMonth} {payrollYear}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Net Pay</span>
                  <span className="font-extrabold text-emerald-600">{formatINR(calculation.netSalary)}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={handleDownload}
                  className="flex-1 py-3 bg-gradient-to-tr from-primary to-primary-light text-white font-extrabold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg">
                  <Download size={15} />
                  Download PDF
                </button>
                <button onClick={() => setShowPreview(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl text-sm hover:bg-slate-200 transition-all">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Tiny icon helper
const TrendingDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
    <polyline points="17 18 23 18 23 12" />
  </svg>
);

export default PayrollGenerator;

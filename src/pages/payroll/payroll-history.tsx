import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Search, Eye, Edit3, Trash2, 
  Copy, CheckCircle2, Circle, AlertCircle, FileText, Download 
} from 'lucide-react';
import { usePayrollStore } from '../../db/payroll-store';
import { generateVyessPayslipPDF, downloadBlob } from '../../lib/pdf-engine';
import type { PayrollRecord, PayrollStatus } from '../../payroll-types';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const YEARS = [new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1];

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: <Circle size={10} /> },
  generated: { label: 'Generated', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: <CheckCircle2 size={10} /> },
  paid: { label: 'Paid', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle2 size={10} /> },
};

export const PayrollHistory: React.FC = () => {
  const navigate = useNavigate();
  const { deletePayroll, duplicatePayroll, setPayrollStatus, filterRecords, company } = usePayrollStore();

  const [search, setSearch] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState<number | undefined>(undefined);
  const [status, setStatus] = useState<PayrollStatus | undefined>(undefined);

  const [showPreview, setShowPreview] = useState(false);
  const [previewRecord, setPreviewRecord] = useState<PayrollRecord | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfPassword, setPdfPassword] = useState('');

  const filtered = filterRecords({
    search: search.trim() || undefined,
    month: month || undefined,
    year: year || undefined,
    status: status || undefined,
  });

  const handlePreviewPDF = async (record: PayrollRecord) => {
    try {
      const result = await generateVyessPayslipPDF(record, company);
      setPdfBlob(result.blob);
      setPdfPassword(result.password);
      setPreviewRecord(record);
      setShowPreview(true);
    } catch (err) {
      console.error(err);
      alert('Error generating payslip preview.');
    }
  };

  const handleDownload = () => {
    if (pdfBlob && previewRecord) {
      const monthLabel = previewRecord.payrollMonth.replace(/\s+/g, '_');
      downloadBlob(pdfBlob, `${previewRecord.employee.employeeName.replace(/\s+/g, '_')}_Payslip_${monthLabel}.pdf`);
    }
  };

  const handleDuplicate = async (id: string) => {
    const dup = await duplicatePayroll(id);
    if (dup) {
      alert('Payroll record successfully duplicated as a new draft!');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this payroll record?')) {
      await deletePayroll(id);
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    await setPayrollStatus(id, 'paid');
    alert('Payroll record status successfully updated to Paid!');
  };

  return (
    <div className="min-h-screen pb-28 md:pb-8 pt-6 px-4 md:px-8 relative overflow-x-hidden">
      <div className="absolute top-[-60px] left-[-60px] fluid-orb-indigo pointer-events-none z-0" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/payroll" className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary/30 transition-all">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Payroll History</h1>
            <p className="text-xs text-slate-400 font-semibold">Manage, filter, and export generated payslips</p>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="glass-card rounded-2xl p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                <Search size={16} />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search employee or ID..."
                className="w-full h-10 pl-10 border border-slate-200 rounded-xl px-3 text-sm focus:border-primary focus:outline-none bg-white font-medium"
              />
            </div>

            <div>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full h-10 border border-slate-200 rounded-xl px-3 text-sm focus:border-primary focus:outline-none bg-white font-medium text-slate-600"
              >
                <option value="">All Months</option>
                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div>
              <select
                value={year || ''}
                onChange={(e) => setYear(e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full h-10 border border-slate-200 rounded-xl px-3 text-sm focus:border-primary focus:outline-none bg-white font-medium text-slate-600"
              >
                <option value="">All Years</option>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <div>
              <select
                value={status || ''}
                onChange={(e) => setStatus(e.target.value ? e.target.value as PayrollStatus : undefined)}
                className="w-full h-10 border border-slate-200 rounded-xl px-3 text-sm focus:border-primary focus:outline-none bg-white font-medium text-slate-600"
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="generated">Generated</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>
        </div>

        {/* History Table */}
        <div className="glass-card rounded-3xl overflow-hidden shadow-sm">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                <FileText size={28} className="text-slate-400" />
              </div>
              <p className="font-bold text-slate-700 mb-1">No payroll records match filters</p>
              <p className="text-xs text-slate-400">Try modifying your search criteria or generate a new payroll entry.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    <th className="py-4 px-6">Employee ID / Name</th>
                    <th className="py-4 px-6">Month</th>
                    <th className="py-4 px-6">Net Pay</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((record) => {
                    const statusCfg = STATUS_CONFIG[record.status];
                    return (
                      <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4.5 px-6">
                          <div className="font-extrabold text-slate-800 text-sm">{record.employee.employeeName}</div>
                          <div className="text-[10px] text-slate-400 font-bold mt-0.5">{record.employee.employeeId}</div>
                        </td>
                        <td className="py-4.5 px-6 text-sm font-semibold text-slate-600">
                          {record.payrollMonth}
                        </td>
                        <td className="py-4.5 px-6 text-sm font-black text-slate-800">
                          ₹{record.calculation.netSalary.toLocaleString('en-IN')}
                        </td>
                        <td className="py-4.5 px-6">
                          <span className={`text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded border inline-flex items-center gap-1 ${statusCfg.color}`}>
                            {statusCfg.icon}
                            {statusCfg.label}
                          </span>
                        </td>
                        <td className="py-4.5 px-6 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handlePreviewPDF(record)}
                              title="Preview / Download PDF"
                              className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-primary/10 text-slate-500 hover:text-primary flex items-center justify-center transition-all"
                            >
                              <Eye size={14} />
                            </button>

                            {record.status === 'draft' ? (
                              <button
                                onClick={() => navigate(`/payroll/generate/${record.id}`)}
                                title="Edit Draft"
                                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-500 hover:text-blue-600 flex items-center justify-center transition-all"
                              >
                                <Edit3 size={14} />
                              </button>
                            ) : record.status === 'generated' ? (
                              <button
                                onClick={() => handleMarkAsPaid(record.id)}
                                title="Mark as Paid"
                                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 flex items-center justify-center transition-all"
                              >
                                <CheckCircle2 size={14} />
                              </button>
                            ) : null}

                            <button
                              onClick={() => handleDuplicate(record.id)}
                              title="Duplicate Record"
                              className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 flex items-center justify-center transition-all"
                            >
                              <Copy size={14} />
                            </button>

                            <button
                              onClick={() => handleDelete(record.id)}
                              title="Delete Record"
                              className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 flex items-center justify-center transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* PDF Preview Modal */}
      {showPreview && previewRecord && pdfBlob && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-slide-up">
            <div className="bg-gradient-to-tr from-primary to-primary-light p-6 text-white">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle2 size={20} />
                <h3 className="font-extrabold text-lg">Payslip Generated!</h3>
              </div>
              <p className="text-white/80 text-sm">VYESS payslip PDF is ready to download.</p>
            </div>
            <div className="p-6 space-y-4">
              {pdfPassword && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-800 text-sm">🔒 PDF Password Protected</p>
                      <p className="text-amber-700 text-xs mt-1">
                        Use the uppercase employee name (no spaces) to open the document.
                      </p>
                      <div className="mt-2 bg-amber-100 rounded-xl px-3 py-2">
                        <span className="text-xs font-bold text-amber-700">Password: </span>
                        <span className="font-black text-amber-900 font-mono text-sm">{pdfPassword}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-slate-50 rounded-2xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Employee</span>
                  <span className="font-bold text-slate-800">{previewRecord.employee.employeeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Month</span>
                  <span className="font-bold text-slate-800">{previewRecord.payrollMonth}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Net Pay</span>
                  <span className="font-extrabold text-emerald-600">₹{previewRecord.calculation.netSalary.toLocaleString('en-IN')}</span>
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

export default PayrollHistory;

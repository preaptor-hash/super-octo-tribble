import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, Download, BarChart3, 
  TrendingUp, TrendingDown, Users, CircleDollarSign 
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { usePayrollStore } from '../../db/payroll-store';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export const PayrollReports: React.FC = () => {
  const { records } = usePayrollStore();

  const [selectedMonth, setSelectedMonth] = useState(MONTHS[new Date().getMonth()]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const currentFilterLabel = `${selectedMonth} ${selectedYear}`;
  const thisMonthRecords = records.filter(r => r.payrollMonth === currentFilterLabel && (r.status === 'generated' || r.status === 'paid'));

  // Aggregated Stats
  const totalNetPay = thisMonthRecords.reduce((sum, r) => sum + r.calculation.netSalary, 0);
  const totalGross = thisMonthRecords.reduce((sum, r) => sum + r.calculation.grossEarnings, 0);
  const totalDeductions = thisMonthRecords.reduce((sum, r) => sum + r.calculation.totalDeductions, 0);
  const employeeCount = new Set(thisMonthRecords.map(r => r.employee.employeeId)).size;

  // Department Breakdown
  const deptSummary = thisMonthRecords.reduce((acc: { [key: string]: { count: number, net: number } }, r) => {
    const dept = r.employee.department || 'Operations';
    if (!acc[dept]) {
      acc[dept] = { count: 0, net: 0 };
    }
    acc[dept].count += 1;
    acc[dept].net += r.calculation.netSalary;
    return acc;
  }, {});

  const deptData = Object.keys(deptSummary).map(dept => ({
    department: dept,
    count: deptSummary[dept].count,
    netPay: deptSummary[dept].net
  }));

  const handleExportExcel = () => {
    if (thisMonthRecords.length === 0) {
      alert('No generated or paid payroll records found for the selected month.');
      return;
    }

    const exportData = thisMonthRecords.map(r => ({
      'Employee ID': r.employee.employeeId,
      'Employee Name': r.employee.employeeName,
      'Designation': r.employee.designation,
      'Department': r.employee.department,
      'Grade': r.employee.grade,
      'Basic Salary': r.earnings.find(e => e.name.toLowerCase().includes('basic'))?.amount || 0,
      'Gross Earnings': r.calculation.grossEarnings,
      'PF': r.deductions.find(d => d.name.toLowerCase().includes('provident') || d.name.toLowerCase() === 'pf')?.amount || 0,
      'ESI': r.deductions.find(d => d.name.toLowerCase() === 'esi' || d.name.toLowerCase().includes('esic'))?.amount || 0,
      'Total Deductions': r.calculation.totalDeductions,
      'Net Pay': r.calculation.netSalary,
      'Payment Mode': r.payment.mode || 'Cash',
      'Status': r.status.toUpperCase(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Payroll_${selectedMonth}_${selectedYear}`);
    
    // Add columns auto-fit
    const maxKeys = Object.keys(exportData[0] || {});
    worksheet['!cols'] = maxKeys.map(k => ({ wch: Math.max(k.length + 4, 15) }));

    XLSX.writeFile(workbook, `VYESS_Payroll_Report_${selectedMonth}_${selectedYear}.xlsx`);
  };

  return (
    <div className="min-h-screen pb-28 md:pb-8 pt-6 px-4 md:px-8 relative overflow-x-hidden">
      <div className="absolute top-[-60px] left-[-60px] fluid-orb-indigo pointer-events-none z-0" />

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link to="/payroll" className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary/30 transition-all">
              <ArrowLeft size={16} />
            </Link>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Payroll Reports</h1>
              <p className="text-xs text-slate-400 font-semibold">Generate analytical summaries and export spreadsheets</p>
            </div>
          </div>
        </div>

        {/* Date Selector */}
        <div className="glass-card rounded-2xl p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 block">Select Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full h-10 border border-slate-200 rounded-xl px-3 text-sm focus:border-primary focus:outline-none bg-white font-medium text-slate-700"
              >
                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 block">Select Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full h-10 border border-slate-200 rounded-xl px-3 text-sm focus:border-primary focus:outline-none bg-white font-medium text-slate-700"
              >
                {[new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div>
              <button
                onClick={handleExportExcel}
                className="w-full h-10 bg-gradient-to-tr from-amber-500 to-orange-500 text-white font-extrabold rounded-xl shadow-premium text-xs flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Download size={14} />
                Export to Excel (.xlsx)
              </button>
            </div>
          </div>
        </div>

        {/* Aggregated Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Active Employees', value: employeeCount, icon: <Users size={18} />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Total Gross Pay', value: totalGross, icon: <TrendingUp size={18} />, color: 'text-blue-600', bg: 'bg-blue-50', isCurrency: true },
            { label: 'Total Deductions', value: totalDeductions, icon: <TrendingDown size={18} />, color: 'text-rose-500', bg: 'bg-rose-50', isCurrency: true },
            { label: 'Net Disbursement', value: totalNetPay, icon: <CircleDollarSign size={18} />, color: 'text-emerald-600', bg: 'bg-emerald-50', isCurrency: true },
          ].map((card, idx) => (
            <div key={idx} className="glass-card rounded-2xl p-4.5 flex flex-col gap-3">
              <div className={`w-9 h-9 ${card.bg} rounded-xl flex items-center justify-center ${card.color}`}>
                {card.icon}
              </div>
              <div>
                <div className={`text-lg font-black ${card.color}`}>
                  {card.isCurrency ? `₹${card.value.toLocaleString('en-IN')}` : card.value}
                </div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mt-0.5 leading-none">
                  {card.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Department Breakdown */}
        <div className="glass-card rounded-3xl p-6">
          <h2 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
            <BarChart3 size={16} className="text-primary" />
            Department Wise Breakdown ({currentFilterLabel})
          </h2>

          {deptData.length === 0 ? (
            <p className="text-xs text-slate-400 italic text-center py-8">No payroll records found for this period.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Employee Count</th>
                    <th className="py-3 px-4 text-right">Net Salary Disbursement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {deptData.map((row, idx) => (
                    <tr key={idx} className="text-xs font-semibold text-slate-700">
                      <td className="py-3.5 px-4 font-bold text-slate-800">{row.department}</td>
                      <td className="py-3.5 px-4">{row.count}</td>
                      <td className="py-3.5 px-4 text-right font-black text-slate-800">
                        ₹{row.netPay.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PayrollReports;

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Edit3, Trash2, User, 
  Search, CreditCard, Shield 
} from 'lucide-react';
import { usePayrollStore } from '../../db/payroll-store';
import { useHRMSStore } from '../../db/store';
import type { EmployeePayrollProfile } from '../../payroll-types';

export const EmployeeProfiles: React.FC = () => {
  const { employees, saveEmployeeProfile, updateEmployeeProfile, deleteEmployeeProfile, templates } = usePayrollStore();
  const { workers } = useHRMSStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Form State
  const [workerId, setWorkerId] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState('');
  const [workLocation, setWorkLocation] = useState('');
  const [grade, setGrade] = useState('');
  const [dateOfJoining, setDateOfJoining] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountNo, setBankAccountNo] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [uanNumber, setUanNumber] = useState('');
  const [pfNumber, setpfNumber] = useState('');
  const [esicNumber, setesicNumber] = useState('');
  const [defaultSalaryTemplateId, setDefaultSalaryTemplateId] = useState('');
  const [basicSalary, setBasicSalary] = useState<number>(0);

  const handleOpenNew = () => {
    setWorkerId('');
    setEmployeeName('');
    setEmployeeId('');
    setDesignation('');
    setDepartment('');
    setWorkLocation('');
    setGrade('');
    setDateOfJoining('');
    setBankName('');
    setBankAccountNo('');
    setPanNumber('');
    setUanNumber('');
    setpfNumber('');
    setesicNumber('');
    setDefaultSalaryTemplateId('');
    setBasicSalary(0);
    setEditingId(null);
    setIsEditing(true);
  };

  const handleOpenEdit = (emp: EmployeePayrollProfile) => {
    setWorkerId(emp.workerId || '');
    setEmployeeName(emp.employeeName);
    setEmployeeId(emp.employeeId);
    setDesignation(emp.designation);
    setDepartment(emp.department);
    setWorkLocation(emp.workLocation);
    setGrade(emp.grade);
    setDateOfJoining(emp.dateOfJoining);
    setBankName(emp.bankName);
    setBankAccountNo(emp.bankAccountNo);
    setPanNumber(emp.panNumber);
    setUanNumber(emp.uanNumber);
    setpfNumber(emp.pfNumber);
    setesicNumber(emp.esicNumber);
    setDefaultSalaryTemplateId(emp.defaultSalaryTemplateId || '');
    setBasicSalary(emp.basicSalary);
    setEditingId(emp.id);
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeName.trim()) return alert('Name is required.');
    if (!employeeId.trim()) return alert('Employee ID is required.');

    const payload = {
      workerId: workerId || undefined,
      employeeName,
      employeeId,
      designation,
      department,
      workLocation,
      grade,
      dateOfJoining,
      bankName,
      bankAccountNo,
      panNumber,
      uanNumber,
      pfNumber: pfNumber,
      esicNumber: esicNumber,
      defaultSalaryTemplateId: defaultSalaryTemplateId || undefined,
      basicSalary,
    };

    if (editingId) {
      await updateEmployeeProfile(editingId, payload);
      alert('Profile updated successfully!');
    } else {
      await saveEmployeeProfile(payload);
      alert('Profile created successfully!');
    }
    setIsEditing(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this employee payroll profile?')) {
      await deleteEmployeeProfile(id);
    }
  };

  const filtered = employees.filter(emp =>
    emp.employeeName.toLowerCase().includes(search.toLowerCase()) ||
    emp.employeeId.toLowerCase().includes(search.toLowerCase()) ||
    emp.department.toLowerCase().includes(search.toLowerCase())
  );

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
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Employee Payroll Profiles</h1>
              <p className="text-xs text-slate-400 font-semibold">Manage employee defaults, bank details, and recurring allowances</p>
            </div>
          </div>
          {!isEditing && (
            <button
              onClick={handleOpenNew}
              className="flex items-center gap-1.5 px-4.5 py-2.5 bg-gradient-to-tr from-primary to-primary-light text-white text-xs font-extrabold rounded-2xl shadow-premium"
            >
              <Plus size={14} />
              Add Profile
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up">
            <div className="lg:col-span-2 space-y-4">
              {/* Profile Link & Core Info */}
              <div className="glass-card rounded-2xl p-5 space-y-4">
                <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                  <User size={16} className="text-primary" /> Identity & Position
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Link to Roster Worker</label>
                    <select
                      value={workerId}
                      onChange={(e) => {
                        const wId = e.target.value;
                        setWorkerId(wId);
                        const w = workers.find(work => work.id === wId);
                        if (w) {
                          setEmployeeName(w.full_name || '');
                          setEmployeeId(w.internal_id || '');
                          setDesignation(w.skill_category || '');
                          setWorkLocation(w.city || '');
                        }
                      }}
                      className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs bg-white text-slate-800 font-medium focus:border-primary focus:outline-none"
                    >
                      <option value="">— Unlinked Profile —</option>
                      {workers.map(w => (
                        <option key={w.id} value={w.id}>{w.full_name} ({w.internal_id || 'No ID'})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Employee ID *</label>
                    <input type="text" required value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}
                      placeholder="e.g. EMP001" className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs bg-white" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Employee Full Name *</label>
                    <input type="text" required value={employeeName} onChange={(e) => setEmployeeName(e.target.value)}
                      placeholder="e.g. Manikandan S" className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs bg-white" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Designation</label>
                    <input type="text" value={designation} onChange={(e) => setDesignation(e.target.value)}
                      placeholder="e.g. Security Guard" className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs bg-white" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Department</label>
                    <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Operations" className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs bg-white" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Work Location</label>
                    <input type="text" value={workLocation} onChange={(e) => setWorkLocation(e.target.value)}
                      placeholder="e.g. KK Nagar" className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs bg-white" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Grade</label>
                    <input type="text" value={grade} onChange={(e) => setGrade(e.target.value)}
                      placeholder="e.g. G-2" className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs bg-white" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Date of Joining</label>
                    <input type="date" value={dateOfJoining} onChange={(e) => setDateOfJoining(e.target.value)}
                      className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs bg-white" />
                  </div>
                </div>
              </div>

              {/* Financial & Statutory */}
              <div className="glass-card rounded-2xl p-5 space-y-4">
                <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                  <CreditCard size={16} className="text-primary" /> Bank & Statutory Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Bank Name</label>
                    <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. State Bank of India" className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs bg-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Bank Account No.</label>
                    <input type="text" value={bankAccountNo} onChange={(e) => setBankAccountNo(e.target.value)}
                      placeholder="e.g. 30291039281" className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs bg-white font-mono" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">PAN Number</label>
                    <input type="text" value={panNumber} onChange={(e) => setPanNumber(e.target.value)}
                      placeholder="e.g. ABCDE1234F" className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs bg-white font-mono uppercase" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">UAN Number</label>
                    <input type="text" value={uanNumber} onChange={(e) => setUanNumber(e.target.value)}
                      placeholder="e.g. 100293028192" className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs bg-white font-mono" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">PF Number</label>
                    <input type="text" value={pfNumber} onChange={(e) => setpfNumber(e.target.value)}
                      placeholder="e.g. TR/TRY/0029302/000" className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs bg-white font-mono" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">ESIC Number</label>
                    <input type="text" value={esicNumber} onChange={(e) => setesicNumber(e.target.value)}
                      placeholder="e.g. 62002930283928102" className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs bg-white font-mono" />
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar actions: Salary defaults */}
            <div className="lg:col-span-1">
              <div className="glass-card rounded-2xl p-5 sticky top-24 space-y-4">
                <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                  <Shield size={16} className="text-primary" /> Salary Defaults
                </h3>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Basic Monthly Salary (₹) *</label>
                    <input
                      type="number"
                      required
                      value={basicSalary || ''}
                      onChange={(e) => setBasicSalary(parseFloat(e.target.value) || 0)}
                      placeholder="e.g. 15000"
                      className="w-full h-10 border border-slate-200 rounded-xl px-3 text-sm focus:border-primary focus:outline-none bg-white font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Default Salary Template</label>
                    <select
                      value={defaultSalaryTemplateId}
                      onChange={(e) => setDefaultSalaryTemplateId(e.target.value)}
                      className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs bg-white text-slate-800 font-medium focus:border-primary"
                    >
                      <option value="">— Choose Template —</option>
                      {templates.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setIsEditing(false)}
                    className="flex-1 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs">
                    Cancel
                  </button>
                  <button type="submit"
                    className="flex-1 py-2.5 bg-gradient-to-tr from-primary to-primary-light text-white font-extrabold rounded-xl text-xs shadow-md">
                    Save Profile
                  </button>
                </div>
              </div>
            </div>
          </form>
        ) : (
          /* List Mode */
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                <Search size={16} />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, ID or department..."
                className="w-full h-10 pl-10 border border-slate-200 rounded-xl px-3 text-sm focus:border-primary focus:outline-none bg-white font-medium"
              />
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.length === 0 ? (
                <div className="col-span-full glass-card rounded-3xl p-12 text-center flex flex-col items-center justify-center">
                  <User size={40} className="text-slate-300 mb-3" />
                  <p className="font-bold text-slate-700">No employee profiles found</p>
                  <p className="text-xs text-slate-400 mt-1 mb-4">Add employee payroll defaults to speed up payslip generation.</p>
                  <button onClick={handleOpenNew} className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow">
                    Add First Profile
                  </button>
                </div>
              ) : (
                filtered.map((emp) => (
                  <div key={emp.id} className="glass-card rounded-2xl p-5 flex flex-col justify-between hover:shadow-glass-hover transition-all duration-300">
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-3">
                        <div>
                          <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">{emp.employeeName}</h3>
                          <span className="text-[10px] text-slate-400 font-bold">{emp.employeeId}</span>
                        </div>
                        <span className="text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100">
                          {emp.designation || 'Staff'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-slate-500 mb-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase font-black">Department</span>
                          <span>{emp.department || '—'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase font-black">Basic Pay</span>
                          <span className="text-slate-700">₹{emp.basicSalary.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="col-span-2 border-t border-slate-200/50 pt-1.5 mt-0.5">
                          <span className="text-slate-400 block text-[9px] uppercase font-black">Bank A/C</span>
                          <span className="font-mono text-slate-600">{emp.bankName} - {emp.bankAccountNo || '—'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 border-t border-slate-100 pt-3 mt-1">
                      <button
                        onClick={() => handleOpenEdit(emp)}
                        className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-primary/10 text-slate-500 hover:text-primary flex items-center justify-center transition-all"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(emp.id)}
                        className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-500 flex items-center justify-center transition-all"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeProfiles;

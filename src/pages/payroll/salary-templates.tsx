import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Edit3, Trash2, Save, LayoutTemplate 
} from 'lucide-react';
import { usePayrollStore } from '../../db/payroll-store';
import type { SalaryTemplate, EarningRow, DeductionRow } from '../../payroll-types';

const CATEGORIES = [
  { value: 'housekeeping', label: 'Housekeeping' },
  { value: 'security', label: 'Security' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'office', label: 'Office Staff' },
  { value: 'contract', label: 'Contract Workers' },
  { value: 'custom', label: 'Custom Profile' },
];

export const SalaryTemplates: React.FC = () => {
  const { templates, saveTemplate, updateTemplate, deleteTemplate } = usePayrollStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<SalaryTemplate['category']>('housekeeping');
  const [earnings, setEarnings] = useState<Omit<EarningRow, 'id'>[]>([]);
  const [deductions, setDeductions] = useState<Omit<DeductionRow, 'id'>[]>([]);

  const handleOpenNew = () => {
    setName('');
    setDescription('');
    setCategory('housekeeping');
    setEarnings([
      { name: 'Basic Salary', rate: '', amount: 0 },
      { name: 'HRA', rate: '40%', amount: 0 }
    ]);
    setDeductions([
      { name: 'Provident Fund', rate: '12%', amount: 0 },
      { name: 'ESI', rate: '0.75%', amount: 0 }
    ]);
    setEditingId(null);
    setIsEditing(true);
  };

  const handleOpenEdit = (tpl: SalaryTemplate) => {
    setName(tpl.name);
    setDescription(tpl.description || '');
    setCategory(tpl.category);
    setEarnings([...tpl.earnings]);
    setDeductions([...tpl.deductions]);
    setEditingId(tpl.id);
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert('Template name is required.');

    const payload = {
      name,
      description,
      category,
      earnings: earnings.filter(e => e.name.trim() || e.amount > 0),
      deductions: deductions.filter(d => d.name.trim() || d.amount > 0),
    };

    if (editingId) {
      await updateTemplate(editingId, payload);
      alert('Template updated successfully!');
    } else {
      await saveTemplate(payload);
      alert('Template created successfully!');
    }
    setIsEditing(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      await deleteTemplate(id);
    }
  };

  // Dynamic lists helpers
  const addEarningRow = () => setEarnings(prev => [...prev, { name: '', rate: '', amount: 0 }]);
  const removeEarningRow = (index: number) => setEarnings(prev => prev.filter((_, i) => i !== index));
  const updateEarningRow = (index: number, field: 'name' | 'rate' | 'amount', value: string | number) => {
    setEarnings(prev => prev.map((row, i) => i === index ? { ...row, [field]: value } : row));
  };

  const addDeductionRow = () => setDeductions(prev => [...prev, { name: '', rate: '', amount: 0 }]);
  const removeDeductionRow = (index: number) => setDeductions(prev => prev.filter((_, i) => i !== index));
  const updateDeductionRow = (index: number, field: 'name' | 'rate' | 'amount', value: string | number) => {
    setDeductions(prev => prev.map((row, i) => i === index ? { ...row, [field]: value } : row));
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
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Salary Templates</h1>
              <p className="text-xs text-slate-400 font-semibold">Configure reusable salary component structure profiles</p>
            </div>
          </div>
          {!isEditing && (
            <button
              onClick={handleOpenNew}
              className="flex items-center gap-1.5 px-4.5 py-2.5 bg-gradient-to-tr from-primary to-primary-light text-white text-xs font-extrabold rounded-2xl shadow-premium"
            >
              <Plus size={14} />
              Create Template
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up">
            {/* Left panels: Info & Components */}
            <div className="lg:col-span-2 space-y-4">
              <div className="glass-card rounded-2xl p-5 space-y-3">
                <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                  <LayoutTemplate size={16} className="text-primary" /> Template Metadata
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">Template Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Standard Housekeeping"
                      className="w-full h-10 border border-slate-200 rounded-xl px-3 text-sm focus:border-primary focus:outline-none bg-white font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">Category *</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as SalaryTemplate['category'])}
                      className="w-full h-10 border border-slate-200 rounded-xl px-3 text-sm focus:border-primary focus:outline-none bg-white font-medium text-slate-700"
                    >
                      {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">Description</label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Brief note about who uses this template..."
                      className="w-full h-10 border border-slate-200 rounded-xl px-3 text-sm focus:border-primary focus:outline-none bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Earnings */}
              <div className="glass-card rounded-2xl p-5">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-extrabold text-slate-800 text-sm">Earnings Component Configuration</h3>
                  <button type="button" onClick={addEarningRow} className="text-xs font-bold text-primary flex items-center gap-1 bg-primary/5 px-2.5 py-1 rounded-lg">
                    <Plus size={12} /> Add Component
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-1">
                    <span className="col-span-6">Component</span>
                    <span className="col-span-3">Default Rate</span>
                    <span className="col-span-2">Base Amt (₹)</span>
                    <span className="col-span-1"></span>
                  </div>
                  {earnings.map((row, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                      <input value={row.name} onChange={(e) => updateEarningRow(i, 'name', e.target.value)}
                        placeholder="e.g. Basic Salary" className="col-span-6 h-9 border border-slate-200 rounded-xl px-2.5 text-xs focus:border-primary focus:outline-none" />
                      <input value={row.rate} onChange={(e) => updateEarningRow(i, 'rate', e.target.value)}
                        placeholder="e.g. 40%" className="col-span-3 h-9 border border-slate-200 rounded-xl px-2.5 text-xs focus:border-primary focus:outline-none" />
                      <input type="number" value={row.amount || ''}
                        onChange={(e) => updateEarningRow(i, 'amount', parseFloat(e.target.value) || 0)}
                        placeholder="0.00" className="col-span-2 h-9 border border-slate-200 rounded-xl px-2.5 text-xs focus:border-primary focus:outline-none font-mono" />
                      <button type="button" onClick={() => removeEarningRow(i)}
                        className="col-span-1 w-8 h-8 flex items-center justify-center text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Deductions */}
              <div className="glass-card rounded-2xl p-5">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-extrabold text-slate-800 text-sm">Deductions Configuration</h3>
                  <button type="button" onClick={addDeductionRow} className="text-xs font-bold text-primary flex items-center gap-1 bg-primary/5 px-2.5 py-1 rounded-lg">
                    <Plus size={12} /> Add Deduction
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-1">
                    <span className="col-span-6">Component</span>
                    <span className="col-span-3">Default Rate</span>
                    <span className="col-span-2">Base Amt (₹)</span>
                    <span className="col-span-1"></span>
                  </div>
                  {deductions.map((row, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                      <input value={row.name} onChange={(e) => updateDeductionRow(i, 'name', e.target.value)}
                        placeholder="e.g. Provident Fund" className="col-span-6 h-9 border border-slate-200 rounded-xl px-2.5 text-xs focus:border-primary focus:outline-none" />
                      <input value={row.rate} onChange={(e) => updateDeductionRow(i, 'rate', e.target.value)}
                        placeholder="e.g. 12%" className="col-span-3 h-9 border border-slate-200 rounded-xl px-2.5 text-xs focus:border-primary focus:outline-none" />
                      <input type="number" value={row.amount || ''}
                        onChange={(e) => updateDeductionRow(i, 'amount', parseFloat(e.target.value) || 0)}
                        placeholder="0.00" className="col-span-2 h-9 border border-slate-200 rounded-xl px-2.5 text-xs focus:border-primary focus:outline-none font-mono" />
                      <button type="button" onClick={() => removeDeductionRow(i)}
                        className="col-span-1 w-8 h-8 flex items-center justify-center text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar actions */}
            <div className="lg:col-span-1">
              <div className="glass-card rounded-2xl p-5 sticky top-24 space-y-4">
                <h4 className="font-extrabold text-slate-800 text-sm">Save Options</h4>
                <p className="text-slate-400 text-xs font-semibold leading-relaxed">
                  Apply components specified as the blueprint for automatic calculations when generating worker payslips.
                </p>
                <div className="space-y-2">
                  <button type="submit"
                    className="w-full py-3 bg-gradient-to-tr from-primary to-primary-light text-white font-extrabold rounded-xl shadow-premium text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all">
                    <Save size={14} />
                    {editingId ? 'Save Changes' : 'Create Template'}
                  </button>
                  <button type="button" onClick={() => setIsEditing(false)}
                    className="w-full py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-200 transition-all">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </form>
        ) : (
          /* List Mode */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.length === 0 ? (
              <div className="col-span-full glass-card rounded-3xl p-12 text-center flex flex-col items-center justify-center">
                <LayoutTemplate size={40} className="text-slate-300 mb-3" />
                <p className="font-bold text-slate-700">No salary templates found</p>
                <p className="text-xs text-slate-400 mt-1 mb-4">Templates help you bootstrap earnings and deductions in one tap.</p>
                <button onClick={handleOpenNew} className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow">
                  Create First Template
                </button>
              </div>
            ) : (
              templates.map((tpl) => (
                <div key={tpl.id} className="glass-card rounded-2xl p-5 flex flex-col justify-between hover:shadow-glass-hover transition-all duration-300">
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">{tpl.name}</h3>
                      <span className="text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {tpl.category}
                      </span>
                    </div>
                    {tpl.description && (
                      <p className="text-slate-400 text-[11px] font-semibold mb-4 leading-normal">{tpl.description}</p>
                    )}
                    
                    <div className="space-y-1 mb-4">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Blueprint Summary</div>
                      <div className="text-[11px] font-bold text-slate-600 flex justify-between">
                        <span>Earnings :</span>
                        <span>{tpl.earnings.length} components</span>
                      </div>
                      <div className="text-[11px] font-bold text-slate-600 flex justify-between">
                        <span>Deductions :</span>
                        <span>{tpl.deductions.length} components</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 border-t border-slate-100 pt-3 mt-2">
                    <button
                      onClick={() => handleOpenEdit(tpl)}
                      className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-primary/10 text-slate-500 hover:text-primary flex items-center justify-center transition-all"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(tpl.id)}
                      className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-500 flex items-center justify-center transition-all"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SalaryTemplates;

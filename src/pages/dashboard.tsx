import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { 
  Users, 
  MapPin, 
  Briefcase, 
  CalendarCheck, 
  UserPlus, 
  Phone, 
  Calendar, 
  TrendingUp, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { useHRMSStore } from '../db/store';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { 
    currentUser, 
    workers, 
    areas, 
    attendance, 
    fastAddWorker,
    addArea
  } = useHRMSStore();

  // Rapid Worker Add Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newSkill, setNewSkill] = useState('helper'); // default skill
  const [newAreaId, setNewAreaId] = useState('not_specified'); // "Address not specified" by default!
  const [newGender, setNewGender] = useState('male');

  const [showAddAreaInline, setShowAddAreaInline] = useState(false);
  const [newAreaName, setNewAreaName] = useState('');
  const [newAreaPincode, setNewAreaPincode] = useState('');
  const [newAreaZone, setNewAreaZone] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleFastAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const newWorker = await fastAddWorker({
      full_name: newName,
      phone: newPhone,
      skill_category: newSkill,
      area_id: newAreaId === 'not_specified' ? null : newAreaId,
      gender: newGender,
    });
    setIsSaving(false);
    if (!newWorker) return;
    setNewName('');
    setNewPhone('');
    setNewSkill('helper');
    setNewAreaId('not_specified');
    setNewGender('male');
    setShowAddModal(false);
    navigate(`/workers/${newWorker.id}`);
  };

  const handleAddAreaInline = async () => {
    if (!newAreaName.trim()) return;
    const created = await addArea({
      name: newAreaName,
      pincode: newAreaPincode || null,
      latitude: null,
      longitude: null,
      zone: newAreaZone || null,
    });
    if (created) {
      setNewAreaId(created.id);
      setNewAreaName('');
      setNewAreaPincode('');
      setNewAreaZone('');
      setShowAddAreaInline(false);
    }
  };

  // Operational metrics calculations
  const totalWorkers = workers.length;
  const deployedWorkers = workers.filter(w => w.worker_status === 'deployed').length;
  const draftWorkers = workers.filter(w => w.worker_status === 'draft').length;
  
  // Calculate attendance rate (percentage present today)
  const todayAttendance = attendance.length;
  const attendanceRate = totalWorkers > 0 ? Math.round((todayAttendance / totalWorkers) * 100) : 0;

  // Recent 5 workers for the dashboard table (as requested by user)
  const recentWorkers = [...workers]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  // Chart 1: Skill category distribution data
  const skillCounts = workers.reduce((acc: { [key: string]: number }, w) => {
    if (w.skill_category) {
      acc[w.skill_category] = (acc[w.skill_category] || 0) + 1;
    }
    return acc;
  }, {});

  const skillData = Object.keys(skillCounts).map(key => ({
    name: key.toUpperCase(),
    value: skillCounts[key]
  }));

  const COLORS = ['#3525CD', '#10B981', '#F59E0B', '#EF4444', '#818CF8', '#A78BFA'];

  // Chart 2: Area distribution
  const areaCounts = workers.reduce((acc: { [key: string]: number }, w) => {
    const area = areas.find(a => a.id === w.area_id);
    const name = area ? area.name : 'Address not specified';
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});

  const areaData = Object.keys(areaCounts).map(key => ({
    name: key,
    count: areaCounts[key]
  }));

  return (
    <div className="min-h-screen bg-slate-50/50 pb-28 pt-6 px-4 md:px-8 font-sans">
      {/* Top Welcome Bar */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Recruiter Operations</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            Welcome back, <span className="text-primary font-bold">{currentUser?.full_name}</span> • Trichy Main Branch
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-tr from-primary to-primary-light text-white text-sm font-extrabold rounded-2xl shadow-premium hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 border border-white/10"
        >
          <UserPlus size={18} />
          Rapid Worker Add
        </button>
      </div>

      {/* Grid of Metric Widgets */}
      <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Roster Widget */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <Users size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">{totalWorkers}</div>
            <div className="text-xs font-semibold text-slate-400">Total Workforce</div>
          </div>
        </div>

        {/* Deployed Widget */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
            <Briefcase size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-600">{deployedWorkers}</div>
            <div className="text-xs font-semibold text-slate-400">Active Deployed</div>
          </div>
        </div>

        {/* Draft/Incomplete Profile Widget */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500">
            <FileText size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-amber-500">{draftWorkers}</div>
            <div className="text-xs font-semibold text-slate-400">Incomplete (Drafts)</div>
          </div>
        </div>

        {/* Daily Attendance Rate Widget */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
            <CalendarCheck size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-indigo-600">{todayAttendance} <span className="text-xs font-bold text-slate-400">({attendanceRate}%)</span></div>
            <div className="text-xs font-semibold text-slate-400">Checked In Today</div>
          </div>
        </div>
      </div>

      {/* Roster & Grid Layout */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Main Content Area - Left Column Span 2: Recent Workers */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">Recent Workers Roster</h2>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">Quickly view worker profiles and verification status</p>
            </div>
            <Link 
              to="/workers" 
              className="text-xs font-bold text-primary hover:text-primary-dark bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-xl transition-all duration-200"
            >
              See All Workers
            </Link>
          </div>

          {/* User Requested Table: SHOWS NAME, PHONE, ADDRESS, ENTERED DATE */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-[10px] uppercase tracking-wider font-extrabold">
                  <th className="pb-3 pl-2">Worker Name</th>
                  <th className="pb-3">Phone Number</th>
                  <th className="pb-3">Address</th>
                  <th className="pb-3">Entered Date</th>
                  <th className="pb-3 pr-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium">
                {recentWorkers.map((w) => {
                  const matchedArea = areas.find(a => a.id === w.area_id);
                  const entryDate = new Date(w.created_at).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  });

                  return (
                    <tr key={w.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Name */}
                      <td className="py-3.5 pl-2">
                        <Link to={`/workers/${w.id}`} className="font-bold text-slate-800 hover:text-primary transition-all">
                          {w.full_name || <span className="text-slate-400 italic">Not specified</span>}
                        </Link>
                        {w.skill_category && (
                          <div className="text-[10px] text-primary-light uppercase tracking-wider font-extrabold mt-0.5">
                            {w.skill_category}
                          </div>
                        )}
                      </td>
                      
                      {/* Phone */}
                      <td className="py-3.5 text-slate-600 font-mono">
                        {w.phone ? (
                          <div className="flex items-center gap-1">
                            <Phone size={11} className="text-slate-400" />
                            {w.phone}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-xs">Not specified</span>
                        )}
                      </td>

                      {/* Address: Displays "Address not specified" if null */}
                      <td className="py-3.5 text-slate-500">
                        {matchedArea ? (
                          <div className="flex items-center gap-1">
                            <MapPin size={11} className="text-slate-400 flex-shrink-0" />
                            <span className="truncate max-w-[120px]" title={`${matchedArea.name} (${matchedArea.pincode})`}>
                              {matchedArea.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-amber-500/80 font-bold bg-amber-50 px-2 py-0.5 rounded text-[11px] inline-flex items-center gap-1">
                            <AlertCircle size={10} />
                            Not specified
                          </span>
                        )}
                      </td>

                      {/* Entered Date */}
                      <td className="py-3.5 text-slate-500 text-xs">
                        <div className="flex items-center gap-1">
                          <Calendar size={11} className="text-slate-400" />
                          {entryDate}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 pr-2 text-right">
                        <span className={`text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-md border ${
                          w.worker_status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : w.worker_status === 'deployed'
                            ? 'bg-blue-50 text-blue-700 border-blue-100'
                            : w.worker_status === 'draft'
                            ? 'bg-yellow-50 text-yellow-700 border-yellow-100'
                            : 'bg-rose-50 text-rose-700 border-rose-100'
                        }`}>
                          {w.worker_status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column - Skill charts */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col">
          <h2 className="text-lg font-bold text-slate-900 leading-tight mb-4">Skills Demographics</h2>
          
          <div className="h-44 w-full flex items-center justify-center">
            {skillData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={skillData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {skillData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} Workers`, 'Count']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-xs text-slate-400 italic">No skill distribution data</span>
            )}
          </div>

          {/* Chart Legend */}
          <div className="grid grid-cols-2 gap-2 mt-4 text-xs font-semibold text-slate-500">
            {skillData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-1.5">
                <span 
                  className="w-2.5 h-2.5 rounded-sm flex-shrink-0" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="truncate">{entry.name} ({entry.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Area-wise Bar Chart */}
      <div className="max-w-6xl mx-auto bg-white rounded-3xl border border-slate-100 shadow-sm p-6 mb-8">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <TrendingUp className="text-primary" size={18} />
          Hyperlocal Distribution by Area
        </h2>
        
        <div className="h-64 w-full">
          {areaData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={areaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip formatter={(value) => [`${value} Workers`, 'Roster Count']} />
                <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]}>
                  {areaData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.name === 'Address not specified' ? '#f59e0b' : '#3525CD'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <span className="text-xs text-slate-400 italic">No area distribution data</span>
          )}
        </div>
      </div>

      {/* User Requested: ADD WORKER MODAL WITH NO OPTION MANDATORY & "ADDRESS NOT SPECIFIED" OPTION */}
      {showAddModal && (
        <div className="fixed inset-0 z-[600] flex items-end justify-center md:items-center bg-darkbg/60 backdrop-blur-sm p-0 md:p-4">
          <div className="w-full max-w-md bg-white rounded-t-3xl md:rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] animate-slide-up">
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-950 text-xl tracking-tight">Rapid Worker Entry</h3>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Core Philosophy: "Save First, Complete Later"</p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-bold hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleFastAdd} className="p-6 space-y-4.5 overflow-y-auto flex-1">
              
              <div className="bg-yellow-50 p-3 rounded-2xl border border-yellow-100 flex gap-2.5 items-start">
                <AlertCircle size={16} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-yellow-800 font-semibold leading-relaxed">
                  <strong>Flexible Entry Enabled</strong>: Absolutely no field is mandatory. You can save this form empty or partially complete. All inputs will default cleanly.
                </p>
              </div>

              {/* Name (Optional) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Worker Full Name (Optional)</label>
                <input 
                  type="text" 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)} 
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full h-11 border border-slate-200 rounded-xl px-3 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              {/* Phone (Optional) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Phone Number (Optional)</label>
                <input 
                  type="tel" 
                  value={newPhone} 
                  onChange={(e) => setNewPhone(e.target.value)} 
                  placeholder="e.g. 9842100000"
                  className="w-full h-11 border border-slate-200 rounded-xl px-3 text-sm font-mono focus:border-primary focus:outline-none"
                />
              </div>

              {/* Address Area Selector - USER REQUESTED "ADDRESS NOT SPECIFIED" OPTION */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700 block">Hyperlocal Address (Optional)</label>
                  <button
                    type="button"
                    onClick={() => setShowAddAreaInline(!showAddAreaInline)}
                    className="text-[10px] text-primary hover:text-primary-dark font-extrabold cursor-pointer"
                  >
                    {showAddAreaInline ? '✕ Cancel' : '＋ Add Area Centroid'}
                  </button>
                </div>
                
                {showAddAreaInline ? (
                  <div className="p-3.5 rounded-2xl glass-card border border-slate-200/50 space-y-2.5 mb-2 mt-1 animate-slide-up">
                    <div className="text-[10px] font-black text-slate-700 uppercase tracking-wider">New Area Centroid</div>
                    <div className="space-y-1">
                      <input
                        type="text"
                        placeholder="Area Name (e.g. Woraiyur)"
                        value={newAreaName}
                        onChange={(e) => setNewAreaName(e.target.value)}
                        className="w-full h-9 border border-slate-200 rounded-xl px-2.5 text-xs focus:border-primary focus:outline-none bg-slate-50 font-medium"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Pincode"
                        value={newAreaPincode}
                        onChange={(e) => setNewAreaPincode(e.target.value)}
                        className="w-full h-9 border border-slate-200 rounded-xl px-2.5 text-xs focus:border-primary focus:outline-none bg-slate-50 font-medium"
                      />
                      <input
                        type="text"
                        placeholder="Zone (e.g. East)"
                        value={newAreaZone}
                        onChange={(e) => setNewAreaZone(e.target.value)}
                        className="w-full h-9 border border-slate-200 rounded-xl px-2.5 text-xs focus:border-primary focus:outline-none bg-slate-50 font-medium"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddAreaInline}
                      className="w-full h-9 bg-gradient-to-tr from-primary to-primary-light text-white text-xs font-extrabold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 cursor-pointer shadow-md"
                    >
                      Create Centroid
                    </button>
                  </div>
                ) : (
                  <select 
                    value={newAreaId} 
                    onChange={(e) => setNewAreaId(e.target.value)}
                    className="w-full h-11 border border-slate-200 rounded-xl px-3 text-sm focus:border-primary focus:outline-none bg-white font-medium text-slate-700"
                  >
                    <option value="not_specified">⚠️ Address not specified</option>
                    {areas.map(a => (
                      <option key={a.id} value={a.id}>📍 {a.name} ({a.pincode})</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Skill (Optional) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Primary Skill (Optional)</label>
                <select 
                  value={newSkill} 
                  onChange={(e) => setNewSkill(e.target.value)}
                  className="w-full h-11 border border-slate-200 rounded-xl px-3 text-sm focus:border-primary focus:outline-none bg-white font-medium text-slate-700"
                >
                  <option value="helper">Helper / Loader</option>
                  <option value="electrician">Electrician</option>
                  <option value="tailoring">Tailoring</option>
                  <option value="delivery executive">Delivery Executive</option>
                  <option value="security guard">Security Guard</option>
                  <option value="plumber">Plumber</option>
                </select>
              </div>

              {/* Gender */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Gender</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNewGender('male')}
                    className={`flex-1 py-2.5 rounded-xl border text-sm font-bold transition-all ${
                      newGender === 'male' 
                        ? 'bg-primary/10 border-primary text-primary' 
                        : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}
                  >
                    Male
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewGender('female')}
                    className={`flex-1 py-2.5 rounded-xl border text-sm font-bold transition-all ${
                      newGender === 'female' 
                        ? 'bg-primary/10 border-primary text-primary' 
                        : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}
                  >
                    Female
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 text-slate-500 bg-slate-100 hover:bg-slate-200 font-bold rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 bg-gradient-to-tr from-primary to-primary-light text-white font-extrabold rounded-xl text-sm shadow-lg border border-white/10 flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : 'Save Instantly (Draft)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Dashboard;

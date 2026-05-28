import React, { useState } from 'react';
import { 
  Settings as SettingsIcon,
  MapPin, 
  Trash2, 
  Edit3, 
  Plus, 
  Database, 
  RotateCcw, 
  Building,
  Sliders,
  Save,
  Download,
  AlertCircle
} from 'lucide-react';
import { useHRMSStore } from '../db/store';
import type { Area } from '../types';

export const Settings: React.FC = () => {
  const { areas, addArea, updateArea, deleteArea, resetDatabase, workers, deployments } = useHRMSStore();
  
  // Tab control
  const [activeTab, setActiveTab] = useState<'areas' | 'policies' | 'system'>('areas');

  // New Area form state
  const [newAreaName, setNewAreaName] = useState('');
  const [newAreaPincode, setNewAreaPincode] = useState('');
  const [newAreaZone, setNewAreaZone] = useState('');
  const [newAreaLat, setNewAreaLat] = useState('');
  const [newAreaLng, setNewAreaLng] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Edit Area state
  const [editingAreaId, setEditingAreaId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPincode, setEditPincode] = useState('');
  const [editZone, setEditZone] = useState('');
  const [editLat, setEditLat] = useState('');
  const [editLng, setEditLng] = useState('');

  // Proximity & Policy state
  const [defaultRadius, setDefaultRadius] = useState<number>(5);
  const [requireSelfie, setRequireSelfie] = useState<boolean>(true);
  const [gpsTolerance, setGpsTolerance] = useState<number>(150); // meters

  // Custom branding label state (simulated)
  const [customBrandPrefix, setCustomBrandPrefix] = useState('VY-2026');

  // Reset database confirmation modal
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleAddAreaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAreaName.trim()) return;

    addArea({
      name: newAreaName,
      pincode: newAreaPincode || null,
      latitude: newAreaLat ? parseFloat(newAreaLat) : null,
      longitude: newAreaLng ? parseFloat(newAreaLng) : null,
      zone: newAreaZone || null
    });

    // Reset Form
    setNewAreaName('');
    setNewAreaPincode('');
    setNewAreaZone('');
    setNewAreaLat('');
    setNewAreaLng('');
    setShowAddForm(false);
  };

  const handleStartEdit = (area: Area) => {
    setEditingAreaId(area.id);
    setEditName(area.name || '');
    setEditPincode(area.pincode || '');
    setEditZone(area.zone || '');
    setEditLat(area.latitude?.toString() || '');
    setEditLng(area.longitude?.toString() || '');
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) return;
    updateArea(id, {
      name: editName,
      pincode: editPincode || null,
      latitude: editLat ? parseFloat(editLat) : null,
      longitude: editLng ? parseFloat(editLng) : null,
      zone: editZone || null
    });
    setEditingAreaId(null);
  };

  // Download database JSON dump
  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(localStorage));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `vyesshrms_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-28 pt-6 px-4 md:px-8 font-sans">
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
            <SettingsIcon size={20} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">System Settings</h1>
            <p className="text-slate-500 text-sm mt-1 font-medium">
              Configure Vyesshrms platform configurations, hyperlocal area centroids, and diagnostic tools.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Navigation Sidebar Drawer */}
        <div className="lg:col-span-1 glass rounded-3xl border border-slate-200/50 p-4 space-y-1.5 shadow-sm">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-3 mb-2">Settings Console</div>
          
          <button
            onClick={() => setActiveTab('areas')}
            className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
              activeTab === 'areas' 
                ? 'bg-primary text-white shadow-md' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
            }`}
          >
            <MapPin size={16} />
            Area Centroids Manager
          </button>
          
          <button
            onClick={() => setActiveTab('policies')}
            className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
              activeTab === 'policies' 
                ? 'bg-primary text-white shadow-md' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
            }`}
          >
            <Sliders size={16} />
            Operational Policies
          </button>
          
          <button
            onClick={() => setActiveTab('system')}
            className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
              activeTab === 'system' 
                ? 'bg-primary text-white shadow-md' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
            }`}
          >
            <Database size={16} />
            System & Diagnostics
          </button>
          
          <div className="border-t border-slate-200/40 my-3 pt-3 px-3">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Active Brand</div>
            <div className="flex items-center gap-2 mt-1.5 bg-slate-100 p-2.5 rounded-2xl border border-slate-200/40">
              <Building size={14} className="text-primary-light" />
              <div className="text-[10px] font-bold text-slate-700">Vyess Technology</div>
            </div>
          </div>
        </div>

        {/* Dynamic Display Panel */}
        <div className="lg:col-span-3">
          
          {/* TAB 1: AREA CENTROIDS MANAGER */}
          {activeTab === 'areas' && (
            <div className="space-y-6">
              <div className="glass rounded-3xl border border-slate-200/50 p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 leading-tight">Hyperlocal Area Centroids</h2>
                    <p className="text-xs text-slate-400 font-semibold mt-0.5">
                      Configure master neighborhoods to instantly enable Leaflet proximity markers and recruiter maps.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-tr from-primary to-primary-light text-white text-xs font-extrabold rounded-2xl shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <Plus size={14} />
                    {showAddForm ? 'Hide Form' : 'Add Centroid Area'}
                  </button>
                </div>

                {/* Add Area Inline Form */}
                {showAddForm && (
                  <form onSubmit={handleAddAreaSubmit} className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl space-y-4 mb-6 animate-slide-up text-left">
                    <div className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">
                      <MapPin size={12} className="text-primary" /> Register New Area Centroid
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-500">Area Name *</label>
                        <input 
                          type="text"
                          required
                          value={newAreaName}
                          onChange={(e) => setNewAreaName(e.target.value)}
                          placeholder="e.g. Woraiyur"
                          className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs bg-white text-slate-800 font-medium focus:border-primary focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-500">Pincode</label>
                        <input 
                          type="text"
                          value={newAreaPincode}
                          onChange={(e) => setNewAreaPincode(e.target.value)}
                          placeholder="e.g. 620003"
                          className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs bg-white text-slate-800 font-medium focus:border-primary focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-500">Zone Name</label>
                        <input 
                          type="text"
                          value={newAreaZone}
                          onChange={(e) => setNewAreaZone(e.target.value)}
                          placeholder="e.g. West Zone"
                          className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs bg-white text-slate-800 font-medium focus:border-primary focus:outline-none"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-500">Latitude (Optional - blank triggers dynamic random offset)</label>
                        <input 
                          type="number"
                          step="0.0001"
                          value={newAreaLat}
                          onChange={(e) => setNewAreaLat(e.target.value)}
                          placeholder="e.g. 10.7924"
                          className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs bg-white text-slate-800 font-medium focus:border-primary focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-500">Longitude (Optional)</label>
                        <input 
                          type="number"
                          step="0.0001"
                          value={newAreaLng}
                          onChange={(e) => setNewAreaLng(e.target.value)}
                          placeholder="e.g. 78.6835"
                          className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs bg-white text-slate-800 font-medium focus:border-primary focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2.5 pt-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setShowAddForm(false)}
                        className="h-9 px-4 text-slate-500 bg-slate-200/60 hover:bg-slate-200 text-xs font-bold rounded-xl"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="h-9 px-5 bg-primary text-white text-xs font-extrabold rounded-xl shadow-md"
                      >
                        Save Master Centroid
                      </button>
                    </div>
                  </form>
                )}

                {/* Areas List Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {areas.map((area) => (
                    <div 
                      key={area.id}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between hover:shadow-xs transition-all text-left"
                    >
                      {editingAreaId === area.id ? (
                        /* EDIT MODE */
                        <div className="space-y-3 w-full">
                          <input 
                            type="text" 
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full h-8 border border-slate-200 rounded-lg px-2 text-xs bg-white"
                            placeholder="Name"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <input 
                              type="text" 
                              value={editPincode}
                              onChange={(e) => setEditPincode(e.target.value)}
                              className="h-8 border border-slate-200 rounded-lg px-2 text-xs bg-white"
                              placeholder="Pincode"
                            />
                            <input 
                              type="text" 
                              value={editZone}
                              onChange={(e) => setEditZone(e.target.value)}
                              className="h-8 border border-slate-200 rounded-lg px-2 text-xs bg-white"
                              placeholder="Zone"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <input 
                              type="text" 
                              value={editLat}
                              onChange={(e) => setEditLat(e.target.value)}
                              className="h-8 border border-slate-200 rounded-lg px-2 text-xs bg-white"
                              placeholder="Lat"
                            />
                            <input 
                              type="text" 
                              value={editLng}
                              onChange={(e) => setEditLng(e.target.value)}
                              className="h-8 border border-slate-200 rounded-lg px-2 text-xs bg-white"
                              placeholder="Lng"
                            />
                          </div>
                          <div className="flex gap-2 justify-end pt-1">
                            <button 
                              type="button"
                              onClick={() => setEditingAreaId(null)}
                              className="px-3 h-7 bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold"
                            >
                              Cancel
                            </button>
                            <button 
                              type="button"
                              onClick={() => handleSaveEdit(area.id)}
                              className="px-3 h-7 bg-primary text-white rounded-lg text-[10px] font-black"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* DISPLAY MODE */
                        <>
                          <div>
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1">
                                  <MapPin size={13} className="text-primary-light" />
                                  {area.name}
                                </h3>
                                <span className="text-[10px] text-slate-400 font-semibold tracking-wide uppercase">
                                  {area.zone || 'No Zone'} • Pin: {area.pincode || 'None'}
                                </span>
                              </div>
                              
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => handleStartEdit(area)}
                                  className="w-7 h-7 bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg flex items-center justify-center transition-all border border-slate-200/50"
                                  title="Edit"
                                >
                                  <Edit3 size={11} />
                                </button>
                                <button
                                  onClick={() => deleteArea(area.id)}
                                  className="w-7 h-7 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-lg flex items-center justify-center transition-all border border-slate-200/50"
                                  title="Delete"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="mt-3.5 pt-2.5 border-t border-slate-200/40 flex items-center justify-between text-[10px] font-mono text-slate-400">
                            <span>Lat: {area.latitude?.toFixed(4) || 'Auto'}</span>
                            <span>Lng: {area.longitude?.toFixed(4) || 'Auto'}</span>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: OPERATIONAL POLICIES */}
          {activeTab === 'policies' && (
            <div className="glass rounded-3xl border border-slate-200/50 p-6 shadow-sm text-left space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 leading-tight">Operational Policies</h2>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">
                  Configure default thresholds, compliance policies, and search preferences.
                </p>
              </div>

              <div className="space-y-5 divide-y divide-slate-100">
                {/* Policy 1: Default Search Radius */}
                <div className="pt-2 pb-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <label className="text-xs font-extrabold text-slate-800 block">Default Recruitment Search Radius</label>
                      <span className="text-[10px] text-slate-400 font-semibold block">Default proximity bounds for active recruiters query matches</span>
                    </div>
                    <span className="text-sm font-extrabold text-primary bg-primary/10 px-3 py-1 rounded-lg">
                      {defaultRadius} KM
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="2" 
                    max="20" 
                    step="1"
                    value={defaultRadius} 
                    onChange={(e) => setDefaultRadius(parseInt(e.target.value))}
                    className="w-full accent-primary" 
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 font-semibold">
                    <span>2 KM</span>
                    <span>20 KM</span>
                  </div>
                </div>

                {/* Policy 2: Attendance Verification Policy */}
                <div className="py-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <label className="text-xs font-extrabold text-slate-800 block">Selfie Verification Enforcement</label>
                      <span className="text-[10px] text-slate-400 font-semibold block">Require field agents to upload verification selfie upon checking in</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={requireSelfie} 
                        onChange={(e) => setRequireSelfie(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>

                {/* Policy 3: GPS Range Tolerance */}
                <div className="py-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <label className="text-xs font-extrabold text-slate-800 block">GPS Radius Tolerance (Meters)</label>
                      <span className="text-[10px] text-slate-400 font-semibold block font-sans">Acceptable radius variance between worker location check-in selfie coordinates and master area centroid coordinates</span>
                    </div>
                    <span className="text-xs font-black text-slate-700 bg-slate-100 border border-slate-200/50 px-2.5 py-1 rounded-lg">
                      {gpsTolerance} m
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="50" 
                    max="500" 
                    step="25"
                    value={gpsTolerance} 
                    onChange={(e) => setGpsTolerance(parseInt(e.target.value))}
                    className="w-full accent-primary" 
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 font-semibold">
                    <span>50m (Strict)</span>
                    <span>500m (Relaxed)</span>
                  </div>
                </div>

                {/* Policy 4: Brand Prefix Prefix */}
                <div className="py-4 space-y-3">
                  <div className="space-y-1.5 max-w-sm">
                    <label className="text-xs font-extrabold text-slate-800 block">System Auto-ID Prefix</label>
                    <span className="text-[10px] text-slate-400 font-semibold block -mt-1 mb-1">Prefix added to newly registered worker internal roster profiles</span>
                    <input 
                      type="text" 
                      value={customBrandPrefix}
                      onChange={(e) => setCustomBrandPrefix(e.target.value)}
                      className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs bg-white text-slate-800 font-semibold font-mono focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  onClick={() => alert("System policies saved locally to local config state.")}
                  className="flex items-center gap-1.5 px-5 py-3 bg-gradient-to-tr from-primary to-primary-light text-white text-xs font-extrabold rounded-2xl shadow-premium"
                >
                  <Save size={14} />
                  Save Preferences
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: SYSTEM DIAGNOSTICS & DATA CONTROL */}
          {activeTab === 'system' && (
            <div className="space-y-6">
              {/* Stats Widgets */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-xs text-left">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Indexed Roster</div>
                  <div className="text-xl font-black text-slate-800 mt-1">{workers.length} Workers</div>
                </div>
                <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-xs text-left">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Active Deployments</div>
                  <div className="text-xl font-black text-emerald-600 mt-1">{deployments.filter(d => d.deployment_status === 'active').length} Active</div>
                </div>
                <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-xs text-left">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Registered Areas</div>
                  <div className="text-xl font-black text-indigo-600 mt-1">{areas.length} Centroids</div>
                </div>
              </div>

              {/* Action Panels */}
              <div className="glass rounded-3xl border border-slate-200/50 p-6 shadow-sm text-left space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 leading-tight">Data Maintenance & Controls</h2>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">
                    Perform system backup operations, download local storage database, or factory reset seed values.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Backup Panel */}
                  <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xs font-extrabold text-slate-800">Export State JSON Database Backup</h3>
                      <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">Download a secure JSON copy of all local rosters, attendance checklists, and area centroids.</span>
                    </div>
                    <button
                      onClick={handleExportData}
                      className="flex items-center justify-center gap-1.5 px-4.5 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-xs shrink-0"
                    >
                      <Download size={14} />
                      Export Data
                    </button>
                  </div>

                  {/* Reset Panel */}
                  <div className="p-4 rounded-2xl border border-rose-100 bg-rose-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className="text-xs font-extrabold text-rose-800 flex items-center gap-1">
                        <AlertCircle size={14} className="text-rose-600" />
                        Hard Database Reset (Restore Default Seed Data)
                      </h3>
                      <span className="text-[10px] text-rose-700/80 font-semibold block">
                        Warning: This will permanently wipe all current local storage updates, added centroids, workers, and attendance cards, restoring the database to default values.
                      </span>
                    </div>
                    <button
                      onClick={() => setShowResetConfirm(true)}
                      className="flex items-center justify-center gap-1.5 px-4.5 py-2.5 bg-gradient-to-tr from-rose-600 to-rose-500 hover:opacity-95 text-white text-xs font-black rounded-xl shadow-md shrink-0 cursor-pointer"
                    >
                      <RotateCcw size={14} />
                      Factory Reset
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FACTORY RESET CONFIRMATION OVERLAY MODAL */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-darkbg/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-5 animate-slide-up">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <RotateCcw size={22} />
            </div>
            
            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-slate-900 text-lg">Factory Reset Database?</h3>
              <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                Are you absolutely sure? This will wipe all changes, custom coordinates, and draft worker profiles. This action is irreversible.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-3 text-slate-500 bg-slate-100 hover:bg-slate-200 font-bold rounded-xl text-xs"
              >
                No, Keep My Data
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowResetConfirm(false);
                  resetDatabase();
                }}
                className="flex-1 py-3 bg-gradient-to-tr from-rose-600 to-rose-500 hover:opacity-90 text-white font-extrabold rounded-xl text-xs shadow-lg"
              >
                Yes, Clear Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Settings;

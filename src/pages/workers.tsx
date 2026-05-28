import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  SlidersHorizontal,
  Map,
  List,
  Compass,
  AlertCircle
} from 'lucide-react';
import { useHRMSStore } from '../db/store';
import { WorkerCard } from '../components/worker-card';
import { MapView } from '../components/map-view';
import type { WorkerStatus, RecruitmentStage } from '../types';

export const Workers: React.FC = () => {
  const navigate = useNavigate();
  const { areas, searchWorkers, addArea } = useHRMSStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddAreaInline, setShowAddAreaInline] = useState(false);
  const [newAreaName, setNewAreaName] = useState('');
  const [newAreaPincode, setNewAreaPincode] = useState('');
  const [newAreaZone, setNewAreaZone] = useState('');
  const [selectedAreaId, setSelectedAreaId] = useState<string>('');
  const [radiusKm, setRadiusKm] = useState<number>(5);
  const [genderFilter, setGenderFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [stageFilter, setStageFilter] = useState<string>('');
  const [incompleteOnly, setIncompleteOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [showFilters, setShowFilters] = useState(false);

  const filteredWorkers = useMemo(() => {
    return searchWorkers(searchQuery, {
      areaId: selectedAreaId || undefined,
      radiusKm: selectedAreaId ? radiusKm : undefined,
      gender: genderFilter || undefined,
      status: statusFilter ? [statusFilter as WorkerStatus] : undefined,
      stage: stageFilter ? [stageFilter as RecruitmentStage] : undefined,
      incompleteOnly: incompleteOnly || undefined,
    });
  }, [searchQuery, selectedAreaId, radiusKm, genderFilter, statusFilter, stageFilter, incompleteOnly, searchWorkers]);

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
      setSelectedAreaId(created.id);
      setNewAreaName('');
      setNewAreaPincode('');
      setNewAreaZone('');
      setShowAddAreaInline(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-28 pt-6 px-4 md:px-8 font-sans">
      <div className="max-w-6xl mx-auto flex flex-col gap-5 mb-6">
        
        {/* Title Bar */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Worker Directory</h1>
            <p className="text-slate-500 text-sm mt-1 font-medium">Discover, verify, and deploy field staff in Trichy</p>
          </div>
          
          {/* View toggle (Map vs List) */}
          <div className="bg-slate-200/60 p-1 rounded-2xl flex items-center border border-slate-300/20">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 ${
                viewMode === 'list' 
                  ? 'bg-white text-slate-800 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <List size={14} />
              List Feed
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 ${
                viewMode === 'map' 
                  ? 'bg-white text-slate-800 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Map size={14} />
              Map View
            </button>
          </div>
        </div>

        {/* Global Search and Filter Activator */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, skill category, or area (e.g. KK Nagar tailor)..."
              className="w-full h-12 pl-11 pr-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:border-primary focus:outline-none shadow-sm"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-200 shadow-sm ${
              showFilters 
                ? 'bg-primary/10 border-primary text-primary' 
                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal size={18} />
          </button>
        </div>

        {/* Sliders and Selectors Drawer */}
        {showFilters && (
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up">
            
            {/* Column 1: Hyperlocal Proximity Filters */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Compass size={14} className="text-primary-light" />
                Hyperlocal Proximity
              </h3>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-bold text-slate-500 block">Centroid Trichy Area</label>
                    <button
                      type="button"
                      onClick={() => setShowAddAreaInline(!showAddAreaInline)}
                      className="text-[10px] text-primary hover:text-primary-dark font-extrabold cursor-pointer"
                    >
                      {showAddAreaInline ? '✕ Cancel' : '＋ Add Centroid'}
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
                          className="w-full h-9 border border-slate-200 rounded-xl px-2.5 text-xs focus:border-primary focus:outline-none bg-slate-50"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Pincode"
                          value={newAreaPincode}
                          onChange={(e) => setNewAreaPincode(e.target.value)}
                          className="w-full h-9 border border-slate-200 rounded-xl px-2.5 text-xs focus:border-primary focus:outline-none bg-slate-50"
                        />
                        <input
                          type="text"
                          placeholder="Zone (e.g. East)"
                          value={newAreaZone}
                          onChange={(e) => setNewAreaZone(e.target.value)}
                          className="w-full h-9 border border-slate-200 rounded-xl px-2.5 text-xs focus:border-primary focus:outline-none bg-slate-50"
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
                      value={selectedAreaId}
                      onChange={(e) => setSelectedAreaId(e.target.value)}
                      className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs focus:border-primary focus:outline-none bg-slate-50 font-medium text-slate-700"
                    >
                      <option value="">No proximity filter (show all)</option>
                      {areas.map(a => (
                        <option key={a.id} value={a.id}>📍 {a.name} ({a.pincode})</option>
                      ))}
                    </select>
                  )}
                </div>

                {selectedAreaId && (
                  <div>
                    <div className="flex justify-between items-center mb-1 text-[11px] font-bold text-slate-500">
                      <span>Proximity Radius</span>
                      <span className="text-primary font-extrabold">{radiusKm} km</span>
                    </div>
                    <input 
                      type="range"
                      min="1"
                      max="15"
                      step="1"
                      value={radiusKm}
                      onChange={(e) => setRadiusKm(Number(e.target.value))}
                      className="w-full accent-primary"
                    />
                    <div className="flex justify-between text-[9px] font-semibold text-slate-400">
                      <span>1 km</span>
                      <span>15 km</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: Status & Stage Filters */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Status & Recruitment</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">Roster Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs focus:border-primary focus:outline-none bg-slate-50 font-medium"
                  >
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="deployed">Deployed</option>
                    <option value="draft">Draft</option>
                    <option value="blacklisted">Blacklisted</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">Workflow Stage</label>
                  <select
                    value={stageFilter}
                    onChange={(e) => setStageFilter(e.target.value)}
                    className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs focus:border-primary focus:outline-none bg-slate-50 font-medium"
                  >
                    <option value="">All Stages</option>
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="interested">Interested</option>
                    <option value="verification_pending">Verification</option>
                    <option value="ready_to_join">Ready to Join</option>
                    <option value="deployed">Deployed</option>
                  </select>
                </div>
              </div>

              {/* Toggle to focus on incomplete profiles */}
              <label className="flex items-center gap-2 cursor-pointer pt-2">
                <input 
                  type="checkbox"
                  checked={incompleteOnly}
                  onChange={(e) => setIncompleteOnly(e.target.checked)}
                  className="rounded border-slate-300 text-primary focus:ring-primary w-4 h-4 accent-primary"
                />
                <div>
                  <span className="text-xs font-bold text-slate-700 block">Incomplete Profiles Only</span>
                  <span className="text-[9px] text-slate-400 font-semibold block -mt-0.5">Focus on missing Aadhaar / Drafts</span>
                </div>
              </label>
            </div>

            {/* Column 3: Demographic Filters */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Demographics</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">Gender</label>
                  <select
                    value={genderFilter}
                    onChange={(e) => setGenderFilter(e.target.value)}
                    className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs focus:border-primary focus:outline-none bg-slate-50 font-medium"
                  >
                    <option value="">All Genders</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedAreaId('');
                    setRadiusKm(5);
                    setGenderFilter('');
                    setStatusFilter('');
                    setStageFilter('');
                    setIncompleteOnly(false);
                  }}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-extrabold rounded-xl transition-all duration-200"
                >
                  Reset All Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Roster Body */}
      <div className="max-w-6xl mx-auto">
        {viewMode === 'list' ? (
          /* List Mode Layout */
          filteredWorkers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredWorkers.map(w => (
                <WorkerCard 
                  key={w.id} 
                  worker={w} 
                  area={areas.find(a => a.id === w.area_id)} 
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-sm">
              <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-extrabold text-slate-800 text-lg">No Workers Found</h3>
              <p className="text-slate-400 text-sm mt-1 max-w-md mx-auto">
                No profiles matched your search or proximity boundaries. Check your filters or add a new worker.
              </p>
            </div>
          )
        ) : (
          /* Map Mode Layout (Side-by-side split map + brief items) */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-280px)] min-h-[450px]">
            {/* Map (2/3 size) */}
            <div className="lg:col-span-2 h-full">
              <MapView 
                workers={filteredWorkers}
                areas={areas}
                selectedAreaId={selectedAreaId}
                radiusKm={radiusKm}
                onSelectWorker={(id) => navigate(`/workers/${id}`)}
              />
            </div>
            
            {/* Mini List Sidebar (1/3 size) */}
            <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden flex flex-col h-full">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">Map Results</span>
                <span className="text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                  {filteredWorkers.length} matching
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-2">
                {filteredWorkers.map(w => {
                  const areaObj = areas.find(a => a.id === w.area_id);
                  return (
                    <div 
                      key={w.id} 
                      onClick={() => navigate(`/workers/${w.id}`)}
                      className="p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors duration-150 flex items-center justify-between"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-slate-800 text-sm truncate">{w.full_name || 'Draft Worker'}</div>
                        <div className="text-[10px] font-semibold text-slate-400 mt-0.5">
                          {w.internal_id} • <span className="uppercase text-primary-light">{w.skill_category || 'Helper'}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1 truncate">
                          📍 {areaObj ? areaObj.name : 'Address not specified'}
                        </div>
                      </div>
                      <span className={`text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-md ${
                        w.worker_status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {w.worker_status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default Workers;

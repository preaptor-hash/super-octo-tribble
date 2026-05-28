import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Briefcase, 
  MapPin, 
  Clock, 
  CalendarDays, 
  UserSquare2, 
  AlertCircle,
  XCircle,
  FileCheck
} from 'lucide-react';
import { useHRMSStore } from '../db/store';

export const Deployments: React.FC = () => {
  const { deployments, workers, cancelDeployment } = useHRMSStore();

  const activeDeployments = deployments.filter(d => d.deployment_status === 'active');
  const cancelledDeployments = deployments.filter(d => d.deployment_status === 'cancelled');

  const handleCancel = (depId: string, name: string) => {
    if (confirm(`Are you sure you want to cancel ${name}'s active client deployment? They will be returned to 'active' availability.`)) {
      cancelDeployment(depId);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-28 pt-6 px-4 md:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Title */}
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Briefcase className="text-primary" size={28} />
            Client Deployments Roster
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">Track operational deployments, shifts, and client sites in Trichy</p>
        </div>

        {/* Active Deployments Section */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <FileCheck className="text-emerald-500" size={18} />
              Active Deployments ({activeDeployments.length})
            </h2>
          </div>

          {activeDeployments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeDeployments.map(dep => {
                const w = workers.find(work => work.id === dep.worker_id);
                if (!w) return null;
                
                const join = new Date(dep.joining_date || '').toLocaleDateString('en-IN', {
                  day: '2-digit', month: 'short', year: 'numeric'
                });

                return (
                  <div key={dep.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col justify-between hover:shadow-sm transition-all duration-200">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-[10px] font-black text-primary-light uppercase tracking-wider">
                          💼 {dep.client_name}
                        </span>
                        <span className="text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-800">
                          Active
                        </span>
                      </div>

                      {/* Location */}
                      <div className="flex items-center text-xs text-slate-500 gap-1 font-medium">
                        <MapPin size={12} className="text-slate-400 flex-shrink-0" />
                        <span className="truncate">{dep.deployment_location}</span>
                      </div>

                      {/* Shift */}
                      <div className="flex items-center text-xs text-slate-500 gap-1 font-medium">
                        <Clock size={12} className="text-slate-400 flex-shrink-0" />
                        <span className="truncate">{dep.shift}</span>
                      </div>

                      {/* Joining Date */}
                      <div className="flex items-center text-xs text-slate-500 gap-1 font-medium">
                        <CalendarDays size={12} className="text-slate-400 flex-shrink-0" />
                        <span>Joined: {join}</span>
                      </div>

                      {/* Worker card details */}
                      <div className="bg-white border border-slate-100 p-2.5 rounded-xl flex items-center gap-2 mt-3 shadow-inner">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center border border-slate-200/50 flex-shrink-0">
                          {w.profile_photo_url ? (
                            <img src={w.profile_photo_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <UserSquare2 className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link to={`/workers/${w.id}`} className="font-bold text-slate-800 text-xs truncate hover:underline hover:text-primary block">
                            {w.full_name || 'Draft Worker'}
                          </Link>
                          <span className="text-[9px] font-semibold text-slate-400 block -mt-0.5">
                            {w.internal_id} • <span className="uppercase text-primary-light font-bold">{w.skill_category}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/50 flex justify-end">
                      <button
                        onClick={() => handleCancel(dep.id, w.full_name || 'Worker')}
                        className="flex items-center gap-1 text-[10px] font-black text-rose-500 hover:text-white hover:bg-rose-500 border border-rose-100 hover:border-transparent px-2.5 py-1 rounded-md transition-all"
                      >
                        <XCircle size={11} />
                        Terminate Shift
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-400 font-semibold italic">No active worker deployments found.</p>
            </div>
          )}
        </div>

        {/* History Log Section */}
        {cancelledDeployments.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-4">
              Recently Cancelled / Completed Deployments
            </h2>
            
            <div className="space-y-2">
              {cancelledDeployments.map(dep => {
                const w = workers.find(work => work.id === dep.worker_id);
                return (
                  <div key={dep.id} className="p-3 border border-slate-100 bg-slate-50/50 rounded-xl flex items-center justify-between text-xs font-semibold">
                    <div>
                      <span className="text-slate-800 font-bold">{w ? w.full_name : 'Worker'}</span>
                      <span className="text-slate-400 font-normal"> - Deployed to </span>
                      <span className="text-slate-700 font-bold">{dep.client_name}</span>
                    </div>
                    <span className="text-[9px] uppercase font-extrabold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
                      Cancelled
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
export default Deployments;

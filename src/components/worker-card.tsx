import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Phone, 
  MessageSquare, 
  MapPin, 
  ShieldAlert, 
  FileText, 
  CheckCircle2, 
  Clock, 
  UserSquare2 
} from 'lucide-react';
import type { Worker, Area } from '../types';

interface WorkerCardProps {
  worker: Worker;
  area: Area | undefined;
}

export const WorkerCard: React.FC<WorkerCardProps> = ({ worker, area }) => {
  // Helper to resolve status colors
  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/50';
      case 'deployed':
        return 'bg-blue-50 text-blue-700 border-blue-200/50';
      case 'draft':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200/50';
      case 'blacklisted':
        return 'bg-rose-50 text-rose-700 border-rose-200/50';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200/50';
    }
  };

  // Helper to resolve recruitment stage colors
  const getStageColor = (stage: string | null) => {
    switch (stage) {
      case 'ready_to_join':
        return 'bg-emerald-500/10 text-emerald-800';
      case 'verification_pending':
        return 'bg-purple-500/10 text-purple-800';
      case 'deployed':
        return 'bg-blue-500/10 text-blue-800';
      case 'draft':
      case 'new':
        return 'bg-yellow-500/10 text-yellow-800';
      case 'rejected':
        return 'bg-rose-500/10 text-rose-800';
      default:
        return 'bg-slate-500/10 text-slate-800';
    }
  };

  // Missing fields for profile completion tracking
  const missingAadhaar = !worker.aadhaar_number;
  const missingPhoto = !worker.profile_photo_url;
  const isDraft = worker.worker_status === 'draft';
  const profileCompletionPercent = 
    (worker.full_name ? 20 : 0) +
    (worker.phone ? 20 : 0) +
    (worker.age ? 15 : 0) +
    (worker.skill_category ? 15 : 0) +
    (!missingAadhaar ? 15 : 0) +
    (!missingPhoto ? 15 : 0);

  return (
    <div className={`p-4 rounded-2xl border transition-all duration-200 ${
      worker.worker_status === 'blacklisted' 
        ? 'bg-rose-50/20 border-rose-100 hover:border-rose-200' 
        : 'bg-white hover:bg-slate-50/50 border-slate-100 hover:border-slate-200'
    } shadow-sm hover:shadow-md`}>
      <div className="flex items-start gap-3">
        {/* Profile Photo Avatar */}
        <div className="w-14 h-14 rounded-2xl bg-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center border border-slate-200/50 shadow-inner">
          {worker.profile_photo_url ? (
            <img 
              src={worker.profile_photo_url} 
              alt={worker.full_name || 'Worker'} 
              className="w-full h-full object-cover"
            />
          ) : (
            <UserSquare2 className="w-7 h-7 text-slate-400" />
          )}
        </div>

        {/* Worker core details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1.5">
            <h3 className="font-semibold text-slate-900 truncate text-base leading-tight hover:text-primary">
              <Link to={`/workers/${worker.id}`}>
                {worker.full_name || 'Draft Worker'}
              </Link>
            </h3>
            <span className={`text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full border ${getStatusColor(worker.worker_status)}`}>
              {worker.worker_status}
            </span>
          </div>

          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
              {worker.internal_id || 'NO ID'}
            </span>
            {worker.skill_category && (
              <span className="text-xs font-bold text-primary-light uppercase tracking-wider">
                • {worker.skill_category}
              </span>
            )}
          </div>

          {/* Hyperlocal Area & Pincode */}
          <div className="flex items-center text-xs text-slate-500 mt-2 gap-1 font-medium">
            <MapPin size={13} className="text-slate-400 flex-shrink-0" />
            <span className="truncate">
              {area ? `${area.name}, Trichy` : 'No Area Assigned'}
              {area?.pincode && ` (${area.pincode})`}
            </span>
          </div>

          {/* Verification / Progress Indicator */}
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${getStageColor(worker.recruitment_stage)}`}>
              {worker.recruitment_stage?.replace('_', ' ')}
            </span>
            
            {/* Save First, Complete Later - Profile progress bar & triggers */}
            {isDraft ? (
              <div className="flex items-center gap-1.5" title="Draft Profile - Needs completion">
                <ShieldAlert size={12} className="text-yellow-500 flex-shrink-0 animate-pulse-soft" />
                <span className="text-[10px] text-yellow-600 font-bold">Draft Profile ({profileCompletionPercent}%)</span>
              </div>
            ) : missingAadhaar ? (
              <div className="flex items-center gap-1" title="Aadhaar missing - gradual entry">
                <FileText size={12} className="text-purple-400 flex-shrink-0" />
                <span className="text-[10px] text-purple-600 font-bold">Aadhaar Pending</span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <CheckCircle2 size={12} className="text-emerald-500 flex-shrink-0" />
                <span className="text-[10px] text-emerald-600 font-semibold">Verified</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Roster & Quick Actions Row */}
      <div className="flex items-center justify-between border-t border-slate-100/70 mt-3 pt-3">
        <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
          <Clock size={12} />
          {worker.shift_preference ? `Pref: ${worker.shift_preference.toUpperCase()}` : 'No shift preference'}
        </span>

        {/* Action icons */}
        <div className="flex items-center gap-1.5">
          {worker.phone ? (
            <>
              <a 
                href={`tel:${worker.phone}`} 
                className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-primary/10 hover:text-primary transition-all duration-200"
                title="Call Worker"
              >
                <Phone size={14} />
              </a>
              <a 
                href={`https://wa.me/91${worker.phone}?text=Hello%20${encodeURIComponent(worker.full_name || 'Worker')},%20this%20is%20Vyesshrms.`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 hover:bg-emerald-100 transition-all duration-200"
                title="WhatsApp Worker"
              >
                <MessageSquare size={14} />
              </a>
            </>
          ) : (
            <span className="text-[10px] text-slate-400 italic">No phone quick-actions</span>
          )}
          <Link 
            to={`/workers/${worker.id}`}
            className="text-xs font-bold text-primary hover:text-primary-dark px-3 py-1 rounded-lg hover:bg-primary/5 transition-all duration-200"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};
export default WorkerCard;

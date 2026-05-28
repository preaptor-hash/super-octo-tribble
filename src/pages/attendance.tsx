import React, { useState } from 'react';
import imageCompression from 'browser-image-compression';
import { 
  CalendarDays, 
  MapPin, 
  Camera, 
  CheckCircle2, 
  Clock
} from 'lucide-react';
import { useHRMSStore, calculateDistance } from '../db/store';
import type { AttendanceType } from '../types';

export const Attendance: React.FC = () => {
  const { workers, attendance, checkIn, checkOut, areas } = useHRMSStore();
  
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [attType, setAttType] = useState<AttendanceType>('present');
  const [selfieCaptured, setSelfieCaptured] = useState<File | null>(null);
  const [attNotes, setAttNotes] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  const activeWorkers = workers.filter(w => w.worker_status === 'active' || w.worker_status === 'deployed');

  // Trigger GPS Geolocation
  const handleGetLocation = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setIsLocating(false);
        },
        (error) => {
          console.error("GPS failed:", error);
          alert("GPS Failed: Please ensure location permissions are granted.");
          setIsLocating(false);
        },
        { timeout: 5000 }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
      setIsLocating(false);
    }
  };

  const handleSelfieCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedFile = await imageCompression(file, {
          maxSizeMB: 0.2,
          maxWidthOrHeight: 800,
          useWebWorker: true,
        });
        setSelfieCaptured(compressedFile);
      } catch (err) {
        console.error("Compression error:", err);
        setSelfieCaptured(file);
      }
    }
  };

  const handleCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkerId) {
      alert('Please select a worker to record attendance.');
      return;
    }

    let finalNotes = attNotes || `Checked in via field recruiter app.`;

    // ── GEOFENCING LOGIC ──
    const worker = activeWorkers.find(w => w.id === selectedWorkerId);
    if (worker && worker.area_id && coords) {
      const area = areas.find(a => a.id === worker.area_id);
      if (area && area.latitude && area.longitude) {
        const distMeters = calculateDistance(
          coords.latitude, coords.longitude,
          area.latitude, area.longitude
        );
        
        if (distMeters > 500) {
          finalNotes += ` [WARNING: Out of Bounds Check-in. Worker is ${Math.round(distMeters)}m away from assigned area centroid]`;
        }
      }
    }

    // Call store action
    checkIn(
      selectedWorkerId,
      attType,
      coords,
      selfieCaptured,
      finalNotes
    );

    alert('Attendance successfully recorded!');
    
    // Reset Form
    setSelectedWorkerId('');
    setAttType('present');
    setSelfieCaptured(null);
    setAttNotes('');
    setCoords(null);
  };

  const handleCheckOut = (workerId: string) => {
    checkOut(workerId);
    alert('Worker checked out of shift.');
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-28 pt-6 px-4 md:px-8 font-sans">
      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Span 3: Form Roster */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
            <h1 className="text-2xl font-black text-slate-800 tracking-tight mb-1 flex items-center gap-2">
              <CalendarDays className="text-primary" size={24} />
              Shift Check-In Portal
            </h1>
            <p className="text-slate-500 text-xs font-semibold mb-6">Log daily attendance verification for deployed field workers</p>

            <form onSubmit={handleCheckIn} className="space-y-4.5">
              
              {/* Select Deployed Worker */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Select Worker</label>
                <select
                  value={selectedWorkerId}
                  onChange={(e) => setSelectedWorkerId(e.target.value)}
                  className="w-full h-11 border border-slate-200 rounded-xl px-3 text-sm focus:border-primary focus:outline-none bg-white font-medium text-slate-700"
                >
                  <option value="">-- Choose active worker --</option>
                  {activeWorkers.map(w => {
                    const areaObj = areas.find(a => a.id === w.area_id);
                    return (
                      <option key={w.id} value={w.id}>
                        {w.full_name} ({w.internal_id}) - {w.skill_category} [📍 {areaObj ? areaObj.name : 'No address'}]
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Attendance Type Buttons */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Attendance Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['present', 'late', 'leave'] as AttendanceType[]).map((type) => (
                    <button
                      type="button"
                      key={type}
                      onClick={() => setAttType(type)}
                      className={`py-2.5 rounded-xl border text-xs font-extrabold capitalize transition-all ${
                        attType === type
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* simulated GPS Location Capture */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">GPS Verification Stamp</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={isLocating}
                    className={`flex-1 h-11 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                      coords 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <MapPin size={14} className={isLocating ? 'animate-pulse' : ''} />
                    {isLocating ? 'Acquiring GPS Coords...' : coords ? 'GPS Coordinates Locked!' : 'Fetch Field GPS Coordinates'}
                  </button>
                </div>
                {coords && (
                  <div className="text-[10px] text-slate-400 font-semibold pl-1">
                    Latitude: <span className="text-slate-600 font-bold">{coords.latitude.toFixed(6)}</span>, 
                    Longitude: <span className="text-slate-600 font-bold">{coords.longitude.toFixed(6)}</span>
                  </div>
                )}
              </div>

              {/* Field Camera Selfie */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Field Selfie Upload (Visual Stamp)</label>
                <div className="relative">
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment" 
                    onChange={handleSelfieCapture}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className={`w-full h-24 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all ${
                    selfieCaptured
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-600 shadow-inner'
                      : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300'
                  }`}>
                    {selfieCaptured ? (
                      <>
                        <CheckCircle2 size={24} className="text-emerald-500 animate-bounce" />
                        <span className="text-xs font-bold mt-1">Selfie Stamp Attached</span>
                      </>
                    ) : (
                      <>
                        <Camera size={24} className="text-slate-400" />
                        <span className="text-xs font-bold mt-1">Tap to capture field selfie</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Verification Comments (Optional)</label>
                <input
                  type="text"
                  value={attNotes}
                  onChange={(e) => setAttNotes(e.target.value)}
                  placeholder="e.g. Checked in at Cantonment complex. Proper uniform."
                  className="w-full h-11 border border-slate-200 rounded-xl px-3 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-tr from-primary to-primary-light text-white font-extrabold rounded-2xl shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all border border-white/10"
              >
                Log Shift Check-In
              </button>
            </form>
          </div>
        </div>

        {/* Right Span 2: Active Shift checkins */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm h-max">
          <h2 className="text-lg font-bold text-slate-900 leading-tight mb-1 flex items-center gap-1.5">
            <Clock className="text-primary-light" size={18} />
            Checked-In Roster
          </h2>
          <p className="text-slate-400 text-[10px] font-semibold mb-4">Active shift workers checked in today</p>

          <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto pr-1">
            {attendance.length > 0 ? (
              attendance.map(att => {
                const w = workers.find(work => work.id === att.worker_id);
                if (!w) return null;

                const checkTime = new Date(att.check_in_time || '').toLocaleTimeString('en-IN', {
                  hour: '2-digit', minute: '2-digit'
                });

                return (
                  <div key={att.id} className="py-3 flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold text-slate-800 text-xs truncate max-w-[140px]">{w.full_name}</div>
                      <div className="text-[9px] font-semibold text-slate-400 mt-0.5">
                        ID: {w.internal_id} • IN: {checkTime}
                      </div>
                      {att.notes && (
                        <div className="text-[9px] text-slate-500 italic mt-0.5 truncate max-w-[145px]">"{att.notes}"</div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <span className={`text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-md ${
                        att.type === 'present' ? 'bg-emerald-50 text-emerald-700' : 'bg-yellow-50 text-yellow-700'
                      }`}>
                        {att.type}
                      </span>
                      {!att.check_out_time ? (
                        <button
                          onClick={() => handleCheckOut(w.id)}
                          className="text-[9px] font-black text-rose-500 hover:text-white hover:bg-rose-500 border border-rose-200/50 hover:border-transparent px-2 py-0.5 rounded transition-all"
                        >
                          Checkout
                        </button>
                      ) : (
                        <span className="text-[8px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">OUT</span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 font-semibold italic text-center py-4">No active checkins logged today.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
export default Attendance;

import React, { useState } from 'react';
import imageCompression from 'browser-image-compression';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  FileText, 
  Briefcase, 
  History, 
  Send,
  Upload,
  AlertTriangle,
  Trash2,
  CalendarDays
} from 'lucide-react';
import { useHRMSStore } from '../db/store';
import type { WorkerStatus, RecruitmentStage } from '../types';

export const WorkerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { 
    users,
    workers, 
    areas, 
    attendance, 
    notesTimeline, 
    deployments,
    documents,
    updateWorker,
    deleteWorker,
    addNote,
    deployWorker,
    uploadDocument
  } = useHRMSStore();

  // Tabs state
  const [activeTab, setActiveTab] = useState<'profile' | 'timeline' | 'deploy' | 'attendance' | 'docs'>('profile');

  const worker = workers.find(w => w.id === id);

  // Tab 1 Form states (Profile Info edit) - using optional chaining to satisfy hooks rules on empty routes
  const [fullName, setFullName] = useState(worker?.full_name || '');
  const [phone, setPhone] = useState(worker?.phone || '');
  const [altPhone, setAltPhone] = useState(worker?.alternate_phone || '');
  const [age, setAge] = useState(worker?.age ? String(worker.age) : '');
  const [gender, setGender] = useState(worker?.gender || 'male');
  const [skill, setSkill] = useState(worker?.skill_category || 'helper');
  const [areaId, setAreaId] = useState(worker?.area_id || 'not_specified');
  const [salary, setSalary] = useState(worker?.salary_expected ? String(worker.salary_expected) : '');
  const [shiftPref, setShiftPref] = useState(worker?.shift_preference || 'day');
  const [aadhaar, setAadhaar] = useState(worker?.aadhaar_number || '');
  const [pan, setPan] = useState(worker?.pan_number || '');
  const [workerStatus, setWorkerStatus] = useState<WorkerStatus>(worker?.worker_status || 'draft');
  const [stage, setStage] = useState<RecruitmentStage>(worker?.recruitment_stage || 'new');
  const [generalNotes, setGeneralNotes] = useState(worker?.notes || '');

  // Tab 2 Note timeline state
  const [noteText, setNoteText] = useState('');

  // Tab 3 Deployment form state
  const [clientName, setClientName] = useState('');
  const [depLocation, setDepLocation] = useState('');
  const [depShift, setDepShift] = useState('General Shift (9:00 AM - 6:00 PM)');
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split('T')[0]);

  // Tab 5 Document dynamic upload states
  const [docType, setDocType] = useState('aadhaar');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);

  // Early return if worker doesn't exist - safely placed BELOW all hook declarations
  if (!worker) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 text-center max-w-sm">
          <AlertTriangle className="text-yellow-500 w-12 h-12 mx-auto mb-3" />
          <h2 className="font-extrabold text-slate-800 text-lg">Worker Profile Not Found</h2>
          <p className="text-slate-400 text-sm mt-1">This worker profile may have been removed or does not exist.</p>
          <Link to="/workers" className="mt-4 inline-flex px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl animate-pulse-soft">
            Back to Directory
          </Link>
        </div>
      </div>
    );
  }

  // Derived properties - safely computed ONLY when worker is validated
  const workerArea = areas.find(a => a.id === worker.area_id);
  const workerNotes = notesTimeline.filter(n => n.worker_id === worker.id).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const workerAttendance = attendance.filter(a => a.worker_id === worker.id).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const workerDeployments = deployments.filter(d => d.worker_id === worker.id).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const workerDocuments = documents.filter(d => d.worker_id === worker.id);

  // Profile completion calculation
  const missingAadhaar = !worker.aadhaar_number;
  const missingPhoto = !worker.profile_photo_url;
  const completionPercent = 
    (worker.full_name ? 20 : 0) +
    (worker.phone ? 20 : 0) +
    (worker.age ? 15 : 0) +
    (worker.skill_category ? 15 : 0) +
    (!missingAadhaar ? 15 : 0) +
    (!missingPhoto ? 15 : 0);

  const assignedRecruiter = users.find(u => u.id === worker.assigned_recruiter_id);
  const assignedRecruiterName = assignedRecruiter?.full_name || 'Admin User';

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateWorker(worker.id, {
      full_name: fullName || null,
      phone: phone || null,
      alternate_phone: altPhone || null,
      age: age ? Number(age) : null,
      gender: gender || null,
      skill_category: skill || null,
      area_id: areaId === 'not_specified' ? null : areaId,
      pincode: areaId !== 'not_specified' ? areas.find(a => a.id === areaId)?.pincode || null : null,
      salary_expected: salary ? Number(salary) : null,
      shift_preference: shiftPref || null,
      aadhaar_number: aadhaar || null,
      pan_number: pan || null,
      worker_status: workerStatus,
      recruitment_stage: stage,
      notes: generalNotes || null
    });
    alert('Worker profile successfully updated!');
  };

  const handleAddTimelineNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    addNote(worker.id, noteText);
    setNoteText('');
  };

  const handleDeploy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !depLocation.trim()) {
      alert('Please enter Client Name and Deployment Location.');
      return;
    }
    deployWorker(worker.id, clientName, depLocation, depShift, joiningDate);
    alert('Worker successfully deployed! Roster updated.');
    setClientName('');
    setDepLocation('');
    setActiveTab('deploy');
  };

  const handleDocUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (selectedFile) {
      await uploadDocument(worker.id, docType, selectedFile);
      alert(`${docType.toUpperCase()} document copy uploaded successfully!`);
      // Reset upload fields
      setSelectedFile(null);
      setFileName('');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setErrorMsg('File size exceeds the 10 MB limit. Please choose a smaller file.');
        setSelectedFile(null);
        setFileName('');
        return;
      }
      
      try {
        const options = {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        };
        const compressedFile = await imageCompression(file, options);
        setSelectedFile(compressedFile);
        setFileName(file.name);
      } catch (err) {
        console.error("Compression error, using original file:", err);
        setSelectedFile(file);
        setFileName(file.name);
      }
    }
  };

  const handleDelete = () => {
    if (confirm('Are you absolutely sure you want to permanently delete this worker profile? This cannot be undone.')) {
      deleteWorker(worker.id);
      navigate('/workers');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-28 pt-6 px-4 md:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Back Link */}
        <Link 
          to="/workers" 
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl mb-5 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <ArrowLeft size={14} />
          Back to Directory
        </Link>

        {/* Worker Summary Header Card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Profile Photo Avatar */}
              <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10 flex-shrink-0">
                {worker.profile_photo_url ? (
                  <img src={worker.profile_photo_url} alt="" className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  <User size={32} />
                )}
              </div>
              
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-tight">
                    {worker.full_name || <span className="text-slate-400 italic">Not specified</span>}
                  </h2>
                  <span className={`text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-md border ${
                    worker.worker_status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                  }`}>
                    {worker.worker_status}
                  </span>
                </div>
                
                <p className="text-xs text-slate-400 font-semibold mt-1">
                  ID: <span className="text-slate-600 font-bold">{worker.internal_id || 'NOT GENERATED'}</span> • 
                  📍 {workerArea ? `${workerArea.name} (${workerArea.pincode})` : 'Address not specified'}
                </p>
              </div>
            </div>

            {/* Profile Completion Dial */}
            <div className="w-full md:w-auto bg-slate-50 border border-slate-100 p-3 rounded-2xl flex items-center gap-3">
              <div className="relative w-11 h-11 flex-shrink-0">
                {/* Visual circular completion meter */}
                <svg className="w-full h-full" viewBox="0 0 36 36">
                  <path
                    className="text-slate-200"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-primary"
                    strokeDasharray={`${completionPercent}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-slate-700">
                  {completionPercent}%
                </div>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-700">Profile Completion</div>
                <div className="text-[10px] font-semibold text-slate-400">Save First, Complete Later</div>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-t border-slate-100/70 mt-5 pt-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Assigned Recruiter: <span className="text-slate-700 font-extrabold">{assignedRecruiterName}</span>
            </span>
            <button
              onClick={handleDelete}
              className="flex items-center gap-1 text-xs font-bold text-rose-500 hover:text-rose-700 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-colors"
            >
              <Trash2 size={13} />
              Delete Profile
            </button>
          </div>
        </div>

        {/* Tab Selection Navigation */}
        <div className="overflow-x-auto mb-6">
          <div className="flex gap-1.5 bg-slate-200/50 p-1 rounded-2xl w-max">
            <button 
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 ${
                activeTab === 'profile' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <User size={14} />
              Profile Details
            </button>
            <button 
              onClick={() => setActiveTab('timeline')}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 ${
                activeTab === 'timeline' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <FileText size={14} />
              Notes Timeline ({workerNotes.length})
            </button>
            <button 
              onClick={() => setActiveTab('deploy')}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 ${
                activeTab === 'deploy' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Briefcase size={14} />
              Deployments ({workerDeployments.length})
            </button>
            <button 
              onClick={() => setActiveTab('attendance')}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 ${
                activeTab === 'attendance' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <History size={14} />
              Attendance Log ({workerAttendance.length})
            </button>
            <button 
              onClick={() => setActiveTab('docs')}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 ${
                activeTab === 'docs' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Upload size={14} />
              Credentials ({workerDocuments.length})
            </button>
          </div>
        </div>

        {/* Tab contents */}
        <div className="animate-slide-up">
          
          {/* TAB 1: PROFILE EDITOR */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
              <h3 className="font-extrabold text-slate-800 text-lg mb-5 border-b border-slate-100 pb-3">Gradual Profile Completion Info</h3>
              
              <form onSubmit={handleUpdateProfile} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Full Name</label>
                    <input 
                      type="text" 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full h-11 border border-slate-200 rounded-xl px-3 text-sm focus:border-primary focus:outline-none"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Phone Number</label>
                    <input 
                      type="tel" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full h-11 border border-slate-200 rounded-xl px-3 text-sm font-mono focus:border-primary focus:outline-none"
                    />
                  </div>

                  {/* Alternate Phone */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Alternate Phone (Optional)</label>
                    <input 
                      type="tel" 
                      value={altPhone}
                      onChange={(e) => setAltPhone(e.target.value)}
                      className="w-full h-11 border border-slate-200 rounded-xl px-3 text-sm font-mono focus:border-primary focus:outline-none"
                    />
                  </div>

                  {/* Age */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Age (Optional)</label>
                    <input 
                      type="number" 
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full h-11 border border-slate-200 rounded-xl px-3 text-sm focus:border-primary focus:outline-none"
                    />
                  </div>

                  {/* Gender */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full h-11 border border-slate-200 rounded-xl px-3 text-sm focus:border-primary focus:outline-none bg-white"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>

                  {/* Skill Category */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Primary Skill</label>
                    <select
                      value={skill}
                      onChange={(e) => setSkill(e.target.value)}
                      className="w-full h-11 border border-slate-200 rounded-xl px-3 text-sm focus:border-primary focus:outline-none bg-white"
                    >
                      <option value="helper">Helper / Loader</option>
                      <option value="electrician">Electrician</option>
                      <option value="tailoring">Tailoring</option>
                      <option value="delivery executive">Delivery Executive</option>
                      <option value="security guard">Security Guard</option>
                      <option value="plumber">Plumber</option>
                    </select>
                  </div>

                  {/* Expected Salary */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Expected Monthly Salary (INR)</label>
                    <input 
                      type="number" 
                      value={salary}
                      onChange={(e) => setSalary(e.target.value)}
                      className="w-full h-11 border border-slate-200 rounded-xl px-3 text-sm focus:border-primary focus:outline-none"
                    />
                  </div>

                  {/* Shift preference */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Preferred Shift</label>
                    <select
                      value={shiftPref}
                      onChange={(e) => setShiftPref(e.target.value)}
                      className="w-full h-11 border border-slate-200 rounded-xl px-3 text-sm focus:border-primary focus:outline-none bg-white"
                    >
                      <option value="day">Day Shift</option>
                      <option value="night">Night Shift</option>
                      <option value="any">Flexible / Any</option>
                    </select>
                  </div>

                  {/* Hyperlocal Area Selector - USER REQUESTED "ADDRESS NOT SPECIFIED" OPTION */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Trichy Hyperlocal Area</label>
                    <select
                      value={areaId}
                      onChange={(e) => setAreaId(e.target.value)}
                      className="w-full h-11 border border-slate-200 rounded-xl px-3 text-sm focus:border-primary focus:outline-none bg-white"
                    >
                      {/* Option for not specified address */}
                      <option value="not_specified">⚠️ Address not specified</option>
                      
                      {areas.map(a => (
                        <option key={a.id} value={a.id}>📍 {a.name} ({a.pincode})</option>
                      ))}
                    </select>
                  </div>

                  {/* Aadhaar Number */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Aadhaar Number (12 Digits)</label>
                    <input 
                      type="text" 
                      value={aadhaar}
                      onChange={(e) => setAadhaar(e.target.value)}
                      placeholder="XXXX XXXX XXXX"
                      className="w-full h-11 border border-slate-200 rounded-xl px-3 text-sm focus:border-primary focus:outline-none"
                    />
                  </div>

                  {/* PAN Number */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">PAN Number (Optional)</label>
                    <input 
                      type="text" 
                      value={pan}
                      onChange={(e) => setPan(e.target.value)}
                      placeholder="ABCDE1234F"
                      className="w-full h-11 border border-slate-200 rounded-xl px-3 text-sm font-mono uppercase focus:border-primary focus:outline-none"
                    />
                  </div>

                  {/* Status Selection */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Roster Status</label>
                    <select
                      value={workerStatus}
                      onChange={(e) => setWorkerStatus(e.target.value as WorkerStatus)}
                      className="w-full h-11 border border-slate-200 rounded-xl px-3 text-sm focus:border-primary focus:outline-none bg-white"
                    >
                      <option value="draft">Draft (Incomplete)</option>
                      <option value="active">Active (Available)</option>
                      <option value="deployed">Deployed</option>
                      <option value="blacklisted">Blacklisted</option>
                      <option value="unavailable">Unavailable</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

                  {/* Workflow Stage */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Recruitment Workflow Stage</label>
                    <select
                      value={stage}
                      onChange={(e) => setStage(e.target.value as RecruitmentStage)}
                      className="w-full h-11 border border-slate-200 rounded-xl px-3 text-sm focus:border-primary focus:outline-none bg-white"
                    >
                      <option value="new">New Entry</option>
                      <option value="contacted">Contacted</option>
                      <option value="interested">Interested</option>
                      <option value="verification_pending">Verification Pending</option>
                      <option value="ready_to_join">Ready to Join</option>
                      <option value="deployed">Deployed to Client</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>

                {/* General Notes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">General Annotations & Roster Notes</label>
                  <textarea 
                    value={generalNotes}
                    onChange={(e) => setGeneralNotes(e.target.value)}
                    rows={4}
                    placeholder="General characteristics, skills, behavior, language parameters..."
                    className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <button 
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-tr from-primary to-primary-light text-white font-extrabold rounded-xl text-sm shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    Save Profile Complete Info
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: NOTES TIMELINE FEED */}
          {activeTab === 'timeline' && (
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
              <h3 className="font-extrabold text-slate-800 text-lg mb-5 border-b border-slate-100 pb-3">Interaction Notes Timeline Feed</h3>
              
              {/* Form to log new recruiter annotation */}
              <form onSubmit={handleAddTimelineNote} className="mb-6 flex gap-2.5 items-end">
                <div className="flex-1 space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Log Recruiter Action (e.g. called worker - no answer)</label>
                  <input 
                    type="text" 
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="e.g. Called worker - salary agreed. Scheduled to join on Monday."
                    className="w-full h-11 border border-slate-200 rounded-xl px-3 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="h-11 px-5 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-sm flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <Send size={14} />
                  Add Note
                </button>
              </form>

              {/* Feed items */}
              <div className="relative border-l-2 border-slate-100 pl-6 ml-3 space-y-6">
                {workerNotes.map((note) => {
                  const matchedUser = users.find(u => u.id === note.user_id);
                  const logTime = new Date(note.created_at).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <div key={note.id} className="relative">
                      {/* Timeline dot */}
                      <span className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-primary border-2 border-white ring-4 ring-slate-50"></span>
                      
                      <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-2xl">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-xs font-black text-slate-700">
                            👤 {matchedUser ? matchedUser.full_name : 'System Recruiter'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold">{logTime}</span>
                        </div>
                        <p className="text-slate-600 text-sm font-medium leading-relaxed">{note.note_content}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: ACTIVE & PAST DEPLOYMENTS */}
          {activeTab === 'deploy' && (
            <div className="space-y-6">
              {/* Deploy worker active form */}
              <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                <h3 className="font-extrabold text-slate-800 text-lg mb-5 border-b border-slate-100 pb-3">Deploy Worker to Client</h3>
                
                <form onSubmit={handleDeploy} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">Client Company Name</label>
                      <input 
                        type="text" 
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="e.g. Trendset Garments Trichy"
                        className="w-full h-11 border border-slate-200 rounded-xl px-3 text-sm focus:border-primary focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">Deployment Specific Location</label>
                      <input 
                        type="text" 
                        value={depLocation}
                        onChange={(e) => setDepLocation(e.target.value)}
                        placeholder="e.g. Apparel Complex, Thillai Nagar"
                        className="w-full h-11 border border-slate-200 rounded-xl px-3 text-sm focus:border-primary focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">Active Shift</label>
                      <select 
                        value={depShift}
                        onChange={(e) => setDepShift(e.target.value)}
                        className="w-full h-11 border border-slate-200 rounded-xl px-3 text-sm focus:border-primary focus:outline-none bg-white font-medium text-slate-700"
                      >
                        <option value="General Shift (9:00 AM - 6:00 PM)">General Shift (9:00 AM - 6:00 PM)</option>
                        <option value="Day Shift (8:00 AM - 5:00 PM)">Day Shift (8:00 AM - 5:00 PM)</option>
                        <option value="Night Shift (8:00 PM - 5:00 AM)">Night Shift (8:00 PM - 5:00 AM)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">Joining Date</label>
                      <input 
                        type="date" 
                        value={joiningDate}
                        onChange={(e) => setJoiningDate(e.target.value)}
                        className="w-full h-11 border border-slate-200 rounded-xl px-3 text-sm focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-tr from-primary to-primary-light text-white font-extrabold rounded-xl text-sm shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all"
                  >
                    Deploy Worker & Set Active Roster Status
                  </button>
                </form>
              </div>

              {/* History Roster */}
              <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                <h3 className="font-extrabold text-slate-800 text-lg mb-4">Deployment History Log</h3>
                
                {workerDeployments.length > 0 ? (
                  <div className="space-y-3">
                    {workerDeployments.map(dep => {
                      const join = new Date(dep.joining_date || '').toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      });
                      
                      return (
                        <div key={dep.id} className="p-4 border border-slate-100 bg-slate-50/50 rounded-2xl flex items-center justify-between">
                          <div>
                            <h4 className="font-bold text-slate-800 text-sm">💼 {dep.client_name}</h4>
                            <p className="text-xs text-slate-500 font-semibold mt-1">📍 {dep.deployment_location}</p>
                            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Shift: {dep.shift} • Joined: {join}</p>
                          </div>
                          <span className={`text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-md ${
                            dep.deployment_status === 'active' ? 'bg-emerald-500/10 text-emerald-800' : 'bg-slate-200 text-slate-500'
                          }`}>
                            {dep.deployment_status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 font-semibold italic text-center py-4">No historical deployment logs exist for this worker profile.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: ATTENDANCE LOG */}
          {activeTab === 'attendance' && (
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
              <h3 className="font-extrabold text-slate-800 text-lg mb-5 border-b border-slate-100 pb-3">Daily Attendance logs</h3>
              
              {workerAttendance.length > 0 ? (
                <div className="space-y-4">
                  {workerAttendance.map(att => {
                    const checkIn = new Date(att.check_in_time || '').toLocaleTimeString('en-IN', {
                      hour: '2-digit', minute: '2-digit'
                    });
                    
                    const checkInDate = new Date(att.check_in_time || '').toLocaleDateString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric'
                    });

                    return (
                      <div key={att.id} className="p-4 border border-slate-100 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                              <CalendarDays size={13} className="text-slate-400" />
                              {checkInDate} • Checked-in at {checkIn}
                            </div>
                            {att.notes && (
                              <p className="text-slate-500 text-xs mt-1 italic font-medium">"{att.notes}"</p>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`text-[9px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-md ${
                            att.type === 'present' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-yellow-50 text-yellow-700 border-yellow-100'
                          }`}>
                            {att.type.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 font-semibold italic text-center py-4">No attendance checks logged for this worker.</p>
              )}
            </div>
          )}

          {/* TAB 5: DOCUMENT UPLOADER */}
          {activeTab === 'docs' && (
            <div className="space-y-6 animate-slide-up">
              {/* Actual file upload selector & verification form */}
              <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                <h3 className="font-extrabold text-slate-800 text-lg mb-4 border-b border-slate-100 pb-3">Verify Worker Credentials</h3>
                
                <form onSubmit={handleDocUpload} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Select Document Type */}
                    <div className="space-y-1.5 w-full">
                      <label className="text-xs font-bold text-slate-700 block">Select Document Type</label>
                      <select
                        value={docType}
                        onChange={(e) => setDocType(e.target.value)}
                        className="w-full h-11 border border-slate-200 rounded-xl px-3 text-sm focus:border-primary focus:outline-none bg-white font-medium text-slate-700 font-sans"
                      >
                        <option value="aadhaar">Aadhaar Card (UIDAI)</option>
                        <option value="pan">PAN Card (Income Tax)</option>
                        <option value="resume">Resume / CV</option>
                        <option value="certificate">Trade Course Certificate</option>
                      </select>
                    </div>

                    {/* File input (accepts all image formats & PDFs) */}
                    <div className="space-y-1.5 w-full">
                      <label className="text-xs font-bold text-slate-700 block">Upload File (Max 3MB, Images/PDF)</label>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleFileChange}
                        className="text-slate-900 w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer h-11 flex items-center border border-slate-200 rounded-xl px-2 bg-slate-50"
                      />
                    </div>
                  </div>

                  {/* Size and generic warnings */}
                  {errorMsg && (
                    <div className="text-xs font-bold text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-100 flex items-center gap-1.5 animate-slide-up">
                      ⚠️ {errorMsg}
                    </div>
                  )}

                  {fileName && !errorMsg && (
                    <div className="text-xs font-bold text-emerald-600 bg-emerald-50 p-3 rounded-xl border border-emerald-100 flex items-center gap-1.5 animate-slide-up">
                      ✓ Ready: {fileName} (Size and format verified)
                    </div>
                  )}

                  <div className="flex justify-end pt-2 border-t border-slate-100">
                    <button
                      type="submit"
                      disabled={!selectedFile || !!errorMsg}
                      className="w-full md:w-auto h-11 px-6 bg-gradient-to-tr from-primary to-primary-light text-white font-extrabold rounded-xl text-sm flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md cursor-pointer border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Upload size={14} />
                      Upload Selected File
                    </button>
                  </div>
                </form>
              </div>

              {/* Document List with direct preview support for website viewing */}
              <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                <h3 className="font-extrabold text-slate-800 text-lg mb-4">Uploaded Files Log</h3>
                
                {workerDocuments.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {workerDocuments.map(doc => {
                      const isImage = doc.file_url.startsWith('data:image/') || doc.file_url.match(/\.(jpeg|jpg|gif|png|webp)/i);
                      return (
                        <div key={doc.id} className="p-4 border border-slate-100 bg-slate-50/50 rounded-2xl flex items-center justify-between gap-3 shadow-xs hover:border-slate-200 transition-all duration-200">
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Live Viewable thumbnail or generic icon */}
                            {isImage ? (
                              <div 
                                onClick={() => setPreviewDocUrl(doc.file_url)}
                                className="w-12 h-12 rounded-xl border border-slate-200 overflow-hidden cursor-zoom-in flex-shrink-0 bg-white hover:scale-105 active:scale-95 transition-all shadow-sm"
                                title="Click to view image directly"
                              >
                                <img src={doc.file_url} className="w-full h-full object-cover" alt={doc.document_type} />
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-xl border border-slate-100 bg-primary/5 flex items-center justify-center flex-shrink-0">
                                <FileText size={20} className="text-primary-light" />
                              </div>
                            )}
                            
                            <div className="min-w-0">
                              <div className="font-extrabold text-slate-800 text-sm uppercase truncate">{doc.document_type}</div>
                              <div className="text-[9px] text-slate-400 font-semibold mt-0.5">
                                {isImage ? '✓ Viewable Image File' : '📄 PDF Document'}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                            {isImage && (
                              <button
                                type="button"
                                onClick={() => setPreviewDocUrl(doc.file_url)}
                                className="text-[11px] font-extrabold text-primary hover:text-primary-dark hover:underline bg-primary/5 hover:bg-primary/10 px-2.5 py-1 rounded-lg transition-all"
                              >
                                View copy
                              </button>
                            )}
                            
                            <a 
                              href={doc.file_url} 
                              download={`${doc.document_type}_${worker.id}`}
                              className="text-[10px] font-bold text-slate-400 hover:text-slate-600 hover:underline"
                            >
                              Download copy
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 border border-dashed border-slate-200 rounded-3xl">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-400 font-semibold italic">No credential documents uploaded yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Premium Frosted Glass Full-Screen Image Preview Modal */}
          {previewDocUrl && (
            <div 
              className="fixed inset-0 z-[1000] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
              onClick={() => setPreviewDocUrl(null)}
            >
              <div 
                className="relative max-w-3xl w-full max-h-[85vh] glass p-4 rounded-3xl border border-white/20 flex flex-col items-center justify-center animate-slide-up shadow-2xl"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image container
              >
                <button 
                  onClick={() => setPreviewDocUrl(null)}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white hover:bg-slate-100 text-slate-700 flex items-center justify-center font-bold shadow-md text-sm cursor-pointer z-10 hover:scale-105 active:scale-95 transition-all border border-slate-200"
                >
                  ✕
                </button>
                <div className="w-full overflow-auto flex justify-center py-4">
                  <img 
                    src={previewDocUrl} 
                    className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-lg border border-slate-200/50" 
                    alt="Credential Preview" 
                  />
                </div>
                <div className="text-center pb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Worker Credential Preview • Frosted Viewer</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default WorkerDetail;

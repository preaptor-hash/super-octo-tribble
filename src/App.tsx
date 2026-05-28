import { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Briefcase,
  LogOut,
  User,
  AlertCircle,
  Settings as SettingsIcon,
  Loader2,
} from 'lucide-react';

import { supabase } from './lib/supabase';
import { useHRMSStore } from './db/store';
import { Login } from './pages/login';
import { Dashboard } from './pages/dashboard';
import { Workers } from './pages/workers';
import { WorkerDetail } from './pages/worker-detail';
import { Attendance } from './pages/attendance';
import { Deployments } from './pages/deployments';
import { Settings } from './pages/settings';
import { BottomNav } from './components/bottom-nav';

// ─── Auth guard + data bootstrap ─────────────────────────────
const MainLayout = ({ children }) => {
  const { currentUser, loadAll, logout } = useHRMSStore();
  const [appReady, setAppReady] = useState(false);

  // Listen to ALL auth state changes (refresh, login, logout, token renewal)
  useEffect(() => {
    let isMounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        console.log(`🔑 Auth event: ${event}`);

        if (
          (event === 'INITIAL_SESSION' ||
           event === 'SIGNED_IN' ||
           event === 'TOKEN_REFRESHED') &&
          session?.user
        ) {
          // Only bootstrap if we don't already have a user in store
          if (!useHRMSStore.getState().currentUser) {
            console.log('✓ Session found, loading user profile...');
            let { data: profile } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();

            // Upsert if missing (new auth user not yet in public.users)
            if (!profile) {
              await supabase.from('users').upsert({
                id: session.user.id,
                email: session.user.email,
                full_name: session.user.user_metadata?.full_name
                  ?? session.user.email?.split('@')[0],
                role: 'recruiter',
              }, { onConflict: 'id' });
              const { data: refetched } = await supabase
                .from('users').select('*')
                .eq('id', session.user.id).maybeSingle();
              profile = refetched;
            }

            if (profile && isMounted) {
              useHRMSStore.setState({ currentUser: profile });
              await loadAll();
              useHRMSStore.getState().initializeRealtimeSubscriptions();
              setAppReady(true);
            } else if (isMounted) {
              // Profile still missing — allow app to redirect to login
              setAppReady(true);
            }
          }
        } else if (event === 'SIGNED_OUT') {
          // Clear store on logout (from any tab)
          useHRMSStore.setState({
            currentUser: null,
            users: [],
            areas: [],
            workers: [],
            attendance: [],
            notesTimeline: [],
            deployments: [],
            documents: [],
          });
        }

        if (isMounted) setAppReady(true);
      }
    );

    // Safety-net timeout — if onAuthStateChange never fires (network issue)
    const timeout = setTimeout(() => {
      if (isMounted && !useHRMSStore.getState().currentUser) {
        console.log('⏱️ Auth timeout — marking app ready');
        setAppReady(true);
      }
    }, 8000);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!appReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // ── Quick Add Modal state ──────────────────────────────────
  return <MainLayoutInner>{children}</MainLayoutInner>;
};

// Separated so hooks aren't conditional
const MainLayoutInner = ({ children }) => {
  const { currentUser, logout, fastAddWorker, areas, addArea } = useHRMSStore();
  const location = useLocation();
  const navigate = useNavigate();

  const [showGlobalAdd, setShowGlobalAdd] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [skill, setSkill] = useState('helper');
  const [customSkill, setCustomSkill] = useState('');
  const [areaId, setAreaId] = useState('not_specified');
  const [gender, setGender] = useState('male');

  const [showAddAreaInline, setShowAddAreaInline] = useState(false);
  const [newAreaName, setNewAreaName] = useState('');
  const [newAreaPincode, setNewAreaPincode] = useState('');
  const [newAreaZone, setNewAreaZone] = useState('');

  const handleGlobalFastAdd = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const newWorker = await fastAddWorker({
      full_name: name,
      phone,
      skill_category: skill === 'other' ? customSkill.trim() : skill,
      area_id: areaId === 'not_specified' ? null : areaId,
      gender,
    });
    setIsSaving(false);
    if (!newWorker) return;
    setName(''); setPhone(''); setSkill('helper'); setCustomSkill(''); setAreaId('not_specified'); setGender('male');
    setShowGlobalAdd(false);
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
      setAreaId(created.id);
      setNewAreaName(''); setNewAreaPincode(''); setNewAreaZone('');
      setShowAddAreaInline(false);
    }
  };

  const handleLogoutClick = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]/30 flex flex-col font-sans relative overflow-hidden">
      <div className="absolute top-[-100px] left-[-80px] fluid-orb-indigo pointer-events-none z-0"></div>
      <div className="absolute bottom-[20%] right-[-100px] fluid-orb-emerald pointer-events-none z-0"></div>
      <div className="absolute top-[40%] left-[70%] fluid-orb-amber pointer-events-none z-0"></div>

      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full glass border-b border-slate-200/50 px-4 md:px-8 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-primary to-primary-light text-white rounded-lg flex items-center justify-center shadow-md overflow-hidden p-1">
            <img src="/logo.png" alt="Vyesshrms Logo" className="w-full h-full object-contain" />
          </div>
          <span className="font-extrabold text-slate-800 text-sm tracking-tight hidden sm:inline">Vyesshrms</span>
        </div>

        <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {[
            { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={14} />, exact: true },
            { to: '/workers', label: 'Workers', icon: <Users size={14} />, exact: false },
            { to: '/attendance', label: 'Attendance', icon: <CalendarCheck size={14} />, exact: true },
            { to: '/deployments', label: 'Deployments', icon: <Briefcase size={14} />, exact: true },
            { to: '/settings', label: 'Settings', icon: <SettingsIcon size={14} />, exact: true },
          ].map(({ to, label, icon, exact }) => {
            const active = exact ? location.pathname === to : location.pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-extrabold transition-all ${
                  active ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {icon}
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
              <User size={16} />
            </div>
            <div className="hidden sm:block text-right">
              <div className="font-bold text-xs text-slate-800">{currentUser!.full_name}</div>
              <div className="text-[9px] font-semibold text-slate-400 capitalize -mt-0.5">
                {currentUser!.role.replace(/_/g, ' ')}
              </div>
            </div>
          </div>
          <Link
            to="/settings"
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-primary/10 text-slate-400 hover:text-primary flex items-center justify-center transition-all"
          >
            <SettingsIcon size={16} />
          </Link>
          <button
            onClick={handleLogoutClick}
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-500 flex items-center justify-center transition-all"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto">{children}</main>

      <BottomNav onOpenQuickAdd={() => setShowGlobalAdd(true)} />

      {/* Rapid Worker Entry Modal */}
      {showGlobalAdd && (
        <div className="fixed inset-0 z-[600] flex items-end justify-center md:items-center bg-darkbg/60 backdrop-blur-sm p-0 md:p-4">
          <div className="w-full max-w-md bg-white rounded-t-3xl md:rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] animate-slide-up">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-950 text-xl tracking-tight">Rapid Worker Entry</h3>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Philosophy: "Save First, Complete Later"</p>
              </div>
              <button
                onClick={() => setShowGlobalAdd(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-bold hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGlobalFastAdd} className="p-6 space-y-4 overflow-y-auto flex-1 text-left">
              <div className="bg-yellow-50 p-3 rounded-2xl border border-yellow-100 flex gap-2.5 items-start">
                <AlertCircle size={16} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-yellow-800 font-semibold leading-relaxed">
                  <strong>Flexible Entry Enabled</strong>: No field is mandatory. Save with partial or empty fields.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Worker Full Name (Optional)</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Manikandan S"
                  className="w-full h-11 border border-slate-200 rounded-xl px-3 text-sm focus:border-primary focus:outline-none" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Phone Number (Optional)</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9944012345"
                  className="w-full h-11 border border-slate-200 rounded-xl px-3 text-sm font-mono focus:border-primary focus:outline-none" />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700 block">Hyperlocal Address (Optional)</label>
                  <button type="button" onClick={() => setShowAddAreaInline(!showAddAreaInline)}
                    className="text-[10px] text-primary hover:text-primary-dark font-extrabold cursor-pointer">
                    {showAddAreaInline ? '✕ Cancel' : '＋ Add Area'}
                  </button>
                </div>
                {showAddAreaInline ? (
                  <div className="p-3.5 rounded-2xl border border-slate-200 space-y-2.5 bg-slate-50">
                    <input type="text" placeholder="Area Name" value={newAreaName}
                      onChange={(e) => setNewAreaName(e.target.value)}
                      className="w-full h-9 border border-slate-200 rounded-xl px-2.5 text-xs focus:border-primary focus:outline-none bg-white" />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" placeholder="Pincode" value={newAreaPincode}
                        onChange={(e) => setNewAreaPincode(e.target.value)}
                        className="h-9 border border-slate-200 rounded-xl px-2.5 text-xs focus:border-primary focus:outline-none bg-white" />
                      <input type="text" placeholder="Zone" value={newAreaZone}
                        onChange={(e) => setNewAreaZone(e.target.value)}
                        className="h-9 border border-slate-200 rounded-xl px-2.5 text-xs focus:border-primary focus:outline-none bg-white" />
                    </div>
                    <button type="button" onClick={handleAddAreaInline}
                      className="w-full h-9 bg-gradient-to-tr from-primary to-primary-light text-white text-xs font-extrabold rounded-xl shadow-md">
                      Create Area
                    </button>
                  </div>
                ) : (
                  <select value={areaId} onChange={(e) => {
                      if (e.target.value === 'other') {
                        setShowAddAreaInline(true);
                        setAreaId('not_specified');
                      } else {
                        setAreaId(e.target.value);
                      }
                    }}
                    className="w-full h-11 border border-slate-200 rounded-xl px-3 text-sm focus:border-primary focus:outline-none bg-white font-medium text-slate-700">
                    <option value="not_specified">⚠️ Address not specified</option>
                    {areas.map(a => (
                      <option key={a.id} value={a.id}>📍 {a.name} ({a.pincode})</option>
                    ))}
                    <option value="other">＋ Other (Add New Area)</option>
                  </select>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Primary Skill (Optional)</label>
                <select value={skill} onChange={(e) => setSkill(e.target.value)}
                  className="w-full h-11 border border-slate-200 rounded-xl px-3 text-sm focus:border-primary focus:outline-none bg-white font-medium text-slate-700">
                  <option value="helper">Helper / Loader</option>
                  <option value="electrician">Electrician</option>
                  <option value="tailoring">Tailoring</option>
                  <option value="delivery executive">Delivery Executive</option>
                  <option value="security guard">Security Guard</option>
                  <option value="plumber">Plumber</option>
                  <option value="other">Other (Specify)</option>
                </select>
                {skill === 'other' && (
                  <input type="text" value={customSkill} onChange={(e) => setCustomSkill(e.target.value)}
                    placeholder="Enter custom skill..."
                    className="w-full h-11 border border-slate-200 rounded-xl px-3 text-sm focus:border-primary focus:outline-none mt-2" />
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Gender</label>
                <div className="flex gap-2">
                  {['male', 'female'].map(g => (
                    <button key={g} type="button" onClick={() => setGender(g)}
                      className={`flex-1 py-2.5 rounded-xl border text-sm font-bold capitalize transition-all ${
                        gender === g ? 'bg-primary/10 border-primary text-primary' : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowGlobalAdd(false)}
                  className="flex-1 py-3 text-slate-500 bg-slate-100 hover:bg-slate-200 font-bold rounded-xl text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={isSaving}
                  className="flex-1 py-3 bg-gradient-to-tr from-primary to-primary-light text-white font-extrabold rounded-xl text-sm shadow-lg border border-white/10 flex items-center justify-center gap-2">
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

export const App = () => (
  <Router>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<MainLayout><Dashboard /></MainLayout>} />
      <Route path="/workers" element={<MainLayout><Workers /></MainLayout>} />
      <Route path="/workers/:id" element={<MainLayout><WorkerDetail /></MainLayout>} />
      <Route path="/attendance" element={<MainLayout><Attendance /></MainLayout>} />
      <Route path="/deployments" element={<MainLayout><Deployments /></MainLayout>} />
      <Route path="/settings" element={<MainLayout><Settings /></MainLayout>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  </Router>
);
export default App;

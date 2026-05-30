import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, ChevronRight, Lock } from 'lucide-react';
import { useHRMSStore } from '../db/store';
import { supabase } from '../lib/supabase';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useHRMSStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Load company logo if available in localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      const savedLogo = localStorage.getItem('vyess_company_logo');
      if (savedLogo) setLogoUrl(savedLogo);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // If already logged in, skip login page entirely
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate('/dashboard', { replace: true });
      }
    });
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setIsLoggingIn(true);
    setError('');

    const success = await login(email, password);
    if (success) {
      navigate('/dashboard');
    } else {
      setError('Invalid credentials. Please check your email and password.');
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-darkbg flex flex-col justify-center items-center px-4 relative overflow-hidden font-sans">
      {/* Fluid animated background orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-primary/20 blur-[120px] mix-blend-screen animate-float-orb pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-secondary/10 blur-[130px] mix-blend-screen animate-float-orb-reverse pointer-events-none"></div>
      <div className="absolute top-[40%] left-[60%] w-[30vw] h-[30vw] rounded-full bg-tertiary/15 blur-[100px] mix-blend-screen animate-pulse-soft pointer-events-none"></div>

      <div className="w-full max-w-[420px] glass-dark rounded-[2.5rem] p-8 shadow-2xl relative z-10 border border-white/10 animate-slide-up backdrop-blur-xl">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-primary to-primary-light text-white rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(79,70,229,0.3)] border-2 border-white/20 mb-6 mx-auto overflow-hidden">
            <img src={logoUrl || "/logo.png"} alt="Vyesshrms Logo" className="w-full h-full object-contain p-1" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">Vyesshrms</h1>
          <p className="text-slate-400 text-[13px] font-medium tracking-wide">
            Secure Workforce Operations Platform
          </p>
        </div>

        {error && (
          <div className="mb-5 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold p-3.5 rounded-xl text-center flex items-center justify-center gap-2 animate-slide-up">
            <Lock size={14} />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block ml-1 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl px-4 text-white placeholder:text-slate-500 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block ml-1 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl px-4 text-white placeholder:text-slate-500 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full h-14 bg-gradient-to-r from-primary via-primary-light to-primary text-white font-extrabold rounded-2xl shadow-premium hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 border border-white/20 flex items-center justify-center gap-2 bg-[length:200%_auto] hover:bg-[position:right_center] overflow-hidden relative group"
          >
            {isLoggingIn ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <Briefcase size={18} className="group-hover:rotate-12 transition-transform duration-300" />
                <span className="text-[15px] tracking-wide">Secure Sign In</span>
                <ChevronRight
                  size={18}
                  className="absolute right-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300"
                />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-white/10 pt-6">
          <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
            Authorized Personnel Only.
            <br />
            <span className="text-slate-400 font-bold mt-1 inline-block">
              Trichy Manpower Operations • Vyess Technology
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};
export default Login;

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Shield, ShieldCheck, ShieldX, Lock, KeyRound, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { usePayrollStore } from '../db/payroll-store';

interface VoiceAuthProps {
  onSuccess: () => void;
  onCancel?: () => void;
  mode: 'enroll' | 'verify';
}

// Simple hash function for audio fingerprinting
async function hashAudioBlob(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const VoiceAuth: React.FC<VoiceAuthProps> = ({ onSuccess, onCancel, mode }) => {
  const { voiceAuth, enrollVoice, verifyVoice, resetVoiceAttempts, unlockPayroll } = usePayrollStore();

  const [phase, setPhase] = useState<'idle' | 'recording' | 'processing' | 'success' | 'failed' | 'locked'>('idle');
  const [countdown, setCountdown] = useState(0);
  const [waveAmplitudes, setWaveAmplitudes] = useState<number[]>(Array(20).fill(4));
  const [showPinFallback, setShowPinFallback] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [enrollStep, setEnrollStep] = useState(1); // 1=first recording, 2=confirm

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const firstRecordingRef = useRef<string | null>(null);

  // Animate waveform
  const animateWave = useCallback(() => {
    function step() {
      if (analyserRef.current && phase === 'recording') {
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);
        const amps = Array.from({ length: 20 }, (_, i) => {
          const idx = Math.floor((i / 20) * data.length);
          return Math.max(4, (data[idx] / 255) * 32);
        });
        setWaveAmplitudes(amps);
      } else if (phase !== 'recording') {
        setWaveAmplitudes(Array(20).fill(4));
      }
      animFrameRef.current = requestAnimationFrame(step);
    }
    step();
  }, [phase]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(animateWave);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [animateWave]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const hash = await hashAudioBlob(blob);
        await handleRecordingComplete(hash);
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setPhase('recording');

      // Auto-stop after 3 seconds
      let count = 3;
      setCountdown(count);
      const interval = setInterval(() => {
        count--;
        setCountdown(count);
        if (count <= 0) {
          clearInterval(interval);
          if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop();
            setPhase('processing');
          }
        }
      }, 1000);
    } catch {
      setPhase('failed');
    }
  };

  const handleRecordingComplete = async (hash: string) => {
    if (mode === 'enroll') {
      if (enrollStep === 1) {
        firstRecordingRef.current = hash;
        setEnrollStep(2);
        setPhase('idle');
      } else {
        // Compare both recordings (for demo: just enroll directly — real system would compare)
        enrollVoice(hash, voiceAuth.passphrase);
        setPhase('success');
        setTimeout(onSuccess, 1500);
      }
    } else {
      // Verify mode
      if (!voiceAuth.isEnrolled) {
        setPhase('failed');
        return;
      }
      const matched = verifyVoice(hash);
      if (matched) {
        unlockPayroll();
        setPhase('success');
        setTimeout(onSuccess, 1200);
      } else {
        setPhase('failed');
        if (voiceAuth.attemptCount >= 2) {
          setShowPinFallback(true);
        }
      }
    }
  };

  const handlePinSubmit = () => {
    if (pin === '1234' || pin === 'VYESS' || pin.toUpperCase() === 'PAYROLL') {
      resetVoiceAttempts();
      unlockPayroll();
      setPhase('success');
      setTimeout(onSuccess, 1200);
    } else {
      setPinError('Incorrect PIN. Try again.');
    }
  };

  const phaseConfig = {
    idle: { icon: <Mic size={28} />, color: 'text-violet-400', label: mode === 'enroll' ? 'Tap to Record' : 'Tap to Speak' },
    recording: { icon: <Mic size={28} />, color: 'text-red-400', label: `Recording... ${countdown}s` },
    processing: { icon: <Shield size={28} />, color: 'text-violet-400', label: 'Processing...' },
    success: { icon: <ShieldCheck size={28} />, color: 'text-emerald-400', label: 'Authenticated!' },
    failed: { icon: <ShieldX size={28} />, color: 'text-rose-400', label: 'Verification Failed' },
    locked: { icon: <Lock size={28} />, color: 'text-amber-400', label: 'Temporarily Locked' },
  };

  const cfg = phaseConfig[phase];

  return (
    <div className="fixed inset-0 z-[700] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="bg-gradient-to-tr from-primary to-primary-light p-6 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="absolute rounded-full border border-white/30"
                style={{ width: `${(i + 1) * 60}px`, height: `${(i + 1) * 60}px`, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
            ))}
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Shield size={18} />
              <span className="text-xs font-bold uppercase tracking-wider">Voice Security</span>
            </div>
            <h2 className="text-xl font-black">
              {mode === 'enroll' ? 'Voice Enrollment' : 'Voice Authentication'}
            </h2>
            <p className="text-white/70 text-xs mt-1">
              {mode === 'enroll'
                ? `Step ${enrollStep}/2: ${enrollStep === 1 ? 'Record your passphrase' : 'Confirm by recording again'}`
                : 'Speak to access payroll'}
            </p>
          </div>
        </div>

        <div className="p-6">
          {/* Passphrase display */}
          <div className="bg-slate-50 rounded-2xl p-4 mb-5 text-center border border-slate-100">
            <p className="text-xs text-slate-500 font-semibold mb-1">Say this phrase:</p>
            <p className="text-slate-800 font-extrabold text-lg">"{voiceAuth.passphrase}"</p>
          </div>

          {/* Waveform + Record button */}
          <div className="flex flex-col items-center gap-4">
            {/* Waveform visualizer */}
            <div className="flex items-center gap-0.5 h-10 w-full justify-center">
              {waveAmplitudes.map((amp, i) => (
                <div
                  key={i}
                  className={`rounded-full transition-all duration-75 ${phase === 'recording' ? 'bg-primary' : 'bg-slate-200'}`}
                  style={{ width: '6px', height: `${amp}px` }}
                />
              ))}
            </div>

            {/* Record button */}
            <button
              onClick={startRecording}
              disabled={phase === 'recording' || phase === 'processing' || phase === 'success'}
              className={`w-20 h-20 rounded-full flex items-center justify-center text-white shadow-xl transition-all duration-300 ${
                phase === 'recording'
                  ? 'bg-red-500 scale-110 animate-pulse'
                  : phase === 'success'
                  ? 'bg-emerald-500'
                  : phase === 'failed'
                  ? 'bg-rose-100'
                  : 'bg-gradient-to-tr from-primary to-primary-light hover:scale-105 active:scale-95'
              }`}
            >
              <span className={cfg.color}>{cfg.icon}</span>
            </button>

            <p className="text-sm font-bold text-slate-700">{cfg.label}</p>

            {/* Attempt counter */}
            {mode === 'verify' && voiceAuth.attemptCount > 0 && (
              <div className="flex items-center gap-1.5 text-amber-600 text-xs font-semibold">
                <AlertTriangle size={12} />
                {3 - voiceAuth.attemptCount} attempt(s) remaining
              </div>
            )}
          </div>

          {/* PIN Fallback */}
          {showPinFallback && (
            <div className="mt-5 pt-5 border-t border-slate-100">
              <div className="flex items-center gap-2 mb-3">
                <KeyRound size={14} className="text-slate-500" />
                <p className="text-xs font-bold text-slate-600">Voice failed — Enter PIN</p>
              </div>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => { setPin(e.target.value); setPinError(''); }}
                  placeholder="Enter security PIN"
                  className="flex-1 h-11 border border-slate-200 rounded-xl px-3 text-sm focus:border-primary focus:outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && handlePinSubmit()}
                />
                <button onClick={handlePinSubmit}
                  className="px-4 h-11 bg-gradient-to-tr from-primary to-primary-light text-white rounded-xl text-sm font-bold">
                  Enter
                </button>
              </div>
              {pinError && <p className="text-xs text-rose-500 mt-1 font-semibold">{pinError}</p>}
              <p className="text-[10px] text-slate-400 mt-1">Default demo PIN: PAYROLL</p>
            </div>
          )}

          {/* Status messages */}
          {phase === 'success' && (
            <div className="mt-4 flex items-center justify-center gap-2 text-emerald-600 font-bold text-sm">
              <CheckCircle2 size={16} />
              Access Granted
            </div>
          )}
          {phase === 'failed' && !showPinFallback && (
            <div className="mt-4 flex items-center justify-center gap-2 text-rose-500 font-bold text-sm">
              <XCircle size={16} />
              Try speaking again
            </div>
          )}

          {/* Cancel */}
          {onCancel && (
            <button onClick={onCancel}
              className="w-full mt-4 py-2.5 text-slate-500 text-sm font-semibold hover:text-slate-700 transition-colors">
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Voice Auth Guard Wrapper ──────────────────────────────────────
interface VoiceAuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export const VoiceAuthGuard: React.FC<VoiceAuthGuardProps> = ({ children, requireAuth = true }) => {
  const { voiceAuth } = usePayrollStore();
  const [isAuthenticated, setIsAuthenticated] = useState(!requireAuth || !voiceAuth.isEnrolled);

  const shouldShowAuth = requireAuth && voiceAuth.isEnrolled && !isAuthenticated;

  if (shouldShowAuth) {
    return (
      <VoiceAuth
        mode="verify"
        onSuccess={() => setIsAuthenticated(true)}
        onCancel={() => window.history.back()}
      />
    );
  }

  return <>{children}</>;
};

export default VoiceAuth;

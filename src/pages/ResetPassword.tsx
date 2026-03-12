import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    // Basic Validation
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    try {
      // Supabase handles the session automatically if they clicked the email link
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      setIsSuccess(true);
      // Wait 3 seconds then go back to Landing for login
      setTimeout(() => navigate('/'), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update password. Link may be expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Visual background effects to match Landing page */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-cyan-500/5 blur-[100px] rounded-full" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md bg-[#0f172a] border border-blue-500/20 rounded-[40px] p-10 shadow-2xl overflow-hidden"
      >
        {/* Glow effect at top */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />

        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-500/20 shadow-[0_0_20px_rgba(37,99,235,0.1)]">
            <ShieldCheck className="text-blue-500" size={32} />
          </div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">Access Recovery</h2>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-3">Identity verified. Set your new password.</p>
        </div>

        <AnimatePresence mode="wait">
          {isSuccess ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="text-center py-8"
            >
              <div className="flex justify-center mb-6 text-emerald-500">
                <div className="p-4 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                    <CheckCircle2 size={48} className="animate-pulse" />
                </div>
              </div>
              <h4 className="text-white font-black uppercase text-lg mb-2">Password Synced</h4>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                Security protocols updated. <br /> Redirecting to portal in 3s...
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleReset} className="space-y-6">
              {errorMsg && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400"
                >
                  <AlertTriangle size={18} className="shrink-0" />
                  <p className="text-[10px] font-black uppercase tracking-tight leading-tight">{errorMsg}</p>
                </motion.div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">New Secure Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input 
                    required
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#020617] border border-slate-800 rounded-2xl py-4 pl-14 pr-14 text-white focus:border-blue-500/50 outline-none transition-all font-bold text-sm"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-400 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-blue-900/20 transition-all flex items-center justify-center gap-3 active:scale-95 group"
              >
                {loading ? (
                    <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        UPDATING VAULT...
                    </span>
                ) : (
                  <>Finalize Reset <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></>
                )}
              </button>
            </form>
          )}
        </AnimatePresence>

        <div className="mt-10 pt-8 border-t border-slate-800/50 text-center">
          <p className="text-[9px] font-mono text-slate-600 uppercase tracking-[0.4em]">
            ICpEP.SE • ESSU MAIN CAMPUS
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
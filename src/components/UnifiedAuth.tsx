import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, GraduationCap, Layers, ArrowRight, Eye, EyeOff, CheckCircle2, AlertTriangle, Hash } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface UnifiedAuthProps {
  isOpen: boolean;
  onClose: () => void;
}

const UnifiedAuth = ({ isOpen, onClose }: UnifiedAuthProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showToast, setShowToast] = useState(false); // FIXED: Now used in JSX
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    yearLevel: '',
    section: '',
    studentNumber: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errorMsg) setErrorMsg(null);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setSuccessMsg("Recovery link sent to your email!");
        setTimeout(() => { setIsForgotPassword(false); setIsLogin(true); setSuccessMsg(null); }, 3000);
      } else if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (error) throw error;
        onClose();
      } else {
        if (!formData.yearLevel || !formData.section || !formData.studentNumber) {
          setErrorMsg("Please complete all academic information.");
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName,
              year_level: formData.yearLevel,
              section: formData.section,
              student_number: formData.studentNumber,
            }
          }
        });

        if (error) throw error;
        
        // Trigger the Toast upon successful registration
        setShowToast(true);
        setTimeout(() => {
          setShowToast(false);
          setIsLogin(true);
        }, 5000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = (mode: 'login' | 'register' | 'forgot') => {
    setErrorMsg(null);
    setSuccessMsg(null);
    if (mode === 'login') { setIsLogin(true); setIsForgotPassword(false); }
    if (mode === 'register') { setIsLogin(false); setIsForgotPassword(false); }
    if (mode === 'forgot') { setIsForgotPassword(true); }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

          {/* Success Toast for Registration */}
          <AnimatePresence>
            {showToast && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -20 }}
                className="fixed top-10 z-[60] bg-emerald-500 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-400"
              >
                <CheckCircle2 size={20} />
                <span className="font-bold text-xs uppercase tracking-wide">Verification Email Sent!</span>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-[#0f172a] border border-blue-500/20 rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="flex bg-slate-900/50 p-1 m-6 rounded-xl border border-slate-800">
              <button type="button" onClick={() => toggleMode('login')}
                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${isLogin && !isForgotPassword ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              > Login </button>
              <button type="button" onClick={() => toggleMode('register')}
                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${!isLogin && !isForgotPassword ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              > Register </button>
            </div>

            <div className="px-8 pb-8">
              <div className="mb-6">
                <h2 className="text-xl font-black text-white uppercase tracking-tight">
                  {isForgotPassword ? 'Reset Password' : isLogin ? 'Welcome Back' : 'Join the Election'}
                </h2>
              </div>

              <AnimatePresence mode="wait">
                {errorMsg && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400"
                  >
                    <AlertTriangle size={16} className="shrink-0" />
                    <p className="text-[11px] font-medium leading-tight">{errorMsg}</p>
                  </motion.div>
                )}
                {successMsg && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-emerald-400"
                  >
                    <CheckCircle2 size={16} className="shrink-0" />
                    <p className="text-[11px] font-medium leading-tight">{successMsg}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <form className="space-y-4" onSubmit={handleAuth}>
                {!isLogin && !isForgotPassword && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Full Name</label>
                      <div className="relative">
                        <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input name="fullName" required type="text" onChange={handleChange} placeholder="Juan Dela Cruz" className="modern-input pl-11" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Student ID Number</label>
                      <div className="relative">
                        <Hash size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input name="studentNumber" required type="text" onChange={handleChange} placeholder="25-12345" className="modern-input pl-11" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1" htmlFor="yearLevel">Year</label>
                        <div className="relative">
                          <GraduationCap size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                          <select id="yearLevel" name="yearLevel" required onChange={handleChange} className="modern-input pl-11 appearance-none text-slate-400 focus:text-white">
                            <option value="">Year</option>
                            <option value="1">1st Year</option>
                            <option value="2">2nd Year</option>
                            <option value="3">3rd Year</option>
                            <option value="4">4th Year</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1" htmlFor="section">Section</label>
                        <div className="relative">
                          <Layers size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                          <select id="section" name="section" required onChange={handleChange} className="modern-input pl-11 appearance-none text-slate-400 focus:text-white">
                            <option value="">Section</option>
                            <option value="A">Section A</option>
                            <option value="B">Section B</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Email Address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input name="email" required type="email" onChange={handleChange} placeholder="example@gmail.com" className="modern-input pl-11" />
                  </div>
                </div>

                {!isForgotPassword && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Password</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input name="password" required type={showPassword ? "text" : "password"} onChange={handleChange} placeholder="••••••••" className="modern-input pl-11 pr-12" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-400 transition-colors">
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {isLogin && (
                      <div className="flex justify-end mt-1 px-1">
                        <button 
                          type="button" 
                          onClick={() => toggleMode('forgot')} 
                          className="text-[9px] font-black text-blue-500 uppercase tracking-widest hover:text-blue-400 hover:underline transition-colors"
                        >
                          Forgot Password?
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <button type="submit" disabled={loading} className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-lg transition-all flex items-center justify-center gap-2 group mt-4 active:scale-95">
                  {loading ? 'Processing...' : isForgotPassword ? 'Send Recovery Link' : isLogin ? 'Login' : 'Create Account'}
                  {!loading && <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />}
                </button>

                {isForgotPassword && (
                  <button type="button" onClick={() => toggleMode('login')} className="w-full text-center text-[10px] font-bold text-slate-500 uppercase hover:text-white transition-colors mt-2">
                    Back to Login
                  </button>
                )}
              </form>
            </div>
          </motion.div>
        </div>
      )}
      <style>{`
        .modern-input {
          width: 100%;
          background: #020617;
          border: 1px solid #1e293b;
          border-radius: 0.75rem;
          padding-top: 0.75rem;
          padding-bottom: 0.75rem;
          padding-right: 1rem;
          font-size: 0.875rem;
          color: white;
          outline: none;
          transition: border-color 0.2s;
        }
        .modern-input:focus {
          border-color: rgba(59, 130, 246, 0.5);
        }
      `}</style>
    </AnimatePresence>
  );
};

export default UnifiedAuth;
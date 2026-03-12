import React, { useState } from 'react';
import { ArrowRight, Send, AlertCircle, Info, BarChart3, User, Mail } from 'lucide-react';
import { motion, type Variants } from 'framer-motion';
import UnifiedAuth from '../components/UnifiedAuth';
import TallyModal from '../components/TallyModal';
import { supabase } from '../lib/supabase'; // Ensure supabase is imported

const Landing = () => {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isTallyOpen, setIsTallyOpen] = useState(false);
  
  // Updated Form State
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.from('reports').insert([
        { 
          name: formData.name, 
          email: formData.email, 
          message: formData.message 
        }
      ]);

      if (error) throw error;

      setSubmitted(true);
      setFormData({ name: '', email: '', message: '' });
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err) {
      console.error("Report failed:", err);
      alert("Failed to send report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
  };

  return (
    <div className="relative min-h-screen bg-[#020617] text-slate-200 overflow-x-hidden font-sans">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] right-[-5%] w-[500px] h-[500px] bg-cyan-500/10 blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10 container mx-auto px-6">
        {/* Hero Section */}
        <motion.section variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col items-center text-center max-w-4xl mx-auto pt-20 pb-20">
          <motion.div variants={fadeInUp} className="relative mb-8 group">
            <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full scale-75 group-hover:scale-100 transition-transform duration-700"></div>
            <img src="/ICpEP logo.png" alt="ICpEP Logo" className="relative w-32 h-32 md:w-40 md:h-40 drop-shadow-2xl transition-all duration-500 group-hover:scale-105" />
          </motion.div>
          
          <motion.h2 variants={fadeInUp} className="text-blue-500 font-mono tracking-[0.2em] text-[10px] md:text-xs uppercase mb-3 px-4">
            Institute of Computer Engineers of the Philippines <span className="text-cyan-400 font-bold">Student Edition</span>
          </motion.h2>
          
          <motion.h1 variants={fadeInUp} className="text-6xl md:text-8xl font-black tracking-tighter text-white mb-6 uppercase leading-none">
            ESSU MAIN <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-blue-100 to-blue-500">ELECTION</span>
          </motion.h1>
          
          <motion.p variants={fadeInUp} className="text-base md:text-lg text-slate-400 max-w-xl mx-auto mb-10 leading-relaxed font-light px-4">
            The official digital voting platform for the ICpEP Student Edition. 
            Empowering the next generation of Computer Engineers.
          </motion.p>

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full">
            <button onClick={() => setIsAuthOpen(true)} className="group relative px-10 py-4 bg-white text-black font-black rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.15)]">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative flex items-center gap-2 uppercase tracking-widest text-xs">Cast Your Vote <ArrowRight className="w-4 h-4" /></span>
            </button>
            
            <button onClick={() => setIsTallyOpen(true)} className="px-10 py-4 bg-slate-900/50 border border-slate-800 text-white font-bold rounded-full transition-all hover:bg-slate-800 hover:border-blue-500/50 flex items-center gap-2 uppercase tracking-widest text-xs">
              <BarChart3 className="w-4 h-4 text-blue-400" /> View Live Tally
            </button>
          </div>
        </motion.section>

        {/* Info & Support Section */}
        <section className="max-w-5xl mx-auto pb-20">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer} className="grid lg:grid-cols-5 gap-8 items-stretch px-4">
            
            <motion.div variants={fadeInUp} className="lg:col-span-2">
               <div className="h-full p-8 rounded-3xl bg-slate-900/40 border border-slate-800/50 flex flex-col backdrop-blur-sm transition-colors hover:border-blue-500/20 group">
                  <div className="p-3 bg-blue-500/10 rounded-2xl w-fit mb-6 group-hover:bg-blue-500/20 transition-colors">
                    <Info className="text-blue-500" size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 tracking-tight uppercase">About the System</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Dedicated election management system for the ICpEP.SE ESSU Main Campus. 
                    Ensuring accuracy, accessibility, and real-time result tracking.
                  </p>
                  <div className="mt-auto pt-6 flex items-center gap-2 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                    
                  </div>
               </div>
            </motion.div>

            {/* UPDATED: Functional Problem Report Inbox */}
            <motion.div variants={fadeInUp} className="lg:col-span-3">
              <div className="relative group overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-blue-900/20 border border-slate-800 p-8 shadow-2xl transition-all duration-500 hover:border-blue-500/30">
                <div className="flex items-start justify-between mb-8">
                  <h3 className="text-2xl font-black text-white tracking-tight uppercase">REPORT PROBLEM</h3>
                  <AlertCircle className="text-blue-500/50" />
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 w-4 h-4" />
                      <input 
                        required
                        type="text" 
                        placeholder="Full Name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-black/40 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all"
                      />
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 w-4 h-4" />
                      <input 
                        required
                        type="email" 
                        placeholder="Email Address"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full bg-black/40 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all"
                      />
                    </div>
                  </div>
                  <textarea 
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    placeholder="Describe technical issues or login concerns..."
                    className="w-full h-32 bg-black/40 border border-slate-800 rounded-2xl p-5 text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-blue-500/50 transition-all resize-none"
                  />
                  <motion.button 
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading || submitted}
                    className={`w-full py-4 rounded-2xl font-bold uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 transition-all ${
                      submitted 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                      : 'bg-blue-600 hover:bg-blue-500 text-white'
                    }`}
                  >
                    {loading ? "Sending." : submitted ? "Report Sent" : <>Send Report <Send size={14} /></>}
                  </motion.button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        </section>

        <footer className="py-12 border-t border-slate-900">
          <div className="flex justify-center items-center gap-4 text-slate-600 text-[10px] font-mono tracking-[0.3em] uppercase">
             <div className="h-px w-8 bg-slate-800" />
             ICpEP.SE • ESSU MAIN CAMPUS
             <div className="h-px w-8 bg-slate-800" />
          </div>
        </footer>
      </div>

      <UnifiedAuth isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <TallyModal isOpen={isTallyOpen} onClose={() => setIsTallyOpen(false)} />
    </div>
  );
};

export default Landing;
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, AlertCircle, X, ShieldAlert, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface VotingManagementProps {
  isElectionLive: boolean;
  onToggleElection: () => void;
}

const VotingManagement = ({ isElectionLive, onToggleElection }: VotingManagementProps) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleToggleRequest = async () => {
    setLoading(true);
    try {
      const newStatus = !isElectionLive; 
      
      // Update the Source of Truth in Supabase
      const { error } = await supabase
        .from('system_settings')
        .update({ is_election_live: newStatus })
        .eq('id', 'global_config'); 

      if (error) throw error;
      
      onToggleElection(); // Updates the local UI in Admin Panel
      setShowConfirm(false);
    } catch (error: any) {
      alert("Database Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
      <div className="mb-16">
        <p className="text-blue-600 font-mono text-[10px] uppercase tracking-[0.5em] font-black mb-3">System Lifecycle Control</p>
        <h2 className="text-5xl font-black text-slate-900 uppercase tracking-tighter">Voting Management</h2>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 max-w-6xl">
        <div className={`p-10 rounded-[32px] border-2 transition-all duration-500 ${isElectionLive ? 'border-blue-600 bg-blue-50/50 shadow-xl shadow-blue-100' : 'border-slate-100 bg-slate-50'}`}>
          <div className="flex items-center justify-between mb-10">
            <div className={`p-4 rounded-2xl ${isElectionLive ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-200 text-slate-500'}`}><ShieldCheck size={28} /></div>
            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${isElectionLive ? 'bg-blue-600 text-white animate-pulse' : 'bg-slate-200 text-slate-500'}`}>
              {isElectionLive ? 'Live & Accepting Votes' : 'System Offline'}
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 uppercase mb-4 tracking-tight">Global Election State</h3>
          <p className="text-slate-500 text-sm mb-10 leading-relaxed font-medium">Toggle the election status. This will enable or disable the voting portal for all students in real-time.</p>
          <button onClick={() => setShowConfirm(true)} className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-lg ${isElectionLive ? 'bg-slate-900 text-white hover:bg-black' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'}`}>
            {isElectionLive ? 'Terminate Election' : 'Initialize Election'}
          </button>
        </div>
        {/* Reset Card Placeholder */}
        <div className="p-10 rounded-[32px] border-2 border-slate-100 bg-slate-50">
          <div className="p-4 bg-red-50 text-red-600 rounded-2xl w-fit mb-10"><AlertCircle size={28} /></div>
          <h3 className="text-2xl font-black text-slate-900 uppercase mb-4 tracking-tight">Database Reset</h3>
          <p className="text-slate-500 text-sm mb-10 leading-relaxed font-medium">Purge all current vote tallies. Use only for testing or before the official launch.</p>
          <button className="w-full py-5 border-2 border-slate-200 rounded-2xl font-black text-xs uppercase tracking-[0.2em] text-slate-400">Reset Tally</button>
        </div>
      </div>

      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowConfirm(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-md bg-white rounded-[40px] p-10 shadow-2xl">
              <div className="flex justify-between items-start mb-8">
                <div className={`p-4 rounded-2xl ${isElectionLive ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}><ShieldAlert size={32} /></div>
<button 
  onClick={() => setShowConfirm(false)} 
  title="Close confirmation"
  aria-label="Close confirmation"
  className="p-2 text-slate-300 hover:text-slate-900 transition-colors"
>
  <X size={24} />
</button>
              </div>
              <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-4">{isElectionLive ? 'Terminate?' : 'Launch?'}</h4>
              <p className="text-slate-500 text-sm mb-10 font-medium">This command will update the global election state for all engineering students.</p>
              <div className="flex flex-col gap-3">
                <button onClick={handleToggleRequest} disabled={loading} className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${isElectionLive ? 'bg-red-600 text-white' : 'bg-blue-600 text-white shadow-xl'}`}>
                  {loading ? <Loader2 className="animate-spin" size={18} /> : (isElectionLive ? 'Terminate' : 'Launch Now')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default VotingManagement;
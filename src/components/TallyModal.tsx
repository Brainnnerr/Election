import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X,  LayoutPanelTop, AlertCircle, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';

const POSITIONS = ['President', 'Vice President', 'Secretary', 'Finance Executive', 'Auditor', 'PRO', '2nd Year Representative', '3rd Year Representative', '4th Year Representative'];
const VOTE_MILESTONE = 600;

const TallyModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
 

  const fetchTallyData = async () => {
    setLoading(true);
    try {
      const [candRes, votesRes] = await Promise.all([
        supabase.from('candidates').select('*'),
        supabase.from('votes').select('candidate_id')
      ]);

      const voteCounts: Record<string, number> = {};
      votesRes.data?.forEach(v => {
        voteCounts[v.candidate_id] = (voteCounts[v.candidate_id] || 0) + 1;
      });

      const processedResults = candRes.data?.map(c => ({
        ...c,
        votes: voteCounts[c.id] || 0
      })) || [];

      setResults(processedResults);
     
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTallyData();
      const channel = supabase
        .channel('public-tally')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'votes' }, () => fetchTallyData())
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [isOpen]);

  const calculateBarWidth = (votes: number) => Math.min((votes / VOTE_MILESTONE) * 100, 100);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-6">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="absolute inset-0 bg-[#020617]/95 backdrop-blur-xl" 
          />

          <motion.div 
            initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="relative w-full h-full md:h-[80vh] md:max-w-3xl bg-[#020617] md:rounded-[48px] border-t md:border border-white/10 overflow-hidden flex flex-col shadow-[0_0_100px_rgba(37,99,235,0.1)]"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-64 bg-blue-600/10 blur-[100px] pointer-events-none" />

            {/* Header Area */}
            <div className="relative p-6 md:p-10 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <div>
                <div className="flex items-center gap-2 mb-2"> 
                </div>
                <h3 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tighter">Election Results</h3>
              </div>
             <button 
  onClick={onClose} 
  title="Close Tally"
  aria-label="Close Tally"
  className="p-3 bg-white/5 border border-white/10 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-90"
>
  <X size={24} />
</button>
            </div>

            {/* Content Area */}
            <div className="relative flex-1 overflow-y-auto p-6 md:p-10 space-y-12 custom-scrollbar">
              
              {results.length === 0 && !loading ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-20">
                  <div className="w-20 h-20 bg-blue-500/10 rounded-3xl flex items-center justify-center mb-6 border border-blue-500/20">
                    <AlertCircle className="text-blue-500" size={40} />
                  </div>
                  <h4 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Registry Offline</h4>
                  <p className="text-slate-400 text-sm max-w-xs uppercase tracking-widest font-bold leading-relaxed">
                    Election is not yet active. <br /> Not Yet Open.
                  </p>
                </div>
              ) : (
                <div className="space-y-16">
                  {POSITIONS.map((pos) => {
                    const candidatesForPos = results.filter(r => r.position === pos).sort((a, b) => b.votes - a.votes);
                    if (candidatesForPos.length === 0) return null;

                    return (
                      <section key={pos} className="space-y-6">
                        <div className="flex items-center gap-4">
                          <h4 className="text-xl font-black text-white uppercase tracking-tighter whitespace-nowrap">{pos}</h4>
                          <div className="h-px w-full bg-gradient-to-r from-blue-500/50 to-transparent" />
                        </div>
                        
                        <div className="space-y-3">
                          {candidatesForPos.map((cand, idx) => {
                            const visualWidth = calculateBarWidth(cand.votes);
                            const isWinner = idx === 0 && cand.votes > 0;

                            return (
                              <div key={cand.id} className="relative bg-white/[0.02] border border-white/5 rounded-2xl h-16 md:h-20 flex items-center overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }} animate={{ width: `${visualWidth}%` }}
                                  transition={{ duration: 1.5, ease: "circOut" }}
                                  className={`absolute inset-0 opacity-[0.12] ${isWinner ? 'bg-blue-500' : 'bg-slate-500'}`}
                                />
                                
                                <div className={`w-12 md:w-16 h-full flex items-center justify-center font-black text-lg border-r border-white/5 ${
                                  isWinner ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-500'
                                }`}>
                                  {idx + 1}
                                </div>

                                <div className="flex-1 px-4 md:px-6 min-w-0">
                                  <h5 className="font-black text-white uppercase text-xs md:text-sm truncate">{cand.name}</h5>
                                  <div className="flex items-center gap-2">
                                    <Shield size={10} className="text-blue-500" />
                                    <p className="text-blue-500 font-bold text-[9px] uppercase tracking-widest truncate"> {cand.party_name} Partylist</p>
                                  </div>
                                </div>

                                <div className="px-8 text-right border-l border-white/5 h-full flex flex-col justify-center bg-white/[0.01]">
                                  <p className="text-slate-500 text-[8px] font-black uppercase tracking-widest mb-1">Total Votes</p>
                                  <div className="flex items-center justify-end gap-2">
                                    <p className="text-xl md:text-2xl font-black text-white leading-none tabular-nums">{cand.votes.toLocaleString()}</p>
                                   
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bottom Branding */}
            <div className="p-5 bg-white/[0.02] border-t border-white/5 flex items-center justify-center gap-6 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">
              
              <div className="h-3 w-px bg-white/10" />
              <div className="flex items-center gap-2">
                <LayoutPanelTop size={12} /> ICpEP.SE ELECTION
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TallyModal;
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, ShieldCheck, User, Check, 
  AlertTriangle, CheckCircle2, Camera
} from 'lucide-react';

const POSITIONS = ['President', 'Vice President', 'Secretary', 'Treasurer', 'Auditor', 'PIO', 'Protocol Officer'];

const VotingBooth = () => {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [selections, setSelections] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<any>(null);
  
  // UI States
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'error' | 'success'} | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return navigate('/');

      // 1. Check if user already voted
      const { data: existingVote } = await supabase
        .from('votes')
        .select('id')
        .eq('voter_id', user.id)
        .limit(1);

      if (existingVote && existingVote.length > 0) {
        window.location.href = '/dashboard?error=already_voted';
        return;
      }

      // 2. Fetch Profile & Settings
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setUserProfile(profile);

      const { data: settings } = await supabase.from('system_settings').select('is_election_live').eq('id', 'global_config').single();
      if (!settings?.is_election_live) navigate('/dashboard');

      // 3. Fetch Candidates
      const { data: list } = await supabase.from('candidates').select('*').order('created_at', { ascending: true });
      setCandidates(list || []);
      setLoading(false);
    };
    fetchData();
  }, [navigate]);

  const triggerToast = (msg: string, type: 'error' | 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSelect = (position: string, candidate: any) => {
    setSelections(prev => ({ ...prev, [position]: candidate }));
  };

  const processVoteSubmission = async () => {
    setShowConfirmModal(false);
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const voteEntries = Object.entries(selections).map(([pos, cand]) => ({
        voter_id: user?.id,
        candidate_id: cand.id,
        position: pos
      }));

      if (voteEntries.length === 0) {
        triggerToast("Empty ballots are not permitted.", "error");
        setSubmitting(false);
        return;
      }

      const { error } = await supabase.from('votes').insert(voteEntries);
      if (error) throw error;

      setReceipt({
        timestamp: new Date().toLocaleString(),
        choices: selections,
        ref: Math.random().toString(36).toUpperCase().substring(2, 10)
      });

    } catch (err: any) {
      triggerToast("Submission failed. You may have already voted.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
      <p className="text-blue-500 font-black tracking-widest text-[9px] uppercase">Verifying Credentials...</p>
    </div>
  );

  const missingVotes = POSITIONS.filter(pos => !selections[pos]);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-blue-500/30 relative flex flex-col">
      
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-6 py-3 rounded-xl shadow-2xl border ${
              toast.type === 'success' ? 'bg-emerald-500 border-emerald-400' : 'bg-red-600 border-red-500 text-white'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 size={16}/> : <AlertTriangle size={16}/>}
            <span className="text-[10px] font-black uppercase tracking-widest">{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <button onClick={() => navigate('/dashboard')} className="text-slate-400 hover:text-white transition-all uppercase font-black text-[9px] tracking-widest flex items-center gap-2">
            <ArrowLeft size={14} /> Cancel
          </button>
          <ShieldCheck size={18} className="text-blue-500" />
        </div>
      </nav>

      <main className="container mx-auto px-4 md:px-6 py-12 flex-grow max-w-4xl">
        <header className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-2 text-white">Ballot</h2>
          <p className="text-blue-500 uppercase font-black text-[9px] tracking-[0.6em]">Session ID: {userProfile?.id?.substring(0,8)}</p>
        </header>

        <div className="space-y-20">
          {POSITIONS.map((pos) => (
            <section key={pos} className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="bg-slate-900 text-slate-400 px-4 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-widest border border-slate-800">{pos}</div>
                <div className="h-px flex-1 bg-slate-800/50"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {candidates.filter(c => c.position === pos).map((cand) => (
                  <label key={cand.id} className={`cursor-pointer flex items-center gap-5 p-5 rounded-[32px] border-2 transition-all duration-300 ${
                      selections[pos]?.id === cand.id ? 'bg-blue-600/10 border-blue-500 shadow-lg shadow-blue-500/5' : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <input type="radio" name={pos} className="hidden" onChange={() => handleSelect(pos, cand)} />
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-slate-800 overflow-hidden shrink-0 border border-slate-700 relative">
                      {cand.image_url ? (
                        <img src={cand.image_url} alt={`${cand.name} profile`} title={cand.name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-full h-full p-5 text-slate-700" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-base uppercase tracking-tight truncate text-white">{cand.name}</h4>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">{cand.party_name}</p>
                    </div>
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                        selections[pos]?.id === cand.id ? 'bg-blue-500 border-blue-400' : 'border-slate-800'
                    }`}>
                      {selections[pos]?.id === cand.id && <Check size={16} className="text-white" strokeWidth={3} />}
                    </div>
                  </label>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="fixed bottom-0 left-0 w-full bg-slate-950/90 backdrop-blur-xl border-t border-slate-800 p-6 z-40">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Progress: {Object.keys(selections).length}/{POSITIONS.length}</p>
            <button 
              onClick={() => setShowConfirmModal(true)}
              className="w-full md:w-auto px-12 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] transition-all shadow-xl active:scale-95"
            >
              Cast Official Ballot
            </button>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {receipt && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-slate-950/98 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-full max-w-[360px] bg-white text-slate-900 rounded-[40px] p-8 shadow-2xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-600"></div>
              
              <div className="text-center mb-6 pt-2">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ShieldCheck size={24} />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight">Ballot Sealed</h3>
                <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mt-1">ID: {receipt.ref}</p>
              </div>

              <div className="mb-6 flex items-center gap-3 p-3 bg-blue-50 rounded-2xl border border-blue-100">
                <Camera size={16} className="text-blue-600 shrink-0" />
                <p className="text-[9px] font-black text-blue-700 uppercase leading-tight">
                  Action Required: Please screenshot this receipt for your personal records.
                </p>
              </div>

              <div className="bg-slate-50 rounded-3xl p-6 mb-6 border border-slate-100 font-mono text-[9px]">
                <div className="space-y-3">
                  {POSITIONS.map(pos => (
                    <div key={pos} className="grid grid-cols-2 gap-2">
                      <span className="text-slate-400 font-bold uppercase truncate">{pos}</span>
                      <span className={`font-black text-right uppercase truncate ${receipt.choices[pos] ? 'text-slate-900' : 'text-slate-300'}`}>
                        {receipt.choices[pos]?.name || '---'}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-4 border-t border-dashed border-slate-200 text-[8px] text-slate-400 text-center uppercase">
                  Processed: {receipt.timestamp}
                </div>
              </div>

              <button onClick={() => navigate('/dashboard')} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-black transition-all">
                Close & Finalize
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowConfirmModal(false)} className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-full max-w-sm bg-white text-slate-900 rounded-[40px] p-10 shadow-2xl">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6"><AlertTriangle size={28} /></div>
              <h3 className="text-xl font-black uppercase text-center mb-4">Confirm Ballot?</h3>
              {missingVotes.length > 0 && (
                <div className="bg-slate-50 p-4 rounded-2xl mb-6 border border-slate-100">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Abstained:</p>
                  <p className="text-[9px] font-bold text-slate-600 uppercase">{missingVotes.join(',  ')}</p>
                </div>
              )}
              <div className="flex flex-col gap-2">
                <button onClick={processVoteSubmission} disabled={submitting} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em]">Authorize</button>
                <button onClick={() => setShowConfirmModal(false)} className="w-full py-4 text-slate-400 font-bold text-[10px] uppercase tracking-widest">Review</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VotingBooth;
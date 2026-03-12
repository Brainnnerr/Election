import { useEffect, useState, useRef } from 'react'; // Added useRef to imports
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, ShieldCheck, User, Check, 
  AlertTriangle, CheckCircle2, Camera, Info
} from 'lucide-react';

const EXECUTIVE_POSITIONS = [
  'President', 
  'Vice President', 
  'Secretary', 
  'Finance Executive', 
  'Auditor', 
  'PRO'
];

const VotingBooth = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [userProfile, setUserProfile] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [selections, setSelections] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<any>(null);
  const [myBallotPositions, setMyBallotPositions] = useState<string[]>([]);

  const [hasTakenSelfie, setHasTakenSelfie] = useState(false);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  // UI States
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'error' | 'success'} | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return navigate('/');

      const { data: existingVote } = await supabase
        .from('votes')
        .select('id')
        .eq('voter_id', user.id)
        .limit(1);

      if (existingVote && existingVote.length > 0) {
        window.location.href = '/dashboard?error=already_voted';
        return;
      }

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setUserProfile(profile);

      // --- REPRESENTATIVE SHIFT LOGIC ---
      const userYear = profile?.year_level; 
      let repPosition = "";

      if (userYear === '1') {
        repPosition = '2nd Year Representative';
      } else if (userYear === '2') {
        repPosition = '3rd Year Representative';
      } else if (userYear === '3') {
        repPosition = '4th Year Representative';
      } else if (userYear === '4') {
        repPosition = ""; 
      }

      const finalPositions = repPosition 
        ? [...EXECUTIVE_POSITIONS, repPosition] 
        : [...EXECUTIVE_POSITIONS];

      setMyBallotPositions(finalPositions);

      const { data: settings } = await supabase.from('system_settings').select('is_election_live').eq('id', 'global_config').single();
      if (!settings?.is_election_live) navigate('/dashboard');

      const { data: list } = await supabase.from('candidates').select('*').order('created_at', { ascending: true });
      setCandidates(list || []);
      setLoading(false);
      
      // Start Camera
      startCamera();
    };
    fetchData();
    return () => stopCamera();
  }, [navigate]);

  const triggerToast = (msg: string, type: 'error' | 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSelect = (position: string, candidate: any) => {
    setSelections(prev => ({ ...prev, [position]: candidate }));
  };

  // Helper to upload selfie to Supabase Storage
  const uploadSelfieToStorage = async (userId: string) => {
    if (!selfieImage) return null;
    try {
      // Convert base64 to blob
      const base64 = selfieImage.split(',')[1];
      const blob = await fetch(`data:image/png;base64,${base64}`).then(res => res.blob());
      const fileName = `${userId}/${Date.now()}.png`;

      const { error: uploadError } = await supabase.storage
        .from('voter-selfies')
        .upload(fileName, blob);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('voter-selfies').getPublicUrl(fileName);
      return data.publicUrl;
    } catch (err) {
      console.error("Storage Error:", err);
      return null;
    }
  };

  const processVoteSubmission = async () => {
    setShowConfirmModal(false);
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No User Found");

      // 1. Upload Selfie First
      const publicSelfieUrl = await uploadSelfieToStorage(user.id);

      // 2. Prepare Vote Entries with Selfie URL
      const voteEntries = Object.entries(selections).map(([pos, cand]) => ({
        voter_id: user.id,
        candidate_id: cand.id,
        position: pos,
        voter_selfie: publicSelfieUrl // Storing the link in the DB
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
      triggerToast("Submission failed. Database error.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user" },
        audio: false 
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraStream(stream);
    } catch (err) {
      console.error("Camera access error:", err);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const takeSelfie = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context?.drawImage(videoRef.current, 0, 0);
      const imageData = canvasRef.current.toDataURL('image/png');
      setSelfieImage(imageData);
      stopCamera();
      setHasTakenSelfie(true);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
      <p className="text-blue-500 font-black tracking-widest text-[9px] uppercase">Verifying Credentials...</p>
    </div>
  );

  const missingVotes = myBallotPositions.filter(pos => !selections[pos]);

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

      <nav className="sticky top-0 z-40 border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <button onClick={() => navigate('/dashboard')} className="text-slate-400 hover:text-white transition-all uppercase font-black text-[9px] tracking-widest flex items-center gap-2">
            <ArrowLeft size={14} /> Cancel
          </button>
          <ShieldCheck size={18} className="text-blue-500" />
        </div>
      </nav>

     {!hasTakenSelfie ? (
  <div className="flex flex-col items-center justify-center p-6 min-h-screen bg-[#020617]">
    <h2 className="text-white font-black uppercase mb-4 tracking-widest">Voter Verification</h2>
    <p className="text-slate-500 text-[10px] font-bold uppercase mb-8 tracking-[0.2em]">Face capture required to unlock ballot</p>
    
    <div className="relative w-full max-w-sm aspect-square bg-slate-900 rounded-[40px] overflow-hidden border-2 border-blue-500/20 shadow-2xl">
      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
      <canvas ref={canvasRef} className="hidden" />
      <div className="absolute inset-0 border-[40px] border-[#020617]/40 rounded-full pointer-events-none" />
      <div className="absolute inset-0 border border-blue-500/10 pointer-events-none" />
    </div>

    {/* --- INSTRUCTION NOTE --- */}
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 bg-blue-600/5 border border-blue-500/20 p-4 rounded-2xl max-w-sm w-full flex items-center gap-3"
    >
      <div className="bg-blue-600 p-2 rounded-lg text-white">
        <Info size={16} />
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase leading-tight tracking-wide">
        Ensure your <span className="text-blue-400">face is visible</span>. Please remove any <span className="text-white">caps, sunglasses, or face masks</span> before capturing.
      </p>
    </motion.div>

    <button 
      onClick={takeSelfie}
      className="mt-8 px-12 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-[0.3em] text-xs transition-all shadow-xl active:scale-95 flex items-center gap-3"
    >
      <Camera size={18} /> Take Selfie & Vote
    </button>
  </div>
) : (
 
        <main className="container mx-auto px-4 md:px-6 py-12 pb-40 flex-grow max-w-4xl">
          <header className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-2 text-white italic">Ballot</h2>
            <div className="flex items-center justify-center gap-4">
              <div className="w-10 h-10 rounded-full border border-blue-500/50 overflow-hidden bg-slate-900">
                <img src={selfieImage!} alt="Voter" className="w-full h-full object-cover" />
              </div>
              <p className="text-blue-500 uppercase font-black text-[9px] tracking-[0.6em]">Session ID: {userProfile?.id?.substring(0,8)}</p>
            </div>
          </header>

          <div className="space-y-20">
            {myBallotPositions.map((pos) => (
              <div key={pos}>
                 {pos.includes('Representative') && (
                   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8 bg-blue-600/5 border border-blue-500/20 p-5 rounded-3xl flex items-start gap-4">
                      <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-slate-400 leading-relaxed font-medium uppercase tracking-tight">
                        Note: You are voting for the <span className="text-white font-black italic">{pos}</span> candidates who will serve during the next academic term.
                      </p>
                   </motion.div>
                 )}

                <section className="space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="bg-slate-900 text-slate-400 px-4 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-widest border border-slate-800">{pos}</div>
                    <div className="h-px flex-1 bg-slate-800/50"></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {candidates.filter(c => c.position === pos).map((cand) => (
                      <label key={cand.id} className={`cursor-pointer flex items-center gap-4 md:gap-5 p-4 md:p-5 rounded-[32px] border-2 transition-all duration-300 ${
                          selections[pos]?.id === cand.id ? 'bg-blue-600/10 border-blue-500 shadow-lg shadow-blue-500/5' : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <input type="radio" name={pos} className="hidden" onChange={() => handleSelect(pos, cand)} />
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-slate-800 overflow-hidden shrink-0 border border-slate-700 relative">
                          {cand.image_url ? (
                            <img src={cand.image_url} alt={cand.name} className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-full h-full p-5 text-slate-700" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-black text-sm md:text-base uppercase tracking-tight truncate text-white">{cand.name}</h4>
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">{cand.party_name} </p>
                        </div>
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                            selections[pos]?.id === cand.id ? 'bg-blue-500 border-blue-400' : 'border-slate-800'
                        }`}>
                          {selections[pos]?.id === cand.id && <Check size={16} className="text-white" strokeWidth={3} />}
                        </div>
                      </label>
                    ))}
                  </div>
                </section>
              </div>
            ))}
          </div>

          
          <div className="fixed bottom-0 left-0 w-full bg-slate-950/90 backdrop-blur-xl border-t border-white/5 p-6 z-40">
  <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
      Ballot Completion: {Object.keys(selections).length} / {myBallotPositions.length}
    </p>
    
    <button 
      onClick={() => setShowConfirmModal(true)}
      disabled={submitting}
      className="w-full md:w-auto px-12 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] transition-all shadow-xl active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3"
    >
      {submitting ? (
        <>
          <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          <span>Sealing Ballot...</span>
        </>
      ) : (
        "Cast Official Ballot"
      )}
    </button>
  </div>
</div>
        </main>
      )}

      {/* RECEIPT MODAL */}
      <AnimatePresence>
        {receipt && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-slate-950/98 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-full max-w-[360px] bg-white text-slate-900 rounded-[40px] p-8 shadow-2xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-600"></div>
              <div className="text-center mb-6 pt-2">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 size={24} />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight">Ballot Sealed</h3>
                <div className="mt-4 w-20 h-20 mx-auto rounded-xl overflow-hidden border-2 border-slate-100 shadow-inner">
                  <img src={selfieImage!} alt="Voter Receipt" className="w-full h-full object-cover" />
                </div>
                <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mt-3">Ref: {receipt.ref}</p>
              </div>

              <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-lg text-white">
                  <Camera size={14} className="animate-pulse" />
                </div>
                <p className="text-[9px] font-black text-blue-800 uppercase leading-tight tracking-tight">
                  Action Required: Please screenshot this receipt for your records.
                </p>
              </div>

              <div className="bg-slate-50 rounded-3xl p-6 mb-6 border border-slate-100 font-mono text-[9px] max-h-56 overflow-y-auto custom-scrollbar">
                <div className="space-y-3">
                  {myBallotPositions.map(pos => (
                    <div key={pos} className="grid grid-cols-2 gap-2 border-b border-slate-100 pb-2 last:border-0">
                      <span className="text-slate-400 font-bold uppercase truncate">{pos}</span>
                      <span className={`font-black text-right uppercase truncate ${receipt.choices[pos] ? 'text-slate-900' : 'text-slate-300'}`}>
                        {receipt.choices[pos]?.name || 'ABSTAINED'}
                      </span>
                    </div>
                  ))}
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
                <div className="bg-slate-50 p-4 rounded-2xl mb-6 border border-slate-100 max-h-32 overflow-y-auto text-center">
                  <p className="text-[8px] font-black text-red-500 uppercase tracking-widest mb-1">No selection for:</p>
                  <p className="text-[9px] font-bold text-slate-600 uppercase leading-tight">{missingVotes.join(', ')}</p>
                </div>
              )}
              <div className="flex flex-col gap-2">
                <button onClick={processVoteSubmission} disabled={submitting} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] disabled:opacity-50">
                   {submitting ? 'SEALING...' : 'AUTHORIZE'}
                </button>
                <button onClick={() => setShowConfirmModal(false)} className="w-full py-4 text-slate-400 font-bold text-[10px] uppercase tracking-widest">Review Ballot</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VotingBooth;
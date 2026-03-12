import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LogOut, 
  Vote, 
  ShieldCheck, 
  ChevronRight, 
  Clock, 
  X, 
  ShieldAlert,
  Info,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const Dashboard = () => {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isElectionLive, setIsElectionLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
          setUserProfile(profile);
        }

        const { data: settings } = await supabase
          .from('system_settings')
          .select('is_election_live')
          .eq('id', 'global_config')
          .single();
        
        if (settings) setIsElectionLive(settings.is_election_live);
      } catch (error) {
        console.error("Dashboard Sync Error:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();

    const channel = supabase
      .channel('election_state_updates')
      .on(
        'postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'system_settings', filter: 'id=eq.global_config' }, 
        (payload) => {
          setIsElectionLive(payload.new.is_election_live);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/'; 
  };

  if (loading) return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center text-blue-500 font-black tracking-widest uppercase text-[10px]">
      Syncing Session...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-blue-500/30 relative flex flex-col">
      
      {/* Navbar */}
      <nav className="relative z-20 border-b border-slate-800 bg-slate-950/50 backdrop-blur-md">
        <div className="container mx-auto px-4 md:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 md:gap-3">
            <img src="/ICpEP logo.png" alt="Logo" className="w-8 h-8 md:w-10 md:h-10" />
            <div className="flex flex-col border-l border-slate-700 px-2 md:px-3">
              <h1 className="text-xs md:text-sm font-black uppercase tracking-tighter text-white leading-none">
                ICpEP.SE
              </h1>
              <span className="text-[8px] md:text-[9px] text-blue-500 font-mono font-bold tracking-[0.2em] uppercase mt-1">
                Election Portal
              </span>
            </div>
          </div>
          <button 
            onClick={() => setShowLogoutConfirm(true)} 
            className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-red-500 flex items-center gap-2 transition-all bg-slate-900/50 px-3 py-2 rounded-lg border border-slate-800"
          >
            <LogOut size={14} /> <span className="hidden xs:inline">Logout</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 md:px-6 py-6 flex-grow">
        
        {/* Header - Below Navbar */}
        <header className="mb-8 p-6 bg-slate-900/30 border border-slate-800/50 rounded-3xl backdrop-blur-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
             
              <h2 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tight">
                Welcome, <span className="text-blue-400">{userProfile?.full_name || 'Engineer'}</span>
              </h2>
            </div>
            <div className="flex gap-3">
              <div className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-[10px] font-mono font-bold">
                YEAR AND SECTION: {userProfile?.year_level}{userProfile?.section}
              </div>
             
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Voting Box - Blue when Live */}
          <motion.div 
            layout 
            className={`lg:col-span-2 relative rounded-[40px] p-8 md:p-12 transition-all duration-700 overflow-hidden border-2 ${
              isElectionLive 
                ? 'bg-blue-600 border-blue-400 shadow-[0_0_50px_rgba(37,99,235,0.3)]' 
                : 'bg-slate-900/40 border-slate-800 opacity-80'
            }`}
          >
            <div className="relative z-10">
              <div className={`w-fit p-4 rounded-2xl mb-8 border transition-all duration-500 ${
                isElectionLive ? 'bg-white/20 border-white' : 'bg-slate-800 border-slate-700'
              }`}>
                {isElectionLive ? <Vote className="text-white" size={32} /> : <Clock className="text-slate-500" size={32} />}
              </div>
              <h3 className="text-2xl md:text-4xl font-black text-white uppercase mb-4 leading-tight">
                {isElectionLive ? 'Election is Now Live' : 'System on Standby'}
              </h3>
              <p className={`text-sm md:text-lg mb-10 max-w-md font-medium leading-relaxed uppercase tracking-wider ${isElectionLive ? 'text-blue-50' : 'text-slate-500'}`}>
                {isElectionLive 
                  ? 'Access to the digital ballot is authorized. You may now cast your vote for the chapter leaders.' 
                  : 'Wait for the system administrator to initialize the voting session.'}
              </p>
              
              {/* Button - White when Live */}
              <button 
                disabled={!isElectionLive}
                onClick={() => navigate('/voting')}
                className={`w-full sm:w-auto flex items-center justify-center gap-4 px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all ${
                  isElectionLive 
                    ? 'bg-white text-blue-600 hover:bg-slate-100 hover:scale-105 shadow-xl' 
                    : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'
                }`}
              >
                {isElectionLive ? 'Start Voting' : 'Locked'} 
                <ChevronRight size={18} />
              </button>
            </div>
            <ShieldCheck className={`absolute -right-12 -bottom-12 w-64 h-64 rotate-12 transition-all duration-1000 ${isElectionLive ? 'text-white/10 opacity-100' : 'text-white/0 opacity-0'}`} />
          </motion.div>

          {/* Information Node */}
          <div className="space-y-6">
            <div className="p-8 rounded-[40px] bg-slate-900/40 border border-slate-800 flex flex-col h-full backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-6 text-blue-500">
                <Info size={20} />
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white">System Info</h4>
              </div>
              <div className="space-y-6 flex-grow">
                <div className="space-y-2">
                  <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                   
                  </span>
                  <p className="text-[11px] text-slate-400 leading-relaxed uppercase font-bold tracking-tight">
                    Your choice is encrypted and anonymous. Results are processed through a secure server node.
                  </p>
                </div>
                <div className="pt-6 border-t border-slate-800">
                  <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-4">Ballot Guide</span>
                  <ul className="text-[10px] text-slate-500 space-y-4 font-bold uppercase tracking-wider">
                    <li className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 shrink-0" />
                      <span>Select one candidate per category</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 shrink-0" />
                      <span>Review your choices carefully</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 shrink-0" />
                      <span>Confirm submission to seal ballot</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800 bg-slate-950/50 backdrop-blur-md">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <img src="/ICpEP logo.png" alt="Logo" className="w-5 h-5 opacity-70" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">ICpEP.SE</span>
            </div>
            <p className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">
              Eastern Samar State University
            </p>
          </div>
        </div>
      </footer>

      {/* Logout Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowLogoutConfirm(false)} className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-[340px] bg-slate-900 border border-slate-800 rounded-[32px] p-8 shadow-2xl">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20"><ShieldAlert size={24} /></div>
               <button 
  onClick={() => setShowLogoutConfirm(false)} 
  title="Close logout confirmation"
  aria-label="Close logout confirmation"
  className="p-2 text-slate-500 hover:text-white transition-colors"
>
  <X size={20} />
</button>
              </div>
              <h4 className="text-xl font-black text-white uppercase tracking-tight mb-2">Logout?</h4>
              <p className="text-slate-400 text-xs font-medium leading-relaxed mb-8 uppercase tracking-widest">Terminate secure session connection.</p>
              <div className="flex flex-col gap-2">
                <button onClick={handleLogout} className="w-full py-4 rounded-xl bg-red-600 text-white font-black text-[10px] uppercase tracking-[0.2em]">Confirm Logout</button>
                <button onClick={() => setShowLogoutConfirm(false)} className="w-full py-4 rounded-xl bg-slate-800 text-slate-300 font-black text-[10px] uppercase tracking-[0.2em]">Cancel</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
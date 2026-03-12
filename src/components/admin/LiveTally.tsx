import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { Trophy, Clock, RefreshCcw, Percent, Users } from 'lucide-react';

const POSITIONS = ['President', 'Vice President', 'Secretary', 'Finance Executive', 'Auditor', 'PRO', '2nd Year Representative', '3rd Year Representative', '4th Year Representative'];
const VOTE_MILESTONE = 600;

const LiveTally = () => {
  const [results, setResults] = useState<any[]>([]);
  const [totalVoters, setTotalVoters] = useState(0);
  const [totalVotesCast, setTotalVotesCast] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchTallyData = async () => {
    setLoading(true);
    try {
      const [candRes, profileRes, votesRes] = await Promise.all([
        supabase.from('candidates').select('*'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('votes').select('candidate_id, voter_id')
      ]);

      if (candRes.error) throw candRes.error;

      const voteCounts: Record<string, number> = {};
      votesRes.data?.forEach(v => {
        voteCounts[v.candidate_id] = (voteCounts[v.candidate_id] || 0) + 1;
      });

      const processedResults = candRes.data.map(c => ({
        ...c,
        votes: voteCounts[c.id] || 0
      }));

      const uniqueVoters = new Set(votesRes.data?.map(v => v.voter_id));

      setResults(processedResults);
      setTotalVoters(profileRes.count || 0);
      setTotalVotesCast(uniqueVoters.size);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching tally:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTallyData();
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'votes' }, () => fetchTallyData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const calculateBarWidth = (votes: number) => {
    const width = (votes / VOTE_MILESTONE) * 100;
    return Math.min(width, 100); 
  };

  const calculateActualPercentage = (votes: number, pos: string) => {
    const totalPosVotes = results
      .filter(r => r.position === pos)
      .reduce((sum, curr) => sum + curr.votes, 0);
    return totalPosVotes === 0 ? 0 : (votes / totalPosVotes) * 100;
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 font-sans">
      {/* --- HEADER --- */}
      <header className="mb-12 border-b border-slate-100 pb-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-blue-600 font-black text-5xl uppercase tracking-tighter leading-none mb-2">Live Election Tally</h2>
            <p className="text-slate-900 font-black text-xl uppercase tracking-tight">ICpEP.SE | ESSU Chapter</p>
            <div className="flex items-center gap-3 mt-3">
               <span className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                 <Clock size={12} /> {lastUpdated.toLocaleTimeString()}
               </span>
               <span className="animate-pulse flex items-center gap-1 text-[10px] font-black text-blue-500 uppercase tracking-widest">
                 <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"/> Real-time Feed
               </span>
            </div>
          </div>
          
          <button 
            onClick={fetchTallyData} 
            title="Refresh Tally Data"
            aria-label="Refresh Tally Data"
            className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg active:scale-95"
          >
            <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* --- STATS OVERVIEW --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#060b18] p-6 rounded-3xl border border-blue-900/20">
            <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1">Voters Processed</p>
            <h4 className="text-white text-3xl font-black tabular-nums flex items-center gap-2">
                <Users size={20} className="text-blue-500"/> {totalVotesCast}
            </h4>
          </div>
          <div className="bg-[#060b18] p-6 rounded-3xl border border-blue-900/20 border-l-4 border-blue-500">
            <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1">Target Milestone</p>
            <h4 className="text-white text-3xl font-black tabular-nums">{VOTE_MILESTONE}</h4>
          </div>
          <div className="bg-blue-600 p-6 rounded-3xl shadow-xl shadow-blue-900/20">
            <p className="text-blue-100 text-[9px] font-black uppercase tracking-widest mb-1">Total Turnout</p>
            <h4 className="text-white text-3xl font-black tabular-nums">
              {totalVoters > 0 ? ((totalVotesCast / totalVoters) * 100).toFixed(1) : 0}%
            </h4>
          </div>
        </div>
      </header>

      {/* --- POSITIONS --- */}
      <div className="space-y-16">
        {POSITIONS.map((pos) => {
          const candidatesForPos = results
            .filter(r => r.position === pos)
            .sort((a, b) => b.votes - a.votes);

          if (candidatesForPos.length === 0) return null;

          return (
            <section key={pos} className="space-y-6">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter border-l-4 border-blue-600 pl-4">
                {pos}
              </h3>
              
              <div className="space-y-3">
                {candidatesForPos.map((cand, index) => {
                  const visualWidth = calculateBarWidth(cand.votes);
                  const actualPercent = calculateActualPercentage(cand.votes, pos);
                  const isWinner = index === 0 && cand.votes > 0;

                  return (
                    <div key={cand.id} className="group relative bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      {/* BLUE BAR LOGIC */}
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${visualWidth}%` }}
                        transition={{ duration: 1.5, ease: "circOut" }}
                        className={`absolute inset-0 opacity-[0.08] ${isWinner ? 'bg-blue-600' : 'bg-slate-400'}`}
                      />
                      
                      <div className="relative flex items-center h-16 md:h-20">
                        <div className={`w-12 md:w-16 h-full flex items-center justify-center font-black text-xl border-r border-slate-100 ${
                          isWinner ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400'
                        }`}>
                          {index + 1}
                        </div>

                        <div className="flex-1 px-4 md:px-8">
                          <h5 className="font-black text-slate-900 uppercase text-sm md:text-lg leading-none mb-1">
                            {cand.name}
                          </h5>
                          <span className="text-[10px] md:text-xs font-bold text-blue-500 uppercase tracking-[0.2em]">
                            {cand.party_name} Party
                          </span>
                        </div>

                        <div className="px-6 md:px-10 text-right flex flex-col justify-center border-l border-slate-50">
                          <p className="font-black text-slate-900 text-lg md:text-2xl leading-none tabular-nums">
                            {cand.votes.toLocaleString()}
                          </p>
                          <div className="flex items-center justify-end gap-1 text-slate-400 mt-1">
                             <Percent size={10} className="text-blue-400" />
                             <span className="text-[10px] font-black">{actualPercent.toFixed(1)}</span>
                             {isWinner && <Trophy size={12} className="text-amber-500 ml-1 drop-shadow-sm" />}
                          </div>
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
    </div>
  );
};

export default LiveTally;
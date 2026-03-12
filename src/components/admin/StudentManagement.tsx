import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trash2, Search, UserCheck, UserX, Users, 
  AlertCircle, CheckCircle2, RefreshCcw, 
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

const SUB_TABS = [
  { id: '1A', year: '1', section: 'A' },
  { id: '1B', year: '1', section: 'B' },
  { id: '2A', year: '2', section: 'A' },
  { id: '2B', year: '2', section: 'B' },
  { id: '3A', year: '3', section: 'A' },
  { id: '3B', year: '3', section: 'B' },
  { id: '4', year: '4', section: null } 
];

const StudentManagement = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [activeSubTab, setActiveSubTab] = useState('1A');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Custom UI States
  const [deleteTarget, setDeleteTarget] = useState<{id: string, name: string} | null>(null);
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const triggerToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .order('full_name', { ascending: true });

    const { data: voteData } = await supabase.from('votes').select('voter_id');
    const votedSet = new Set(voteData?.map(v => v.voter_id));

    setStudents(profileData || []);
    setVotedIds(votedSet);
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    
    const { error } = await supabase.from('profiles').delete().eq('id', deleteTarget.id);
    
    if (error) {
      triggerToast("Failed to remove student record", "error");
    } else {
      triggerToast("Student record terminated", "success");
      fetchData();
    }
    setDeleteTarget(null);
  };

  const currentTabInfo = SUB_TABS.find(t => t.id === activeSubTab);
  const filteredStudents = students.filter(s => {
    const matchesTab = currentTabInfo?.section 
      ? (s.year_level === currentTabInfo.year && s.section === currentTabInfo.section)
      : (s.year_level === currentTabInfo?.year);
    
    const matchesSearch = s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         s.student_number?.includes(searchQuery);
    
    return matchesTab && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto relative">
      
      {/* --- NOTIFICATION TOAST --- */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
            className={`fixed top-10 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-6 py-3 rounded-2xl shadow-2xl border ${
              toast.type === 'success' ? 'bg-slate-900 border-blue-500/50 text-blue-400' : 'bg-slate-900 border-red-500/50 text-red-400'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 size={18}/> : <AlertCircle size={18}/>}
            <span className="text-[10px] font-black uppercase tracking-widest">{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-blue-600 font-mono text-[10px] uppercase tracking-[0.5em] font-black mb-3">Database Management</p>
          <h2 className="text-5xl font-black text-slate-900 uppercase tracking-tighter">Voter List</h2>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={fetchData}
            title="Reload Data"
            className="p-3 bg-slate-100 text-slate-500 rounded-xl hover:bg-blue-600 hover:text-white transition-all active:scale-90"
          >
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <div className="bg-blue-50 text-blue-600 px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest border border-blue-100">
            Sector Total: {filteredStudents.length}
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search Identity..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 pr-6 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 transition-all font-bold text-xs min-w-[260px]"
            />
          </div>
        </div>
      </header>

      {/* --- SUB-TABS --- */}
      <div className="flex flex-wrap gap-1.5 mb-8 bg-slate-100/50 p-1.5 rounded-[24px] border border-slate-100 w-fit">
        {SUB_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`px-6 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${
              activeSubTab === tab.id 
                ? 'bg-white text-blue-600 shadow-sm border border-slate-200' 
                : 'text-slate-400 hover:text-slate-600 hover:bg-white/40'
            }`}
          >
            {tab.year}{tab.section || ''}
          </button>
        ))}
      </div>

      {/* --- TABLE AREA --- */}
      <div className="bg-white border-2 border-slate-100 rounded-[40px] overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-20 text-center animate-pulse text-blue-500 font-black uppercase tracking-widest text-[10px]">Syncing Secure Registry...</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400">
                <th className="p-8">Verified Student</th>
                <th className="p-8">Student ID</th>
                <th className="p-8">Registry Status</th>
                <th className="p-8 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <AnimatePresence mode='popLayout'>
                {filteredStudents.length > 0 ? filteredStudents.map((student) => (
                  <motion.tr 
                    layout
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    key={student.id} 
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="p-8">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 uppercase text-sm">{student.full_name}</span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Level {student.year_level} — {student.section ? `Section ${student.section}` : 'General'}</span>
                      </div>
                    </td>
                    <td className="p-8 font-mono text-xs font-bold text-blue-600">{student.student_number || '---'}</td>
                    <td className="p-8">
                      {votedIds.has(student.id) ? (
                        <div className="flex items-center gap-2 text-emerald-500 bg-emerald-50 w-fit px-3 py-1.5 rounded-lg border border-emerald-100">
                          <UserCheck size={14} />
                          <span className="text-[9px] font-black uppercase tracking-[0.1em]">VOTED</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-300 px-3 py-1.5">
                          <UserX size={14} />
                          <span className="text-[9px] font-black uppercase tracking-[0.1em]">PENDING</span>
                        </div>
                      )}
                    </td>
                    <td className="p-8 text-right">
                      <button 
                        onClick={() => setDeleteTarget({id: student.id, name: student.full_name})}
                        title={`Purge ${student.full_name}`}
                        aria-label={`Delete student ${student.full_name}`}
                        className="p-3 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 size={18}/>
                      </button>
                    </td>
                  </motion.tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="p-24 text-center">
                      <Users size={32} className="mx-auto text-slate-200 mb-4" />
                      <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest leading-relaxed">No data detected <br /> for this sector</p>
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        )}
      </div>

      {/* --- DELETE CONFIRMATION --- */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteTarget(null)} className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-xs bg-white rounded-[32px] p-8 text-center shadow-2xl">
              <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-100">
                <AlertCircle size={28}/>
              </div>
              <h4 className="text-lg font-black text-slate-900 uppercase mb-2 leading-none">Purge Account?</h4>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-8 leading-relaxed px-4 text-center">
                This will permanently remove <span className="text-slate-900 underline">{deleteTarget.name}</span> from the registry.
              </p>
              <div className="flex flex-col gap-2">
                <button onClick={handleDelete} className="w-full py-4 bg-red-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all">Confirm Delete</button>
                <button onClick={() => setDeleteTarget(null)} className="w-full py-4 bg-slate-100 text-slate-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">Abort</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default StudentManagement;
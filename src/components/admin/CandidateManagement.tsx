import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, User, Loader2, X, 
  Image as ImageIcon, AlertCircle, CheckCircle2 
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

const POSITIONS = ['President', 'Vice President', 'Secretary', 'Finance Executive', 'Auditor', 'PRO', '1st Year Representative', '3rd Year Representative', '4th Year Representative'];

const CandidateManagement = () => {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const [name, setName] = useState('');
  const [party, setParty] = useState('');
  const [position, setPosition] = useState(POSITIONS[0]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchCandidates();
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchCandidates = async () => {
    const { data } = await supabase.from('candidates').select('*').order('created_at', { ascending: true });
    setCandidates(data || []);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let image_url = '';
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `candidates/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('candidate-photos')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('candidate-photos').getPublicUrl(filePath);
        image_url = urlData.publicUrl;
      }

      const { error } = await supabase.from('candidates').insert([{ name, party_name: party, position, image_url }]);
      if (error) throw error;

      showToast("Candidate successfully registered", "success");
      setName(''); setParty(''); setImageFile(null); setPreviewUrl(null); setShowModal(false);
      fetchCandidates();
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('candidates').delete().eq('id', deleteConfirm);
      if (error) throw error;
      showToast("Nominee removed from pool", "success");
      fetchCandidates();
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setDeleteConfirm(null);
      setLoading(false);
    }
  };

  const groupedCandidates = POSITIONS.reduce((acc: any, pos) => {
    const list = candidates.filter(c => c.position === pos);
    if (list.length > 0) acc[pos] = list;
    return acc;
  }, {});

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto pb-20 relative">
      
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
            className={`fixed top-10 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-6 py-3 rounded-2xl shadow-2xl border ${
              toast.type === 'success' ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-red-600 border-red-500 text-white'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 size={18}/> : <AlertCircle size={18}/>}
            <span className="text-[10px] font-black uppercase tracking-widest">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-end mb-16">
        <div>
          <p className="text-blue-600 font-mono text-[10px] uppercase tracking-[0.5em] font-black mb-3">System Registry</p>
          <h2 className="text-5xl font-black text-slate-900 uppercase tracking-tighter leading-none">Nominees</h2>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all">
          <Plus size={18} /> Register New
        </button>
      </div>

      <div className="space-y-16">
        {Object.keys(groupedCandidates).length === 0 ? (
          <div className="p-32 text-center border-2 border-dashed border-slate-100 rounded-[60px] bg-slate-50/50">
            <User size={48} className="mx-auto text-slate-200 mb-6" />
            <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.4em]">Node Empty: No registered entries found</p>
          </div>
        ) : (
          Object.entries(groupedCandidates).map(([pos, list]: any) => (
            <div key={pos} className="space-y-8">
              <div className="flex items-center gap-6">
                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">{pos}</h4>
                <div className="h-px flex-1 bg-slate-100"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {list.map((c: any) => (
                  <div key={c.id} className="p-6 bg-white border border-slate-100 rounded-[32px] flex items-center gap-6 group hover:border-blue-500 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300">
                    <div className="w-20 h-20 rounded-2xl bg-slate-50 overflow-hidden shrink-0 border border-slate-100">
                      {c.image_url ? (
                        <img 
                          src={c.image_url} 
                          alt={`${c.name} - ${c.party_name}`} 
                          title={c.name}
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <User className="w-full h-full p-6 text-slate-200" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h5 className="font-black text-slate-900 uppercase text-lg leading-tight mb-1">{c.name}</h5>
                      <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">{c.party_name} Party</span>
                    </div>
                    <button 
                      onClick={() => setDeleteConfirm(c.id)} 
                      title={`Remove ${c.name} from candidates`}
                      aria-label={`Remove ${c.name}`}
                      className="p-4 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-md bg-white rounded-[40px] p-10 shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Add Nominee</h3>
                <button 
                  onClick={() => setShowModal(false)} 
                  title="Close registration modal"
                  aria-label="Close modal"
                  className="p-2 text-slate-300 hover:text-slate-900"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddCandidate} className="space-y-5">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Full Name</label>
                  <input required value={name} onChange={e => setName(e.target.value)} className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-500 outline-none font-bold text-xs transition-all" placeholder="Enter nominee name..." />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Party Name</label>
                  <input required value={party} onChange={e => setParty(e.target.value)} className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-500 outline-none font-bold text-xs transition-all" placeholder="Enter party name..." />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Position</label>
                  <select 
                    value={position} 
                    onChange={e => setPosition(e.target.value)} 
                    title="Select position for candidate"
                    className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-transparent outline-none font-bold text-xs appearance-none"
                  >
                    {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Photo Upload</label>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" id="file-up" />
                  <label htmlFor="file-up" className="flex items-center gap-4 p-4 border-2 border-dashed border-slate-100 rounded-2xl cursor-pointer hover:border-blue-300 transition-all bg-slate-50/50">
                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                      {previewUrl ? (
                        <img src={previewUrl} alt="Candidate preview" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon size={20} className="text-slate-300"/>
                      )}
                    </div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{imageFile ? imageFile.name.substring(0, 15) + '...' : 'Upload Image'}</span>
                  </label>
                </div>
                <button disabled={loading} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-blue-200 flex items-center justify-center gap-2 hover:bg-blue-700 transition-all">
                  {loading ? <Loader2 className="animate-spin" size={16}/> : 'Register Nominee'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteConfirm(null)} className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-sm bg-white rounded-[32px] p-8 text-center shadow-2xl">
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6"><AlertCircle size={32}/></div>
              <h4 className="text-xl font-black text-slate-900 uppercase mb-2">Confirm Delete</h4>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-8">This action will permanently remove the nominee from the system.</p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={handleDelete} className="py-4 bg-red-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all">Delete</button>
                <button onClick={() => setDeleteConfirm(null)} className="py-4 bg-slate-100 text-slate-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CandidateManagement;

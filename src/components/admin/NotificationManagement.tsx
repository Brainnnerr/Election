import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Trash2, Clock, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const NotificationManagement = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    const { data } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });
    setReports(data || []);
  };

  const markAsRead = async (id: string) => {
  setProcessingId(id);
  const { error } = await supabase
    .from('reports')
    .update({ is_read: true }) // Changing this triggers the dashboard listener
    .eq('id', id);

  if (!error) {
    setReports(reports.map(r => r.id === id ? { ...r, is_read: true } : r));
  }
  setProcessingId(null);
};


  const deleteReport = async (id: string) => {
    // 1. Set processing state to prevent double-clicks
    setProcessingId(id);
    
    // 2. Perform the actual deletion in Supabase
    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('id', id);

    if (!error) {
      // 3. Update local state only if database deletion was successful
      setReports(prev => prev.filter(r => r.id !== id));
    } else {
      console.error("Database deletion failed:", error.message);
    }
    
    setProcessingId(null);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-12">
        <p className="text-blue-600 font-mono text-[10px] uppercase tracking-[0.5em] font-black mb-3">System Alerts</p>
        <h2 className="text-5xl font-black text-slate-900 uppercase tracking-tighter">Notifications</h2>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {reports.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="p-20 text-center bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-100"
            >
              <Mail className="mx-auto text-slate-200 mb-4" size={48} />
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Inbox Empty</p>
            </motion.div>
          ) : (
            reports.map((report) => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={report.id}
                className={`border p-6 rounded-[32px] shadow-sm transition-all group ${
                  report.is_read ? 'bg-white border-slate-100 opacity-60' : 'bg-blue-50/30 border-blue-100 shadow-md'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                      report.is_read ? 'bg-slate-100 text-slate-400' : 'bg-blue-100 text-blue-600'
                    }`}>
                      <AlertTriangle size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h4 className="font-black text-slate-900 uppercase text-sm">{report.name}</h4>
                        {!report.is_read && (
                          <span className="px-2 py-0.5 bg-blue-600 text-white text-[8px] font-black rounded-full uppercase tracking-widest">New</span>
                        )}
                      </div>
                      <p className="text-blue-500 font-bold text-[10px] mb-2">{report.email}</p>
                      <p className="text-slate-600 text-sm leading-relaxed">{report.message}</p>
                      <div className="flex items-center gap-2 mt-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        <Clock size={12} /> {new Date(report.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!report.is_read && (
                      <button 
                        disabled={processingId === report.id}
                        onClick={() => markAsRead(report.id)}
                        title="Mark as Read"
                        aria-label="Mark as read"
                        className="p-3 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all disabled:opacity-50"
                      >
                        {processingId === report.id ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                      </button>
                    )}
                    <button 
                      disabled={processingId === report.id}
                      onClick={() => deleteReport(report.id)}
                      title="Delete Notification"
                      aria-label={`Delete report from ${report.name}`}
                      className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all disabled:opacity-50"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default NotificationManagement;
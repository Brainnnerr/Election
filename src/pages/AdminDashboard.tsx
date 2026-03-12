import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckSquare,
  LayoutDashboard,
  LogOut,
  Settings,
  Trophy,
  Users,
  Bell,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import VotingManagement from "../components/admin/VotingManagement";
import CandidateManagement from "../components/admin/CandidateManagement";
import StudentManagement from "../components/admin/StudentManagement";
import LiveTally from '../components/admin/LiveTally';
import NotificationManagement from '../components/admin/NotificationManagement';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("voting");
  const [isElectionLive, setIsElectionLive] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchInitialData = async () => {
    // 1. Sync election status
    const { data: settings } = await supabase
      .from("system_settings")
      .select("is_election_live")
      .eq("id", "global_config")
      .single();
    if (settings) setIsElectionLive(settings.is_election_live);

    // 2. Sync unread notifications count
    const { count } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false);
    setUnreadCount(count || 0);
  };

  useEffect(() => {
    fetchInitialData();

    // 3. Real-time subscription for reports and system settings
    const channel = supabase
      .channel('admin-dashboard-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
        fetchInitialData();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'system_settings' }, (payload) => {
        setIsElectionLive(payload.new.is_election_live);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <div className="flex min-h-screen bg-white text-slate-900 font-sans">
      
      {/* --- SIDEBAR --- */}
      <aside className="w-80 bg-[#060b18] flex flex-col sticky top-0 h-screen">
        <div className="p-10">
          <div className="flex items-center gap-4 mb-12">
            <div className="p-2.5 bg-blue-600 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)]">
              <Settings className="text-white" size={22} />
            </div>
            <div>
              <h1 className="font-black uppercase tracking-tighter text-white text-lg leading-none">
                Admin
              </h1>
              <p className="text-[10px] text-blue-500 font-mono tracking-[0.2em] uppercase mt-1">
                Console v1.0
              </p>
            </div>
          </div>

          <nav className="flex flex-col gap-2">
            <MenuButton
              active={activeTab === "voting"}
              onClick={() => setActiveTab("voting")}
              icon={<CheckSquare size={20} />}
              label="Voting Management"
            />
            <MenuButton
              active={activeTab === "candidates"}
              onClick={() => setActiveTab("candidates")}
              icon={<Users size={20} />}
              label="Candidates"
            />
            <MenuButton
              active={activeTab === "students"}
              onClick={() => setActiveTab("students")}
              icon={<LayoutDashboard size={20} />}
              label="Students/Voters"
            />
            <MenuButton
              active={activeTab === "tally"}
              onClick={() => setActiveTab("tally")}
              icon={<Trophy size={20} />}
              label="Live Tally"
            />
            <MenuButton
              active={activeTab === "notifications"}
              onClick={() => setActiveTab("notifications")}
              icon={<Bell size={20} />}
              label="Reports"
              // Pass the numerical count here
              badge={unreadCount > 0 ? unreadCount : undefined}
            />
          </nav>
        </div>

        <div className="mt-auto p-10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-red-500 transition-all group px-2"
          >
            <LogOut
              size={18}
              className="group-hover:-translate-x-1 transition-transform"
            />
            Exit Console
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 p-16 overflow-y-auto bg-slate-50/30">
        <AnimatePresence mode="wait">
          <TabWrapper key={activeTab}>
            {activeTab === "voting" && (
              <VotingManagement
                isElectionLive={isElectionLive}
                onToggleElection={() => setIsElectionLive(!isElectionLive)}
              />
            )}
            {activeTab === "candidates" && <CandidateManagement />}
            {activeTab === "students" && <StudentManagement />}
            {activeTab === "tally" && <LiveTally />}
            {activeTab === "notifications" && <NotificationManagement />}
          </TabWrapper>
        </AnimatePresence>
      </main>
    </div>
  );
};

const TabWrapper = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.2 }}
  >
    {children}
  </motion.div>
);

const MenuButton = ({ active, onClick, icon, label, badge }: any) => (
  <button
    onClick={onClick}
    className={`relative w-full flex items-center gap-5 px-6 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 group ${
      active
        ? "bg-blue-600/10 text-blue-400"
        : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
    }`}
  >
    {active && (
      <motion.div
        layoutId="activeIndicator"
        className="absolute left-0 w-1.5 h-6 bg-blue-500 rounded-r-full"
      />
    )}
    <span
      className={`relative ${
        active ? "text-blue-500" : "text-slate-600 group-hover:text-slate-400"
      } transition-colors`}
    >
      {icon}
      {/* Pulsing Dot for unread reports */}
      {badge !== undefined && !active && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-[#060b18]"></span>
        </span>
      )}
    </span>
    <span className="flex-1 text-left">{label}</span>
    
    {/* Numerical Badge */}
    {badge !== undefined && (
      <motion.span 
        initial={{ scale: 0.5 }}
        animate={{ scale: 1 }}
        className={`px-2.5 py-0.5 rounded-full text-[9px] font-black tabular-nums ${
          active ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-800 text-slate-400'
        }`}
      >
        {badge}
      </motion.span>
    )}
  </button>
);

export default AdminDashboard;
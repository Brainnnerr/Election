import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from './lib/supabase';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import VotingBooth from './pages/VotingBooth';
import ResetPassword from './pages/ResetPassword';


function App() {
  const [session, setSession] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Function to fetch the role from our profiles table
    const getRole = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .single();
        
        if (error) throw error;
        setUserRole(data?.role || 'student');
      } catch (err) {
        console.error("Error fetching role:", err);
        setUserRole('student');
      } finally {
        // Delay loading finish slightly for a smoother transition
        setTimeout(() => setLoading(false), 1000);
      }
    };

    // 1. Initial Session Check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        getRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // 2. Auth State Listener (Catches logins/logouts)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        getRole(session.user.id);
      } else {
        setUserRole(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center relative overflow-hidden font-sans">
        {/* Ambient Background Pulse */}
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1] 
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-[500px] h-[500px] bg-blue-600/20 blur-[120px] rounded-full"
        />

        <div className="relative flex flex-col items-center">
          {/* Tech Orb Spinner */}
          <div className="relative w-24 h-24 mb-8">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 border-t-2 border-r-2 border-blue-500 rounded-full"
            />
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute inset-2 border-b-2 border-l-2 border-cyan-400 rounded-full opacity-50"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <img 
                src="https://pmhkigqkqqdsedkeffgk.supabase.co/storage/v1/object/public/assets/ICpEP%20logo.png" 
                alt="Logo" 
                className="w-10 h-10 animate-pulse" 
              />
            </div>
          </div>

          {/* System Status Text */}
          <div className="text-center space-y-2">
            <motion.h2 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-white font-black uppercase tracking-[0.3em] text-[10px]"
            >
              Establishing Secure Connection
            </motion.h2>
            <div className="flex items-center justify-center gap-1">
              {[0, 1, 2].map((i) => (
                <motion.span 
                  key={i}
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                  className="w-1 h-1 bg-blue-500 rounded-full"
                />
              ))}
            </div>
          </div>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            className="absolute -bottom-24 text-[9px] text-blue-400 font-mono uppercase tracking-[0.4em] whitespace-nowrap"
          >
            Initializing ICpEP.SE Core Modules...
          </motion.p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 selection:bg-blue-500/30 selection:text-blue-400">
      <Router>
        <Routes>
          {/* Main Entry Point */}
          <Route 
            path="/" 
            element={
              !session ? <Landing /> : 
              userRole === 'admin' ? <Navigate to="/admin" /> : <Navigate to="/dashboard" />
            } 
          />
          
          {/* Student Portal */}
          <Route 
            path="/dashboard" 
            element={session && userRole === 'student' ? <Dashboard /> : <Navigate to="/" />} 
          />

          {/* Voting Booth - Only for Students */}
          <Route 
            path="/voting" 
            element={session && userRole === 'student' ? <VotingBooth /> : <Navigate to="/" />} 
          />

          {/* Admin Command Center */}
          <Route 
            path="/admin" 
            element={session && userRole === 'admin' ? <AdminDashboard /> : <Navigate to="/" />} 
          />

<Route path="/reset-password" element={<ResetPassword />} />

          {/* Redirect any unknown routes back to home */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
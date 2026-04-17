import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, Clock, Droplets, CalendarDays } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [floodData, setFloodData] = useState({
    waterLevel: 0, statusLevel: 0, date: "Waiting...", time: "Waiting..."
  });
  const [history, setHistory] = useState([]);
  const prevStatusRef = useRef(0);

  // YOUR VERCEL API LINK
  const API_URL = 'https://flood-monitor-seven.vercel.app/api/flood';

  // Ask for Notification Permission on Load
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(API_URL, { cache: 'no-store' });
        const data = await response.json();
        if (data.latest) setFloodData(data.latest);
        if (data.history) setHistory(data.history);
      } catch (e) {
        console.warn("Connection lost. Retrying...");
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  // Push Notification Trigger
  useEffect(() => {
    if (floodData.statusLevel > prevStatusRef.current && floodData.statusLevel > 0) {
      if ("Notification" in window && Notification.permission === "granted") {
        const status = getStatus(floodData.statusLevel);
        new Notification(`🚨 ${status.text} ALERT`, {
          body: `Water Level is at ${floodData.waterLevel}cm. Please take immediate action.`,
          vibrate: [200, 100, 200]
        });
      }
    }
    prevStatusRef.current = floodData.statusLevel;
  }, [floodData.statusLevel, floodData.waterLevel]);

  const getStatus = (level) => {
    const states = {
      3: { text: "EVACUATE", color: "bg-red-500/20", textColor: "text-red-400", border: "border-red-500/50", glow: "shadow-[0_0_40px_rgba(239,68,68,0.4)]", icon: AlertTriangle, pulse: true },
      2: { text: "ALERT", color: "bg-orange-500/20", textColor: "text-orange-400", border: "border-orange-500/50", glow: "shadow-[0_0_30px_rgba(249,115,22,0.3)]", icon: AlertTriangle, pulse: false },
      1: { text: "WARNING", color: "bg-yellow-500/20", textColor: "text-yellow-400", border: "border-yellow-500/50", glow: "shadow-[0_0_20px_rgba(234,179,8,0.2)]", icon: AlertTriangle, pulse: false },
      0: { text: "NORMAL", color: "bg-emerald-500/10", textColor: "text-emerald-400", border: "border-emerald-500/30", glow: "shadow-none", icon: CheckCircle, pulse: false }
    };
    return states[level] || states[0];
  };

  const s = getStatus(floodData.statusLevel);

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 p-4 md:p-8 flex items-center justify-center font-sans selection:bg-blue-500/30">
      
      <div className="max-w-md w-full relative group">
        {/* Background Ambient Glow */}
        <div className={`absolute -inset-1 rounded-[3rem] blur-xl opacity-50 transition-all duration-1000 ${s.glow}`}></div>

        <div className="relative bg-[#1e293b]/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-slate-700/50 overflow-hidden">
          
          {/* Header */}
          <div className="p-8 pb-6 text-center">
            <motion.div 
              animate={{ y: [0, -8, 0] }} 
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              className="flex justify-center mb-3"
            >
              <div className="p-3 bg-blue-500/20 rounded-full border border-blue-500/30">
                <Droplets className="text-blue-400" size={28} />
              </div>
            </motion.div>
            <h1 className="text-3xl font-black text-white tracking-tight">Order Po!</h1>
            <p className="text-blue-400 text-xs font-bold uppercase tracking-[0.3em] mt-2">Flood Monitor System</p>
          </div>

          {/* Tab Switcher */}
          <div className="flex p-1.5 bg-slate-900/50 mx-8 rounded-2xl mb-6 border border-slate-800">
            {['dashboard', 'history'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)} 
                className="relative flex-1 py-3 rounded-xl transition-all text-xs font-black uppercase tracking-wider z-10"
              >
                {activeTab === tab && (
                  <motion.div layoutId="activeTab" className="absolute inset-0 bg-blue-500/20 border border-blue-500/50 rounded-xl -z-10" />
                )}
                <span className={activeTab === tab ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}>
                  {tab}
                </span>
              </button>
            ))}
          </div>

          <div className="px-8 pb-10 min-h-[350px]">
            <AnimatePresence mode="wait">
              {activeTab === 'dashboard' ? (
                <motion.div key="live" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <div className={`rounded-[2rem] p-10 text-center border transition-all duration-700 ${s.color} ${s.border} ${s.textColor}`}>
                    <motion.div 
                      animate={s.pulse ? { scale: [1, 1.1, 1] } : {}} 
                      transition={{ repeat: Infinity, duration: 1 }}
                    >
                      <s.icon size={64} className="mx-auto mb-6 drop-shadow-lg" />
                    </motion.div>
                    
                    <h2 className="text-5xl font-black tracking-tighter drop-shadow-md">{s.text}</h2>
                    
                    <div className="mt-4 flex items-baseline justify-center gap-2">
                      <span className="text-7xl font-black text-white">{floodData.waterLevel}</span>
                      <span className="text-2xl font-bold opacity-70">cm</span>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-center gap-2 opacity-80">
                      <Clock size={14} />
                      <p className="text-[11px] font-black uppercase tracking-widest">{floodData.time}</p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="hist" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-3 h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                  {history.length > 0 ? history.map((item, i) => {
                    const st = getStatus(item.statusLevel);
                    return (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        key={i} 
                        className="bg-slate-800/50 p-4 rounded-2xl flex justify-between items-center border border-slate-700 hover:bg-slate-700/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-2 h-10 rounded-full ${st.color.replace('/20', '')}`}></div>
                          <div>
                            <p className={`text-[10px] font-black uppercase tracking-wider ${st.textColor}`}>{st.text}</p>
                            <p className="text-2xl font-black text-white">{item.waterLevel} <span className="text-sm text-slate-400 font-bold">cm</span></p>
                          </div>
                        </div>
                        <div className="text-right flex flex-col gap-1">
                          <div className="flex items-center justify-end gap-1 text-slate-300">
                            <Clock size={10} />
                            <p className="text-[10px] font-bold uppercase">{item.time}</p>
                          </div>
                          <div className="flex items-center justify-end gap-1 text-slate-500">
                            <CalendarDays size={10} />
                            <p className="text-[9px] font-bold uppercase">{item.date}</p>
                          </div>
                        </div>
                      </motion.div>
                    )
                  }) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
                      <Droplets size={48} className="mb-4" />
                      <p className="text-sm font-bold uppercase tracking-widest">No Data Yet</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
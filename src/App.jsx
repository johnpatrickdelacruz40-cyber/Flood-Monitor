import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, Activity, BellRing, Clock, CalendarDays } from 'lucide-react';

export default function App() {
  const [floodData, setFloodData] = useState({
    waterLevel: 0, statusLevel: 0, date: "--/--/--", time: "--:--:--"
  });
  const [history, setHistory] = useState([]);
  const [isOnline, setIsOnline] = useState(false);
  const prevStatusRef = useRef(0);
  const lastFetchTime = useRef(Date.now());

  const API_URL = 'https://flood-monitor-seven.vercel.app/api/flood';

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(API_URL, { cache: 'no-store' });
        const data = await response.json();
        
        if (data.latest) {
          setFloodData(data.latest);
          setIsOnline(true);
          lastFetchTime.current = Date.now();
        }
        if (data.history) setHistory(data.history);
      } catch (e) {
        if (Date.now() - lastFetchTime.current > 6000) setIsOnline(false);
      }
    };
    
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (floodData.statusLevel > prevStatusRef.current && floodData.statusLevel > 0) {
      if ("Notification" in window && Notification.permission === "granted") {
        const status = getTheme(floodData.statusLevel);
        new Notification(`🚨 ${status.label} ALERT`, {
          body: `Water Level reached ${floodData.waterLevel}cm!`,
        });
      }
    }
    prevStatusRef.current = floodData.statusLevel;
  }, [floodData.statusLevel, floodData.waterLevel]);

  const getTheme = (level) => {
    const themes = {
      3: { label: "EVACUATE", bg: "bg-red-500", glow: "shadow-red-500/50", text: "text-red-500", border: "border-red-500/30", gradient: "from-red-950 via-red-900/20 to-[#0a0a0a]", icon: AlertTriangle },
      2: { label: "ALERT", bg: "bg-orange-500", glow: "shadow-orange-500/50", text: "text-orange-500", border: "border-orange-500/30", gradient: "from-orange-950 via-orange-900/20 to-[#0a0a0a]", icon: AlertTriangle },
      1: { label: "WARNING", bg: "bg-yellow-400", glow: "shadow-yellow-400/50", text: "text-yellow-400", border: "border-yellow-400/30", gradient: "from-yellow-950 via-yellow-900/20 to-[#0a0a0a]", icon: AlertTriangle },
      0: { label: "NORMAL", bg: "bg-emerald-500", glow: "shadow-emerald-500/50", text: "text-emerald-500", border: "border-emerald-500/30", gradient: "from-emerald-950 via-emerald-900/20 to-[#0a0a0a]", icon: CheckCircle }
    };
    return themes[level] || themes[0];
  };

  const theme = getTheme(floodData.statusLevel);
  // NEW MATH: 23cm Maximum Capacity
  const fillPercentage = Math.min((floodData.waterLevel / 23) * 100, 100);

  return (
    <div className={`min-h-screen bg-[#0a0a0a] text-slate-200 font-sans selection:bg-white/20 transition-colors duration-1000 bg-gradient-to-br ${theme.gradient} flex items-center justify-center p-4 md:p-8`}>
      
      <div className="w-full max-w-5xl flex flex-col gap-6">
        
        {/* --- NAVBAR --- */}
        <header className="flex justify-between items-center bg-black/40 backdrop-blur-2xl border border-white/5 rounded-3xl p-4 md:px-6 shadow-2xl">
          <div className="flex items-center gap-5">
            <div className="relative group p-0.5 rounded-full bg-white/5 border border-white/10 shadow-inner overflow-hidden">
              <div className={`absolute -inset-1 rounded-full blur-md opacity-70 transition-all duration-1000 ${theme.bg}`}></div>
              <img 
                src="C:\Users\johnp\OneDrive\Desktop\FINAL PROJECT\Embedded System\cozy-dispenser\src\assets\ICON ICON.png" 
                alt="HydroSense OS" 
                className="w-16 h-16 rounded-full relative z-10 border-2 border-slate-900 group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tighter drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)]">HydroSense OS</h1>
              <p className="text-blue-400 text-[10px] md:text-xs font-black uppercase tracking-[0.25em] mt-1.5 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                GROUP 5 Deployment Live
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-white/10">
              <span className="relative flex h-2 w-2 md:h-2.5 md:w-2.5">
                {isOnline && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                <span className={`relative inline-flex rounded-full h-2 w-2 md:h-2.5 md:w-2.5 ${isOnline ? 'bg-emerald-500' : 'bg-slate-600'}`}></span>
              </span>
              <span className="text-[9px] md:text-[11px] font-black uppercase tracking-widest text-slate-300">
                {isOnline ? 'Hardware Live' : 'Connecting...'}
              </span>
            </div>
            <p className="text-[10px] md:text-[11px] font-mono font-bold text-slate-500 mt-2 tracking-wider">{floodData.time}</p>
          </div>
        </header>

        {/* --- BENTO GRID LAYOUT --- */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* MAIN MODULE: Liquid Level Visualizer */}
          <motion.div layout className="md:col-span-8 relative bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] overflow-hidden min-h-[400px] flex flex-col justify-between p-8 shadow-2xl">
            <div className={`absolute -top-32 -right-32 w-96 h-96 rounded-full blur-[100px] opacity-20 ${theme.bg}`}></div>

            <div className="relative z-10 flex justify-between items-start">
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Activity size={16} /> Live Telemetry
                </p>
                <div className="mt-4 flex items-baseline gap-2">
                  <motion.h2 
                    key={floodData.waterLevel}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="text-8xl md:text-9xl font-black text-white tracking-tighter"
                  >
                    {floodData.waterLevel}
                  </motion.h2>
                  <span className="text-3xl font-bold text-slate-500">cm</span>
                </div>
              </div>
              
              <motion.div animate={{ scale: floodData.statusLevel > 0 ? [1, 1.05, 1] : 1 }} transition={{ repeat: Infinity, duration: 2 }} className={`flex items-center gap-2 px-6 py-3 rounded-2xl border ${theme.border} bg-white/5 backdrop-blur-md shadow-xl`}>
                <theme.icon className={`${theme.text} drop-shadow-md`} size={20} />
                <span className={`text-sm font-black uppercase tracking-widest ${theme.text}`}>
                  {theme.label}
                </span>
              </motion.div>
            </div>

            {/* Liquid Fill Visualizer */}
            <div className="relative z-10 mt-12">
              <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase mb-2 px-1">
                <span>Sensor Floor (0cm)</span>
                <span>Max Capacity (23cm)</span>
              </div>
              <div className="h-8 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 relative p-1 shadow-inner">
                <motion.div 
                  className={`h-full rounded-full ${theme.bg} shadow-[0_0_20px_rgba(255,255,255,0.3)] relative overflow-hidden`}
                  initial={{ width: 0 }}
                  animate={{ width: `${fillPercentage}%` }}
                  transition={{ type: "spring", stiffness: 50, damping: 15 }}
                >
                  <div className="absolute top-0 left-0 w-full h-1/2 bg-white/20"></div>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* SIDE MODULE: Notification & History */}
          <div className="md:col-span-4 flex flex-col gap-6">
            
            <div className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden`}>
              <div className={`absolute top-0 left-0 w-1 h-full ${theme.bg}`}></div>
              <div className="flex items-center gap-3 mb-2">
                <BellRing size={18} className={theme.text} />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">System Action</h3>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed font-medium">
                {floodData.statusLevel === 3 ? "Critical danger. Evacuate immediately. Hardware alarms are active." : 
                 floodData.statusLevel === 2 ? "High water detected. Prepare for possible evacuation." :
                 floodData.statusLevel === 1 ? "Water levels rising. Monitor the situation closely." :
                 "Sensors detect normal levels. No immediate action required."}
              </p>
            </div>

            <div className="flex-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 shadow-2xl flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Clock size={16} className="text-slate-400" /> Event Log
                </h3>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3 max-h-[200px] md:max-h-[300px]">
                <AnimatePresence>
                  {history.length > 0 ? history.map((item, i) => {
                    const st = getTheme(item.statusLevel);
                    return (
                      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} key={i} className="group flex items-center justify-between p-3 rounded-xl bg-black/20 hover:bg-white/5 border border-white/5 transition-all duration-300">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${st.bg} ${st.glow}`}></div>
                          <div>
                            <p className="text-lg font-black text-white">{item.waterLevel}<span className="text-[10px] text-slate-500 ml-1">cm</span></p>
                            <p className={`text-[9px] font-bold uppercase tracking-widest ${st.text}`}>{st.label}</p>
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
                    <div className="h-full flex flex-col items-center justify-center text-slate-600">
                      <p className="text-xs font-bold uppercase tracking-widest">Awaiting Data</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, Activity, BellRing, Clock, CalendarDays, Droplets } from 'lucide-react';

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
  const fillPercentage = Math.min((floodData.waterLevel / 16) * 100, 100);

  return (
    <div className={`min-h-screen bg-[#0a0a0a] text-slate-200 font-sans selection:bg-white/20 transition-colors duration-1000 bg-gradient-to-br ${theme.gradient} flex items-center justify-center p-4 md:p-8`}>
      
      <div className="w-full max-w-5xl flex flex-col gap-6">
        
        {/* --- NAVBAR --- */}
        <header className="flex justify-between items-center bg-black/40 backdrop-blur-2xl border border-white/5 rounded-3xl p-4 md:px-6 shadow-2xl">
          <div className="flex items-center gap-5">
            <div className="relative group p-0.5 rounded-full bg-white/5 border border-white/10 shadow-inner overflow-hidden">
              <div className={`absolute -inset-1 rounded-full blur-md opacity-70 transition-all duration-1000 ${theme.bg}`}></div>
              <img 
                src="http://googleusercontent.com/image_generation_content/1
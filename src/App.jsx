import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, Clock, Droplets } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [floodData, setFloodData] = useState({
    waterLevel: 0, statusLevel: 0, date: "Waiting...", time: "Waiting..."
  });
  const [history, setHistory] = useState([]);

  // Replace this with your ACTUAL production URL
  const API_URL = 'https://flood-monitor-seven.vercel.app/api/flood';

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
    const interval = setInterval(fetchData, 2000); // Refresh every 2 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatus = (level) => {
    const states = {
      3: { text: "EVACUATE", color: "bg-purple-100", textColor: "text-purple-700", border: "border-purple-200", icon: AlertTriangle },
      2: { text: "Alert", color: "bg-orange-100", textColor: "text-orange-700", border: "border-orange-200", icon: AlertTriangle },
      1: { text: "Warning", color: "bg-yellow-100", textColor: "text-yellow-700", border: "border-yellow-200", icon: AlertTriangle },
      0: { text: "Normal", color: "bg-blue-100", textColor: "text-blue-700", border: "border-blue-200", icon: CheckCircle }
    };
    return states[level] || states[0];
  };

  const s = getStatus(floodData.statusLevel);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 flex items-center justify-center font-sans">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="p-8 text-center bg-white">
          <div className="flex justify-center mb-2">
            <Droplets className="text-blue-500 animate-bounce" size={28} />
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">FLOOD MONITOR</h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Group 5 Live Feed</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1.5 bg-slate-100 mx-8 rounded-2xl mb-6">
          <button onClick={() => setActiveTab('dashboard')} className={`flex-1 py-2.5 rounded-xl transition-all text-sm font-black ${activeTab === 'dashboard' ? 'bg-white shadow-md text-slate-800' : 'text-slate-400'}`}>LIVE</button>
          <button onClick={() => setActiveTab('history')} className={`flex-1 py-2.5 rounded-xl transition-all text-sm font-black ${activeTab === 'history' ? 'bg-white shadow-md text-slate-800' : 'text-slate-400'}`}>HISTORY</button>
        </div>

        <div className="px-8 pb-10">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' ? (
              <motion.div key="live" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                <div className={`rounded-[2rem] p-10 text-center border-2 transition-colors duration-500 ${s.color} ${s.border} ${s.textColor}`}>
                  <s.icon size={56} className="mx-auto mb-4" />
                  <h2 className="text-5xl font-black tracking-tighter">{s.text}</h2>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <span className="text-2xl font-bold">{floodData.waterLevel} cm</span>
                  </div>
                  <div className="mt-8 pt-6 border-t border-black/5 flex items-center justify-center gap-2 opacity-60">
                    <Clock size={14} />
                    <p className="text-[10px] font-black uppercase tracking-wider">{floodData.time}</p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="hist" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {history.length > 0 ? history.map((item, i) => (
                  <div key={i} className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center border border-slate-100">
                    <div>
                      <p className={`text-[10px] font-black uppercase ${getStatus(item.statusLevel).textColor}`}>{getStatus(item.statusLevel).text}</p>
                      <p className="text-xl font-extrabold text-slate-700">{item.waterLevel} cm</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{item.time}</p>
                      <p className="text-[9px] text-slate-300">{item.date}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-center text-slate-400 py-10 font-bold">No history recorded yet.</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
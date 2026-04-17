import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, History, LayoutDashboard, AlertTriangle, CheckCircle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [floodData, setFloodData] = useState({
    waterLevel: 0, statusLevel: 0, date: "Loading...", time: "Loading..."
  });
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/flood', { cache: 'no-store' });
        const data = await response.json();
        if (data.latest) setFloodData(data.latest);
        if (data.history) setHistory(data.history);
      } catch (e) { 
        console.error("Sync Error - Waiting for connection..."); 
      }
    };
    
    fetchData(); // Fetch immediately on load
    const interval = setInterval(fetchData, 2000); // Check every 2 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatus = (level) => {
    if (level === 3) return { text: "EVACUATE", color: "bg-[#F3E8FF]", textColor: "text-[#6B4C9A]", icon: AlertTriangle };
    if (level === 2) return { text: "Alert", color: "bg-[#FFE5D9]", textColor: "text-[#9D5C43]", icon: AlertTriangle };
    if (level === 1) return { text: "Warning", color: "bg-[#FEFAE0]", textColor: "text-[#8A793A]", icon: AlertTriangle };
    return { text: "Normal", color: "bg-[#E0F4FF]", textColor: "text-[#3A7292]", icon: CheckCircle };
  };

  const s = getStatus(floodData.statusLevel);

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        <div className="p-8 text-center border-b border-slate-50">
          <h1 className="text-2xl font-bold text-slate-700">Flood Monitor</h1>
          <p className="text-slate-400 text-sm">Group 5 Live Feed</p>
        </div>

        <div className="flex p-2 bg-slate-50 mx-8 mt-6 rounded-2xl">
          <button onClick={() => setActiveTab('dashboard')} className={`flex-1 py-2 rounded-xl transition-all font-bold ${activeTab === 'dashboard' ? 'bg-white shadow-sm text-slate-800' : 'opacity-40 text-slate-600'}`}>Live</button>
          <button onClick={() => setActiveTab('history')} className={`flex-1 py-2 rounded-xl transition-all font-bold ${activeTab === 'history' ? 'bg-white shadow-sm text-slate-800' : 'opacity-40 text-slate-600'}`}>History</button>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' ? (
              <motion.div key="dashboard" initial={{y:10, opacity:0}} animate={{y:0, opacity:1}} exit={{y:-10, opacity:0}} className={`p-8 rounded-3xl text-center ${s.color} ${s.textColor}`}>
                <s.icon size={48} className="mx-auto mb-4" />
                <h2 className="text-4xl font-black">{s.text}</h2>
                <p className="text-xl font-bold mt-2">{floodData.waterLevel} cm</p>
                <p className="mt-4 text-xs opacity-60">Updated: {floodData.time}</p>
              </motion.div>
            ) : (
              <motion.div key="history" initial={{y:10, opacity:0}} animate={{y:0, opacity:1}} exit={{y:-10, opacity:0}} className="space-y-3 max-h-64 overflow-y-auto pr-2">
                {history.length === 0 ? (
                  <p className="text-center text-slate-400 text-sm py-4">No data recorded yet...</p>
                ) : (
                  history.map((item, i) => (
                    <div key={i} className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center border border-slate-100 text-sm">
                      <div>
                        <p className={`font-black uppercase text-[10px] ${getStatus(item.statusLevel).textColor}`}>{getStatus(item.statusLevel).text}</p>
                        <p className="text-lg font-bold text-slate-700">{item.waterLevel} cm</p>
                      </div>
                      <div className="text-right text-[10px] text-slate-400 font-bold">
                        <p>{item.date}</p><p>{item.time}</p>
                      </div>
                    </div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
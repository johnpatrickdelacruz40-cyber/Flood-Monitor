import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, AlertTriangle, CheckCircle, Clock, History, LayoutDashboard } from 'lucide-react';

export default function App() {
const [activeTab, setActiveTab] = useState('dashboard');
const [floodData, setFloodData] = useState({
waterLevel: 0,
statusLevel: 0,
date: "Loading...",
time: "Loading..."
});
const [history, setHistory] = useState([]);

useEffect(() => {
const fetchData = async () => {
try {
const response = await fetch('/api/flood');
const data = await response.json();

    if (data.time !== floodData.time) {
      setFloodData(data);
      setHistory(prev => [{...data, id: Date.now()}, ...prev].slice(0, 20));
    }
  } catch (error) {
    console.log("Error fetching data");
  }
};

const interval = setInterval(fetchData, 2000);
return () => clearInterval(interval);
}, [floodData.time]);

const getStatusInfo = (level) => {
if (level === 3) return { text: "EVACUATE", color: "bg-purple-100", textColor: "text-purple-700", icon: AlertTriangle };
if (level === 2) return { text: "Alert", color: "bg-orange-100", textColor: "text-orange-700", icon: AlertTriangle };
if (level === 1) return { text: "Warning", color: "bg-yellow-100", textColor: "text-yellow-700", icon: AlertTriangle };
return { text: "Normal", color: "bg-green-100", textColor: "text-green-700", icon: CheckCircle };
};

const status = getStatusInfo(floodData.statusLevel);

return (
<div className="min-h-screen bg-slate-50 text-slate-800 p-6 font-sans">
<div className="max-w-md mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">

    <div className="p-8 text-center bg-white border-b border-slate-50">
      <h1 className="text-2xl font-bold text-slate-700">Flood Monitor</h1>
      <p className="text-slate-400 text-sm">Group 5 Live Feed</p>
    </div>

    <div className="flex p-2 bg-slate-50 mx-8 mt-6 rounded-2xl">
      <button 
        onClick={() => setActiveTab('dashboard')}
        className={`flex-1 flex items-center justify-center py-2 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}
      >
        <LayoutDashboard size={18} className="mr-2" />
        <span className="text-sm font-semibold">Live</span>
      </button>
      <button 
        onClick={() => setActiveTab('history')}
        className={`flex-1 flex items-center justify-center py-2 rounded-xl transition-all ${activeTab === 'history' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}
      >
        <History size={18} className="mr-2" />
        <span className="text-sm font-semibold">History</span>
      </button>
    </div>

    <div className="p-8">
      <AnimatePresence mode="wait">
        {activeTab === 'dashboard' ? (
          <motion.div 
            key="dash"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-8 rounded-3xl flex flex-col items-center justify-center ${status.color} ${status.textColor}`}
          >
            <status.icon size={50} className="mb-4" />
            <h2 className="text-4xl font-black mb-1">{status.text}</h2>
            <p className="text-xl font-bold">{floodData.waterLevel} cm</p>
            <div className="mt-6 flex items-center space-x-2 text-xs font-medium opacity-70">
              <Clock size={14} />
              <span>Updated: {floodData.time}</span>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="hist"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3 max-h-64 overflow-y-auto pr-2"
          >
            {history.map(item => {
              const itemStatus = getStatusInfo(item.statusLevel);
              return (
                <div key={item.id} className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between border border-slate-100">
                  <div>
                    <p className={`text-xs font-black uppercase ${itemStatus.textColor}`}>{itemStatus.text}</p>
                    <p className="text-lg font-bold text-slate-700">{item.waterLevel} cm</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-bold">{item.date}</p>
                    <p className="text-[10px] text-slate-400 font-bold">{item.time}</p>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </div>
</div>
);
}
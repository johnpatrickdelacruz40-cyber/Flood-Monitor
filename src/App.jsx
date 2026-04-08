import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, Activity, Wifi, Clock } from 'lucide-react';

export default function App() {
  const [waterLevel, setWaterLevel] = useState(0);
  const [lastUpdate, setLastUpdate] = useState("Waiting for sensor...");
  const [isOnline, setIsOnline] = useState(false);

  // Fetch data from your API
  const fetchData = async () => {
    try {
      const response = await fetch('/api/flood');
      const data = await response.json();
      
      if (data && data.latest) {
        setWaterLevel(data.latest.level || 0);
        
        // Format the time nicely
        const date = new Date(data.latest.timestamp);
        setLastUpdate(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        setIsOnline(true);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setIsOnline(false);
    }
  };

  useEffect(() => {
    fetchData(); // Fetch immediately
    const interval = setInterval(fetchData, 5000); // Auto-refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // Determine the color of the water based on danger level
  const getWaterColor = (level) => {
    if (level < 50) return "bg-blue-400"; // Safe
    if (level < 80) return "bg-amber-400"; // Warning
    return "bg-red-500"; // Danger
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] shadow-xl p-8 w-full max-w-md border border-slate-100"
      >
        {/* Header Section */}
        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-2xl text-blue-600">
              <Droplets size={28} strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Flood Monitor</h1>
          </div>
          
          {/* Status Indicator */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
            isOnline ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
          }`}>
            <Wifi size={16} />
            {isOnline ? "Live" : "Offline"}
          </div>
        </div>

        {/* The Digital Water Tank */}
        <div className="relative h-80 w-32 mx-auto bg-slate-100 rounded-full border-4 border-white shadow-inner overflow-hidden mb-10 flex items-end">
          <AnimatePresence>
            <motion.div
              key="water-level"
              initial={{ height: "0%" }}
              animate={{ height: `${waterLevel}%` }}
              transition={{ type: "spring", bounce: 0.2, duration: 1.5 }}
              className={`w-full rounded-full ${getWaterColor(waterLevel)} relative`}
            >
              {/* Little wave effect at the top of the water */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-white/20 rounded-t-full"></div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Stats Footer */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 rounded-3xl p-5 flex flex-col items-center justify-center border border-slate-100">
            <Activity className="text-slate-400 mb-2" size={20} />
            <span className="text-sm font-medium text-slate-500 mb-1">Current Level</span>
            <span className="text-3xl font-bold text-slate-800">{waterLevel}%</span>
          </div>

          <div className="bg-slate-50 rounded-3xl p-5 flex flex-col items-center justify-center border border-slate-100">
            <Clock className="text-slate-400 mb-2" size={20} />
            <span className="text-sm font-medium text-slate-500 mb-1">Last Updated</span>
            <span className="text-lg font-bold text-slate-800 text-center">{lastUpdate}</span>
          </div>
        </div>

      </motion.div>
    </div>
  );
}
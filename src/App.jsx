import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, AlertTriangle, CheckCircle, Clock, History, LayoutDashboard } from 'lucide-react';

export default function App() {
const [activeTab, setActiveTab] = useState('dashboard');
const [machineStatus, setMachineStatus] = useState("Online");
const [toast, setToast] = useState(null);

const [floodData, setFloodData] = useState({
waterLevel: 0,
statusLevel: 0,
date: "Waiting...",
time: "Waiting..."
});

const [history, setHistory] = useState([]);

let statusText = "Normal";
let statusColor = "bg-[#E0F4FF]";
let statusTextColor = "text-[#3A7292]";
let StatusIcon = CheckCircle;

if (floodData.statusLevel === 1) {
statusText = "Warning";
statusColor = "bg-[#FEFAE0]";
statusTextColor = "text-[#8A793A]";
StatusIcon = AlertTriangle;
} else if (floodData.statusLevel === 2) {
statusText = "Alert";
statusColor = "bg-[#FFE5D9]";
statusTextColor = "text-[#9D5C43]";
StatusIcon = AlertTriangle;
} else if (floodData.statusLevel === 3) {
statusText = "EVACUATE";
statusColor = "bg-[#F3E8FF]";
statusTextColor = "text-[#6B4C9A]";
StatusIcon = AlertTriangle;
}

return (
<div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-6">
<div className="max-w-md mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">

    <div className="p-8 text-center">
      <h1 className="text-2xl font-bold text-slate-700 mb-2">Flood Monitor</h1>
      <p className="text-slate-500">Group 5 Dashboard</p>
    </div>

    <div className="px-8 pb-8">
      <div className={`p-6 rounded-2xl flex flex-col items-center justify-center transition-colors duration-500 ${statusColor} ${statusTextColor}`}>
        <StatusIcon size={48} className="mb-4" />
        <h2 className="text-3xl font-black mb-1">{statusText}</h2>
        <p className="text-lg font-medium">Water Level: {floodData.waterLevel} cm</p>
        <div className="mt-4 flex items-center space-x-2 text-sm opacity-80">
          <Clock size={16} />
          <span>{floodData.date} | {floodData.time}</span>
        </div>
      </div>
    </div>

  </div>
</div>
);
}
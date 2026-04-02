import React, { useState, useEffect } from 'react';
import mqtt from 'mqtt';
import { Pill, Bell, Activity, Wifi } from 'lucide-react';

export default function App() {
  const [client, setClient] = useState(null);
  const [status, setStatus] = useState("Connecting to Cloud...");

  useEffect(() => {
    // Connect to the Public MQTT Broker
    const mqttClient = mqtt.connect('wss://broker.emqx.io:8084/mqtt');

    mqttClient.on('connect', () => {
      setClient(mqttClient);
      setStatus("Cloud System Online");
    });

    mqttClient.on('error', (err) => {
      setStatus("Cloud Error: " + err.message);
      mqttClient.end();
    });

    return () => mqttClient.end();
  }, []);

  const publishCommand = (cmd) => {
    if (client) {
      const payload = JSON.stringify({ command: cmd });
      client.publish('cozy/dispenser/commands', payload);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6 font-sans text-[#4A4A4A]">
      <div className="bg-white p-12 rounded-[3rem] shadow-2xl w-full max-w-md text-center border-2 border-[#8B9A8B20]">
        <div className="bg-[#8B9A8B15] w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 text-[#8B9A8B]">
          <Pill size={48} />
        </div>
        
        <h1 className="text-3xl font-bold mb-2">Smart Apothecary</h1>
        <div className="flex items-center justify-center gap-2 mb-10">
          <span className={`w-3 h-3 rounded-full ${client ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
          <p className="text-sm font-medium text-gray-400">{status}</p>
        </div>

        <div className="space-y-4">
          <button 
            onClick={() => publishCommand('drop')}
            className="w-full bg-[#8B9A8B] text-white py-5 rounded-[2rem] font-bold text-lg shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <Activity size={20} /> Drop Medication
          </button>

          <button 
            onClick={() => publishCommand('force_buzz')}
            className="w-full bg-[#E3A88D] text-white py-5 rounded-[2rem] font-bold text-lg shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <Bell size={20} /> Remote Nudge
          </button>
        </div>

        <p className="mt-10 text-xs text-gray-300 tracking-widest uppercase">Powered by MQTT Cloud Architecture</p>
      </div>
    </div>
  );
}
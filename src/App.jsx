import React, { useState, useEffect } from 'react';
import mqtt from 'mqtt';
import { Pill, Bell, Heart } from 'lucide-react';

export default function App() {
const [client, setClient] = useState(null);
const [status, setStatus] = useState("Waking up system...");

useEffect(() => {
const mqttClient = mqtt.connect('wss://broker.emqx.io:8084/mqtt');
mqttClient.on('connect', () => {
setClient(mqttClient);
setStatus("Connected to Apothecary Cloud");
});
return () => mqttClient.end();
}, []);

const trigger = (cmd) => {
if (client) {
const payload = JSON.stringify({ command: cmd });
client.publish('cozy/dispenser/commands', payload);
}
};

return (
<div className="min-h-screen bg-[#F5F0EA] flex flex-col items-center justify-center p-6 text-[#5C4A3D] font-sans">
<div className="bg-white p-12 rounded-[2rem] shadow-xl w-full max-w-md border-4 border-[#E8DFD5]">
<div className="bg-[#E8DFD5] w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-[#8BA888]">
<Heart size={48} />
</div>
<h1 className="text-3xl font-bold mb-2 text-center">My Apothecary</h1>
<p className="text-center text-sm font-medium text-[#A89F91] mb-8">{status}</p>

    <button onClick={() => trigger('drop')} className="w-full bg-[#8BA888] text-white py-5 rounded-[1.5rem] font-bold text-lg mb-4 flex items-center justify-center gap-3 shadow-md hover:bg-[#7A9677] transition-colors">
      <Pill size={24} /> Dispense Medicine
    </button>
    
    <button onClick={() => trigger('force_buzz')} className="w-full bg-[#D4A373] text-white py-5 rounded-[1.5rem] font-bold text-lg flex items-center justify-center gap-3 shadow-md hover:bg-[#C39262] transition-colors">
      <Bell size={24} /> Sound Chime
    </button>
  </div>
</div>
);
}
import React, { useState, useEffect } from 'react';
import mqtt from 'mqtt';

export default function App() {
const [client, setClient] = useState(null);
const [connectionState, setConnectionState] = useState("Connecting to Cloud...");
const [machineStatus, setMachineStatus] = useState("Standby");

const [schedules, setSchedules] = useState(() => {
const saved = localStorage.getItem("medSchedules");
if (saved) {
return JSON.parse(saved);
}
return [];
});

const [slot, setSlot] = useState("Morning Meds");
const [pillName, setPillName] = useState("");
const [time, setTime] = useState("08:00");
const [side, setSide] = useState("left");

useEffect(() => {
localStorage.setItem("medSchedules", JSON.stringify(schedules));
}, [schedules]);

useEffect(() => {
const mqttClient = mqtt.connect('wss://broker.emqx.io:8084/mqtt');

mqttClient.on('connect', () => {
  setClient(mqttClient);
  setConnectionState("Cloud Connected");
  mqttClient.subscribe('cozy/dispenser/status');
});

mqttClient.on('message', (topic, message) => {
  if (topic === 'cozy/dispenser/status') {
    try {
      const data = JSON.parse(message.toString());
      setMachineStatus(data.status);
    } catch (e) {
      console.error("Parse error");
    }
  }
});

return () => mqttClient.end();
}, []);

const addSchedule = () => {
if (!pillName) return;
const newSchedule = {
id: Date.now(),
slot: slot,
pillName: pillName,
time: time,
side: side
};
setSchedules([...schedules, newSchedule]);
setPillName("");
};

const deleteSchedule = (id) => {
setSchedules(schedules.filter(s => s.id !== id));
};

const syncToMachine = (schedule) => {
if (client) {
const payload = JSON.stringify({
command: "update_schedule",
time: schedule.time + ":00",
slot: schedule.slot,
pillName: schedule.pillName,
side: schedule.side
});
client.publish('cozy/dispenser/commands', payload);
}
};

const triggerOverride = () => {
if (client) {
const payload = JSON.stringify({ command: "remote_override" });
client.publish('cozy/dispenser/commands', payload);
}
};

return (
<div style={{ minHeight: '100vh', backgroundColor: '#F5F0EA', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px', color: '#5C4A3D', fontFamily: 'sans-serif' }}>

  <div style={{ backgroundColor: '#FFFFFF', padding: '32px', borderRadius: '32px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', width: '100%', maxWidth: '600px', border: '4px solid #E8DFD5', marginBottom: '24px' }}>
    <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px', textAlign: 'center' }}>My Apothecary</h1>
    <p style={{ textAlign: 'center', fontSize: '14px', color: '#8BA888', marginBottom: '24px', fontWeight: 'bold' }}>{connectionState}</p>

    <div style={{ backgroundColor: '#E8DFD5', padding: '20px', borderRadius: '16px', marginBottom: '32px', textAlign: 'center' }}>
      <p style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '2px', color: '#A89F91', marginBottom: '8px' }}>Hardware Status</p>
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#5C4A3D' }}>{machineStatus}</h2>
      <button onClick={triggerOverride} style={{ marginTop: '16px', backgroundColor: '#D4A373', color: '#FFFFFF', padding: '12px 24px', borderRadius: '16px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>
        Force Override Drop
      </button>
    </div>

    <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Add New Medication</h3>
    <div style={{ display: 'grid', gap: '16px', marginBottom: '24px' }}>
      <select value={slot} onChange={e => setSlot(e.target.value)} style={{ padding: '16px', backgroundColor: '#F5F0EA', borderRadius: '12px', border: 'none', appearance: 'none' }}>
        <option value="Morning Meds">Morning Meds</option>
        <option value="Afternoon Meds">Afternoon Meds</option>
        <option value="Night Meds">Night Meds</option>
      </select>
      
      <input placeholder="Pill Name (e.g. Aspirin)" value={pillName} onChange={e => setPillName(e.target.value)} style={{ padding: '16px', backgroundColor: '#F5F0EA', borderRadius: '12px', border: 'none' }} />
      
      <input type="time" value={time} onChange={e => setTime(e.target.value)} style={{ padding: '16px', backgroundColor: '#F5F0EA', borderRadius: '12px', border: 'none' }} />
      
      <select value={side} onChange={e => setSide(e.target.value)} style={{ padding: '16px', backgroundColor: '#F5F0EA', borderRadius: '12px', border: 'none', appearance: 'none' }}>
        <option value="left">Left Tray (Clockwise)</option>
        <option value="right">Right Tray (Counter-Clockwise)</option>
      </select>

      <button onClick={addSchedule} style={{ backgroundColor: '#8BA888', color: '#FFFFFF', padding: '16px', borderRadius: '16px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>
        Save to List
      </button>
    </div>
  </div>

  <div style={{ backgroundColor: '#FFFFFF', padding: '32px', borderRadius: '32px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', width: '100%', maxWidth: '600px', border: '4px solid #E8DFD5' }}>
    <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Pending Medications</h3>
    
    {schedules.length === 0 && <p style={{ color: '#A89F91', textAlign: 'center' }}>No medications in your list yet.</p>}
    
    {schedules.map(s => (
      <div key={s.id} style={{ backgroundColor: '#F5F0EA', padding: '16px', borderRadius: '16px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ fontWeight: 'bold', margin: '0 0 4px 0' }}>{s.pillName}</p>
          <p style={{ fontSize: '12px', color: '#A89F91', margin: '0' }}>{s.slot} at {s.time}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => syncToMachine(s)} style={{ backgroundColor: '#8BA888', color: '#FFFFFF', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Sync Next</button>
          <button onClick={() => deleteSchedule(s.id)} style={{ backgroundColor: '#D4A373', color: '#FFFFFF', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Del</button>
        </div>
      </div>
    ))}
  </div>

</div>
);
}
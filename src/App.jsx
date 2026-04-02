import React, { useState, useEffect } from 'react';
import mqtt from 'mqtt';

export default function App() {
const [client, setClient] = useState(null);
const [connectionState, setConnectionState] = useState("Connecting to Cloud...");
const [machineStatus, setMachineStatus] = useState("Standby");

const [pillName, setPillName] = useState("Morning Meds");
const [time, setTime] = useState("08:00");
const [side, setSide] = useState("left");

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

const syncSchedule = () => {
if (client) {
const payload = JSON.stringify({
command: "update_schedule",
time: time + ":00",
slot: "SCHEDULED MEDS",
pillName: pillName,
side: side
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
<div style={{ minHeight: '100vh', backgroundColor: '#F5F0EA', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', color: '#5C4A3D', fontFamily: 'sans-serif' }}>
<div style={{ backgroundColor: '#FFFFFF', padding: '48px', borderRadius: '32px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', width: '100%', maxWidth: '500px', border: '4px solid #E8DFD5' }}>

    <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px', textAlign: 'center' }}>My Apothecary</h1>
    <p style={{ textAlign: 'center', fontSize: '14px', color: '#8BA888', marginBottom: '24px', fontWeight: 'bold' }}>{connectionState}</p>

    <div style={{ backgroundColor: '#E8DFD5', padding: '20px', borderRadius: '16px', marginBottom: '32px', textAlign: 'center' }}>
      <p style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '2px', color: '#A89F91', marginBottom: '8px' }}>Hardware Status</p>
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#5C4A3D' }}>{machineStatus}</h2>
    </div>
    
    <div style={{ marginBottom: '24px' }}>
      <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#A89F91', textTransform: 'uppercase' }}>Medication Name</label>
      <input value={pillName} onChange={e => setPillName(e.target.value)} style={{ width: '100%', padding: '16px', backgroundColor: '#F5F0EA', borderRadius: '12px', border: 'none', marginBottom: '16px', marginTop: '8px' }} />
      
      <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#A89F91', textTransform: 'uppercase' }}>Time to Drop</label>
      <input type="time" value={time} onChange={e => setTime(e.target.value)} style={{ width: '100%', padding: '16px', backgroundColor: '#F5F0EA', borderRadius: '12px', border: 'none', marginBottom: '16px', marginTop: '8px' }} />
      
      <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#A89F91', textTransform: 'uppercase' }}>Motor Rotation Side</label>
      <select value={side} onChange={e => setSide(e.target.value)} style={{ width: '100%', padding: '16px', backgroundColor: '#F5F0EA', borderRadius: '12px', border: 'none', marginTop: '8px', appearance: 'none' }}>
        <option value="left">First Meds (Clockwise)</option>
        <option value="right">Second Meds (Counter-Clockwise)</option>
      </select>
    </div>

    <button onClick={syncSchedule} style={{ width: '100%', backgroundColor: '#8BA888', color: '#FFFFFF', padding: '20px', borderRadius: '24px', fontWeight: 'bold', fontSize: '16px', border: 'none', marginBottom: '16px', cursor: 'pointer' }}>
      Sync Schedule
    </button>
    
    <button onClick={triggerOverride} style={{ width: '100%', backgroundColor: '#D4A373', color: '#FFFFFF', padding: '20px', borderRadius: '24px', fontWeight: 'bold', fontSize: '16px', border: 'none', cursor: 'pointer' }}>
      Force Override Alarm
    </button>
    
  </div>
</div>
);
}
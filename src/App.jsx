#include <Arduino.h>
#include <WiFi.h>
#include <time.h>
#include <LiquidCrystal.h>
#include <LiquidCrystal_I2C.h>
#include <ESP32Servo.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

#define LED_RED 25
#define BUZZER_PIN 26
#define LED_BLUE 27
#define LED_GREEN 13
#define BUTTON_PIN 14
#define SERVO_PIN 15

LiquidCrystal lcd_main(19, 18, 17, 16, 4, 2);
LiquidCrystal_I2C lcd_title(0x27, 16, 2);
Servo dispenserServo;
WiFiClient espClient;
PubSubClient client(espClient);

const char* ssid = "TALIA";
const char* password = "123456789";
const char* mqtt_server = "broker.emqx.io";
const char* command_topic = "cozy/dispenser/commands";
const char* status_topic = "cozy/dispenser/status";

String scheduledTime = "08:00:00";
String pillName = "No Meds Set";
String scheduleSlot = "STANDBY";
String dropSide = "left";

bool manualNudgeActive = false;
bool alarmActive = false;
bool medsTakenForThisMinute = false;

void callback(char* topic, byte* payload, unsigned int length) {
StaticJsonDocument<500> doc;
deserializeJson(doc, payload, length);

const char* command = doc["command"];

if (strcmp(command, "remote_override") == 0) {
manualNudgeActive = true;
medsTakenForThisMinute = false;
if (doc["side"]) {
dropSide = doc["side"].as<String>();
}
client.publish(status_topic, R"({"status":"Waiting for Patient..."})");
}

if (strcmp(command, "update_schedule") == 0) {
scheduledTime = doc["time"].as<String>();
pillName = doc["pillName"].as<String>();
scheduleSlot = doc["slot"].as<String>();
dropSide = doc["side"].as<String>();
client.publish(status_topic, R"({"status":"Schedule Synced"})");
medsTakenForThisMinute = false;
}
}

void reconnect() {
while (!client.connected()) {
if (client.connect("ESP32_Dispenser_Cloud_ID")) {
client.subscribe(command_topic);
client.publish(status_topic, R"({"status":"Hardware Online"})");
} else {
delay(5000);
}
}
}

void setup() {
Serial.begin(115200);
pinMode(BUZZER_PIN, OUTPUT);
pinMode(LED_RED, OUTPUT);
pinMode(LED_GREEN, OUTPUT);
pinMode(LED_BLUE, OUTPUT);
pinMode(BUTTON_PIN, INPUT_PULLUP);

dispenserServo.attach(SERVO_PIN);
dispenserServo.write(90);

lcd_title.init();
lcd_title.backlight();
lcd_title.setCursor(0,0);
lcd_title.print(" SMART DISPENSER");

lcd_main.begin(20, 4);
lcd_main.setCursor(0,0);
lcd_main.print("Connecting Wi-Fi...");

WiFi.begin(ssid, password);
while (WiFi.status() != WL_CONNECTED) {
delay(500);
}

configTime(28800, 0, "pool.ntp.org");
client.setServer(mqtt_server, 1883);
client.setCallback(callback);
lcd_main.clear();
}

void loop() {
if (!client.connected()) reconnect();
client.loop();

struct tm timeinfo;
if(!getLocalTime(&timeinfo)) return;

char t[9];
strftime(t, 9, "%H:%M:%S", &timeinfo);
String currentTime = String(t);

time_t now;
time(&now);
time_t pre_now = now + 60;
struct tm pre_ti;
localtime_r(&pre_now, &pre_ti);
char pt[9];
strftime(pt, 9, "%H:%M:%S", &pre_ti);
String preAlarmTime = String(pt);

bool isPreAlarm = (preAlarmTime == scheduledTime && timeinfo.tm_sec < 10);

if (isPreAlarm && !medsTakenForThisMinute) {
if (timeinfo.tm_sec % 2 == 0) {
digitalWrite(BUZZER_PIN, HIGH);
} else {
digitalWrite(BUZZER_PIN, LOW);
}
}

if (currentTime == scheduledTime && !medsTakenForThisMinute) {
alarmActive = true;
client.publish(status_topic, R"({"status":"Alarm Ringing!"})");
}

if (alarmActive || manualNudgeActive) {
if (timeinfo.tm_sec % 2 == 0) {
digitalWrite(BUZZER_PIN, HIGH);
digitalWrite(LED_RED, HIGH);
} else {
digitalWrite(BUZZER_PIN, LOW);
digitalWrite(LED_RED, LOW);
}

if (alarmActive && timeinfo.tm_sec == 59) {
  alarmActive = false;
  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(LED_RED, LOW);
  client.publish(status_topic, R"({"status":"Missed Medication"})");
}
} else if (!medsTakenForThisMinute) {
digitalWrite(LED_BLUE, HIGH);
} else {
digitalWrite(LED_BLUE, LOW);
}

if (digitalRead(BUTTON_PIN) == LOW && (alarmActive || manualNudgeActive)) {
if (dropSide == "left") {
dispenserServo.write(180);
} else {
dispenserServo.write(0);
}
delay(1000);
dispenserServo.write(90);

alarmActive = false;
manualNudgeActive = false;
medsTakenForThisMinute = true;

digitalWrite(BUZZER_PIN, LOW);
digitalWrite(LED_RED, LOW);
digitalWrite(LED_GREEN, HIGH);
delay(2000);
digitalWrite(LED_GREEN, LOW);

client.publish(status_topic, R"({"status":"Medication Taken"})");
}

lcd_main.setCursor(0, 0);
String displaySlot = scheduleSlot + "                    ";
lcd_main.print(displaySlot.substring(0, 20));

lcd_main.setCursor(0, 1);
String displayMed = "MED: " + pillName + "                    ";
lcd_main.print(displayMed.substring(0, 20));

lcd_main.setCursor(0, 2);
String displayTarget = "DRINK AT: " + scheduledTime + "          ";
lcd_main.print(displayTarget.substring(0, 20));

lcd_main.setCursor(0, 3);
String displayNow = "NOW: " + currentTime + "               ";
lcd_main.print(displayNow.substring(0, 20));

if (currentTime == "00:00:00") medsTakenForThisMinute = false;
}

FULL DASHBOARD CODE APP.JSX

import React, { useState, useEffect } from 'react';
import mqtt from 'mqtt';
import { motion, AnimatePresence } from 'framer-motion';
import { Pill, Clock, LayoutDashboard, History, Bell, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

const PILL_COLORS = [
{ name: 'Sage', bg: 'bg-[#E3EFE0]', text: 'text-[#4A6741]' },
{ name: 'Peach', bg: 'bg-[#FFE5D9]', text: 'text-[#9D5C43]' },
{ name: 'Lavender', bg: 'bg-[#F3E8FF]', text: 'text-[#6B4C9A]' },
{ name: 'Butter', bg: 'bg-[#FEFAE0]', text: 'text-[#8A793A]' },
{ name: 'Sky', bg: 'bg-[#E0F4FF]', text: 'text-[#3A7292]' },
];

export default function App() {
const [activeTab, setActiveTab] = useState('home');
const [client, setClient] = useState(null);
const [machineStatus, setMachineStatus] = useState("Waking up...");
const [toast, setToast] = useState(null);

const [inventory, setInventory] = useState(() => JSON.parse(localStorage.getItem('medInventory')) || []);
const [schedules, setSchedules] = useState(() => JSON.parse(localStorage.getItem('medSchedules')) || []);
const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem('medHistory')) || []);

const [newMed, setNewMed] = useState({ name: '', color: PILL_COLORS[0], side: 'left' });
const [newTime, setNewTime] = useState('08:00');
const [selectedMedId, setSelectedMedId] = useState('');

useEffect(() => {
localStorage.setItem('medInventory', JSON.stringify(inventory));
localStorage.setItem('medSchedules', JSON.stringify(schedules));
localStorage.setItem('medHistory', JSON.stringify(history));
}, [inventory, schedules, history]);

useEffect(() => {
const mqttClient = mqtt.connect('wss://broker.emqx.io:8084/mqtt');

mqttClient.on('connect', () => {
  setClient(mqttClient);
  showToast("Cloud connection established", "success");
  mqttClient.subscribe('cozy/dispenser/status');
});

mqttClient.on('message', (topic, message) => {
  if (topic === 'cozy/dispenser/status') {
    const data = JSON.parse(message.toString());
    setMachineStatus(data.status);
    
    if (data.status === "Medication Taken") {
      logHistory("Medication dispensed successfully.");
      showToast("Medication Taken!", "success");
    }
    if (data.status === "Missed Medication") {
      logHistory("Missed Dose Alert!");
      showToast("Missed Dose", "error");
    }
  }
});

return () => mqttClient.end();
}, []);

const showToast = (msg, type = "success") => {
setToast({ msg, type });
setTimeout(() => setToast(null), 3000);
};

const logHistory = (action) => {
const newLog = { id: Date.now(), action, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
setHistory(prev => [newLog, ...prev].slice(0, 10));
};

const format12Hour = (time24) => {
const [hours, minutes] = time24.split(':');
const h = parseInt(hours, 10);
const ampm = h >= 12 ? 'PM' : 'AM';
const formattedHours = h % 12 || 12;
return formattedHours + ':' + minutes + ' ' + ampm;
};

const getNextDose = () => {
if (schedules.length === 0) return null;
const now = new Date();
const currentMinutes = now.getHours() * 60 + now.getMinutes();

const sorted = [...schedules].sort((a, b) => a.time.localeCompare(b.time));

for (let s of sorted) {
  const [h, m] = s.time.split(':');
  if (parseInt(h) * 60 + parseInt(m) > currentMinutes) {
    return s;
  }
}
return sorted[0];
};

const addToCabinet = () => {
if (!newMed.name) return showToast("Medicine name required", "error");
setInventory([...inventory, { ...newMed, id: Date.now() }]);
setNewMed({ name: '', color: PILL_COLORS[0], side: 'left' });
showToast("Added to Cabinet", "success");
};

const addSchedule = () => {
if (!selectedMedId) return showToast("Select a medicine first", "error");
const med = inventory.find(m => m.id === parseInt(selectedMedId));

const newSchedule = { id: Date.now(), medId: med.id, time: newTime };
const updated = [...schedules, newSchedule].sort((a, b) => a.time.localeCompare(b.time));
setSchedules(updated);
showToast("Schedule Set", "success");

syncNextToMachine(updated);
};

const syncNextToMachine = (scheds) => {
if (!client || scheds.length === 0) return;
const next = scheds[0];
const med = inventory.find(m => m.id === next.medId);

const payload = JSON.stringify({
  command: "update_schedule",
  time: next.time + ":00",
  slot: "UPCOMING DOSE",
  pillName: med.name,
  side: med.side
});
client.publish('cozy/dispenser/commands', payload);
};

const triggerOverride = (side) => {
if (client) {
client.publish('cozy/dispenser/commands', JSON.stringify({ command: "remote_override", side: side }));
logHistory("Manual override triggered.");
showToast("Manual Drop Activated", "success");
}
};

const nextDose = getNextDose();

return (
<div className="min-h-screen bg-[#FDFBF7] text-[#5C4A3D] font-sans pb-24 overflow-x-hidden">

  <header className="p-6 md:p-8 flex justify-between items-center bg-white shadow-sm sticky top-0 z-10">
    <div className="flex items-center gap-3">
      <div className="bg-[#8BA888] p-2 rounded-xl text-white"><Pill size={24} /></div>
      <h1 className="text-xl md:text-2xl font-bold tracking-tight">Apothecary</h1>
    </div>
    <div className="flex items-center gap-2 px-4 py-2 bg-[#FDFBF7] rounded-full shadow-inner text-sm font-medium">
      <span className={"w-2 h-2 rounded-full " + (client ? 'bg-green-500 animate-pulse' : 'bg-red-500')}></span>
      {client ? 'Online' : 'Offline'}
    </div>
  </header>

  <AnimatePresence>
    {toast && (
      <motion.div 
        initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
        className={"fixed bottom-24 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 z-50 text-white font-medium " + (toast.type === 'error' ? 'bg-[#D47373]' : 'bg-[#8BA888]')}
      >
        {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
        {toast.msg}
      </motion.div>
    )}
  </AnimatePresence>

  <main className="max-w-2xl mx-auto p-6 space-y-8">
    
    {activeTab === 'home' && (
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
        
        <div className="bg-gradient-to-br from-[#8BA888] to-[#6b8569] p-8 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-10 transform translate-x-4 -translate-y-4">
            <Clock size={120} />
          </div>
          <p className="text-sm font-semibold tracking-widest uppercase mb-2 opacity-80">Next Scheduled Dose</p>
          {nextDose ? (
            <div>
              <h2 className="text-4xl font-black mb-2">{format12Hour(nextDose.time)}</h2>
              <p className="text-xl font-medium opacity-90">{inventory.find(m => m.id === nextDose.medId)?.name || 'Unknown'}</p>
            </div>
          ) : (
            <h2 className="text-2xl font-bold">No upcoming doses.</h2>
          )}
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-sm border-2 border-[#E8DFD5] flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="w-full text-center md:text-left">
            <p className="text-xs font-bold text-[#A89F91] uppercase tracking-widest mb-1">Hardware Status</p>
            <p className="text-lg font-bold">{machineStatus}</p>
          </div>
          <div className="flex w-full md:w-auto gap-3">
            <button onClick={() => triggerOverride('left')} className="flex-1 md:flex-none bg-[#D4A373] hover:bg-[#C39262] text-white px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg active:scale-95 text-sm whitespace-nowrap">
              <Bell size={16} /> Drop A
            </button>
            <button onClick={() => triggerOverride('right')} className="flex-1 md:flex-none bg-[#8BA888] hover:bg-[#7A9677] text-white px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg active:scale-95 text-sm whitespace-nowrap">
              <Bell size={16} /> Drop B
            </button>
          </div>
        </div>
      </motion.div>
    )}

    {activeTab === 'cabinet' && (
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
        <h2 className="text-2xl font-bold flex items-center gap-2"><Pill /> Medicine Cabinet</h2>
        
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border-2 border-[#E8DFD5] space-y-4">
          <input 
            placeholder="Medicine Name (e.g. Vitamin C)" value={newMed.name} onChange={e => setNewMed({...newMed, name: e.target.value})}
            className="w-full p-4 bg-[#F5F0EA] rounded-xl outline-none focus:ring-2 focus:ring-[#8BA888] font-medium"
          />
          <div className="grid grid-cols-2 gap-4">
            <select 
              value={newMed.side} onChange={e => setNewMed({...newMed, side: e.target.value})}
              className="w-full p-4 bg-[#F5F0EA] rounded-xl outline-none font-medium appearance-none"
            >
              <option value="left">Compartment A</option>
              <option value="right">Compartment B</option>
            </select>
            
            <div className="flex items-center gap-2 overflow-x-auto p-2 bg-[#F5F0EA] rounded-xl">
              {PILL_COLORS.map(color => (
                <button 
                  key={color.name} onClick={() => setNewMed({...newMed, color})}
                  className={"w-10 h-10 rounded-full " + color.bg + " border-2 transition-all " + (newMed.color.name === color.name ? 'border-[#5C4A3D]' : 'border-transparent')}
                />
              ))}
            </div>
          </div>
          <button onClick={addToCabinet} className="w-full bg-[#8BA888] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform">
            <Plus size={20} /> Add to Cabinet
          </button>
        </div>

        <div className="grid gap-4">
          {inventory.length === 0 ? <p className="text-center text-[#A89F91]">Cabinet is empty.</p> : null}
          {inventory.map(med => (
            <div key={med.id} className="bg-white p-4 rounded-2xl flex justify-between items-center shadow-sm border border-[#E8DFD5]">
              <div className="flex items-center gap-4">
                <div className={"w-12 h-12 rounded-full flex items-center justify-center " + med.color.bg}>
                  <Pill className={med.color.text} size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{med.name}</h3>
                  <p className="text-xs text-[#A89F91] uppercase tracking-wider">
                    {med.side === 'left' ? 'Compartment A' : 'Compartment B'}
                  </p>
                </div>
              </div>
              <button onClick={() => setInventory(inventory.filter(i => i.id !== med.id))} className="p-3 text-red-400 hover:bg-red-50 rounded-xl transition-colors">
                <Trash2 size={20} />
              </button>
            </div>
          ))}
        </div>
      </motion.div>
    )}

    {activeTab === 'schedule' && (
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
        <h2 className="text-2xl font-bold flex items-center gap-2"><Clock /> Schedule Settings</h2>

        <div className="bg-white p-6 rounded-[2rem] shadow-sm border-2 border-[#E8DFD5] space-y-4">
          {inventory.length === 0 ? (
            <p className="text-center text-[#A89F91] py-4">Please add medicine to the Cabinet first.</p>
          ) : (
            <div>
              <select 
                value={selectedMedId} onChange={e => setSelectedMedId(e.target.value)}
                className="w-full p-4 bg-[#F5F0EA] rounded-xl outline-none font-medium appearance-none mb-4"
              >
                <option value="" disabled>Select Medicine...</option>
                {inventory.map(med => <option key={med.id} value={med.id}>{med.name}</option>)}
              </select>
              <input 
                type="time" value={newTime} onChange={e => setNewTime(e.target.value)}
                className="w-full p-4 bg-[#F5F0EA] rounded-xl outline-none font-medium mb-4"
              />
              <button onClick={addSchedule} className="w-full bg-[#8BA888] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform">
                <Plus size={20} /> Set Alarm
              </button>
            </div>
          )}
        </div>

        <div className="grid gap-4">
          {schedules.map(sched => {
            const med = inventory.find(m => m.id === sched.medId) || { name: 'Deleted Med', color: { bg: 'bg-gray-100', text: 'text-gray-400' } };
            return (
              <div key={sched.id} className={"p-4 rounded-2xl flex justify-between items-center shadow-sm border-2 border-white " + med.color.bg}>
                <div>
                  <h3 className={"font-bold text-lg " + med.color.text}>{format12Hour(sched.time)}</h3>
                  <p className={"text-sm font-medium opacity-80 " + med.color.text}>{med.name}</p>
                </div>
                <button onClick={() => setSchedules(schedules.filter(s => s.id !== sched.id))} className={"p-3 opacity-60 hover:opacity-100 transition-opacity " + med.color.text}>
                  <Trash2 size={20} />
                </button>
              </div>
            )
          })}
        </div>
      </motion.div>
    )}

    {activeTab === 'history' && (
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold flex items-center gap-2"><History /> Adherence Log</h2>
          <button onClick={() => setHistory([])} className="text-sm text-[#A89F91] hover:text-red-400">Clear</button>
        </div>
        <div className="bg-white rounded-[2rem] shadow-sm border border-[#E8DFD5] overflow-hidden p-2">
          {history.length === 0 ? <p className="text-center text-[#A89F91] p-6">No history recorded yet.</p> : null}
          {history.map((log, index) => (
            <div key={log.id} className={"p-4 flex justify-between items-center " + (index !== history.length - 1 ? 'border-b border-gray-100' : '')}>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#8BA888]"></div>
                <p className="font-medium text-sm md:text-base">{log.action}</p>
              </div>
              <span className="text-xs font-bold text-[#A89F91]">{log.time}</span>
            </div>
          ))}
        </div>
      </motion.div>
    )}
  </main>

  <nav className="fixed bottom-0 w-full bg-white border-t border-gray-100 pb-safe pt-2 px-6 flex justify-around items-center z-40 h-20 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
    {[
      { id: 'home', icon: LayoutDashboard, label: 'Home' },
      { id: 'cabinet', icon: Pill, label: 'Cabinet' },
      { id: 'schedule', icon: Clock, label: 'Schedule' },
      { id: 'history', icon: History, label: 'Log' }
    ].map(tab => (
      <button 
        key={tab.id} onClick={() => setActiveTab(tab.id)}
        className={"flex flex-col items-center p-2 transition-colors " + (activeTab === tab.id ? 'text-[#8BA888]' : 'text-[#A89F91] hover:text-[#5C4A3D]')}
      >
        <tab.icon size={24} className={activeTab === tab.id ? 'fill-[#8BA888]/20' : ''} />
        <span className="text-[10px] font-bold mt-1 uppercase tracking-wider">{tab.label}</span>
      </button>
    ))}
  </nav>
  
</div>
);
}
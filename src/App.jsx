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
String pillName = "Aspirin 50mg";
String scheduleSlot = "MORNING PILL";
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
client.publish(status_topic, "{"status":"Waiting for Patient..."}");
}

if (strcmp(command, "update_schedule") == 0) {
scheduledTime = doc["time"].as<String>();
pillName = doc["pillName"].as<String>();
scheduleSlot = doc["slot"].as<String>();
dropSide = doc["side"].as<String>();
client.publish(status_topic, "{"status":"Schedule Synced"}");
}
}

void reconnect() {
while (!client.connected()) {
if (client.connect("ESP32_Dispenser_Cloud_ID")) {
client.subscribe(command_topic);
client.publish(status_topic, "{"status":"Hardware Online"}");
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
client.publish(status_topic, "{"status":"Alarm Ringing!"}");
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
  client.publish(status_topic, "{\"status\":\"Missed Medication\"}");
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

client.publish(status_topic, "{\"status\":\"Medication Taken\"}");
}

lcd_main.setCursor(0, 0);
lcd_main.print(scheduleSlot + "        ");
lcd_main.setCursor(0, 1);
lcd_main.print("TIME: " + currentTime + "  ");
lcd_main.setCursor(0, 2);
lcd_main.print(pillName + "        ");

if (currentTime == "00:00:00") medsTakenForThisMinute = false;
}

FULL DASHBOARD CODE APP.JSX

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
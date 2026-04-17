import { NextResponse } from 'next/server';

// Temporary memory to hold the ESP32 data for your presentation
let floodHistory = [];
let latestData = { waterLevel: 0, statusLevel: 0, date: "Waiting...", time: "Waiting..." };

// 1. ESP32 sends data here (POST)
export async function POST(req) {
  try {
    const data = await req.json();
    latestData = data;
    
    // Add new data to the top of the history list
    floodHistory.unshift(data); 
    
    // Keep only the last 10 scans so the app doesn't crash
    if (floodHistory.length > 10) {
      floodHistory.pop(); 
    }
    
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Failed to read ESP32 data" }, { status: 400 });
  }
}

// 2. React App asks for data here (GET)
export async function GET() {
  return NextResponse.json({
    latest: latestData,
    history: floodHistory
  });
}
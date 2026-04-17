// File: api/flood.js

// These variables stay in Vercel's "warm" memory during your presentation
let latestData = { 
  waterLevel: 0, 
  statusLevel: 0, 
  date: "Waiting...", 
  time: "Waiting..." 
};
let floodHistory = [];

export default function handler(req, res) {
  // 1. CORS Headers (Crucial for ESP32 and React connection)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle pre-flight requests from the browser
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 2. RECEIVE DATA (From ESP32)
  if (req.method === 'POST') {
    try {
      const data = req.body;
      
      if (data && typeof data.waterLevel !== 'undefined') {
        latestData = data;
        floodHistory.unshift(data); // Add new data to the top
        
        // Keep history manageable (last 15 readings)
        if (floodHistory.length > 15) floodHistory.pop();
        
        return res.status(200).json({ success: true });
      }
      return res.status(400).json({ error: "Invalid data structure" });
    } catch (err) {
      return res.status(500).json({ error: "Server Error" });
    }
  }

  // 3. SEND DATA (To Dashboard)
  if (req.method === 'GET') {
    return res.status(200).json({
      latest: latestData,
      history: floodHistory
    });
  }
}
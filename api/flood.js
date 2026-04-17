// File: api/flood.js

let floodHistory = [];
let latestData = { waterLevel: 0, statusLevel: 0, date: "Waiting...", time: "Waiting..." };

export default function handler(req, res) {
  // 1. Enable CORS so ESP32 and React don't get blocked
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 2. ESP32 Sends Data (POST)
  if (req.method === 'POST') {
    try {
      let data = req.body;
      
      // If the ESP32 sends it as plain text, parse it safely
      if (typeof data === 'string') {
        data = JSON.parse(data);
      }

      if (data && data.waterLevel !== undefined) {
        latestData = data;
        floodHistory.unshift(data); // Add to top of history
        
        if (floodHistory.length > 10) {
          floodHistory.pop(); // Keep only the last 10 scans
        }
      }
      // Respond with a 200 OK so the ESP32 knows it worked
      return res.status(200).json({ success: true });
      
    } catch (error) {
      // Safety Net: Never crash the server, just return a safe error message
      return res.status(200).json({ error: "Caught bad data", details: error.message });
    }
  }

  // 3. React App Asks for Data (GET)
  if (req.method === 'GET') {
    return res.status(200).json({
      latest: latestData,
      history: floodHistory
    });
  }

  // Fallback
  return res.status(200).json({ message: "API is awake." });
}
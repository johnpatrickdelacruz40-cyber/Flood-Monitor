// File: api/flood.js

let floodHistory = [];
let latestData = { waterLevel: 0, statusLevel: 0, date: "Waiting...", time: "Waiting..." };

module.exports = async function (req, res) {
  try {
    // 1. Enable CORS so React and ESP32 can connect securely
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // 2. ESP32 Sends Data (POST)
    if (req.method === 'POST') {
      let data = req.body;
      
      // Safety net: If Vercel didn't auto-parse the JSON, do it manually
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch (err) {
          return res.status(400).json({ error: "Invalid JSON from ESP32" });
        }
      }
      
      if (data && typeof data.waterLevel !== 'undefined') {
        latestData = data;
        floodHistory.unshift(data); // Add to history
        
        if (floodHistory.length > 10) {
          floodHistory.pop(); // Keep only the latest 10
        }
      }
      return res.status(200).json({ success: true });
    }

    // 3. React App Asks for Data (GET)
    if (req.method === 'GET') {
      return res.status(200).json({
        latest: latestData,
        history: floodHistory
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
    
  } catch (error) {
    // 4. Ultimate Safety Net: Prevent 500 Crash Screen
    return res.status(200).json({ 
      error: "Server caught an error", 
      details: error.message 
    });
  }
};
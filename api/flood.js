let floodHistory = [];
let latestData = { waterLevel: 0, statusLevel: 0, date: "Waiting...", time: "Waiting..." };

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'POST') {
    const data = req.body;
    if (data && data.waterLevel !== undefined) {
      latestData = data;
      floodHistory.unshift(data);
      if (floodHistory.length > 10) floodHistory.pop();
    }
    return res.status(200).json({ success: true });
  }

  return res.status(200).json({ latest: latestData, history: floodHistory });
}
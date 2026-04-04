import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === "POST") {
    try {
      const data = req.body;
      await kv.set("latestFloodData", data);
      await kv.lpush("floodHistory", data);
      await kv.ltrim("floodHistory", 0, 19);
      return res.status(200).json({ success: true });
    } catch (e) { return res.status(500).json({ error: e.message }); }
  } 

  if (req.method === "GET") {
    const latest = await kv.get("latestFloodData");
    const history = await kv.lrange("floodHistory", 0, 19);
    return res.status(200).json({ latest, history });
  }
}
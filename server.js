import express from 'express';
import fetch from 'node-fetch';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(bodyParser.json({ limit: '1mb' }));

// Serve static site for simple local testing
app.use(express.static(path.join(__dirname)));

// Basic in-memory rate-limiter (very small, not for production)
const lastRequestByIp = new Map();
const MIN_INTERVAL_MS = 300; // minimum 300ms between requests per IP

app.post('/api/generate', async (req, res) => {
  const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const now = Date.now();
  const last = lastRequestByIp.get(clientIp) || 0;
  if (now - last < MIN_INTERVAL_MS) {
    return res.status(429).json({ error: 'Too many requests' });
  }
  lastRequestByIp.set(clientIp, now);

  const GEN_API_KEY = process.env.GEN_API_KEY;
  if (!GEN_API_KEY) {
    return res.status(500).json({ error: 'GEN_API_KEY not configured on server' });
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEN_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy server running on http://localhost:${PORT}`));

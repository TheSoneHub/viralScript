// Netlify Function: proxy to Google Gemini
// Receives POST with requestBody, forwards to Gemini using GEN_API_KEY from env

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  // basic rate limit (per IP, in-memory)
  const MIN_INTERVAL_MS = 300;
  if (!global._lastReq) global._lastReq = {};
  const ip = event.headers['client-ip'] || event.headers['x-forwarded-for'] || event.requestContext?.identity?.sourceIp || context?.identity?.sourceIp || 'unknown';
  const now = Date.now();
  const last = global._lastReq[ip] || 0;
  if (now - last < MIN_INTERVAL_MS) {
    return { statusCode: 429, body: JSON.stringify({ error: 'Too many requests' }) };
  }
  global._lastReq[ip] = now;

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  const GEN_API_KEY = process.env.GEN_API_KEY;
  if (!GEN_API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'GEN_API_KEY not configured' }) };
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEN_API_KEY}`;

  try {
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await resp.json();
    return { statusCode: resp.status, body: JSON.stringify(data) };
  } catch (err) {
    console.error('Netlify function proxy error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Proxy error' }) };
  }
};

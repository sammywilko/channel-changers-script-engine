import type { VercelRequest, VercelResponse } from '@vercel/node';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

// Rate limiting (simple in-memory, resets on cold start)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 60; // requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }
  
  if (record.count >= RATE_LIMIT) {
    return false;
  }
  
  record.count++;
  return true;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, model, contents, config, systemInstruction } = req.body;

  // Handle warmup requests immediately (no API key needed)
  if (action === 'warmup') {
    return res.status(200).json({ status: 'warm', timestamp: Date.now() });
  }

  if (!GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY not configured');
    return res.status(500).json({ error: 'API key not configured' });
  }

  // Rate limiting
  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 'unknown';
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
  }

  try {
    if (!action || !model) {
      return res.status(400).json({ error: 'Missing required fields: action, model' });
    }

    let endpoint: string;
    let payload: any;

    switch (action) {
      case 'generateContent':
        endpoint = `${GEMINI_BASE_URL}/models/${model}:generateContent`;
        payload = {
          contents,
          generationConfig: config,
          systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
        };
        break;

      case 'streamGenerateContent':
        endpoint = `${GEMINI_BASE_URL}/models/${model}:streamGenerateContent`;
        payload = {
          contents,
          generationConfig: config,
          systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
        };
        break;

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }

    const response = await fetch(`${endpoint}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: 'Gemini API error',
        details: errorText 
      });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
/**
 * SCRIPT ENGINE - Vercel API Route (Fixed)
 * 
 * Handles:
 * - Chat messages (text generation)
 * - Image generation (concept art) - NOW WORKING
 * - Warmup requests
 * 
 * File: api/gemini.ts
 */

import { GoogleGenAI } from "@google/genai";

// Model configuration - centralized
const MODELS = {
  text: "gemini-2.5-flash",
  image: "gemini-3-pro-image-preview",
};

// Rate limiting - prevent token overflow
const MAX_HISTORY_LENGTH = 20;

export default async function handler(req: any, res: any) {
  // CORS headers for browser requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Try multiple env var names for flexibility
  const apiKey = process.env.GEMINI_API_KEY || 
                 process.env.VITE_GEMINI_API_KEY ||
                 process.env.API_KEY;
  
  if (!apiKey) {
    console.error('❌ No Gemini API key found in environment');
    return res.status(500).json({ 
      error: 'API key not configured',
      details: 'Set GEMINI_API_KEY in Vercel environment variables'
    });
  }
  
  const { action, model, contents, config, systemInstruction } = req.body;
  
  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // ============================================
    // WARMUP REQUEST
    // ============================================
    if (action === 'warmup') {
      console.log('🔥 Warmup request received');
      return res.status(200).json({ status: 'warm' });
    }
    
    // ============================================
    // IMAGE GENERATION (FIXED - was missing!)
    // ============================================
    if (action === 'generateImage') {
      console.log('🖼️ Image generation request');
      
      const prompt = typeof contents === 'string' 
        ? contents 
        : contents?.[0]?.parts?.[0]?.text || contents?.parts?.[0]?.text || '';
      
      if (!prompt) {
        return res.status(400).json({ error: 'No prompt provided for image generation' });
      }
      
      console.log('📝 Image prompt:', prompt.substring(0, 100) + '...');
      
      const response = await ai.models.generateContent({
        model: MODELS.image,
        contents: {
          parts: [{ text: prompt }]
        },
        config: {
          imageConfig: {
            aspectRatio: config?.aspectRatio || "16:9",
            imageSize: config?.imageSize || "2K"
          }
        }
      });
      
      // Extract image data from response
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            console.log('✅ Image generated successfully');
            return res.status(200).json({
              image: part.inlineData.data,
              mimeType: part.inlineData.mimeType,
            });
          }
        }
      }
      
      console.warn('⚠️ No image in response');
      return res.status(500).json({ error: 'No image generated' });
    }
    
    // ============================================
    // TEXT GENERATION (Chat)
    // ============================================
    if (action === 'generateContent') {
      console.log('💬 Text generation request');
      
      // Trim history if too long to prevent token overflow
      let history = Array.isArray(contents) ? contents : [];
      if (history.length > MAX_HISTORY_LENGTH) {
        history = history.slice(-MAX_HISTORY_LENGTH);
        console.log(`📜 Trimmed history to ${MAX_HISTORY_LENGTH} messages`);
      }
      
      const modelName = model || MODELS.text;
      
      const response = await ai.models.generateContent({
        model: modelName,
        contents: history,
        config: {
          systemInstruction: systemInstruction || undefined,
          temperature: config?.temperature || 0.8,
          maxOutputTokens: config?.maxOutputTokens || 8192,
        }
      });
      
      console.log('✅ Text generated successfully');
      
      return res.status(200).json({
        candidates: response.candidates,
        usageMetadata: response.usageMetadata,
      });
    }
    
    // ============================================
    // UNKNOWN ACTION
    // ============================================
    console.warn('⚠️ Unknown action:', action);
    return res.status(400).json({ 
      error: 'Unknown action',
      received: action,
      validActions: ['warmup', 'generateImage', 'generateContent']
    });
    
  } catch (error: any) {
    console.error('❌ API Error:', error.message || error);
    
    // Parse error type for better client handling
    let status = 500;
    let errorType = 'UNKNOWN';
    let retryable = true;
    
    if (error.status === 429 || error.message?.includes('rate')) {
      status = 429;
      errorType = 'RATE_LIMIT';
      retryable = true;
    } else if (error.status === 403 || error.message?.includes('quota')) {
      status = 403;
      errorType = 'QUOTA';
      retryable = false;
    } else if (error.message?.includes('SAFETY') || error.message?.includes('blocked')) {
      status = 400;
      errorType = 'SAFETY';
      retryable = false;
    } else if (error.message?.includes('not found') || error.status === 404) {
      status = 404;
      errorType = 'MODEL_NOT_FOUND';
      retryable = false;
    }
    
    return res.status(status).json({
      error: error.message || 'Unknown error',
      errorType,
      retryable,
    });
  }
}

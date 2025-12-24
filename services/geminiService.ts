import { GoogleGenAI, GenerateContentResponse, Chat } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";

let chatSession: Chat | null = null;
let genAI: GoogleGenAI | null = null;

// Detect if we're in production (Vercel) or development
const isProduction = typeof window !== 'undefined' && 
  !window.location.hostname.includes('localhost') && 
  !window.location.hostname.includes('127.0.0.1');

// Direct API client for development
const getClient = () => {
  if (!genAI) {
    const apiKey = (import.meta as any).env?.GEMINI_API_KEY || '';
    if (!apiKey && !isProduction) {
      console.warn("No API key found. Using proxy mode.");
    }
    if (apiKey) {
      genAI = new GoogleGenAI({ apiKey });
    }
  }
  return genAI;
};

// Proxy function for production
async function callGeminiProxy(action: string, model: string, contents: any, config?: any, systemInstruction?: string) {
  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action,
      model,
      contents,
      config,
      systemInstruction,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.details || error.error || 'API call failed');
  }

  return response.json();
}

// Chat history for proxy mode
let chatHistory: Array<{ role: string; parts: Array<{ text: string }> }> = [];

export const initializeChat = async (): Promise<void> => {
  const client = getClient();
  
  if (client) {
    // Direct SDK mode (development)
    chatSession = client.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.8,
        maxOutputTokens: 8192,
      },
    });
  } else {
    // Proxy mode (production)
    chatHistory = [];
    console.log('Initialized chat in proxy mode');
  }
};

export const sendMessageToGemini = async (
  userMessage: string,
  imageParts?: { inlineData: { data: string; mimeType: string } }[]
): Promise<{ text: string; dataUpdate?: any }> => {
  const client = getClient();

  let responseText: string;

  if (client && chatSession) {
    // Direct SDK mode
    let result: GenerateContentResponse;
    
    try {
      if (imageParts && imageParts.length > 0) {
        // For messages with images, combine image parts with text
        result = await chatSession.sendMessage({
          message: [
            ...imageParts,
            { text: userMessage }
          ]
        });
      } else {
        result = await chatSession.sendMessage({ message: userMessage });
      }
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }

    responseText = result.text || "";
  } else {
    // Proxy mode
    const userParts: Array<any> = [];
    
    if (imageParts && imageParts.length > 0) {
      userParts.push(...imageParts);
    }
    userParts.push({ text: userMessage });
    
    chatHistory.push({ role: 'user', parts: userParts });
    
    const result = await callGeminiProxy(
      'generateContent',
      'gemini-3-flash-preview',
      chatHistory,
      {
        temperature: 0.8,
        maxOutputTokens: 8192,
      },
      SYSTEM_INSTRUCTION
    );
    
    responseText = result.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // Add assistant response to history
    chatHistory.push({ role: 'model', parts: [{ text: responseText }] });
  }

  // Parse for JSON updates
  let dataUpdate = null;
  const jsonMatch = responseText.match(/```json:update([\s\S]*?)```/);
  
  if (jsonMatch && jsonMatch[1]) {
    try {
      dataUpdate = JSON.parse(jsonMatch[1]);
    } catch (e) {
      console.warn("Failed to parse JSON update from model", e);
    }
  }

  // Clean the text response by removing the JSON block
  const cleanText = responseText.replace(/```json:update[\s\S]*?```/, "").trim();

  return {
    text: cleanText,
    dataUpdate,
  };
};

export const generateConceptArt = async (prompt: string): Promise<string> => {
  const client = getClient();
  
  if (client) {
    // Direct SDK mode
    const response = await client.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
          imageSize: "2K"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
  } else {
    // Proxy mode - image generation might need different handling
    // For now, throw error as image gen through proxy needs special setup
    console.warn('Image generation in proxy mode not yet implemented');
  }
  
  throw new Error("No image generated");
};

// Table Read (Multi-speaker TTS)
export const generateTableRead = async (scriptSegment: string): Promise<string> => {
  const client = getClient();
  
  if (!client) {
    throw new Error("TTS requires direct API access");
  }
  
  const response = await client.models.generateContent({
    model: "gemini-3-flash-preview-preview-tts",
    contents: {
      parts: [{ text: `Perform a dramatic table read of the following script scene. Differentiate the voices clearly:\n\n${scriptSegment}` }]
    },
    config: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Fenrir' },
        },
      },
    }
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("No audio generated");
  return base64Audio;
};

// Continuity Checker
export const checkContinuity = async (scriptChunk: string, bibleContext: string): Promise<string> => {
  const client = getClient();
  const prompt = `
    ROLE: Continuity Supervisor.
    BIBLE CONTEXT: ${bibleContext}
    SCRIPT SEGMENT: ${scriptChunk}
    
    TASK: Analyze the script segment for continuity errors against the bible (e.g., character names, physical traits, established facts).
    Output a bulleted list of errors or "Continuity Solid" if none found. Keep it brief.
  `;
  
  if (client) {
    const response = await client.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });
    return response.text || "Analysis failed.";
  } else {
    const result = await callGeminiProxy(
      'generateContent',
      'gemini-3-flash-preview',
      [{ role: 'user', parts: [{ text: prompt }] }]
    );
    return result.candidates?.[0]?.content?.parts?.[0]?.text || "Analysis failed.";
  }
};

// Subtext Analyzer
export const analyzeSubtext = async (scriptChunk: string): Promise<string> => {
  const client = getClient();
  const prompt = `
    ROLE: Subtext Analyzer / Director.
    SCRIPT SEGMENT: ${scriptChunk}
    
    TASK: Identify 3-5 lines of dialogue rich in subtext.
    Format as JSON: 
    [
      { "line": "Exact text of line", "subtext": "What they really mean" }
    ]
    Only return the JSON.
  `;
  
  let text: string;
  
  if (client) {
    const response = await client.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });
    text = response.text || "";
  } else {
    const result = await callGeminiProxy(
      'generateContent',
      'gemini-3-flash-preview',
      [{ role: 'user', parts: [{ text: prompt }] }]
    );
    text = result.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }
  
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  return jsonMatch ? jsonMatch[0] : "[]";
};

// Location Scout
export const scoutLocation = async (query: string): Promise<any> => {
  const client = getClient();
  
  if (client) {
    const response = await client.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Find real-world locations matching this description: "${query}". Return a list of 3-5 specific places with descriptions.`,
      config: {
        tools: [{ googleMaps: {} }],
      }
    });
    
    const grounding = response.candidates?.[0]?.groundingMetadata;
    const text = response.text;
    
    return { text, grounding };
  } else {
    // Simplified version for proxy mode
    const result = await callGeminiProxy(
      'generateContent',
      'gemini-3-flash-preview',
      [{ role: 'user', parts: [{ text: `Find real-world locations matching this description: "${query}". Return a list of 3-5 specific places with descriptions.` }] }]
    );
    return { 
      text: result.candidates?.[0]?.content?.parts?.[0]?.text || "", 
      grounding: null 
    };
  }
};

// Punch-Up Script
export const punchUpScript = async (selection: string, instruction: string, context: string): Promise<string> => {
  const client = getClient();
  const prompt = `
    ROLE: Script Doctor.
    CONTEXT: ${context}
    ORIGINAL TEXT: "${selection}"
    INSTRUCTION: Rewrite this dialogue/action specifically to be ${instruction}.
    
    Output ONLY the rewritten text. No explanations.
  `;
  
  if (client) {
    const response = await client.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });
    return response.text || selection;
  } else {
    const result = await callGeminiProxy(
      'generateContent',
      'gemini-3-flash-preview',
      [{ role: 'user', parts: [{ text: prompt }] }]
    );
    return result.candidates?.[0]?.content?.parts?.[0]?.text || selection;
  }
};

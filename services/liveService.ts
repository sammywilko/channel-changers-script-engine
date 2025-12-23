import { GoogleGenAI, Session, Modality } from "@google/genai";
import { LIVE_SYSTEM_INSTRUCTION } from "../constants";

let currentSession: Session | null = null;
let inputAudioContext: AudioContext | null = null;
let outputAudioContext: AudioContext | null = null;
let inputSource: MediaStreamAudioSourceNode | null = null;
let scriptProcessor: ScriptProcessorNode | null = null;
let nextStartTime = 0;
const sources = new Set<AudioBufferSourceNode>();

export const disconnectLiveSession = async () => {
  if (currentSession) {
    try {
      await currentSession.close();
    } catch (e) {
      console.error("Error closing session", e);
    }
    currentSession = null;
  }

  if (inputSource) {
    inputSource.disconnect();
    inputSource = null;
  }
  if (scriptProcessor) {
    scriptProcessor.disconnect();
    scriptProcessor = null;
  }
  if (inputAudioContext) {
    await inputAudioContext.close();
    inputAudioContext = null;
  }
  
  // Stop all playing audio
  sources.forEach(source => {
      try { source.stop(); } catch(e){}
  });
  sources.clear();

  if (outputAudioContext) {
    await outputAudioContext.close();
    outputAudioContext = null;
  }
  nextStartTime = 0;
};

export const connectLiveSession = async (
  onAudioData: (active: boolean) => void,
  onError: (error: string) => void
) => {
  // Cleanup previous if exists
  await disconnectLiveSession();

  try {
    const apiKey = (import.meta as any).env?.GEMINI_API_KEY || '';
    if (!apiKey) {
      throw new Error("API key not configured for Live session");
    }
    const ai = new GoogleGenAI({ apiKey });
    
    // Audio Context Setup
    inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const outputNode = outputAudioContext.createGain();
    outputNode.connect(outputAudioContext.destination);

    // Get Mic Stream
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Connect to Gemini Live
    const sessionPromise = ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      config: {
        responseModalities: [Modality.AUDIO],
        systemInstruction: LIVE_SYSTEM_INSTRUCTION,
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
        },
      },
      callbacks: {
        onopen: () => {
          console.log("Live Session Connected");
          onAudioData(true);

          // Setup Input Processing
          if (!inputAudioContext) return;
          
          inputSource = inputAudioContext.createMediaStreamSource(stream);
          scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
          
          scriptProcessor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const pcmData = encodePCM(inputData);
            const base64Data = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
            
            sessionPromise.then(session => {
                session.sendRealtimeInput({
                    media: {
                        mimeType: 'audio/pcm;rate=16000',
                        data: base64Data
                    }
                });
            });
          };

          inputSource.connect(scriptProcessor);
          scriptProcessor.connect(inputAudioContext.destination); // Mute input to avoid feedback loop, effectively
        },
        onmessage: async (msg) => {
          const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          
          if (base64Audio && outputAudioContext) {
            onAudioData(true); // Signal activity
            
            // Handle Interruption
            if (msg.serverContent?.interrupted) {
                sources.forEach(s => s.stop());
                sources.clear();
                nextStartTime = 0;
            }

            const audioData = decodeBase64(base64Audio);
            nextStartTime = Math.max(nextStartTime, outputAudioContext.currentTime);
            
            const audioBuffer = await decodeAudioData(audioData, outputAudioContext);
            
            const source = outputAudioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(outputNode);
            
            source.onended = () => {
                sources.delete(source);
                if (sources.size === 0) onAudioData(false); // Stop activity signal if no audio playing
            };
            
            source.start(nextStartTime);
            nextStartTime += audioBuffer.duration;
            sources.add(source);
          }
        },
        onclose: () => {
          console.log("Live Session Closed");
          onAudioData(false);
        },
        onerror: (err) => {
          console.error("Live Session Error", err);
          onError(err.message || "Connection Error");
        }
      }
    });

    currentSession = await sessionPromise;

  } catch (error: any) {
    console.error("Failed to start live session", error);
    onError(error.message || "Failed to access microphone or connect.");
    await disconnectLiveSession();
  }
};

// --- Helpers ---

function encodePCM(input: Float32Array): Int16Array {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return output;
}

function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) {
        channelData[i] = dataInt16[i] / 32768.0;
    }
    return buffer;
}

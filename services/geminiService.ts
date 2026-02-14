
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { EmergencyAnalysis, EmergencyType, SeverityLevel } from "../types";

/**
 * NEURAL TRIAGE CORE
 * Powered by Gemini 3 Flash
 */
export const analyzeEmergencyTranscript = async (transcript: string): Promise<EmergencyAnalysis> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this emergency dispatch transcript and provide a triage report: "${transcript}"`,
      config: {
        systemInstruction: `You are an expert Emergency Triage AI. 
        Your task is to analyze transcripts from 911/emergency calls and categorize them.
        
        EMERGENCY TYPES: Medical, Fire, Crime, Accident, Unknown.
        SEVERITY LEVELS:
        - P1: Life-threatening, immediate intervention required.
        - P2: Urgent, but not immediately life-threatening.
        - P3: Routine or non-urgent.

        Be decisive and conservative with life-safety (err on P1 if unsure).`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            emergency_type: { type: Type.STRING, enum: ["Medical", "Fire", "Crime", "Accident", "Unknown"] },
            severity: { type: Type.STRING, enum: ["P1", "P2", "P3"] },
            summary: { type: Type.STRING },
            key_risks: { type: Type.ARRAY, items: { type: Type.STRING } },
            confidence: { type: Type.NUMBER },
            recommended_route: { type: Type.STRING },
            reasoning_trace: { type: Type.STRING }
          },
          required: ["emergency_type", "severity", "summary", "key_risks", "confidence", "recommended_route", "reasoning_trace"]
        }
      }
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as EmergencyAnalysis;
  } catch (error) {
    console.error("Neural Inference Failed:", error);
    return {
      emergency_type: EmergencyType.Unknown,
      severity: SeverityLevel.P1,
      summary: "Neural inference error. Manual triage required immediately.",
      key_risks: ["System connectivity loss"],
      confidence: 0,
      recommended_route: "Dispatcher Manual Override",
      reasoning_trace: "Critical: API request failed or timed out."
    };
  }
};

/**
 * NEURAL TRANSCRIPTION ENGINE
 * Uses multi-modal capabilities to transcribe audio files for simulation ingestion.
 */
export const transcribeAudio = async (base64Data: string, mimeType: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        },
        { text: "Please provide a verbatim transcript of this emergency call. Format it as a single block of text." },
      ],
      config: {
        systemInstruction: "You are a professional stenographer for emergency services. Transcribe everything exactly as heard.",
      }
    });
    return response.text || "";
  } catch (error) {
    console.error("Transcription Failed:", error);
    throw error;
  }
};

/**
 * DISPATCHER TTS ENGINE
 * Converts dispatcher text to synthesized speech for the caller.
 */
export const synthesizeSpeech = async (text: string): Promise<string | undefined> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say authoritatively and calmly as an emergency dispatcher: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Puck' }, // Professional, clear voice
          },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (error) {
    console.error("TTS Synthesis Failed:", error);
    return undefined;
  }
};

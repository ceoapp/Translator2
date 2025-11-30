import { GoogleGenAI, Modality } from "@google/genai";

// Initialize Gemini AI client
// We access process.env.API_KEY directly. 
// In browser build environments (like Vite), this string is replaced at build time with the actual key.
// The previous "typeof process" check prevented this replacement mechanism from working.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function translateText(text: string): Promise<string> {
  if (!text.trim()) return "";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Translate the following English text to Thai. Ensure the tone is natural and polite. 
      Only return the translated Thai text. Do not include any explanations, romanization, or markdown formatting.
      
      Text: "${text}"`,
    });

    return response.text?.trim() || "";
  } catch (error) {
    console.error("Translation error details:", error);
    throw error;
  }
}

export async function generateSpeech(text: string): Promise<string> {
  if (!text.trim()) return "";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, 
          },
        },
      },
    });

    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioData) {
      throw new Error("No audio data received from Gemini.");
    }
    return audioData;
  } catch (error) {
    console.error("TTS error details:", error);
    throw error;
  }
}
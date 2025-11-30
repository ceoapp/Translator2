import { GoogleGenAI, Modality } from "@google/genai";

const apiKey = process.env.API_KEY;

if (!apiKey) {
  console.error("API Key is missing. Ensure process.env.API_KEY is set.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

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
    console.error("Translation error:", error);
    throw new Error("Failed to translate text. Please try again.");
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
    console.error("TTS error:", error);
    throw new Error("Failed to generate speech.");
  }
}
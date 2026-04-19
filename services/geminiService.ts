
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { MediaType } from "../types";

// Initialize AI client
const getAiClient = () => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing from environment variables.");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result as string;
      // Remove the data prefix (e.g., "data:image/png;base64,")
      resolve(base64String.split(',')[1]);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const transcribeMedia = async (file: File, type: MediaType): Promise<string> => {
  const ai = getAiClient();
  const base64Data = await fileToBase64(file);

  // Gemini 3 Flash is high-speed; disabling thinking for maximum throughput
  const modelName = 'gemini-3-flash-preview';
  
  let prompt = "";
  switch (type) {
    case 'image':
      prompt = "Extract all text from this image. Output only the text found.";
      break;
    case 'audio':
      prompt = "Transcribe this audio verbatim. Use speaker labels.";
      break;
    case 'video':
      prompt = "Transcribe the speech in this video and briefly note key visual context.";
      break;
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: file.type,
              data: base64Data,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        // Disable thinking for maximum speed as per user request
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    return response.text || "No transcript generated.";
  } catch (error: any) {
    console.error("Transcription Engine Error:", error);
    throw new Error(error.message || "Failed to process media with AI.");
  }
};

export const summarizeTranscript = async (transcript: string): Promise<string> => {
  const ai = getAiClient();
  
  // Using Flash Lite for ultra-low latency text summarization
  const modelName = 'gemini-flash-lite-latest';
  
  const prompt = `Summarize this transcript into concise bullet points:

${transcript}`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        // Minimize latency further
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    return response.text || "No summary generated.";
  } catch (error: any) {
    console.error("Summarization Error:", error);
    throw new Error(error.message || "Failed to generate summary.");
  }
};


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

  // Using the high-speed standard neural engine as requested
  const modelName = 'gemini-3-flash-preview';
  
  let prompt = "";
  switch (type) {
    case 'image':
      prompt = "Extract all text from this image using OCR. Provide only the extracted text. If no text is found, state 'No text found in image.' Do not describe the image contents or provide additional commentary.";
      break;
    case 'audio':
      prompt = "Please provide a verbatim transcript of this audio file. Include speaker labels if possible and timestamp hints if appropriate. Focus on high precision.";
      break;
    case 'video':
      prompt = "Please provide a detailed transcript of the speech in this video, and describe any significant visual context or text shown on screen.";
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
    });

    return response.text || "No transcript generated.";
  } catch (error: any) {
    console.error("Transcription Engine Error:", error);
    throw new Error(error.message || "Failed to process media with AI.");
  }
};

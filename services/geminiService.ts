import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult } from "../types";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

// JSON Schema for the fashion analysis
const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    items: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of visible clothing items and accessories."
    },
    colors: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          hex: { type: Type.STRING, description: "Hex code of the color" },
          name: { type: Type.STRING, description: "Artistic name of the color" }
        }
      },
      description: "Dominant color palette of the outfit (max 5)."
    },
    styleKeywords: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "3-5 keywords describing the aesthetic (e.g., 'Y2K', 'Old Money', 'Streetwear')."
    },
    captions: {
      type: Type.OBJECT,
      properties: {
        minimalist: { type: Type.STRING, description: "A very short, cool caption in first-person. E.g., 'Details.' or 'My current mood.'" },
        storyteller: { type: Type.STRING, description: "A longer first-person caption sharing a personal thought or vibe about the day/outfit using 'I' or 'my'." },
        witty: { type: Type.STRING, description: "A clever or self-deprecating first-person one-liner." },
        hype: { type: Type.STRING, description: "A confident, high-energy first-person caption flexing my fit." }
      },
      required: ["minimalist", "storyteller", "witty", "hype"]
    },
    hashtags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "15-20 trending and relevant hashtags."
    },
    vibeRating: {
      type: Type.INTEGER,
      description: "A subjective rating of the outfit execution from 1 to 10."
    },
    critique: {
      type: Type.STRING,
      description: "A short, professional stylist critique. Constructive but honest."
    }
  },
  required: ["items", "colors", "styleKeywords", "captions", "hashtags", "vibeRating", "critique"]
};

export const analyzeOutfit = async (base64Image: string, mimeType: string = 'image/png'): Promise<AnalysisResult> => {
  const ai = getAiClient();
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image,
            },
          },
          {
            text: "Analyze this fashion image for the user who posted it. You are their social media manager. Provide specific details about the outfit, and generate engaging captions written STRICTLY in the FIRST PERSON (using 'I', 'my', 'me'). The user is posting this about THEMSELVES.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        systemInstruction: "You are a high-end fashion editor and social media strategist. Your tone is chic, knowledgeable, and internet-savvy. You understand trends like Gorpcore, Coquette, Y2K, Old Money, etc. CRITICAL: All captions must be written in First Person POV ('I', 'Me', 'My'), ready for the user to copy and paste as their own post. Do not describe the person in the third person.",
      },
    });

    let text = response.text || "{}";
    
    // Robust cleaning of markdown code blocks if model returns them
    if (text.trim().startsWith("```")) {
        text = text.replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/```$/, "");
    }

    return JSON.parse(text) as AnalysisResult;
  } catch (error) {
    console.error("Analysis failed:", error);
    throw error;
  }
};
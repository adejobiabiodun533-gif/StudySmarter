import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface StudySummary {
  summary: string;
  topics: {
    title: string;
    content: string;
  }[];
  keyConcepts: string[];
}

export interface Mnemonic {
  concept: string;
  mnemonic: string;
  explanation: string;
}

export interface Question {
  id: string;
  type: 'multiple-choice' | 'theory' | 'fill-gap' | 'short-answer';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

export const geminiService = {
  async performFullAnalysis(content: string): Promise<{ summary: StudySummary, mnemonics: Mnemonic[], questions: Question[] }> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are an elite academic architect. Analyze the provided study material and return a complete academic breakdown in a single structured JSON object.
      
      Requirements for the breakdown:
      1. Summary: A high-level executive overview and detailed granular topics.
      2. Memory Hacks: 5-8 creative mnemonics for the toughest concepts using acrostics or metaphors.
      3. Practice Lab: Exactly 10 challenging questions (4 Multiple Choice, 2 Theory, 2 Fill-gap, 2 Short-answer) at a University Competitive level.
      
      Content: ${content.substring(0, 35000)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.OBJECT,
              properties: {
                summary: { type: Type.STRING },
                topics: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      content: { type: Type.STRING }
                    },
                    required: ["title", "content"]
                  }
                }
              },
              required: ["summary", "topics"]
            },
            mnemonics: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  concept: { type: Type.STRING },
                  mnemonic: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                },
                required: ["concept", "mnemonic", "explanation"]
              }
            },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  type: { type: Type.STRING },
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctAnswer: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                },
                required: ["id", "type", "question", "correctAnswer", "explanation"]
              }
            }
          },
          required: ["summary", "mnemonics", "questions"]
        }
      }
    });

    try {
      const text = response.text || "{}";
      return JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse master analysis:", e);
      throw new Error("Complex analysis formatting failed. Please try again.");
    }
  },

  async generateSummary(content: string): Promise<StudySummary> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are an expert academic tutor. Analyze the following study material and provide a high-level executive summary, followed by granular topics. Focus on clarity, academic rigor, and logical flow.
      
      Content: ${content.substring(0, 30000)}`, // Avoid token limits
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            topics: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  content: { type: Type.STRING }
                },
                required: ["title", "content"]
              }
            },
            keyConcepts: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["summary", "topics", "keyConcepts"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  },

  async generateMnemonics(content: string): Promise<Mnemonic[]> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a memory specialist. Create highly effective, creative, and memorable mnemonics for the most difficult terminal concepts in this material. 
      Use acrostics, catchy phrases, or visual metaphors.
      
      Content: ${content.substring(0, 30000)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              concept: { type: Type.STRING },
              mnemonic: { type: Type.STRING },
              explanation: { type: Type.STRING }
            },
            required: ["concept", "mnemonic", "explanation"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  },

  async generateQuestions(content: string): Promise<Question[]> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Create exactly 10 challenging practice questions based on this study material. 
      Structure: 4 Multiple Choice (rich distractors), 2 Theory, 2 Fill-in-the-gap, 2 Short answer.
      Ensure the level is "University Competitive". Provide clear, logical explanations for the answers.
      
      Content: ${content.substring(0, 30000)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING }, // Use strings like "q1", "q2"...
              type: { 
                type: Type.STRING,
                enum: ["multiple-choice", "theory", "fill-gap", "short-answer"]
              },
              question: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              correctAnswer: { type: Type.STRING },
              explanation: { type: Type.STRING }
            },
            required: ["id", "type", "question", "correctAnswer", "explanation"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  }
};

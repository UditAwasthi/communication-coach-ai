import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const geminiModel = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

export const embeddingModel = genAI.getGenerativeModel({
  model: "text-embedding-004",
});

export async function generateEmbedding(text: string): Promise<number[]> {
  const result = await embeddingModel.embedContent(text);
  return result.embedding.values;
}

export async function generateText(prompt: string, systemPrompt?: string): Promise<string> {
  const chat = geminiModel.startChat({
    history: systemPrompt
      ? [{ role: "user", parts: [{ text: systemPrompt }] }, { role: "model", parts: [{ text: "Understood." }] }]
      : [],
  });

  const result = await chat.sendMessage(prompt);
  return result.response.text();
}

export async function generateJSON<T>(prompt: string, systemPrompt?: string): Promise<T> {
  const text = await generateText(
    prompt + "\n\nRespond ONLY with valid JSON. No markdown, no code blocks, just the JSON object.",
    systemPrompt
  );

  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(cleaned) as T;
}

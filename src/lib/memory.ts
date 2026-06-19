import { generateJSON } from "./gemini";
import { prisma } from "./prisma";
import { storeEmbedding, searchSimilar } from "./vectors";

interface MemoryExtraction {
  should_create: boolean;
  content: string;
  importance: number;
  category: string;
}

const MEMORY_EXTRACTION_PROMPT = `Analyze this user message in the context of a communication coaching conversation.

Determine if the user revealed a meaningful, long-term fact about themselves that would be useful for future coaching sessions.

Examples of facts worth remembering:
- "I freeze when talking to seniors" -> User experiences anxiety with authority figures
- "I'm building a startup" -> User is an entrepreneur, networking is important
- "I just moved to a new city" -> User needs help building new social connections
- "I'm introverted" -> User's personality affects communication approach

Return JSON:
{
  "should_create": true/false,
  "content": "concise memory about the user (third person)",
  "importance": 0.0-1.0 (how relevant this is for future coaching),
  "category": "personality|goals|struggles|context|preferences|background"
}`;

export async function extractAndStoreMemory(
  userId: string,
  userMessage: string
): Promise<void> {
  const result = await generateJSON<MemoryExtraction>(
    `${MEMORY_EXTRACTION_PROMPT}\n\nUser message: "${userMessage}"`
  );

  if (result.should_create && result.content) {
    const memory = await prisma.memory.create({
      data: {
        userId,
        content: result.content,
        importanceScore: result.importance,
        category: result.category,
      },
    });
    await storeEmbedding("Memory", memory.id, result.content);
  }
}

export async function getRelevantMemories(
  userId: string,
  query: string,
  limit: number = 5
): Promise<Array<{ id: string; content: string; similarity: number }>> {
  return searchSimilar("Memory", query, limit, userId);
}

export async function getUserMemories(userId: string) {
  return prisma.memory.findMany({
    where: { userId },
    orderBy: { importanceScore: "desc" },
  });
}

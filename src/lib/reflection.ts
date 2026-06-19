import { generateJSON } from "./gemini";
import { prisma } from "./prisma";

interface ReflectionData {
  strengths: string[];
  weaknesses: string[];
  patterns: string[];
  growth: string[];
  bottlenecks: string[];
  summary: string;
}

const REFLECTION_PROMPT = `Analyze these recent coaching conversations and generate a reflection about the user's communication progress.

Consider:
1. What communication strengths has the user shown?
2. What weaknesses or recurring issues do they have?
3. What patterns do you notice in their behavior?
4. Where have they grown?
5. What are their current bottlenecks?

Return JSON:
{
  "strengths": ["..."],
  "weaknesses": ["..."],
  "patterns": ["..."],
  "growth": ["..."],
  "bottlenecks": ["..."],
  "summary": "A brief paragraph summarizing their current state and next steps"
}`;

export async function generateReflection(userId: string): Promise<void> {
  const recentMessages = await prisma.message.findMany({
    where: {
      conversation: { userId },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { conversation: true },
  });

  if (recentMessages.length < 10) return;

  const conversationText = recentMessages
    .reverse()
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");

  const memories = await prisma.memory.findMany({
    where: { userId },
    orderBy: { importanceScore: "desc" },
    take: 10,
  });

  const memoryText = memories.map((m) => m.content).join("\n");

  const reflection = await generateJSON<ReflectionData>(
    `${REFLECTION_PROMPT}\n\nUser memories:\n${memoryText}\n\nRecent conversations:\n${conversationText}`
  );

  await prisma.reflection.create({
    data: {
      userId,
      content: reflection.summary,
      strengths: JSON.stringify(reflection.strengths),
      weaknesses: JSON.stringify(reflection.weaknesses),
      patterns: JSON.stringify(reflection.patterns),
      growth: JSON.stringify(reflection.growth),
    },
  });
}

export async function shouldGenerateReflection(userId: string): Promise<boolean> {
  const lastReflection = await prisma.reflection.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  if (!lastReflection) {
    const messageCount = await prisma.message.count({
      where: { conversation: { userId } },
    });
    return messageCount >= 10;
  }

  const messagesSinceReflection = await prisma.message.count({
    where: {
      conversation: { userId },
      createdAt: { gt: lastReflection.createdAt },
    },
  });

  return messagesSinceReflection >= 20;
}

import { searchSimilar } from "./vectors";
import { prisma } from "./prisma";

interface CoachingContext {
  memories: string[];
  principles: string[];
  frameworks: string[];
  examples: string[];
  transcriptEvidence: string[];
  conversationHistory: Array<{ role: string; content: string }>;
  reflections: string[];
}

const SYSTEM_PROMPT = `You are a communication coach trained on the teachings of a specific creator. You provide personalized coaching based on extracted principles, frameworks, and examples from their content.

CORE RULES:
1. Use the creator's principles as your reasoning foundation.
2. Reference specific frameworks when coaching.
3. Use concrete examples from the creator's content when relevant.
4. Adapt advice based on what you know about the user (from memories).
5. NEVER give generic self-help advice. Always ground your response in the creator's specific methodology.
6. Teach underlying principles, not just surface-level tips.
7. Be direct, specific, and actionable.
8. When analyzing conversations, point out exact moments where the user could improve.
9. Reference the creator's frameworks by name when applicable.
10. Track patterns in the user's behavior and growth over time.

COACHING STYLE:
- Be like a knowledgeable friend, not a therapist
- Use real examples and scenarios
- Challenge the user when they make excuses
- Celebrate genuine progress
- Be specific about what to say/do, not vague`;

export async function buildPrompt(
  userId: string,
  userMessage: string,
  conversationId: string,
  mode: string = "coaching"
): Promise<{ systemPrompt: string; contextPrompt: string }> {
  const context = await gatherContext(userId, userMessage, conversationId);

  let modeInstructions = "";
  switch (mode) {
    case "analysis":
      modeInstructions = `\n\nMODE: CONVERSATION ANALYSIS
The user has shared a conversation/interaction for analysis. You should:
1. Identify what went well
2. Identify specific mistakes
3. Explain WHY using the creator's principles
4. Suggest exact alternative responses
5. Rate the overall interaction`;
      break;
    case "roleplay":
      modeInstructions = `\n\nMODE: ROLEPLAY SIMULATION
You are simulating the other person in a conversation practice scenario.
Stay in character. After each exchange, briefly break character to give coaching feedback.
Use the creator's frameworks to guide realistic responses.`;
      break;
    default:
      modeInstructions = `\n\nMODE: COACHING
Provide personalized communication coaching based on the user's question or situation.`;
  }

  const contextPrompt = formatContext(context, userMessage);

  return {
    systemPrompt: SYSTEM_PROMPT + modeInstructions,
    contextPrompt,
  };
}

async function gatherContext(
  userId: string,
  query: string,
  conversationId: string
): Promise<CoachingContext> {
  const [memories, principles, frameworks, examples, transcriptEvidence, history, reflections] =
    await Promise.all([
      searchSimilar("Memory", query, 5, userId).catch(() => []),
      searchSimilar("Principle", query, 5).catch(() => []),
      searchSimilar("Framework", query, 3).catch(() => []),
      searchSimilar("Example", query, 3).catch(() => []),
      searchSimilar("TranscriptChunk", query, 3).catch(() => []),
      prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: "asc" },
        take: 20,
      }),
      prisma.reflection.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 1,
      }),
    ]);

  return {
    memories: memories.map((m) => m.content),
    principles: principles.map((p) => p.content),
    frameworks: frameworks.map((f) => f.content),
    examples: examples.map((e) => e.content),
    transcriptEvidence: transcriptEvidence.map((t) => t.content),
    conversationHistory: history.map((h) => ({ role: h.role, content: h.content })),
    reflections: reflections.map((r) => r.content),
  };
}

function formatContext(context: CoachingContext, userMessage: string): string {
  let prompt = "";

  if (context.memories.length > 0) {
    prompt += `\n--- WHAT I KNOW ABOUT THE USER ---\n${context.memories.map((m) => `- ${m}`).join("\n")}\n`;
  }

  if (context.reflections.length > 0) {
    prompt += `\n--- USER'S PROGRESS ---\n${context.reflections[0]}\n`;
  }

  if (context.principles.length > 0) {
    prompt += `\n--- RELEVANT PRINCIPLES ---\n${context.principles.map((p) => `- ${p}`).join("\n")}\n`;
  }

  if (context.frameworks.length > 0) {
    prompt += `\n--- RELEVANT FRAMEWORKS ---\n${context.frameworks.map((f) => `- ${f}`).join("\n")}\n`;
  }

  if (context.examples.length > 0) {
    prompt += `\n--- RELEVANT EXAMPLES ---\n${context.examples.map((e) => `- ${e}`).join("\n")}\n`;
  }

  if (context.transcriptEvidence.length > 0) {
    prompt += `\n--- SOURCE EVIDENCE ---\n${context.transcriptEvidence.map((t) => `"${t.slice(0, 200)}..."`).join("\n")}\n`;
  }

  if (context.conversationHistory.length > 0) {
    prompt += `\n--- CONVERSATION HISTORY ---\n${context.conversationHistory.map((h) => `${h.role}: ${h.content}`).join("\n")}\n`;
  }

  prompt += `\n--- CURRENT USER MESSAGE ---\n${userMessage}`;

  return prompt;
}

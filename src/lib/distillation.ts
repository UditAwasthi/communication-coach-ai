import { generateJSON } from "./gemini";
import { prisma } from "./prisma";
import { storeEmbedding } from "./vectors";

interface DistilledKnowledge {
  summary: string;
  principles: Array<{ title: string; description: string; category?: string }>;
  conversation_patterns: Array<{ name: string; description: string; steps?: string }>;
  frameworks: Array<{ name: string; description: string; steps?: string; category?: string }>;
  beliefs: Array<{ belief: string; context?: string }>;
  examples: Array<{ scenario: string; response: string; principle?: string }>;
  mistakes_to_avoid: string[];
}

const DISTILLATION_PROMPT = `You are an expert knowledge extractor. Analyze this video transcript from a communication coach/creator and extract structured knowledge.

Extract the following:
1. PRINCIPLES: Core communication principles taught (title + description + category)
2. CONVERSATION_PATTERNS: Reusable conversation patterns/flows (name + description + steps)
3. FRAMEWORKS: Mental models and frameworks for communication (name + description + steps + category)
4. BELIEFS: Underlying beliefs and worldview about communication (belief + context)
5. EXAMPLES: Concrete examples of good/bad communication (scenario + recommended response + related principle)
6. MISTAKES_TO_AVOID: Common mistakes mentioned

Categories for principles/frameworks: "opening", "maintaining", "deepening", "networking", "confidence", "dating", "professional", "general"

Return as JSON with this exact structure:
{
  "summary": "brief summary of the video's main teaching",
  "principles": [{"title": "...", "description": "...", "category": "..."}],
  "conversation_patterns": [{"name": "...", "description": "...", "steps": "step1 -> step2 -> step3"}],
  "frameworks": [{"name": "...", "description": "...", "steps": "...", "category": "..."}],
  "beliefs": [{"belief": "...", "context": "..."}],
  "examples": [{"scenario": "...", "response": "...", "principle": "..."}],
  "mistakes_to_avoid": ["..."]
}`;

export async function distillVideo(videoId: string): Promise<void> {
  const video = await prisma.video.findUnique({ where: { id: videoId } });
  if (!video || !video.transcript) return;

  const transcript = video.transcript.slice(0, 30000);

  const knowledge = await generateJSON<DistilledKnowledge>(
    `${DISTILLATION_PROMPT}\n\nTRANSCRIPT:\n${transcript}`
  );

  // Store principles
  for (const principle of knowledge.principles) {
    const created = await prisma.principle.create({
      data: {
        title: principle.title,
        description: principle.description,
        category: principle.category,
        videoId: video.id,
      },
    });
    await storeEmbedding("Principle", created.id, `${principle.title}: ${principle.description}`);
  }

  // Store frameworks (includes conversation patterns)
  const allFrameworks = [
    ...knowledge.frameworks,
    ...knowledge.conversation_patterns.map((p) => ({
      name: p.name,
      description: p.description,
      steps: p.steps,
      category: "conversation_pattern" as string | undefined,
    })),
  ];

  for (const framework of allFrameworks) {
    const created = await prisma.framework.create({
      data: {
        name: framework.name,
        description: framework.description,
        steps: framework.steps,
        category: framework.category,
        videoId: video.id,
      },
    });
    await storeEmbedding("Framework", created.id, `${framework.name}: ${framework.description}`);
  }

  // Store beliefs
  for (const belief of knowledge.beliefs) {
    const created = await prisma.belief.create({
      data: {
        belief: belief.belief,
        context: belief.context,
        videoId: video.id,
      },
    });
    await storeEmbedding("Belief", created.id, belief.belief);
  }

  // Store examples
  for (const example of knowledge.examples) {
    const created = await prisma.example.create({
      data: {
        scenario: example.scenario,
        response: example.response,
        principle: example.principle,
        videoId: video.id,
      },
    });
    await storeEmbedding("Example", created.id, `${example.scenario} -> ${example.response}`);
  }

  // Create transcript chunks
  const chunks = chunkTranscript(video.transcript, 500);
  for (const chunk of chunks) {
    const created = await prisma.transcriptChunk.create({
      data: {
        videoId: video.id,
        content: chunk,
      },
    });
    await storeEmbedding("TranscriptChunk", created.id, chunk);
  }

  // Mark video as processed
  await prisma.video.update({
    where: { id: video.id },
    data: { processed: true },
  });
}

function chunkTranscript(text: string, wordsPerChunk: number): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += wordsPerChunk) {
    chunks.push(words.slice(i, i + wordsPerChunk).join(" "));
  }
  return chunks;
}

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildPrompt } from "@/lib/prompt-builder";
import { generateText } from "@/lib/gemini";
import { extractAndStoreMemory } from "@/lib/memory";
import { shouldGenerateReflection, generateReflection } from "@/lib/reflection";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, conversationId, mode } = await request.json();

    if (!message) {
      return Response.json({ error: "Message is required" }, { status: 400 });
    }

    const userId = session.user.id;

    // Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = await prisma.conversation.findUnique({
        where: { id: conversationId, userId },
      });
      if (!conversation) {
        return Response.json({ error: "Conversation not found" }, { status: 404 });
      }
    } else {
      conversation = await prisma.conversation.create({
        data: {
          userId,
          mode: mode || "coaching",
          title: message.slice(0, 100),
        },
      });
    }

    // Store user message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "user",
        content: message,
      },
    });

    // Build contextual prompt
    const { systemPrompt, contextPrompt } = await buildPrompt(
      userId,
      message,
      conversation.id,
      conversation.mode
    );

    // Generate response
    const response = await generateText(contextPrompt, systemPrompt);

    // Store assistant message
    const assistantMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: response,
      },
    });

    // Background tasks: memory extraction and reflection check
    extractAndStoreMemory(userId, message).catch(console.error);

    shouldGenerateReflection(userId).then((should) => {
      if (should) generateReflection(userId).catch(console.error);
    });

    return Response.json({
      message: assistantMessage,
      conversationId: conversation.id,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: msg }, { status: 500 });
  }
}

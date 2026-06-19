"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChatMessage } from "./chat-message";
import { ConversationSidebar } from "./conversation-sidebar";
import Link from "next/link";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  title: string;
  mode: string;
  updatedAt: string;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [mode, setMode] = useState<"coaching" | "analysis" | "roleplay">("coaching");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function fetchConversations() {
    try {
      const res = await fetch("/api/conversations");
      const data = await res.json();
      if (data.conversations) setConversations(data.conversations);
    } catch {
      // silently fail
    }
  }

  async function loadConversation(id: string) {
    try {
      const res = await fetch(`/api/conversations/${id}`);
      const data = await res.json();
      if (data.conversation) {
        setConversationId(data.conversation.id);
        setMessages(data.conversation.messages);
        setMode(data.conversation.mode);
      }
    } catch {
      // silently fail
    }
  }

  function startNewConversation() {
    setConversationId(null);
    setMessages([]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          conversationId,
          mode,
        }),
      });

      const data = await res.json();

      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
        if (data.conversationId && !conversationId) {
          setConversationId(data.conversationId);
          fetchConversations();
        }
      } else if (data.error) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "assistant",
            content: `Error: ${data.error}`,
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "Failed to get response. Please try again.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      {sidebarOpen && (
        <ConversationSidebar
          conversations={conversations}
          activeId={conversationId}
          onSelect={loadConversation}
          onNew={startNewConversation}
          onClose={() => setSidebarOpen(false)}
        />
      )}

      {/* Main chat */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-slate-800 p-4 flex items-center justify-between bg-slate-900">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="text-slate-400"
              >
                Menu
              </Button>
            )}
            <h1 className="text-lg font-semibold text-white">Communication Coach</h1>
            <Badge variant="outline" className="text-purple-300 border-purple-300/30">
              {mode}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as typeof mode)}
              className="bg-slate-800 text-white text-sm rounded px-3 py-1.5 border border-slate-700"
            >
              <option value="coaching">Coaching</option>
              <option value="analysis">Analysis</option>
              <option value="roleplay">Roleplay</option>
            </select>
            <Link href="/knowledge">
              <Button variant="ghost" size="sm" className="text-slate-400">
                Knowledge
              </Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-slate-400">
                Home
              </Button>
            </Link>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <EmptyState mode={mode} />
          ) : (
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-slate-400">
                  <div className="animate-pulse">Thinking...</div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="border-t border-slate-800 p-4 bg-slate-900">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={getPlaceholder(mode)}
              className="flex-1 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 min-h-[60px] max-h-[200px] resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-purple-600 hover:bg-purple-700 self-end"
            >
              Send
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ mode }: { mode: string }) {
  const prompts: Record<string, string[]> = {
    coaching: [
      "How do I start conversations with strangers?",
      "I struggle with small talk. What should I do?",
      "How can I be more charismatic in group settings?",
      "What's the best way to network at events?",
    ],
    analysis: [
      "Paste a conversation you had recently for analysis...",
      "Share a text exchange you want feedback on...",
      "Describe an interaction that didn't go well...",
    ],
    roleplay: [
      "Let's practice meeting someone at a coffee shop",
      "Simulate a networking conversation at a tech meetup",
      "Practice asking for a promotion from my manager",
    ],
  };

  return (
    <div className="max-w-2xl mx-auto text-center pt-20">
      <h2 className="text-2xl font-bold text-white mb-2">
        {mode === "coaching" && "What would you like help with?"}
        {mode === "analysis" && "Share a conversation to analyze"}
        {mode === "roleplay" && "Choose a scenario to practice"}
      </h2>
      <p className="text-slate-400 mb-8">
        {mode === "coaching" && "Ask about communication skills, social situations, or anything related."}
        {mode === "analysis" && "Paste any conversation and get detailed feedback with specific improvements."}
        {mode === "roleplay" && "Practice real scenarios with AI feedback after each exchange."}
      </p>
      <div className="grid gap-3">
        {prompts[mode]?.map((prompt) => (
          <Card
            key={prompt}
            className="p-3 bg-slate-800/50 border-slate-700 text-slate-300 text-left cursor-pointer hover:bg-slate-800 transition"
          >
            {prompt}
          </Card>
        ))}
      </div>
    </div>
  );
}

function getPlaceholder(mode: string): string {
  switch (mode) {
    case "analysis":
      return "Paste a conversation or describe an interaction...";
    case "roleplay":
      return "Describe the scenario or respond in character...";
    default:
      return "Ask your communication coach anything...";
  }
}

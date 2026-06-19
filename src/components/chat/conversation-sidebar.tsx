"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface Conversation {
  id: string;
  title: string;
  mode: string;
  updatedAt: string;
}

interface Props {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onClose: () => void;
}

export function ConversationSidebar({ conversations, activeId, onSelect, onNew, onClose }: Props) {
  return (
    <div className="w-72 border-r border-slate-800 bg-slate-900 flex flex-col">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-300">Conversations</h2>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={onNew} className="text-purple-400 text-xs">
            + New
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-slate-500 text-xs">
            Close
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={`w-full text-left p-3 rounded-lg text-sm transition ${
                activeId === conv.id
                  ? "bg-purple-600/20 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <div className="truncate font-medium">{conv.title || "New conversation"}</div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-slate-600 text-slate-500">
                  {conv.mode}
                </Badge>
                <span className="text-[10px] text-slate-600">
                  {new Date(conv.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </button>
          ))}
          {conversations.length === 0 && (
            <p className="text-slate-600 text-xs text-center py-8">
              No conversations yet
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

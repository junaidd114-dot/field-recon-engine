"use client";

import { useState } from "react";
import { MessageCircle, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const suggestions = [
  { label: "Review", description: "Review the most urgent flagged deals" },
  { label: "Dismiss", description: "Dismiss low-priority alerts" },
  { label: "Tell me more", description: "Get a detailed summary of today's queue" },
];

export function AgentChatButton() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "agent" | "user"; text: string }[]>([
    {
      role: "agent",
      text: "Good morning! You have **3 urgent items** requiring attention: 2 deals with failed checks and 1 broker escalation. There are also 8 items awaiting broker response, the oldest being 5 days. What would you like to do?",
    },
  ]);
  const [input, setInput] = useState("");

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    setMessages((prev) => [
      ...prev,
      { role: "user", text },
      { role: "agent", text: `Got it — I'll look into "${text}" for you. One moment...` },
    ]);
    setInput("");
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center"
        aria-label="Open agent chat"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[380px] max-h-[520px] bg-card border border-border rounded-2xl shadow-xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          <span className="font-semibold text-sm">DealFlow Agent</span>
        </div>
        <button onClick={() => setOpen(false)} className="hover:opacity-70 transition-opacity">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-3 max-h-[320px]">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`text-sm rounded-lg px-3 py-2 max-w-[90%] ${
              msg.role === "agent"
                ? "bg-muted text-foreground"
                : "bg-primary text-primary-foreground ml-auto"
            }`}
          >
            {msg.text}
          </div>
        ))}
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <Button
              key={s.label}
              variant="outline"
              size="sm"
              className="text-xs h-7"
              onClick={() => handleSend(s.description)}
            >
              {s.label}
            </Button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border p-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
          placeholder="Ask the agent..."
          className="flex-1 bg-muted rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring text-foreground placeholder:text-muted-foreground"
        />
        <button
          onClick={() => handleSend(input)}
          className="h-9 w-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

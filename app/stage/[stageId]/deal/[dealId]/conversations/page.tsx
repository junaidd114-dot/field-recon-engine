"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Bot, User, Briefcase, StickyNote, CheckCircle2, Clock, AlertCircle, Lightbulb, HelpCircle, Send } from "lucide-react";
import { getConversationsForStage } from "@/lib/data/conversations";
import type { ConversationThread } from "@/lib/data/conversations";
import { ConfidenceBadge } from "@/components/ConfidenceBadge";
import { DealTopBanner } from "@/components/DealTopBanner";
import { getDealById } from "@/lib/data/deals";
import { getDealDetail } from "@/lib/data/deal-detail";

const statusConfig = {
  open: { label: "Open", color: "bg-blue-500", icon: AlertCircle },
  awaiting: { label: "Awaiting", color: "bg-amber-500", icon: Clock },
  resolved: { label: "Resolved", color: "bg-emerald-500", icon: CheckCircle2 },
};

const senderIcon = (role: string) => {
  switch (role) {
    case "broker": return <Briefcase className="h-4 w-4 text-primary" />;
    case "customer": return <User className="h-4 w-4 text-status-success" />;
    case "agent": return <Bot className="h-4 w-4 text-status-info" />;
    default: return <StickyNote className="h-4 w-4 text-muted-foreground" />;
  }
};

export default function DealConversations() {
  const params = useParams<{ stageId: string; dealId: string }>();
  const stageId = params?.stageId ?? "";
  const dealId = params?.dealId ?? "";

  const detail = useMemo(() => {
    const deal = getDealById(stageId, dealId);
    if (!deal) return null;
    return getDealDetail(stageId, deal);
  }, [stageId, dealId]);

  const conversations = getConversationsForStage(stageId);
  const [selectedThread, setSelectedThread] = useState<ConversationThread>(conversations[0]);
  const [replyText, setReplyText] = useState("");

  const isResolved = selectedThread.status === "resolved";

  return (
    <div className="space-y-4 max-w-[1400px]">
      {detail?.deal && (
        <DealTopBanner deal={detail.deal} team={detail.stage} issues={detail.issues} />
      )}

      {/* 3-column card layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* LHS — Thread list */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              Conversations
              <Badge variant="secondary" className="ml-auto text-xs">{conversations.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-0">
            {conversations.map((thread) => {
              const status = statusConfig[thread.status];
              const isActive = thread.id === selectedThread.id;
              return (
                <button
                  key={thread.id}
                  onClick={() => setSelectedThread(thread)}
                  className={`flex items-center gap-3 w-full px-3 py-3 text-left border-b border-border/40 last:border-0 transition-colors hover:bg-muted/50 rounded-md ${
                    isActive ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isActive ? "text-primary" : "text-foreground"}`}>
                      {thread.subject}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {thread.participants.join(", ")}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className="text-xs text-muted-foreground">{thread.lastActivity}</p>
                      {thread.aiConfidence !== undefined && thread.aiConfidence < 0.8 && (
                        <ConfidenceBadge confidence={thread.aiConfidence} />
                      )}
                    </div>
                  </div>
                  <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${status.color}`} />
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Middle — Conversation */}
        <Card className="lg:col-span-1 flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              {selectedThread.subject}
              <Badge variant="outline" className="ml-auto text-xs">
                {statusConfig[selectedThread.status].label}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 flex-1 flex flex-col">
            <div className="space-y-4 flex-1">
              {selectedThread.messages.map((msg) => (
                <div key={msg.id}>
                  {msg.isInternalNote && (
                    <p className="text-xs font-medium text-muted-foreground italic border-l-2 border-muted pl-2">
                      Internal Note: {msg.content}
                    </p>
                  )}
                  {!msg.isInternalNote && (
                    <div className="flex gap-3">
                      <div className="mt-1 shrink-0 h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        {senderIcon(msg.senderRole)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-medium text-foreground">{msg.sender}</span>
                          <span className="text-xs text-muted-foreground capitalize">({msg.senderRole})</span>
                        </div>
                        <div className="mt-1 rounded-lg bg-muted/50 px-3 py-2 text-sm text-foreground">
                          {msg.content}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(msg.timestamp).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Reply box */}
            {!isResolved && (
              <div className="mt-4 pt-3 border-t border-border/40">
                <div className="flex gap-2">
                  <Textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type a reply…"
                    className="min-h-[60px] resize-none text-sm"
                  />
                  <Button size="icon" className="shrink-0 self-end">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* RHS — AI Insights */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              AI Insights
              {selectedThread.aiConfidence !== undefined && (
                <ConfidenceBadge confidence={selectedThread.aiConfidence} size="md" showLabel className="ml-auto" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            {/* AI Summary */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Summary</p>
              <p className="text-sm text-foreground leading-relaxed">{selectedThread.aiSummary}</p>
            </div>

            {selectedThread.aiQuestions && selectedThread.aiQuestions.length > 0 && !isResolved && (
              <>
                <Separator />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <HelpCircle className="h-3.5 w-3.5" /> Questions
                  </p>
                  <div className="space-y-2">
                    {selectedThread.aiQuestions.map((q, i) => (
                      <p key={i} className="text-sm text-foreground leading-relaxed">{q}</p>
                    ))}
                  </div>
                </div>
              </>
            )}

            {selectedThread.suggestedAction && !isResolved && (
              <>
                <Separator />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1.5">
                    <Lightbulb className="h-3.5 w-3.5" /> Suggested Action
                  </p>
                  <p className="text-sm text-foreground leading-relaxed">{selectedThread.suggestedAction}</p>
                </div>
              </>
            )}



            {!isResolved && (
              <>
                <Separator />
                <div className="flex flex-wrap gap-2">
                  <Button size="sm">Reply</Button>
                  <Button size="sm" variant="outline">Request Info</Button>
                  <Button size="sm" variant="outline">Mark Resolved</Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

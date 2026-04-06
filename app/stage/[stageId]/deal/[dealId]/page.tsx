"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import { AlertTriangle, AlertCircle, Info, ArrowRight, Bot, User, Building2, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AgentChatButton } from "@/components/AgentChatButton";
import { DealTopBanner } from "@/components/DealTopBanner";
import { getDealById } from "@/lib/data/deals";
import { getDealDetail } from "@/lib/data/deal-detail";
import type { DealIssue, TimelineEvent } from "@/lib/data/deal-detail";

const severityConfig: Record<DealIssue["severity"], { icon: typeof AlertTriangle; color: string; bg: string }> = {
  high: { icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" },
  medium: { icon: AlertCircle, color: "text-status-warning", bg: "bg-status-warning/10" },
  low: { icon: Info, color: "text-status-info", bg: "bg-status-info/10" },
};

const timelineTypeConfig: Record<TimelineEvent["type"], { icon: typeof Bot; color: string }> = {
  system: { icon: Cpu, color: "text-muted-foreground" },
  human: { icon: User, color: "text-primary" },
  broker: { icon: Building2, color: "text-status-warning" },
  ai: { icon: Bot, color: "text-status-info" },
};

export default function DealDetail() {
  const params = useParams<{ stageId: string; dealId: string }>();
  const stageId = params?.stageId ?? "";
  const dealId = params?.dealId ?? "";
  const router = useRouter();

  const detail = useMemo(() => {
    const deal = getDealById(stageId, dealId);
    if (!deal) return null;
    return getDealDetail(stageId, deal);
  }, [stageId, dealId]);

  if (!detail) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Deal not found.</p>
      </div>
    );
  }

  const { deal, issues, timeline, aiSummary } = detail;

  return (
    <div className="space-y-4 max-w-[1400px]">
      <DealTopBanner deal={deal} team={detail.stage} issues={issues} />

      {/* 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LHS — Issues */}
        <div className="lg:col-span-3">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                {issues.length} Issues Found
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {issues.map((issue) => {
                const config = severityConfig[issue.severity];
                const Icon = config.icon;
                return (
                  <div
                    key={issue.id}
                    className={`${config.bg} rounded-lg p-3 space-y-1 cursor-pointer hover:ring-1 hover:ring-border transition-all`}
                  >
                    <div className="flex items-start gap-2">
                      <Icon className={`h-4 w-4 ${config.color} mt-0.5 shrink-0`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{issue.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{issue.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2 gap-1.5"
                onClick={() => {
                  const sorted = [...issues].sort((a, b) => {
                    const order = { high: 0, medium: 1, low: 2 };
                    return order[a.severity] - order[b.severity];
                  });
                  if (sorted.length > 0) {
                    const sectionMap: Record<string, string> = { checks: "checks", documents: "documents", conversations: "conversations", decision: "decision", summary: "" };
                    const route = sectionMap[sorted[0].section] ?? "";
                    router.push(route ? `/stage/${stageId}/deal/${dealId}/${route}` : `/stage/${stageId}/deal/${dealId}`);
                  }
                }}
              >
                Go to first issue
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Middle — Timeline */}
        <div className="lg:col-span-5">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Case Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />

                <div className="space-y-0">
                  {timeline.map((event) => {
                    const config = timelineTypeConfig[event.type];
                    const Icon = config.icon;
                    return (
                      <div key={event.id} className="relative flex gap-3 pb-4 last:pb-0">
                        {/* Dot */}
                        <div className={`relative z-10 flex items-center justify-center h-[30px] w-[30px] rounded-full bg-card border border-border shrink-0`}>
                          <Icon className={`h-3.5 w-3.5 ${config.color}`} />
                        </div>
                        {/* Content */}
                        <div className="pt-1 min-w-0">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="text-sm font-medium text-foreground">{event.action}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">{event.timestamp}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{event.actor}</p>
                          {event.detail && (
                            <p className="text-xs text-muted-foreground/80 mt-0.5">{event.detail}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RHS — AI Summary */}
        <div className="lg:col-span-4">
          <Card className="h-full border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Bot className="h-4 w-4 text-status-info" />
                AI Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none text-sm text-foreground/90 leading-relaxed space-y-3">
                {aiSummary.split("\n\n").map((paragraph, i) => (
                  <p key={i} className="text-sm" dangerouslySetInnerHTML={{
                    __html: paragraph
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\n- /g, '<br/>• ')
                      .replace(/\n/g, '<br/>')
                  }} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AgentChatButton />
    </div>
  );
}

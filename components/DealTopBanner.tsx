"use client";

import { useRouter, useParams } from "next/navigation";
import { Car, AlertTriangle, AlertCircle, Info, ArrowRight, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { DealIssue } from "@/lib/data/deal-detail";
import type { Deal } from "@/lib/data/deals";

const teamLabels: Record<string, string> = {
  underwriting: "Underwriting",
  payout: "Payout",
  accounts: "Accounts",
};

const severityConfig: Record<DealIssue["severity"], { icon: typeof AlertTriangle; color: string }> = {
  high: { icon: AlertTriangle, color: "text-destructive" },
  medium: { icon: AlertCircle, color: "text-status-warning" },
  low: { icon: Info, color: "text-status-info" },
};

const sectionRouteMap: Record<string, string> = {
  checks: "checks",
  documents: "documents",
  conversations: "conversations",
  decision: "decision",
  summary: "",
};

interface DealTopBannerProps {
  deal: Deal;
  team: string;
  issues: DealIssue[];
}

export function DealTopBanner({ deal, team, issues }: DealTopBannerProps) {
  const router = useRouter();
  const params = useParams<{ stageId: string; dealId: string }>();
  const stageId = params?.stageId;
  const dealId = params?.dealId;
  const basePath = `/stage/${stageId}/deal/${dealId}`;

  const highCount = issues.filter(i => i.severity === "high").length;
  const totalCount = issues.length;

  const navigateToIssue = (issue: DealIssue) => {
    if (!stageId || !dealId) return;
    const route = sectionRouteMap[issue.section] ?? "";
    router.push(route ? `${basePath}/${route}` : basePath);
  };

  const navigateToFirstIssue = () => {
    // Prioritise high severity first
    const sorted = [...issues].sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.severity] - order[b.severity];
    });
    if (sorted.length > 0) navigateToIssue(sorted[0]);
  };

  return (
    <div className="bg-foreground/90 rounded-lg px-5 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xs text-white/60 uppercase tracking-wider font-medium">Deal</span>
        <span className="text-sm text-white font-mono font-bold">{deal.id}</span>
      </div>
      <Separator orientation="vertical" className="h-5 bg-white/20 hidden sm:block" />
      <div className="flex items-center gap-2">
        <span className="text-sm text-white font-medium">{deal.applicant}</span>
      </div>
      <Separator orientation="vertical" className="h-5 bg-white/20 hidden sm:block" />
      <div className="flex items-center gap-1.5">
        <Car className="h-3.5 w-3.5 text-white/60" />
        <span className="text-sm text-white/90">{deal.vehicle}</span>
      </div>
      <Separator orientation="vertical" className="h-5 bg-white/20 hidden sm:block" />
      <span className="text-sm text-white font-semibold">{deal.value}</span>

      {/* Issues dropdown */}
      {totalCount > 0 && (
        <>
          <Separator orientation="vertical" className="h-5 bg-white/20 hidden sm:block" />
          <Popover>
            <PopoverTrigger className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                <span className="text-sm text-white font-medium">
                  {totalCount} Issue{totalCount !== 1 ? "s" : ""}
                </span>
                {highCount > 0 && (
                  <Badge className="bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0 h-4">
                    {highCount} high
                  </Badge>
                )}
                <ChevronDown className="h-3 w-3 text-white/60" />
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
              <div className="px-3 py-2 border-b border-border/40">
                <p className="text-sm font-semibold text-foreground">{totalCount} Issues Found</p>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {issues.map((issue) => {
                  const config = severityConfig[issue.severity];
                  const Icon = config.icon;
                  return (
                    <button
                      key={issue.id}
                      onClick={() => navigateToIssue(issue)}
                      className="flex items-start gap-2.5 w-full px-3 py-2.5 text-left hover:bg-muted/50 transition-colors border-b border-border/20 last:border-0"
                    >
                      <Icon className={`h-4 w-4 ${config.color} mt-0.5 shrink-0`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{issue.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{issue.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="px-3 py-2 border-t border-border/40">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-1.5"
                  onClick={navigateToFirstIssue}
                >
                  Go to first issue
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </>
      )}

      <div className="ml-auto flex items-center gap-2">
        <Badge variant="outline" className="border-white/30 text-white text-xs">
          {teamLabels[team] || team}
        </Badge>
        <Badge className="bg-primary-light text-white text-xs">
          {deal.context}
        </Badge>
      </div>
    </div>
  );
}

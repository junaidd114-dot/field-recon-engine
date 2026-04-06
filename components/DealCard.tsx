"use client";

import { History, Car } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Deal } from "@/lib/data/deals";

interface DealCardProps {
  title: string;
  count: number;
  deals: Deal[];
  icon: React.ReactNode;
  accentColor: string;
}

export function DealCard({ title, count, deals, icon, accentColor }: DealCardProps) {
  const sorted = [...deals].sort((a, b) => b.ageInDays - a.ageInDays);
  const router = useRouter();
  const params = useParams<{ stageId: string }>();
  const stageId = params?.stageId;

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <h3 className="font-semibold text-foreground text-sm">{title}</h3>
        </div>
        <span
          className={`${accentColor} text-white text-xs font-bold rounded-full h-6 min-w-[1.5rem] flex items-center justify-center px-1.5`}
        >
          {count}
        </span>
      </div>

      {/* Deal list */}
      <div className="flex-1 overflow-auto max-h-[360px]">
        {sorted.map((deal, i) => (
          <div
            key={deal.id}
            onClick={() => stageId && router.push(`/stage/${stageId}/deal/${deal.id}`)}
            className={`group flex items-start gap-3 px-4 py-2.5 hover:bg-muted/50 cursor-pointer transition-colors text-sm ${
              i < sorted.length - 1 ? "border-b border-border/50" : ""
            }`}
          >
            {/* Left: ID + applicant + vehicle */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground">{deal.id}</span>
                {deal.workedOnBefore && (
                  <Tooltip>
                    <TooltipTrigger render={<span />} className="inline-flex">
                      <History className="h-3.5 w-3.5 text-primary" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      Last action: {deal.workedOnBefore.action}
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <p className="text-foreground font-medium truncate">{deal.applicant}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Car className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground truncate">{deal.vehicle}</span>
              </div>
            </div>

            {/* Right: value + age + context */}
            <div className="text-right shrink-0">
              <p className="text-xs font-semibold text-foreground">{deal.value}</p>
              <p className="text-xs text-muted-foreground">{deal.age}</p>
              <p className="text-xs font-medium text-foreground truncate max-w-[140px]">
                {deal.context}
              </p>
              {deal.contextDetail && (
                <p className="text-xs text-muted-foreground truncate max-w-[140px]">
                  {deal.contextDetail}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ConfidenceBadgeProps {
  confidence: number; // 0-1
  size?: "sm" | "md";
  showLabel?: boolean;
  className?: string;
}

function getConfidenceLevel(confidence: number) {
  if (confidence >= 0.9) return { label: "High", color: "text-status-success", bg: "bg-status-success", ring: "ring-status-success/20" };
  if (confidence >= 0.75) return { label: "Medium", color: "text-status-warning", bg: "bg-status-warning", ring: "ring-status-warning/20" };
  return { label: "Low", color: "text-destructive", bg: "bg-destructive", ring: "ring-destructive/20" };
}

export function ConfidenceBadge({ confidence, size = "sm", showLabel = false, className }: ConfidenceBadgeProps) {
  const pct = Math.round(confidence * 100);
  const level = getConfidenceLevel(confidence);

  const barWidth = size === "sm" ? "w-8" : "w-12";
  const barHeight = size === "sm" ? "h-1" : "h-1.5";
  const textSize = size === "sm" ? "text-[10px]" : "text-xs";

  return (
    <Tooltip>
      <TooltipTrigger render={<div />} className={cn("inline-flex items-center gap-1.5 cursor-default", className)}>
          <div className={cn("rounded-full bg-muted overflow-hidden", barWidth, barHeight)}>
            <div
              className={cn("h-full rounded-full transition-all", level.bg)}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className={cn("font-mono font-medium tabular-nums", textSize, level.color)}>
            {pct}%
          </span>
          {showLabel && (
            <span className={cn("font-medium", textSize, level.color)}>
              {level.label}
            </span>
          )}
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        <p>AI Confidence: {pct}% ({level.label})</p>
        {confidence < 0.75 && <p className="text-destructive mt-0.5">Low confidence — human review recommended</p>}
      </TooltipContent>
    </Tooltip>
  );
}

export { getConfidenceLevel };

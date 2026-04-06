"use client";

import { useParams } from "next/navigation";
import { AlertTriangle, Clock, CheckCircle, ArrowDownRight } from "lucide-react";
import { DealCard } from "@/components/DealCard";
import { AgentChatButton } from "@/components/AgentChatButton";
import { stageDealsMap, stageLabels } from "@/lib/data/deals";

export default function StageDashboard() {
  const params = useParams<{ stageId: string }>();
  const stageId = params?.stageId ?? "";
  const label = stageLabels[stageId] || stageId;
  const deals = stageDealsMap[stageId];

  if (!deals) {
    return (
      <div className="space-y-6 ">
        <h2 className="text-2xl font-bold text-foreground">{label} Team</h2>
        <p className="text-muted-foreground">No data available for this team.</p>
      </div>
    );
  }

  const stats = [
    { label: "Action required", value: deals.actionRequired.length },
    { label: "Awaiting broker response", value: deals.awaitingBroker.length },
    { label: "Completed today", value: deals.completedToday.length },
    { label: "Incoming", value: deals.incoming.length },
  ];

  return (
    <div className="space-y-6 ">
      <h2 className="text-2xl font-bold text-foreground">{label} Team</h2>

      {/* Top stats bar */}
      <div className="flex flex-wrap items-center gap-1 bg-foreground/90 rounded-lg px-2 py-2">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-2 px-4 py-1.5 text-sm text-white font-medium"
          >
            <span>{s.label}:</span>
            <span className="font-bold">{s.value}</span>
          </div>
        ))}
      </div>

      {/* 2x2 Card Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DealCard
          title="Action required"
          count={deals.actionRequired.length}
          deals={deals.actionRequired}
          icon={<AlertTriangle className="h-4 w-4 text-primary" />}
          accentColor="bg-primary"
        />
        <DealCard
          title="Awaiting broker response"
          count={deals.awaitingBroker.length}
          deals={deals.awaitingBroker}
          icon={<Clock className="h-4 w-4 text-status-warning" />}
          accentColor="bg-status-warning"
        />
        <DealCard
          title="Completed today"
          count={deals.completedToday.length}
          deals={deals.completedToday}
          icon={<CheckCircle className="h-4 w-4 text-status-success" />}
          accentColor="bg-status-success"
        />
        <DealCard
          title="Incoming (upstream)"
          count={deals.incoming.length}
          deals={deals.incoming}
          icon={<ArrowDownRight className="h-4 w-4 text-status-info" />}
          accentColor="bg-status-info"
        />
      </div>

      <AgentChatButton />
    </div>
  );
}

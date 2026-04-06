"use client"

import { ArrowUp, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { KpiCard } from "@/components/KpiCard";
import { TeamBreakdownCard } from "@/components/TeamBreakdownCard";
import { StageDistributionChart } from "@/components/StageDistributionChart";

const underwritingData = [
  { name: "Incoming", value: 42 },
  { name: "In Review", value: 28 },
  { name: "Action Req", value: 15 },
  { name: "Completed", value: 67 },
];

const payoutData = [
  { name: "Incoming", value: 35 },
  { name: "Doc Check", value: 22 },
  { name: "Awaiting", value: 18 },
  { name: "Completed", value: 51 },
];

const accountsData = [
  { name: "Incoming", value: 29 },
  { name: "Reviewing", value: 14 },
  { name: "Kicked Back", value: 8 },
  { name: "Completed", value: 44 },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6 max-w-7xl">
      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Deals in Flight"
          value="1,250"
          subtitle="↑ 5%"
          gradientClass="kpi-gradient-1"
          icon={<ArrowUp className="h-5 w-5" />}
        />
        <KpiCard
          title="Average Cycle Time"
          value="18"
          subtitle="days"
          gradientClass="kpi-gradient-2"
          icon={<Clock className="h-5 w-5" />}
        />
        <KpiCard
          title="Deals Completed Today"
          value="45"
          gradientClass="kpi-gradient-3"
          icon={<CheckCircle className="h-5 w-5" />}
        />
        <KpiCard
          title="On Hold / Awaiting"
          value="23"
          gradientClass="kpi-gradient-4"
          icon={<AlertTriangle className="h-5 w-5" />}
        />
      </div>

      {/* Team Breakdowns + Stage Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 space-y-4">
          <TeamBreakdownCard teamName="Underwriting" data={underwritingData} />
          <TeamBreakdownCard teamName="Payout" data={payoutData} />
          <TeamBreakdownCard teamName="Accounts" data={accountsData} />
        </div>
        <div className="lg:col-span-2">
          <StageDistributionChart />
        </div>
      </div>
    </div>
  );
}

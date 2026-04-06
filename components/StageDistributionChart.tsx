"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";

const data = [
  { stage: "Prospect", count: 320, opacity: 0.3 },
  { stage: "Submitted", count: 180, opacity: 1 },
  { stage: "Underwriting", count: 450, opacity: 1 },
  { stage: "Payout", count: 290, opacity: 1 },
  { stage: "Accounts", count: 1250, opacity: 1 },
  { stage: "Completed", count: 890, opacity: 1 },
];

export function StageDistributionChart() {
  return (
    <div className="rounded-lg bg-card p-5 shadow-sm border border-border h-full">
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
        Overall Stage Distribution
      </p>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(214,20%,92%)" />
          <XAxis
            dataKey="stage"
            tick={{ fontSize: 10, fill: "hsl(215,12%,50%)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "hsl(215,12%,50%)" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "hsl(0,0%,100%)",
              border: "1px solid hsl(214,20%,88%)",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.opacity < 1 ? "hsl(214,15%,80%)" : "hsl(214,55%,48%)"}
                strokeDasharray={entry.opacity < 1 ? "4 2" : undefined}
                stroke={entry.opacity < 1 ? "hsl(214,15%,70%)" : undefined}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

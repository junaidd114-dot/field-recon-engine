"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface TeamBreakdownCardProps {
  teamName: string;
  data: { name: string; value: number }[];
}

export function TeamBreakdownCard({ teamName, data }: TeamBreakdownCardProps) {
  return (
    <div className="rounded-lg bg-card p-5 shadow-sm border border-border">
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
        {teamName}
      </p>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data} barCategoryGap="25%">
          <XAxis
            dataKey="name"
            tick={{ fontSize: 9, fill: "hsl(215,12%,50%)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide />
          <Tooltip
            contentStyle={{
              background: "hsl(0,0%,100%)",
              border: "1px solid hsl(214,20%,88%)",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="hsl(214,62%,38%)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

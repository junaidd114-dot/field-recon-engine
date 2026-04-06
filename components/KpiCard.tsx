"use client";

import { ReactNode } from "react";

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  gradientClass: string;
}

export function KpiCard({ title, value, subtitle, icon, gradientClass }: KpiCardProps) {
  return (
    <div className={`${gradientClass} rounded-lg p-5 text-primary-foreground shadow-sm`}>
      <p className="text-[11px] font-semibold uppercase tracking-widest opacity-90">
        {title}
      </p>
      <div className="mt-2 flex items-end justify-between">
        <div>
          <span className="text-3xl font-extrabold leading-none">{value}</span>
          {subtitle && (
            <span className="ml-1.5 text-xs font-medium opacity-80">{subtitle}</span>
          )}
        </div>
        {icon && <div className="opacity-70">{icon}</div>}
      </div>
    </div>
  );
}

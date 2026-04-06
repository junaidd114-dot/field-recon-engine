"use client";

import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  CheckCircle2, XCircle, MessageSquare, Save, AlertTriangle,
  RotateCcw, Send, FileCheck, ClipboardCheck, ShieldCheck
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { AgentChatButton } from "@/components/AgentChatButton";
import { DealTopBanner } from "@/components/DealTopBanner";
import { getDealById } from "@/lib/data/deals";
import { getDealDetail } from "@/lib/data/deal-detail";
import { getChecksForStage } from "@/lib/data/checks";
import type { CheckStatus } from "@/lib/data/checks";


interface PendingAction {
  id: string;
  icon: typeof RotateCcw;
  label: string;
  detail: string;
  type: "override" | "info_request" | "accepted" | "updated" | "flagged";
}

function derivePendingActions(stageId: string): PendingAction[] {
  // Simulated pending actions based on review activity
  const actions: Record<string, PendingAction[]> = {
    underwriting: [
      { id: "PA-1", icon: RotateCcw, label: "Override: Income Verification", detail: "Reason: Bonus income not reflected in payslip", type: "override" },
      { id: "PA-2", icon: Send, label: "Info Requested: Broker", detail: "Outstanding: Employer confirmation letter", type: "info_request" },
      { id: "PA-3", icon: CheckCircle2, label: "Updated: Risk Score", detail: "New Value: 7.2 (was 6.8)", type: "updated" },
      { id: "PA-4", icon: AlertTriangle, label: "Document Flagged: Payslip", detail: "Employer logo partially obscured", type: "flagged" },
      { id: "PA-5", icon: FileCheck, label: "Document Accepted: Bank Statement", detail: "Verified Feb 2026 statement", type: "accepted" },
      { id: "PA-6", icon: FileCheck, label: "Document Accepted: Application Form", detail: "All fields complete, v3.2", type: "accepted" },
    ],
    payout: [
      { id: "PA-1", icon: RotateCcw, label: "Override: V5 Keeper Check", detail: "Reason: Recent transfer, log book in transit", type: "override" },
      { id: "PA-2", icon: CheckCircle2, label: "Accepted: Outstanding Finance", detail: "Confirmed settlement before payout", type: "accepted" },
      { id: "PA-3", icon: Send, label: "Info Requested: Broker", detail: "Outstanding: MOT renewal confirmation", type: "info_request" },
    ],
    accounts: [
      { id: "PA-1", icon: RotateCcw, label: "Override: Commission Rate", detail: "Reason: Pre-approved exception for volume dealer", type: "override" },
      { id: "PA-2", icon: CheckCircle2, label: "Accepted: VAT Discrepancy", detail: "Noted £400 overstatement, adjusted in system", type: "accepted" },
    ],
  };
  return actions[stageId] || actions.underwriting;
}

interface ApplicationSection {
  title: string;
  rows: { label: string; value: string; highlight?: boolean }[];
}

function getApplicationDetails(): ApplicationSection[] {
  return [
    {
      title: "Applicant Details",
      rows: [
        { label: "Full name", value: "Adam James Piers" },
        { label: "Date of birth", value: "15/03/1988" },
        { label: "Address", value: "14 Birchwood Lane, Solihull, B91 3QR" },
        { label: "Employment", value: "Full-time, 3 years at current employer" },
      ],
    },
    {
      title: "Vehicle",
      rows: [
        { label: "Make / model", value: "2021 Ford Focus ST-Line 1.0T EcoBoost" },
        { label: "Registration", value: "WR21 XYZ" },
        { label: "Mileage", value: "28,400 miles (at invoice)" },
      ],
    },
    {
      title: "Finance",
      rows: [
        { label: "Cash price", value: "£14,000" },
        { label: "Deposit", value: "£1,500" },
        { label: "Amount financed", value: "£12,500" },
        { label: "Monthly payment", value: "£287.43 × 48 months" },
        { label: "Total payable", value: "£17,245.80" },
        { label: "APR", value: "9.9%" },
      ],
    },
    {
      title: "Dealer",
      rows: [
        { label: "Name", value: "Midland Motor Group Ltd" },
        { label: "FCA FRN", value: "123456" },
        { label: "Broker", value: "CarMoney" },
      ],
    },
  ];
}

type DecisionType = "approve" | "reject" | "request_info" | "save_draft";

function deriveRecommendation(pendingActions: PendingAction[]): { recommended: DecisionType; reason: string } {
  const hasInfoRequest = pendingActions.some(a => a.type === "info_request");
  const hasOverride = pendingActions.some(a => a.type === "override");
  const hasFlagged = pendingActions.some(a => a.type === "flagged");

  if (hasInfoRequest) {
    return { recommended: "request_info", reason: "Outstanding information requests need broker response before final decision." };
  }
  if (hasFlagged && !hasOverride) {
    return { recommended: "save_draft", reason: "Flagged items require review or override before proceeding." };
  }
  return { recommended: "approve", reason: "All checks reviewed, overrides documented. Ready for approval." };
}

const actionTypeStyles: Record<PendingAction["type"], string> = {
  override: "text-status-warning",
  info_request: "text-status-info",
  accepted: "text-status-success",
  updated: "text-primary",
  flagged: "text-destructive",
};

export default function DealDecision() {
  const params = useParams<{ stageId: string; dealId: string }>();
  const stageId = params?.stageId ?? "";
  const dealId = params?.dealId ?? "";
  const [notes, setNotes] = useState("");

  const detail = useMemo(() => {
    const deal = getDealById(stageId, dealId);
    if (!deal) return null;
    return getDealDetail(stageId, deal);
  }, [stageId, dealId]);

  const pendingActions = useMemo(() => derivePendingActions(stageId), [stageId]);
  const applicationSections = useMemo(() => getApplicationDetails(), []);
  const recommendation = useMemo(() => deriveRecommendation(pendingActions), [pendingActions]);
  const checks = useMemo(() => getChecksForStage(stageId), [stageId]);

  const checkSummary = useMemo(() => {
    const counts: Record<CheckStatus, number> = { pass: 0, fail: 0, warning: 0, pending: 0 };
    checks.forEach(c => counts[c.status]++);
    return counts;
  }, [checks]);

  if (!detail) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Deal not found.</p>
      </div>
    );
  }

  const { deal } = detail;

  const isDisabled = (action: DecisionType) => {
    const hasInfoRequest = pendingActions.some(a => a.type === "info_request");
    if (action === "approve" && hasInfoRequest) return true;
    return false;
  };

  const decisions: { type: DecisionType; label: string; icon: typeof CheckCircle2; variant: "default" | "destructive" | "outline" | "secondary" }[] = [
    { type: "approve", label: "Approve & Bind", icon: CheckCircle2, variant: "default" },
    { type: "request_info", label: "Request More Info", icon: MessageSquare, variant: "secondary" },
    { type: "reject", label: "Reject Application", icon: XCircle, variant: "destructive" },
    { type: "save_draft", label: "Save as Draft", icon: Save, variant: "outline" },
  ];

  return (
    <div className="space-y-4 max-w-[1400px]">
      <DealTopBanner deal={deal} team={detail.stage} issues={detail.issues} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* LHS: Pending Actions */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                Pending Actions
                <Badge variant="secondary" className="ml-auto text-xs">{pendingActions.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 pt-0">
              {pendingActions.map(action => {
                const Icon = action.icon;
                return (
                  <div key={action.id} className="flex items-start gap-3 py-2.5 border-b border-border/40 last:border-0">
                    <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${actionTypeStyles[action.type]}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground leading-tight">{action.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{action.detail}</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Decision Notes */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Decision Notes</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Textarea
                placeholder="Add notes for the decision record..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="min-h-[100px] text-sm"
              />
              <p className="text-xs text-muted-foreground mt-2">These notes will be attached to the final decision record.</p>
            </CardContent>
          </Card>
        </div>

        {/* Middle: Application Details */}
        <div className="lg:col-span-1 space-y-4">
          {applicationSections.map(section => (
            <Card key={section.title}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">{section.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="divide-y divide-border/40">
                  {section.rows.map(row => (
                    <div key={row.label} className="flex items-center justify-between py-2 text-sm">
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className={`font-medium ${row.highlight ? "text-status-warning font-semibold" : "text-foreground"}`}>
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* RHS: Validation Status & Decision */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-border/60">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start gap-3 mb-4">
                {checkSummary.fail > 0 ? (
                  <>
                    <AlertTriangle className="h-6 w-6 text-status-warning shrink-0" />
                    <div>
                      <p className="font-semibold text-foreground">
                        {checkSummary.fail} check{checkSummary.fail > 1 ? "s" : ""} failed · {checkSummary.warning} warning{checkSummary.warning !== 1 ? "s" : ""} · {checkSummary.pass} passed
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">{recommendation.reason}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-6 w-6 text-status-success shrink-0" />
                    <div>
                      <p className="font-semibold text-status-success">All Checks Passed. Ready for Decision.</p>
                      <p className="text-sm text-muted-foreground mt-1">{recommendation.reason}</p>
                    </div>
                  </>
                )}
              </div>

              <div className="flex flex-col gap-2">
                {decisions.map(d => {
                  const Icon = d.icon;
                  const disabled = isDisabled(d.type);
                  const isRecommended = d.type === recommendation.recommended;
                  return (
                    <Button
                      key={d.type}
                      variant={d.variant}
                      disabled={disabled}
                      className={`gap-2 w-full justify-start ${isRecommended ? "ring-2 ring-primary ring-offset-2" : ""} ${disabled ? "opacity-40" : ""}`}
                    >
                      <Icon className="h-4 w-4" />
                      {d.label}
                      {isRecommended && (
                        <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0 border-primary text-primary">
                          Recommended
                        </Badge>
                      )}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <AgentChatButton />
    </div>
  );
}

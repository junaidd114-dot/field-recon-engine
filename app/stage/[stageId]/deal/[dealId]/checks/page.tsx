"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  FileCheck, FileSearch, FileDiff, Scale, Database, Building,
  CheckCircle2, XCircle, AlertTriangle, Clock,
  ChevronRight, Shield, MessageSquare, Ban,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { AgentChatButton } from "@/components/AgentChatButton";
import { ConfidenceBadge } from "@/components/ConfidenceBadge";
import { DealTopBanner } from "@/components/DealTopBanner";
import { getDealById } from "@/lib/data/deals";
import { getDealDetail } from "@/lib/data/deal-detail";
import { getChecksForStage, getChecksByCategory, categoryLabels, matchTypeLabels } from "@/lib/data/checks";
import type { CheckCategory, CheckStatus } from "@/lib/data/checks";

const categoryIconMap: Record<CheckCategory, typeof FileCheck> = {
  doc_validation: FileCheck,
  intra_doc: FileSearch,
  inter_doc: FileDiff,
  policy_rules: Scale,
  system_lookup: Database,
  entity_resolution: Building,
};

const statusConfig: Record<CheckStatus, { icon: typeof CheckCircle2; color: string; label: string; bg: string }> = {
  pass: { icon: CheckCircle2, color: "text-status-success", label: "Pass", bg: "bg-status-success/10" },
  fail: { icon: XCircle, color: "text-destructive", label: "Fail", bg: "bg-destructive/10" },
  warning: { icon: AlertTriangle, color: "text-status-warning", label: "Warning", bg: "bg-status-warning/10" },
  pending: { icon: Clock, color: "text-muted-foreground", label: "Pending", bg: "bg-muted" },
};

export default function DealChecks() {
  const params = useParams<{ stageId: string; dealId: string }>();
  const stageId = params?.stageId ?? "";
  const dealId = params?.dealId ?? "";
  const [selectedCheckId, setSelectedCheckId] = useState<string | null>(null);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  const detail = useMemo(() => {
    const deal = getDealById(stageId, dealId);
    if (!deal) return null;
    return getDealDetail(stageId, deal);
  }, [stageId, dealId]);

  const checks = useMemo(() => getChecksForStage(stageId), [stageId]);
  const grouped = useMemo(() => getChecksByCategory(checks), [checks]);

  const selectedCheck = useMemo(() => {
    if (selectedCheckId) return checks.find((c) => c.id === selectedCheckId) || null;
    // Default to first failing check, or first check
    return checks.find((c) => c.status === "fail") || checks[0] || null;
  }, [selectedCheckId, checks]);

  const activeDocId = selectedDocId || selectedCheck?.documents[0]?.id || null;

  if (!detail) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Deal not found.</p>
      </div>
    );
  }

  const { deal } = detail;

  const totalChecks = checks.length;
  const failCount = checks.filter((c) => c.status === "fail").length;
  const warnCount = checks.filter((c) => c.status === "warning").length;
  const passCount = checks.filter((c) => c.status === "pass").length;

  return (
    <div className="space-y-4 max-w-[1400px]">
      <DealTopBanner deal={deal} team={detail.stage} issues={detail.issues} />

      {/* Summary strip */}
      <div className="flex items-center gap-4 px-1">
        <span className="text-sm font-semibold text-foreground">{totalChecks} Checks</span>
        <div className="flex items-center gap-1.5">
          <XCircle className="h-3.5 w-3.5 text-destructive" />
          <span className="text-xs text-destructive font-medium">{failCount} Failed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 text-status-warning" />
          <span className="text-xs text-status-warning font-medium">{warnCount} Warnings</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-status-success" />
          <span className="text-xs text-status-success font-medium">{passCount} Passed</span>
        </div>
      </div>

      {/* 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LHS — Check List by Category */}
        <div className="lg:col-span-3">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Checks / Issues</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 overflow-auto max-h-[calc(100vh-280px)]">
              {(Object.keys(grouped) as CheckCategory[]).map((cat) => {
                const catChecks = grouped[cat];
                if (!catChecks || catChecks.length === 0) return null;
                const CatIcon = categoryIconMap[cat];
                const catFails = catChecks.filter((c) => c.status === "fail" || c.status === "warning").length;
                return (
                  <div key={cat}>
                    <div className="flex items-center gap-2 mb-2">
                      <CatIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-semibold text-foreground uppercase tracking-wider">{categoryLabels[cat]}</span>
                      {catFails > 0 && (
                        <Badge variant="destructive" className="text-[10px] h-4 px-1.5">{catFails}</Badge>
                      )}
                    </div>
                    <div className="space-y-1">
                      {catChecks.map((check) => {
                        const sc = statusConfig[check.status];
                        const StatusIcon = sc.icon;
                        const isActive = selectedCheck?.id === check.id;
                        return (
                          <button
                            key={check.id}
                            onClick={() => { setSelectedCheckId(check.id); setSelectedDocId(null); }}
                            className={`w-full text-left flex items-center gap-2 px-2.5 py-2 rounded-md transition-all text-sm ${
                              isActive
                                ? "bg-primary/10 ring-1 ring-primary/30"
                                : "hover:bg-muted/50"
                            }`}
                          >
                            <StatusIcon className={`h-3.5 w-3.5 ${sc.color} shrink-0`} />
                            <span className={`truncate ${isActive ? "font-medium text-foreground" : "text-foreground/80"}`}>
                              {check.title}
                            </span>
                            <ConfidenceBadge confidence={check.confidence} className="ml-auto shrink-0" />
                            {isActive && <ChevronRight className="h-3.5 w-3.5 text-primary shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Middle — Check Detail + Data + Document Viewer */}
        <div className="lg:col-span-5">
          {selectedCheck ? (
            <Card className="h-full">
              <CardContent className="pt-5 space-y-5 overflow-auto max-h-[calc(100vh-280px)]">
                {/* Check info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {selectedCheck.id}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">
                      {matchTypeLabels[selectedCheck.matchType]}
                    </Badge>
                    {selectedCheck.tolerance && (
                      <Badge variant="secondary" className="text-[10px]">
                        Tolerance: {selectedCheck.tolerance}
                      </Badge>
                    )}
                    <ConfidenceBadge confidence={selectedCheck.confidence} size="md" showLabel />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">{selectedCheck.title}</h3>
                  <p className="text-xs text-muted-foreground">{selectedCheck.description}</p>
                </div>

                <Separator />

                {/* Data comparison table */}
                <div>
                  <h4 className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wider">Data Comparison</h4>
                  <div className="rounded-lg border border-border overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="text-left px-3 py-2 font-medium text-muted-foreground">Field</th>
                          <th className="text-left px-3 py-2 font-medium text-muted-foreground">Value</th>
                          <th className="text-left px-3 py-2 font-medium text-muted-foreground">Source / Expected</th>
                          <th className="text-center px-3 py-2 font-medium text-muted-foreground w-10">✓</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedCheck.dataRows.map((row, i) => (
                          <tr key={i} className={`border-t border-border ${!row.match ? "bg-destructive/5" : ""}`}>
                            <td className="px-3 py-2 font-medium text-foreground">{row.field}</td>
                            <td className={`px-3 py-2 ${!row.match ? "text-destructive font-semibold" : "text-foreground"}`}>
                              {row.sourceA}
                            </td>
                            <td className="px-3 py-2 text-muted-foreground">{row.sourceB}</td>
                            <td className="px-3 py-2 text-center">
                              {row.match ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-status-success inline-block" />
                              ) : (
                                <XCircle className="h-3.5 w-3.5 text-destructive inline-block" />
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {selectedCheck.dataRows.some((r) => r.note) && (
                    <div className="mt-2 space-y-1">
                      {selectedCheck.dataRows.filter((r) => r.note).map((r, i) => (
                        <p key={i} className="text-[10px] text-muted-foreground">
                          <span className="font-medium">{r.field}:</span> {r.note}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Document selector + viewer placeholder */}
                <div>
                <h4 className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wider">Related Documents & Data</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCheck.documents.map((doc) => {
                      const isActive = activeDocId === doc.id;
                      const isSystem = doc.type === "system";
                      return (
                        <button
                          key={doc.id}
                          onClick={() => setSelectedDocId(doc.id)}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs transition-all ${
                            isActive
                              ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/30"
                              : "border-border bg-background text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                          }`}
                        >
                          {isSystem ? (
                            <Database className="h-3 w-3 shrink-0" />
                          ) : (
                            <FileCheck className="h-3 w-3 shrink-0" />
                          )}
                          <span className="truncate max-w-[120px]">{doc.name}</span>
                          <span className="text-[10px] text-muted-foreground/60">{doc.version}</span>
                        </button>
                      );
                    })}
                  </div>

                  {activeDocId && (() => {
                    const doc = selectedCheck.documents.find((d) => d.id === activeDocId);
                    if (!doc) return null;
                    return (
                      <div className="mt-3">
                        <div className="rounded-lg border border-border bg-muted/30 h-40 flex items-center justify-center">
                          <div className="text-center">
                            {doc.type === "system" ? (
                              <Database className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                            ) : (
                              <FileCheck className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                            )}
                            <p className="text-xs text-muted-foreground">{doc.name}</p>
                            <p className="text-[10px] text-muted-foreground/60 mt-1">Document preview</p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <p className="text-sm text-muted-foreground">Select a check to view details</p>
            </Card>
          )}
        </div>

        {/* RHS — Check Outcome & Actions */}
        <div className="lg:col-span-4">
          {selectedCheck ? (
            <Card className="h-full">
              <CardContent className="pt-5 space-y-5">
                {/* Check title + status */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">{selectedCheck.title}</h3>
                  <p className="text-xs text-muted-foreground mb-3">{selectedCheck.description}</p>

                  {/* Status badge */}
                  {(() => {
                    const sc = statusConfig[selectedCheck.status];
                    const StatusIcon = sc.icon;
                    return (
                      <div className={`${sc.bg} rounded-lg p-3 flex items-start gap-2`}>
                        <StatusIcon className={`h-4 w-4 ${sc.color} mt-0.5 shrink-0`} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className={`text-sm font-semibold ${sc.color}`}>{sc.label}</p>
                            <ConfidenceBadge confidence={selectedCheck.confidence} size="md" showLabel />
                          </div>
                          <p className="text-xs text-foreground/80 mt-1">{selectedCheck.outcome}</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Fail reason callout */}
                {selectedCheck.failReason && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-destructive">Issue Detail</p>
                        <p className="text-xs text-foreground/80 mt-1">{selectedCheck.failReason}</p>
                      </div>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Actions */}
                <div>
                  <h4 className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wider">Actions</h4>
                  <div className="space-y-3">
                    <div>
                      <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                        <Shield className="h-3.5 w-3.5" />
                        Override
                      </Button>
                      <p className="text-[10px] text-muted-foreground mt-1 ml-1">Add a note and proceed</p>
                    </div>
                    <div>
                      <Button size="sm" className="w-full justify-start gap-2 bg-primary">
                        <MessageSquare className="h-3.5 w-3.5" />
                        Request Info (PAS)
                      </Button>
                      <p className="text-[10px] text-muted-foreground mt-1 ml-1">Send automated request</p>
                    </div>
                    <div>
                      <Button variant="destructive" size="sm" className="w-full justify-start gap-2">
                        <Ban className="h-3.5 w-3.5" />
                        Accept Issue
                      </Button>
                      <p className="text-[10px] text-muted-foreground mt-1 ml-1">Acknowledge and document</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <p className="text-sm text-muted-foreground">Select a check to see outcome</p>
            </Card>
          )}
        </div>
      </div>

      <AgentChatButton />
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  FileText, FileCheck, FileWarning, FilePlus, FileX,
  ChevronRight, ZoomIn, ZoomOut, RotateCw, Download,
  Upload, User, Bot, Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AgentChatButton } from "@/components/AgentChatButton";
import { DealTopBanner } from "@/components/DealTopBanner";
import { getDealById } from "@/lib/data/deals";
import { getDealDetail } from "@/lib/data/deal-detail";
import { getDocumentsForStage, getDocumentsByGroup, docStatusLabels } from "@/lib/data/documents";
import type { DealDocument } from "@/lib/data/documents";

const statusConfig: Record<DealDocument["status"], { label: string; color: string; bg: string; icon: typeof FileCheck }> = {
  received: { label: "Received", color: "text-muted-foreground", bg: "bg-muted", icon: FilePlus },
  verified: { label: "Verified", color: "text-status-success", bg: "bg-status-success/10", icon: FileCheck },
  issue: { label: "Issue", color: "text-destructive", bg: "bg-destructive/10", icon: FileWarning },
  missing: { label: "Missing", color: "text-status-warning", bg: "bg-status-warning/10", icon: FileX },
};

export default function DealDocuments() {
  const params = useParams<{ stageId: string; dealId: string }>();
  const stageId = params?.stageId ?? "";
  const dealId = params?.dealId ?? "";
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  const detail = useMemo(() => {
    const deal = getDealById(stageId, dealId);
    if (!deal) return null;
    return getDealDetail(stageId, deal);
  }, [stageId, dealId]);

  const documents = useMemo(() => getDocumentsForStage(stageId), [stageId]);
  const grouped = useMemo(() => getDocumentsByGroup(documents), [documents]);

  const selectedDoc = useMemo(() => {
    if (selectedDocId) return documents.find((d) => d.id === selectedDocId) || null;
    return documents.find((d) => d.status === "issue") || documents[0] || null;
  }, [selectedDocId, documents]);

  if (!detail) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Deal not found.</p>
      </div>
    );
  }

  const { deal } = detail;
  const totalDocs = documents.length;
  const issueCount = documents.filter((d) => d.status === "issue").length;
  const verifiedCount = documents.filter((d) => d.status === "verified").length;
  const receivedCount = documents.filter((d) => d.status === "received").length;

  const latestVersion = selectedDoc ? selectedDoc.versions[selectedDoc.versions.length - 1] : null;

  return (
    <div className="space-y-4">
      <DealTopBanner deal={deal} team={detail.stage} issues={detail.issues} />

      {/* Summary strip */}
      <div className="flex items-center gap-4 px-1">
        <span className="text-sm font-semibold text-foreground">{totalDocs} Documents</span>
        <div className="flex items-center gap-1.5">
          <FileWarning className="h-3.5 w-3.5 text-destructive" />
          <span className="text-xs text-destructive font-medium">{issueCount} Issues</span>
        </div>
        <div className="flex items-center gap-1.5">
          <FileCheck className="h-3.5 w-3.5 text-status-success" />
          <span className="text-xs text-status-success font-medium">{verifiedCount} Verified</span>
        </div>
        <div className="flex items-center gap-1.5">
          <FilePlus className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-medium">{receivedCount} Pending Review</span>
        </div>
      </div>

      {/* 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LHS — Document List */}
        <div className="lg:col-span-3">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 overflow-auto max-h-[calc(100vh-280px)]">
              {Object.entries(grouped).map(([groupLabel, docs]) => (
                <div key={groupLabel}>
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2 block">
                    {groupLabel}
                  </span>
                  <div className="space-y-1">
                    {docs.map((doc) => {
                      const sc = statusConfig[doc.status];
                      const StatusIcon = sc.icon;
                      const isActive = selectedDoc?.id === doc.id;
                      return (
                        <button
                          key={doc.id}
                          onClick={() => setSelectedDocId(doc.id)}
                          className={`w-full text-left flex items-center gap-2 px-2.5 py-2 rounded-md transition-all text-sm ${
                            isActive
                              ? "bg-primary/10 ring-1 ring-primary/30"
                              : "hover:bg-muted/50"
                          }`}
                        >
                          <StatusIcon className={`h-3.5 w-3.5 ${sc.color} shrink-0`} />
                          <div className="min-w-0 flex-1">
                            <span className={`block truncate ${isActive ? "font-medium text-foreground" : "text-foreground/80"}`}>
                              {doc.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {docStatusLabels[doc.status]} · {doc.pageCount}p · {doc.versions.length} ver
                            </span>
                          </div>
                          {doc.status === "issue" && (
                            <Badge variant="destructive" className="text-[10px] h-4 px-1.5 shrink-0">!</Badge>
                          )}
                          {isActive && <ChevronRight className="h-3.5 w-3.5 text-primary shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Middle — Document Viewer */}
        <div className="lg:col-span-5">
          {selectedDoc ? (
            <Card className="h-full">
              <CardContent className="pt-5 space-y-4 overflow-auto max-h-[calc(100vh-280px)]">
                {/* Doc header */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{selectedDoc.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px] font-mono">{selectedDoc.id}</Badge>
                      <Badge variant="secondary" className="text-[10px]">{docStatusLabels[selectedDoc.status]}</Badge>
                      {(() => {
                        const sc = statusConfig[selectedDoc.status];
                        return (
                          <Badge className={`${sc.bg} ${sc.color} text-[10px] border-0`}>{sc.label}</Badge>
                        );
                      })()}
                    </div>
                  </div>
                  {latestVersion && (
                    <span className="text-[10px] text-muted-foreground">
                      Viewing {latestVersion.version}
                    </span>
                  )}
                </div>

                <Separator />

                {/* Dummy viewer controls */}
                <div className="flex items-center gap-1 justify-between">
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7"><ZoomIn className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7"><ZoomOut className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7"><RotateCw className="h-3.5 w-3.5" /></Button>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">Page 1 of {selectedDoc.pageCount}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7"><Download className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>

                {/* Document preview placeholder */}
                <div className="rounded-lg border border-border bg-muted/20 flex items-center justify-center" style={{ minHeight: 360 }}>
                  <div className="text-center space-y-2">
                    <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto" />
                    <p className="text-sm text-muted-foreground font-medium">{selectedDoc.name}</p>
                    <p className="text-xs text-muted-foreground/60">{selectedDoc.pageCount} pages · {latestVersion ? `${latestVersion.sizeKb} KB` : ""}</p>
                    <p className="text-[10px] text-muted-foreground/40">Document viewer placeholder</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <p className="text-sm text-muted-foreground">Select a document to view</p>
            </Card>
          )}
        </div>

        {/* RHS — Version History */}
        <div className="lg:col-span-4">
          {selectedDoc ? (
            <Card className="h-full">
              <CardContent className="pt-5 space-y-5">
                <div>
                  <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-1">Version History</h4>
                  <p className="text-[10px] text-muted-foreground">
                    {selectedDoc.versions.length} version{selectedDoc.versions.length > 1 ? "s" : ""} on record
                  </p>
                </div>

                <div className="space-y-0 relative">
                  {/* Timeline line */}
                  <div className="absolute left-[11px] top-3 bottom-3 w-px bg-border" />

                  {[...selectedDoc.versions].reverse().map((ver, i) => {
                    const isLatest = i === 0;
                    const isSystem = ver.uploadedBy.startsWith("System");
                    return (
                      <div key={ver.version} className="flex gap-3 relative pb-5 last:pb-0">
                        <div className={`z-10 mt-1 h-[22px] w-[22px] rounded-full flex items-center justify-center shrink-0 ${
                          isLatest ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        }`}>
                          {isSystem ? (
                            <Bot className="h-3 w-3" />
                          ) : (
                            <Upload className="h-3 w-3" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-foreground">{ver.version}</span>
                            {isLatest && (
                              <Badge className="text-[10px] h-4 px-1.5 bg-primary/10 text-primary border-0">Current</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            {isSystem ? (
                              <Bot className="h-3 w-3 text-muted-foreground shrink-0" />
                            ) : (
                              <User className="h-3 w-3 text-muted-foreground shrink-0" />
                            )}
                            <span className="text-[11px] text-foreground/80 truncate">{ver.uploadedBy}</span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="text-[10px] text-muted-foreground">{ver.uploadedAt}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">{ver.sizeKb} KB</span>
                          {ver.note && (
                            <p className="text-[10px] text-muted-foreground/80 mt-1 italic">&quot;{ver.note}&quot;</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Separator />

                {/* Status callout */}
                {(() => {
                  const sc = statusConfig[selectedDoc.status];
                  const StatusIcon = sc.icon;
                  return (
                    <div className={`${sc.bg} rounded-lg p-3 flex items-start gap-2`}>
                      <StatusIcon className={`h-4 w-4 ${sc.color} mt-0.5 shrink-0`} />
                      <div>
                        <p className={`text-sm font-semibold ${sc.color}`}>{sc.label}</p>
                        <p className="text-xs text-foreground/80 mt-1">
                          {selectedDoc.status === "verified" && "This document has been reviewed and verified."}
                          {selectedDoc.status === "issue" && "An issue has been detected with this document. See Checks for details."}
                          {selectedDoc.status === "received" && "This document has been received but not yet reviewed."}
                          {selectedDoc.status === "missing" && "This document is required but has not been submitted."}
                        </p>
                      </div>
                    </div>
                  );
                })()}

                <Separator />

                {/* Actions */}
                <div>
                  <h4 className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wider">Actions</h4>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                      <Download className="h-3.5 w-3.5" />
                      Download Latest
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                      <Upload className="h-3.5 w-3.5" />
                      Request New Version
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <p className="text-sm text-muted-foreground">Select a document to see history</p>
            </Card>
          )}
        </div>
      </div>

      <AgentChatButton />
    </div>
  );
}

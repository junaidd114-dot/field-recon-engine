"use client"

import { LayoutDashboard, Shield, FileCheck, Calculator, FileText, ArrowLeft, ClipboardCheck, FileSearch, MessageSquare, Gavel, ListChecks, Clock } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { usePathname, useRouter } from "next/navigation";
import { stageDealsMap } from "@/lib/data/deals";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Underwriting", url: "/stage/underwriting", icon: Shield },
  { title: "Payout", url: "/stage/payout", icon: FileCheck },
  { title: "Accounts", url: "/stage/accounts", icon: Calculator },
];

const dealSections = [
  { title: "Summary", hash: "summary", icon: ListChecks },
  { title: "Checks / Issues", hash: "checks", icon: ClipboardCheck },
  { title: "Documents", hash: "documents", icon: FileSearch },
  { title: "Conversations", hash: "conversations", icon: MessageSquare },
  { title: "Decision", hash: "decision", icon: Gavel },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = usePathname();
  const router = useRouter();

  const dealMatch = pathname.match(/^\/stage\/(\w+)\/deal\/([^/]+)/);
  const isDealView = !!dealMatch;
  const currentStageId = dealMatch?.[1];
  const currentDealId = dealMatch?.[2];
  const currentSection = pathname.endsWith("/checks") ? "checks"
    : pathname.endsWith("/documents") ? "documents"
    : pathname.endsWith("/conversations") ? "conversations"
    : pathname.endsWith("/decision") ? "decision"
    : "summary";

  const stageFromPath = pathname.match(/^\/stage\/(\w+)/)?.[1];

  const isActive = (path: string) =>
    path === "/" ? pathname === "/" : pathname.startsWith(path);

  const recentDeals = (() => {
    if (!stageFromPath) return [];
    const stageData = stageDealsMap[stageFromPath];
    if (!stageData) return [];
    return [...stageData.actionRequired, ...stageData.awaitingBroker]
      .sort((a, b) => b.ageInDays - a.ageInDays)
      .slice(0, 5);
  })();

  const recentCasesBlock = !collapsed && recentDeals.length > 0 && (
    <SidebarGroup>
      <SidebarGroupLabel className="text-sidebar-muted text-[10px] uppercase tracking-widest">
        Recent Cases
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {recentDeals.map((deal) => (
            <SidebarMenuItem key={deal.id}>
              <SidebarMenuButton
                render={
                  <NavLink
                    href={`/stage/${stageFromPath}/deal/${deal.id}`}
                    className="text-sidebar-foreground hover:bg-sidebar-accent"
                    activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                  />
                }
                isActive={deal.id === currentDealId}
                tooltip={`${deal.id} — ${deal.applicant}`}
              >
                <Clock className="h-3.5 w-3.5 shrink-0" />
                {!collapsed && (
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-mono truncate">{deal.id}</span>
                    <span className="text-[10px] text-sidebar-muted truncate">{deal.applicant}</span>
                  </div>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar side="left" collapsible="icon" className="border-r-0">
      <SidebarHeader className="p-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <FileText className="h-7 w-7 text-sidebar-primary" />
            <div>
              <h2 className="text-sm font-bold text-sidebar-primary tracking-wide">DealFlow</h2>
              <p className="text-[10px] text-sidebar-muted uppercase tracking-widest">Vehicle Finance</p>
            </div>
          </div>
        )}
        {collapsed && <FileText className="h-6 w-6 text-sidebar-primary mx-auto" />}
      </SidebarHeader>

      <SidebarContent>
        {isDealView ? (
          <>
            {/* Back button */}
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => router.push(`/stage/${currentStageId}`)}
                      tooltip="Back to stage"
                      className="text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent cursor-pointer"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      {!collapsed && <span className="text-xs">Back to stage</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Deal sections */}
            <SidebarGroup>
              <SidebarGroupLabel className="text-sidebar-muted text-[10px] uppercase tracking-widest">
                Case Review
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {dealSections.map((section) => {
                    const sectionPath = section.hash === "summary"
                      ? `/stage/${currentStageId}/deal/${currentDealId}`
                      : `/stage/${currentStageId}/deal/${currentDealId}/${section.hash}`;
                    const isActiveSection = section.hash === currentSection;
                    return (
                      <SidebarMenuItem key={section.hash}>
                        <SidebarMenuButton
                          render={
                            <NavLink
                              href={sectionPath}
                              className="text-sidebar-foreground hover:bg-sidebar-accent"
                              activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                            />
                          }
                          isActive={isActiveSection}
                          tooltip={section.title}
                          className="text-sidebar-foreground hover:bg-sidebar-accent cursor-pointer"
                        >
                          <section.icon className="h-4 w-4" />
                          {!collapsed && <span>{section.title}</span>}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {recentCasesBlock}
          </>
        ) : (
          <>
            <SidebarGroup>
              <SidebarGroupLabel className="text-sidebar-muted text-[10px] uppercase tracking-widest">
                Navigation
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        render={
                          <NavLink
                            href={item.url}
                            end={item.url === "/"}
                            className="text-sidebar-foreground hover:bg-sidebar-accent"
                            activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                          />
                        }
                        isActive={isActive(item.url)}
                        tooltip={item.title}
                      >
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {recentCasesBlock}
          </>
        )}
      </SidebarContent>
    </Sidebar>
  );
}

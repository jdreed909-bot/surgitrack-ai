import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "./utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { canView } from "./lib/PageNotFound";
import {
  CalendarDays,
  Package,
  ScanLine,
  Bell,
  Menu,
  X,
  Activity,
  Building2,
  Wrench,
  Users,
  MessageSquare,
  BookOpen,
  Bot,
  Droplet,
  Stethoscope,
} from "lucide-react";

const NAV = [
  { label: "Schedule",  page: "Schedule",    icon: CalendarDays },
  { label: "Case Tracking", page: "CaseTracking", icon: Package },
  { label: "5-Day Lookout", page: "ScheduleLookout", icon: CalendarDays },
  { label: "Instrument Sets", page: "Inventory", icon: Package },
  { label: "Scan Log",  page: "ScanHistory", icon: ScanLine },
  { label: "Alerts",    page: "Alerts",      icon: Bell, badge: true },
  { label: "RN Call",   page: "RNCall",      icon: Users },
  { label: "ST Call",   page: "STCall",      icon: Users },
  { label: "Vendors",   page: "Vendors",          icon: Building2 },
  { label: "Equipment", page: "SpecialtyEquipment", icon: Wrench },
  { label: "Staff Roster",      page: "StaffRoster",        icon: Users },
  { label: "Staffing Schedule", page: "StaffingSchedule",   icon: CalendarDays },
  { label: "Text Notifications", page: "TextNotifications",  icon: MessageSquare },
  { label: "Educational Resources", page: "EducationalResources", icon: BookOpen },
  { label: "Turnover", page: "Turnover", icon: Users },
  { label: "Pre-Op / PACU", page: "PreOpBoard", icon: Stethoscope },
  { label: "OR Assistant", page: "PolicyBot", icon: Bot },
  { label: "TrackCore", page: "TrackCore", icon: Droplet },
  { label: "Admin", page: "Admin", icon: Building2 },
];

export default function Layout({ children, currentPageName }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => null);
  }, []);

  const { data: alerts = [] } = useQuery({
    queryKey: ["alerts"],
    queryFn: () => base44.entities.Alert.filter({ is_resolved: false }, "-created_date", 20),
    refetchInterval: 20000,
  });
  const alertCount = alerts.length;

  // Filter nav items based on user role
  const visibleNav = NAV.filter(item => {
    const section = item.page;
    // Map page names to section names for permission check
    const sectionMap = {
      Schedule: "Schedule",
      CaseTracking: "CaseTracking",
      ScheduleLookout: "ScheduleLookout",
      Inventory: "Inventory",
      ScanHistory: "Inventory",
      Alerts: "Alerts",
      RNCall: "RNCall",
      STCall: "STCall",
      Vendors: "Vendors",
      SpecialtyEquipment: "Equipment",
      StaffRoster: "StaffManagement",
      StaffingSchedule: "StaffManagement",
      TextNotifications: "TextNotifications",
      EducationalResources: "EducationalResources",
      Turnover: "Turnover",
      PolicyBot: "PolicyBot",
      PreOpBoard: "PreOpBoard",
      TrackCore: "TrackCore",
      Admin: "Admin",
      };
    const sectionName = sectionMap[section] || section;
    return canView(currentUser?.role || "user", sectionName);
  });

  return (
    <div className="min-h-screen bg-[#F0F4F8] flex">
      {/* Sidebar – desktop */}
      <aside className="hidden lg:flex flex-col w-60 bg-white border-r border-slate-100 shadow-sm fixed inset-y-0 left-0 z-30">
        <div className="px-6 py-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl flex items-center justify-center shadow">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 leading-tight">ModeRN OR</div>
              <div className="text-xs text-slate-400">A Cut Above</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {visibleNav.map(({ label, page, icon: Icon, badge }) => {
            const active = currentPageName === page;
            return (
              <Link
                key={page}
                to={createPageUrl(page)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative ${
                  active
                    ? "bg-teal-50 text-teal-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon className={`w-4.5 h-4.5 ${active ? "text-teal-600" : "text-slate-400 group-hover:text-slate-600"}`} style={{ width: 18, height: 18 }} />
                {label}
                {badge && alertCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {alertCount > 9 ? "9+" : alertCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="px-4 py-4 border-t border-slate-100">
          <div className="text-xs text-slate-400 text-center">Surgical Instrument Tracker</div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-slate-100 px-4 h-14 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-700 rounded-lg flex items-center justify-center">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-slate-900 text-sm">ModeRN OR</span>
        </div>
        <div className="flex items-center gap-3">
          {alertCount > 0 && (
            <Link to={createPageUrl("Alerts")} className="relative">
              <Bell className="w-5 h-5 text-slate-600" />
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {alertCount > 9 ? "9+" : alertCount}
              </span>
            </Link>
          )}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-1 text-slate-600">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-20 bg-black/30" onClick={() => setMobileOpen(false)}>
          <div className="bg-white w-64 h-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 pt-16 pb-4 space-y-1">
                {visibleNav.map(({ label, page, icon: Icon, badge }) => {
                const active = currentPageName === page;
                return (
                  <Link
                    key={page}
                    to={createPageUrl(page)}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                      active ? "bg-teal-50 text-teal-700" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                    {badge && alertCount > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{alertCount}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 lg:ml-60 pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
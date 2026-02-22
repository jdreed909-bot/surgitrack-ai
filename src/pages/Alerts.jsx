import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { AlertTriangle, CheckCircle2, Bell, Clock, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CreateAlertModal from "../components/alerts/CreateAlertModal";
import TurnoverHitListModal from "../components/alerts/TurnoverHitListModal";

const SEVERITY_CONFIG = {
  Critical: { bar: "border-l-red-500",    badge: "bg-red-100 text-red-700 border-red-200",      icon: "text-red-500" },
  High:     { bar: "border-l-orange-500", badge: "bg-orange-100 text-orange-700 border-orange-200", icon: "text-orange-500" },
  Medium:   { bar: "border-l-amber-400",  badge: "bg-amber-100 text-amber-700 border-amber-200",  icon: "text-amber-500" },
  Low:      { bar: "border-l-slate-300",  badge: "bg-slate-100 text-slate-600 border-slate-200",  icon: "text-slate-400" },
};

export default function Alerts() {
  const [filter, setFilter] = useState("active");
  const [addOpen, setAddOpen] = useState(false);
  const [turnoverOpen, setTurnoverOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ["all-alerts", filter],
    queryFn: () =>
      filter === "all"
        ? base44.entities.Alert.list("-created_date", 100)
        : base44.entities.Alert.filter({ is_resolved: filter === "resolved" }, "-created_date", 100),
    refetchInterval: 15000,
  });

  const handleResolve = async (alert) => {
    const user = await base44.auth.me();
    await base44.entities.Alert.update(alert.id, {
      is_resolved: true,
      resolved_by: user.email,
      resolved_at: new Date().toISOString(),
    });
    queryClient.invalidateQueries(["all-alerts"]);
    queryClient.invalidateQueries(["alerts"]);
  };

  const counts = {
    Critical: alerts.filter((a) => !a.is_resolved && a.severity === "Critical").length,
    High: alerts.filter((a) => !a.is_resolved && a.severity === "High").length,
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Alerts</h1>
            <p className="text-slate-500 mt-1 text-sm">Timing alerts, conflicts, and notifications</p>
          </div>
          <div className="flex items-center gap-3">
            {(counts.Critical > 0 || counts.High > 0) && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-xl text-sm font-medium">
                <AlertTriangle className="w-4 h-4" />
                {counts.Critical > 0 && <span>{counts.Critical} Critical</span>}
                {counts.High > 0 && <span>{counts.High} High</span>}
              </div>
            )}
            <Button onClick={() => setAddOpen(true)} className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl">
              <Bell className="w-4 h-4 mr-2" /> Create Alert
            </Button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: "active", label: "Active" },
            { key: "resolved", label: "Resolved" },
            { key: "all", label: "All" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === key
                  ? "bg-teal-600 text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-teal-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-24">
            <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-300 mb-4" />
            <p className="text-slate-500 font-medium">
              {filter === "active" ? "No active alerts — all clear!" : "No alerts found"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => {
              const cfg = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.Medium;
              return (
                <div
                  key={alert.id}
                  className={`bg-white rounded-2xl border border-l-4 shadow-sm px-5 py-4 flex items-start gap-4 ${cfg.bar} ${alert.is_resolved ? "opacity-60" : ""}`}
                >
                  <AlertTriangle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${cfg.icon}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-slate-800 text-sm">{alert.type}</span>
                      <Badge className={`text-xs border rounded-lg px-2 py-0.5 ${cfg.badge}`}>{alert.severity}</Badge>
                      {alert.is_resolved && (
                        <Badge className="text-xs border rounded-lg px-2 py-0.5 bg-emerald-100 text-emerald-700 border-emerald-200">
                          Resolved
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{alert.message}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                      {alert.created_date && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(parseISO(alert.created_date), "MMM d, h:mm a")}
                        </span>
                      )}
                      {alert.is_resolved && alert.resolved_by && (
                        <span className="flex items-center gap-1 text-emerald-600">
                          <CheckCircle2 className="w-3 h-3" />
                          Resolved by {alert.resolved_by}
                        </span>
                      )}
                    </div>
                    {alert.resolution_notes && (
                      <div className="mt-2 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
                        {alert.resolution_notes}
                      </div>
                    )}
                  </div>
                  {!alert.is_resolved && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResolve(alert)}
                      className="rounded-xl border-slate-200 text-slate-600 text-xs h-8 flex-shrink-0"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Resolve
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {addOpen && (
        <CreateAlertModal
          onClose={() => setAddOpen(false)}
          onCreated={() => {
            queryClient.invalidateQueries(["all-alerts"]);
            queryClient.invalidateQueries(["alerts"]);
          }}
        />
      )}
    </div>
  );
}
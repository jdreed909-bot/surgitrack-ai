import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X, ChevronDown, ChevronUp, CheckCircle } from "lucide-react";

const SEVERITY_CONFIG = {
  Critical: "bg-red-50 border-red-300 text-red-800",
  High:     "bg-orange-50 border-orange-300 text-orange-800",
  Medium:   "bg-amber-50 border-amber-200 text-amber-800",
  Low:      "bg-yellow-50 border-yellow-200 text-yellow-800",
};

export default function AlertBanner({ alerts, onResolve }) {
  const [expanded, setExpanded] = useState(false);
  const [resolving, setResolving] = useState(null);

  const handleResolve = async (alert) => {
    setResolving(alert.id);
    const user = await base44.auth.me();
    await base44.entities.Alert.update(alert.id, {
      is_resolved: true,
      resolved_by: user.email,
      resolved_at: new Date().toISOString(),
    });
    setResolving(null);
    onResolve();
  };

  const visible = expanded ? alerts : alerts.slice(0, 2);

  return (
    <div className="mb-6 space-y-2">
      {visible.map((alert) => (
        <div
          key={alert.id}
          className={`flex items-start justify-between gap-3 border rounded-xl px-4 py-3 ${SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.Medium}`}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-semibold text-sm">{alert.type}</div>
              <div className="text-xs opacity-80 mt-0.5">{alert.message}</div>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleResolve(alert)}
            disabled={resolving === alert.id}
            className="text-xs opacity-70 hover:opacity-100 rounded-lg flex-shrink-0 h-7 px-2"
          >
            <CheckCircle className="w-3.5 h-3.5 mr-1" /> Resolve
          </Button>
        </div>
      ))}

      {alerts.length > 2 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 ml-1"
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {expanded ? "Show less" : `Show ${alerts.length - 2} more alert${alerts.length - 2 !== 1 ? "s" : ""}`}
        </button>
      )}
    </div>
  );
}
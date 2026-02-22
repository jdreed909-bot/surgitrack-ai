import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Check, X, Clock } from "lucide-react";

export default function SwitchLedger({ switches, onApprove, onDeny, userRole }) {
  const [filter, setFilter] = useState("pending"); // "all", "pending", "approved"

  const filteredSwitches = switches.filter((s) => {
    if (filter === "pending") return s.status === "Pending";
    if (filter === "approved") return s.status === "Auto-Approved" || s.status === "Approved";
    return true;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case "Auto-Approved":
        return <Check className="w-4 h-4 text-green-600" />;
      case "Approved":
        return <Check className="w-4 h-4 text-green-600" />;
      case "Pending":
        return <Clock className="w-4 h-4 text-amber-600" />;
      case "Denied":
        return <X className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Auto-Approved":
      case "Approved":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-amber-100 text-amber-800";
      case "Denied":
        return "bg-red-100 text-red-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-slate-900 mb-3">Call Switches</h3>
        <div className="flex gap-2">
          {["pending", "approved", "all"].map((f) => (
            <Button
              key={f}
              onClick={() => setFilter(f)}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              className="text-xs"
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredSwitches.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">No switches to display</div>
        ) : (
          filteredSwitches.map((sw, idx) => (
            <div key={idx} className="border border-slate-200 rounded-lg p-3">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-900">
                    {sw.switch_type}: {sw.from_staff}
                    {sw.to_staff && ` → ${sw.to_staff}`}
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">{format(new Date(sw.call_date), "MMM d, yyyy")} • {sw.call_type}</div>
                  {sw.reason && (
                    <div className="text-xs text-slate-600 mt-1">Reason: {sw.reason}</div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {getStatusIcon(sw.status)}
                  <Badge className={getStatusColor(sw.status)}>{sw.status}</Badge>
                </div>
              </div>

              {sw.status === "Pending" && userRole === "admin" && (
                <div className="flex gap-2 pt-2 border-t border-slate-200">
                  <Button
                    onClick={() => onApprove(sw.id)}
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                  >
                    <Check className="w-3 h-3 mr-1" /> Approve
                  </Button>
                  <Button
                    onClick={() => onDeny(sw.id)}
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                  >
                    <X className="w-3 h-3 mr-1" /> Deny
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
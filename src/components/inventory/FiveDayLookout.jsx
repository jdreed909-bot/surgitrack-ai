import React, { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Wrench, Calendar, Package, ShoppingCart, Edit2, Check, X, AlertTriangle, Zap, Plus, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "date-fns";
import { addDays } from "date-fns";
import AddManualIssueModal from "./AddManualIssueModal";

const ISSUE_CATEGORIES = {
  "Materials": { icon: ShoppingCart, color: "text-blue-600", bg: "bg-blue-50" },
  "Scheduling": { icon: Calendar, color: "text-amber-600", bg: "bg-amber-50" },
  "SPD": { icon: Wrench, color: "text-red-600", bg: "bg-red-50" },
  "OR": { icon: AlertTriangle, color: "text-purple-600", bg: "bg-purple-50" },
};

export default function FiveDayLookout() {
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [manualIssueOpen, setManualIssueOpen] = useState(false);
  const queryClient = useQueryClient();
  const today = new Date();
  const fiveDaysFromNow = addDays(today, 4);

  const { data: cases = [] } = useQuery({
    queryKey: ["cases-5day"],
    queryFn: () => base44.entities.SurgicalCase.list("-scheduled_date", 100),
    refetchInterval: 30000,
  });

  const { data: manualAlerts = [] } = useQuery({
    queryKey: ["alerts-lookout"],
    queryFn: () => base44.entities.Alert.filter({ is_resolved: false }, "-created_date", 50),
    refetchInterval: 30000,
  });

  const handleEditStart = (caseId, currentText) => {
    setEditingId(caseId);
    setEditText(currentText);
  };

  const handleEditSave = async (caseId) => {
    await base44.entities.SurgicalCase.update(caseId, { special_requests: editText });
    queryClient.invalidateQueries(["cases-5day"]);
    setEditingId(null);
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditText("");
  };

  const upcomingCases = useMemo(() => {
    return cases.filter((c) => {
      const caseDate = new Date(c.scheduled_date);
      return caseDate >= today && caseDate <= fiveDaysFromNow;
    });
  }, [cases, today, fiveDaysFromNow]);

  // Group issues by date
  const dateGroups = useMemo(() => {
    const groups = {};
    
    upcomingCases.forEach((caseData) => {
      const dateStr = formatDate(new Date(caseData.scheduled_date), "MMM d, yyyy");
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }

      // Add SPD issues if case has missing or conflicted sets
      if (caseData.conflict_flags?.length > 0) {
        groups[dateStr].push({
          type: "SPD",
          caseId: caseData.id,
          date: caseData.scheduled_date,
          surgeon: caseData.surgeon,
          issue: caseData.conflict_flags[0],
          severity: "high",
        });
      }

      // Add scheduling issues
      if (caseData.status === "Delayed") {
        groups[dateStr].push({
          type: "Scheduling",
          caseId: caseData.id,
          date: caseData.scheduled_date,
          surgeon: caseData.surgeon,
          issue: "Case delayed",
          severity: "high",
        });
      }

      // Add materials/vendor notifications
      if (caseData.special_requests) {
        groups[dateStr].push({
          type: "Materials",
          caseId: caseData.id,
          date: caseData.scheduled_date,
          surgeon: caseData.surgeon,
          issue: caseData.special_requests,
          severity: "medium",
        });
      }
    });

    return groups;
  }, [upcomingCases]);

  const totalIssues = Object.values(dateGroups).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
          <Calendar className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-bold text-slate-900 text-lg">5-Day Schedule Lookout</h2>
          <p className="text-xs text-slate-400">Issues & alerts from today through next 4 days</p>
        </div>
        {totalIssues > 0 && (
          <div className="ml-auto bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full">
            {totalIssues} Issue{totalIssues !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {totalIssues === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No issues scheduled for next 5 days</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(dateGroups).map(([date, items]) => {
            if (items.length === 0) return null;
            return (
              <div key={date}>
                <h3 className="text-sm font-bold text-slate-900 mb-3 pb-2 border-b border-slate-200">{date}</h3>
                <div className="space-y-3">
                  {items.map((item, idx) => {
                    const config = ISSUE_CATEGORIES[item.type];
                    const Icon = config.icon;
                    return (
                      <div key={idx} className={`text-xs p-3 rounded-lg ${config.bg} border border-slate-200`}>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 flex-1">
                            <Icon className={`w-3.5 h-3.5 ${config.color} shrink-0`} />
                            <span className="font-semibold text-slate-800 uppercase tracking-wide text-[10px]">{item.type}</span>
                          </div>
                          {editingId !== item.caseId && (
                            <button
                              onClick={() => handleEditStart(item.caseId, item.issue)}
                              className="p-1 hover:bg-black/10 rounded transition-colors shrink-0"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <div className="font-semibold text-slate-800 truncate ml-5.5">{item.surgeon || "N/A"}</div>
                        {editingId === item.caseId ? (
                          <div className="mt-2 space-y-1.5 ml-5.5">
                            <textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="w-full text-xs p-2 border border-slate-300 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-teal-500"
                              rows="2"
                            />
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => handleEditSave(item.caseId)}
                                className="flex-1 flex items-center justify-center gap-1 text-[11px] font-semibold bg-teal-600 text-white px-2 py-1 rounded hover:bg-teal-700 transition-colors"
                              >
                                <Check className="w-3 h-3" /> Save
                              </button>
                              <button
                                onClick={handleEditCancel}
                                className="flex-1 flex items-center justify-center gap-1 text-[11px] font-semibold bg-slate-300 text-slate-700 px-2 py-1 rounded hover:bg-slate-400 transition-colors"
                              >
                                <X className="w-3 h-3" /> Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-slate-700 mt-1.5 text-xs leading-snug whitespace-pre-wrap break-words ml-5.5">{item.issue}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
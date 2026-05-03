import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Users, Award, Clock } from "lucide-react";

const FTE_BADGE = {
  "Full-Time":  "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Part-Time":  "bg-amber-100 text-amber-700 border-amber-200",
  "Per Diem":   "bg-slate-100 text-slate-600 border-slate-200",
};

function formatSeniority(dateStr) {
  if (!dateStr) return null;
  const d = parseISO(dateStr);
  const now = new Date();
  const years = now.getFullYear() - d.getFullYear();
  const months = now.getMonth() - d.getMonth();
  const total = years + (months < 0 ? -1 : 0);
  return total > 0 ? `${total}yr` : "< 1yr";
}

export default function StaffCallPanel({ role }) {
  const [tab, setTab] = useState("seniority"); // "seniority" | "fte"

  // role prop is "RN" or "ST" — map to StaffRoster roles
  const rosterRole = role === "RN" ? ["RN", "Charge RN"] : ["Scrub Tech"];

  const { data: staff = [] } = useQuery({
    queryKey: ["staff-roster-call", role],
    queryFn: () => base44.entities.StaffRoster.filter({ is_active: true }, "seniority_date", 200),
  });

  const filtered = staff.filter(s => rosterRole.includes(s.role));

  // Seniority list — sorted oldest seniority_date first
  const bySenoirity = [...filtered].sort((a, b) => {
    if (!a.seniority_date && !b.seniority_date) return 0;
    if (!a.seniority_date) return 1;
    if (!b.seniority_date) return -1;
    return new Date(a.seniority_date) - new Date(b.seniority_date);
  });

  // FTE grouping
  const fteGroups = {
    "Full-Time": filtered.filter(s => !s.fte_status || s.fte_status === "Full-Time"),
    "Part-Time": filtered.filter(s => s.fte_status === "Part-Time"),
    "Per Diem":  filtered.filter(s => s.fte_status === "Per Diem"),
  };

  const accentColor = role === "RN" ? "bg-blue-600" : "bg-purple-600";
  const accentLight = role === "RN" ? "border-blue-400 bg-blue-50 text-blue-700" : "border-purple-400 bg-purple-50 text-purple-700";

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-slate-100">
        <button
          onClick={() => setTab("seniority")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-all
            ${tab === "seniority" ? `${accentColor} text-white` : "text-slate-500 hover:bg-slate-50"}`}
        >
          <Award className="w-3.5 h-3.5" />
          Seniority List
        </button>
        <button
          onClick={() => setTab("fte")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-all
            ${tab === "fte" ? `${accentColor} text-white` : "text-slate-500 hover:bg-slate-50"}`}
        >
          <Users className="w-3.5 h-3.5" />
          FTE Status
        </button>
      </div>

      <div className="p-3">
        {filtered.length === 0 && (
          <div className="text-center py-6 text-slate-400 text-xs italic">
            No active {role === "RN" ? "RN" : "ST"} staff found in roster
          </div>
        )}

        {/* Seniority list */}
        {tab === "seniority" && filtered.length > 0 && (
          <div className="space-y-1.5">
            {bySenoirity.map((member, idx) => (
              <div key={member.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50">
                <span className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0
                  ${idx === 0 ? "bg-yellow-400 text-yellow-900" : idx === 1 ? "bg-slate-300 text-slate-700" : idx === 2 ? "bg-orange-300 text-orange-800" : "bg-slate-100 text-slate-500"}`}>
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800 truncate">{member.name}</div>
                  {member.seniority_date && (
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      Since {format(parseISO(member.seniority_date), "MMM yyyy")}
                      {" · "}{formatSeniority(member.seniority_date)}
                    </div>
                  )}
                </div>
                {member.fte_status && (
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border shrink-0 ${FTE_BADGE[member.fte_status] || FTE_BADGE["Full-Time"]}`}>
                    {member.fte_status === "Full-Time" ? "FT" : member.fte_status === "Part-Time" ? "PT" : "PRN"}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* FTE groups */}
        {tab === "fte" && filtered.length > 0 && (
          <div className="space-y-4">
            {Object.entries(fteGroups).map(([label, members]) => members.length > 0 && (
              <div key={label}>
                <div className={`inline-flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-lg border mb-2 ${FTE_BADGE[label]}`}>
                  {label}
                  <span className="font-normal opacity-70">({members.length})</span>
                </div>
                <div className="space-y-1">
                  {members
                    .sort((a, b) => new Date(a.seniority_date || "9999") - new Date(b.seniority_date || "9999"))
                    .map((member) => (
                      <div key={member.id} className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-slate-50">
                        <div className="w-2 h-2 rounded-full bg-slate-300 shrink-0" />
                        <span className="text-sm text-slate-800 flex-1 truncate">{member.name}</span>
                        {member.seniority_date && (
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {formatSeniority(member.seniority_date)}
                          </span>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
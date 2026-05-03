import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { BarChart2 } from "lucide-react";
import SurgeonUsageChart from "@/components/dashboard/SurgeonUsageChart";
import TopSetsChart from "@/components/dashboard/TopSetsChart";
import CaseAveragesTable from "@/components/dashboard/CaseAveragesTable";
import PrepTimeTrendChart from "@/components/dashboard/PrepTimeTrendChart";

export default function UsageDashboard() {
  const [selectedSurgeon, setSelectedSurgeon] = useState("all");

  const { data: cases = [], isLoading: casesLoading } = useQuery({
    queryKey: ["surgical-cases-all"],
    queryFn: () => base44.entities.SurgicalCase.list("-scheduled_date", 500),
  });

  const { data: sets = [] } = useQuery({
    queryKey: ["sets-all"],
    queryFn: () => base44.entities.SurgicalSet.list("name", 200),
  });

  const surgeons = useMemo(() => {
    const s = [...new Set(cases.map(c => c.surgeon).filter(Boolean))].sort();
    return s;
  }, [cases]);

  const filteredCases = useMemo(() => {
    if (selectedSurgeon === "all") return cases;
    return cases.filter(c => c.surgeon === selectedSurgeon);
  }, [cases, selectedSurgeon]);

  const setMap = useMemo(() => {
    const m = {};
    sets.forEach(s => { m[s.id] = s.name; });
    return m;
  }, [sets]);

  const totalCases = filteredCases.length;
  const completedCases = filteredCases.filter(c => c.status === "Completed").length;
  const uniqueProcedures = new Set(filteredCases.map(c => c.procedure_name).filter(Boolean)).size;
  const uniqueSurgeons = new Set(filteredCases.map(c => c.surgeon).filter(Boolean)).size;

  return (
    <div className="min-h-screen bg-[#F0F4F8] p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-700 rounded-2xl flex items-center justify-center shadow-md">
          <BarChart2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Surgical Usage Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Set usage, procedure trends, and case time averages</p>
        </div>
      </div>

      {/* Surgeon filter */}
      <div className="flex items-center gap-3 mb-8">
        <label className="text-sm font-semibold text-slate-600">Filter by Surgeon:</label>
        <select
          value={selectedSurgeon}
          onChange={e => setSelectedSurgeon(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-teal-400 shadow-sm min-w-[200px]"
        >
          <option value="all">All Surgeons</option>
          {surgeons.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Cases", value: totalCases, color: "text-teal-700", bg: "bg-teal-50", border: "border-teal-200" },
          { label: "Completed", value: completedCases, color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
          { label: "Unique Procedures", value: uniqueProcedures, color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
          { label: "Surgeons", value: uniqueSurgeons, color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200" },
        ].map(({ label, value, color, bg, border }) => (
          <div key={label} className={`${bg} ${border} border rounded-2xl px-5 py-4`}>
            <div className={`text-3xl font-bold ${color}`}>{isNaN(value) ? 0 : value}</div>
            <div className="text-sm text-slate-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {casesLoading ? (
        <div className="flex items-center justify-center py-32 text-slate-400">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-teal-600 rounded-full animate-spin mr-3" />
          Loading data...
        </div>
      ) : cases.length === 0 ? (
        <div className="text-center py-32 text-slate-400">
          <BarChart2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg">No case data available yet</p>
          <p className="text-sm mt-1">Cases from the Schedule page will appear here</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Row 1: Surgeon usage + Top sets */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SurgeonUsageChart cases={filteredCases} />
            <TopSetsChart cases={filteredCases} setMap={setMap} />
          </div>

          {/* Row 2: Prep time trend */}
          <PrepTimeTrendChart cases={filteredCases} selectedSurgeon={selectedSurgeon} />

          {/* Row 3: Case averages table */}
          <CaseAveragesTable cases={filteredCases} allCases={cases} />
        </div>
      )}
    </div>
  );
}
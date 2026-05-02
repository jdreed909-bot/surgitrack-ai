import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, Cell
} from "recharts";
import { BarChart2, Clock, Package, User, TrendingUp, Calendar } from "lucide-react";
import SurgeonSetUsageChart from "@/components/dashboard/SurgeonSetUsageChart";
import TopSetsChart from "@/components/dashboard/TopSetsChart";
import CaseDurationTable from "@/components/dashboard/CaseDurationTable";

export default function UsageDashboard() {
  const [selectedSurgeon, setSelectedSurgeon] = useState("all");

  const { data: cases = [], isLoading } = useQuery({
    queryKey: ["surgical-cases-all"],
    queryFn: () => base44.entities.SurgicalCase.list("-scheduled_date", 500),
  });

  const surgeons = useMemo(() => {
    const s = new Set(cases.map(c => c.surgeon).filter(Boolean));
    return ["all", ...Array.from(s).sort()];
  }, [cases]);

  const filteredCases = useMemo(() =>
    selectedSurgeon === "all" ? cases : cases.filter(c => c.surgeon === selectedSurgeon),
    [cases, selectedSurgeon]
  );

  // Stats
  const completedCases = filteredCases.filter(c => c.status === "Completed");
  const avgDuration = completedCases.length
    ? Math.round(completedCases.reduce((sum, c) => sum + (c.estimated_duration || 0), 0) / completedCases.length)
    : 0;

  // Unique set counts
  const allSets = filteredCases.flatMap(c => c.required_sets || []);
  const uniqueSets = new Set(allSets).size;

  return (
    <div className="min-h-screen bg-[#F0F4F8] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl flex items-center justify-center shadow-md">
            <BarChart2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Usage Analytics</h1>
            <p className="text-sm text-slate-500 mt-0.5">Surgical set usage · Case duration trends · Surgeon insights</p>
          </div>
        </div>

        {/* Surgeon filter */}
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-slate-400" />
          <select
            value={selectedSurgeon}
            onChange={e => setSelectedSurgeon(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
          >
            {surgeons.map(s => (
              <option key={s} value={s}>{s === "all" ? "All Surgeons" : s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Cases", value: filteredCases.length, icon: Calendar, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-200" },
          { label: "Completed Cases", value: completedCases.length, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
          { label: "Avg Duration (min)", value: avgDuration || "—", icon: Clock, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
          { label: "Unique Sets Used", value: uniqueSets, icon: Package, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" },
        ].map(({ label, value, icon: Icon, color, bg, border }) => (
          <div key={label} className={`${bg} ${border} border rounded-2xl px-5 py-4`}>
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-xs font-semibold text-slate-500">{label}</span>
            </div>
            <div className={`text-3xl font-bold ${color}`}>{isLoading ? "—" : value}</div>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <TopSetsChart cases={filteredCases} isLoading={isLoading} />
        <SurgeonSetUsageChart cases={cases} isLoading={isLoading} />
      </div>

      {/* Case Duration Table */}
      <CaseDurationTable cases={filteredCases} isLoading={isLoading} />
    </div>
  );
}
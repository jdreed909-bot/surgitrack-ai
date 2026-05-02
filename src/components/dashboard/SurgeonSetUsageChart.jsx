import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { User } from "lucide-react";

const COLORS = ["#0ea5e9","#06b6d4","#14b8a6","#10b981","#84cc16","#f59e0b","#f97316","#ef4444","#ec4899","#8b5cf6"];

export default function SurgeonSetUsageChart({ cases, isLoading }) {
  const data = useMemo(() => {
    const counts = {};
    cases.forEach(c => {
      if (!c.surgeon) return;
      const setCount = (c.required_sets || []).length;
      if (!counts[c.surgeon]) counts[c.surgeon] = { surgeon: c.surgeon, totalSets: 0, caseCount: 0 };
      counts[c.surgeon].totalSets += setCount;
      counts[c.surgeon].caseCount += 1;
    });
    return Object.values(counts)
      .map(d => ({
        name: d.surgeon.length > 16 ? d.surgeon.slice(0, 14) + "…" : d.surgeon,
        fullName: d.surgeon,
        setsPerCase: d.caseCount > 0 ? parseFloat((d.totalSets / d.caseCount).toFixed(1)) : 0,
        totalSets: d.totalSets,
        cases: d.caseCount,
      }))
      .sort((a, b) => b.setsPerCase - a.setsPerCase)
      .slice(0, 12);
  }, [cases]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-5">
        <User className="w-4 h-4 text-cyan-500" />
        <h2 className="text-base font-bold text-slate-800">Sets Per Case by Surgeon</h2>
        <span className="ml-auto text-xs text-slate-400">avg sets requested</span>
      </div>
      {isLoading ? (
        <div className="h-64 flex items-center justify-center text-slate-300 text-sm">Loading…</div>
      ) : data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-slate-300 text-sm">No surgeon data available</div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ left: 0, right: 16, top: 0, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: "#475569" }}
              axisLine={false}
              tickLine={false}
              angle={-35}
              textAnchor="end"
              interval={0}
            />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12 }}
              formatter={(v, name, props) => [
                `${v} sets/case (${props.payload.cases} cases)`,
                props.payload.fullName
              ]}
              labelFormatter={() => ""}
            />
            <Bar dataKey="setsPerCase" radius={[6, 6, 0, 0]}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
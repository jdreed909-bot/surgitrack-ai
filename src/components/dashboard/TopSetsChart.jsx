import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Package } from "lucide-react";

const COLORS = ["#6366f1","#8b5cf6","#a78bfa","#c4b5fd","#ddd6fe","#818cf8","#4f46e5","#7c3aed","#9333ea","#a855f7"];

export default function TopSetsChart({ cases, isLoading }) {
  const data = useMemo(() => {
    const counts = {};
    cases.forEach(c => {
      (c.required_sets || []).forEach(setId => {
        counts[setId] = (counts[setId] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name: name.length > 20 ? name.slice(0, 18) + "…" : name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [cases]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-5">
        <Package className="w-4 h-4 text-indigo-500" />
        <h2 className="text-base font-bold text-slate-800">Most Requested Instrument Sets</h2>
        <span className="ml-auto text-xs text-slate-400">Top 10</span>
      </div>
      {isLoading ? (
        <div className="h-64 flex items-center justify-center text-slate-300 text-sm">Loading…</div>
      ) : data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-slate-300 text-sm">No set data available</div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
            <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11, fill: "#475569" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12 }}
              formatter={(v) => [`${v} cases`, "Used in"]}
            />
            <Bar dataKey="count" radius={[0, 6, 6, 0]}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
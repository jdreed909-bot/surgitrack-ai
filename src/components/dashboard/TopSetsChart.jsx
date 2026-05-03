import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const COLORS = ["#0d9488","#0891b2","#7c3aed","#db2777","#d97706","#16a34a","#dc2626","#9333ea","#2563eb","#059669"];

export default function TopSetsChart({ cases, setMap }) {
  const data = useMemo(() => {
    const counts = {};
    cases.forEach(c => {
      (c.required_sets || []).forEach(setId => {
        const name = setMap[setId] || setId;
        counts[name] = (counts[name] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name: name.length > 22 ? name.slice(0, 20) + "…" : name, fullName: name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [cases, setMap]);

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col items-center justify-center min-h-[320px]">
        <p className="text-slate-400 text-sm">No instrument set data linked to cases yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <h2 className="text-base font-bold text-slate-800 mb-1">Most Requested Instrument Sets</h2>
      <p className="text-xs text-slate-400 mb-4">Top 10 sets by case frequency</p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} width={130} />
          <Tooltip
            formatter={(val, _, props) => [val + " cases", props.payload.fullName]}
            labelFormatter={() => ""}
            contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12 }}
          />
          <Bar dataKey="count" radius={[0, 6, 6, 0]}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
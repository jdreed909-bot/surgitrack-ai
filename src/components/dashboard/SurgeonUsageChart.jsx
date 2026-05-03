import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const COLORS = ["#0d9488","#0891b2","#7c3aed","#db2777","#d97706","#16a34a","#dc2626","#9333ea","#2563eb","#059669"];

export default function SurgeonUsageChart({ cases }) {
  const data = useMemo(() => {
    const counts = {};
    cases.forEach(c => {
      if (!c.surgeon) return;
      counts[c.surgeon] = (counts[c.surgeon] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([surgeon, count]) => ({ surgeon: surgeon.split(" ").pop(), fullName: surgeon, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [cases]);

  if (data.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <h2 className="text-base font-bold text-slate-800 mb-1">Cases by Surgeon</h2>
      <p className="text-xs text-slate-400 mb-4">Top 10 surgeons by case volume</p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -10, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="surgeon"
            tick={{ fontSize: 11, fill: "#64748b" }}
            angle={-35}
            textAnchor="end"
            interval={0}
          />
          <YAxis tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
          <Tooltip
            formatter={(val, _, props) => [val, props.payload.fullName]}
            labelFormatter={() => ""}
            contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12 }}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
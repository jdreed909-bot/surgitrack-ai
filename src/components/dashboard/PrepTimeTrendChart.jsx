import React, { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { format, parseISO } from "date-fns";

export default function PrepTimeTrendChart({ cases }) {
  const { data, avg } = useMemo(() => {
    const withDuration = cases
      .filter(c => c.estimated_duration && c.scheduled_date)
      .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date))
      .map(c => ({
        date: c.scheduled_date,
        duration: c.estimated_duration,
        label: format(parseISO(c.scheduled_date), "MMM d"),
        procedure: c.procedure_name || "",
        surgeon: c.surgeon || "",
      }));

    const total = withDuration.reduce((s, d) => s + d.duration, 0);
    const mean = withDuration.length ? Math.round(total / withDuration.length) : 0;
    return { data: withDuration, avg: mean };
  }, [cases]);

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col items-center justify-center min-h-[220px]">
        <p className="text-slate-400 text-sm">No duration data available for trend chart</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-800 mb-1">Estimated Procedure Duration Trend</h2>
          <p className="text-xs text-slate-400">Scheduled case durations over time (minutes)</p>
        </div>
        {avg > 0 && (
          <div className="bg-teal-50 border border-teal-200 text-teal-700 rounded-xl px-4 py-2 text-center">
            <div className="text-xl font-bold">{avg}m</div>
            <div className="text-[10px] font-semibold uppercase tracking-wide">Avg Duration</div>
          </div>
        )}
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 16, left: -10, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 11, fill: "#64748b" }} unit="m" />
          <Tooltip
            formatter={(val) => [`${val} min`, "Duration"]}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.procedure || ""}
            contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12 }}
          />
          {avg > 0 && (
            <ReferenceLine y={avg} stroke="#0d9488" strokeDasharray="5 5" label={{ value: `Avg ${avg}m`, position: "right", fontSize: 10, fill: "#0d9488" }} />
          )}
          <Line type="monotone" dataKey="duration" stroke="#0891b2" strokeWidth={2} dot={{ r: 3, fill: "#0891b2" }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
import React, { useMemo, useState } from "react";
import { Clock, TrendingUp, TrendingDown, Minus } from "lucide-react";

function parseDuration(val) {
  return typeof val === "number" && val > 0 ? val : null;
}

export default function CaseAveragesTable({ cases, allCases }) {
  const [searchProcedure, setSearchProcedure] = useState("");

  const procedureStats = useMemo(() => {
    const groups = {};
    allCases.forEach(c => {
      const key = `${c.procedure_name || "Unknown"}||${c.surgeon || ""}`;
      if (!groups[key]) groups[key] = { procedure: c.procedure_name || "Unknown", surgeon: c.surgeon || "", cases: [] };
      const d = parseDuration(c.estimated_duration);
      if (d) groups[key].cases.push({ duration: d, date: c.scheduled_date, status: c.status });
    });

    return Object.values(groups)
      .filter(g => g.cases.length >= 1)
      .map(g => {
        const sorted = [...g.cases].sort((a, b) => new Date(b.date) - new Date(a.date));
        const last1 = sorted[0]?.duration ?? null;
        const last10 = sorted.slice(0, 10).map(c => c.duration);
        const avg10 = last10.length ? Math.round(last10.reduce((s, v) => s + v, 0) / last10.length) : null;
        const allDurs = g.cases.map(c => c.duration);
        const overallAvg = Math.round(allDurs.reduce((s, v) => s + v, 0) / allDurs.length);
        // Find a "booked" length — use overall average as proxy for typical booking
        const bookedAvg = overallAvg;
        return {
          procedure: g.procedure,
          surgeon: g.surgeon,
          totalCases: g.cases.length,
          bookedAvg,
          lastCase: last1,
          avg10Cases: avg10,
          last10Count: last10.length,
        };
      })
      .sort((a, b) => b.totalCases - a.totalCases);
  }, [allCases]);

  const filtered = useMemo(() => {
    if (!searchProcedure.trim()) return procedureStats;
    const q = searchProcedure.toLowerCase();
    return procedureStats.filter(p =>
      p.procedure.toLowerCase().includes(q) || p.surgeon.toLowerCase().includes(q)
    );
  }, [procedureStats, searchProcedure]);

  function DiffBadge({ value, reference }) {
    if (!value || !reference) return <span className="text-slate-300 text-xs">—</span>;
    const diff = value - reference;
    if (Math.abs(diff) < 2) return <span className="text-slate-500 text-xs flex items-center gap-0.5"><Minus className="w-3 h-3" /> {value}m</span>;
    if (diff > 0) return (
      <span className="text-red-600 text-xs font-semibold flex items-center gap-0.5">
        <TrendingUp className="w-3 h-3" /> {value}m <span className="text-red-400 font-normal">(+{diff}m)</span>
      </span>
    );
    return (
      <span className="text-emerald-600 text-xs font-semibold flex items-center gap-0.5">
        <TrendingDown className="w-3 h-3" /> {value}m <span className="text-emerald-400 font-normal">({diff}m)</span>
      </span>
    );
  }

  if (procedureStats.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 text-center py-12 text-slate-400">
        <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
        <p>No case duration data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
        <div>
          <h2 className="text-base font-bold text-slate-800 mb-1">Case Duration Averages</h2>
          <p className="text-xs text-slate-400">Booked length vs last case vs last 10-case average</p>
        </div>
        <input
          value={searchProcedure}
          onChange={e => setSearchProcedure(e.target.value)}
          placeholder="Search procedure or surgeon..."
          className="text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-400 w-64"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Procedure</th>
              <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Surgeon</th>
              <th className="text-center py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Cases</th>
              <th className="text-center py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Booked Avg</th>
              <th className="text-center py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Last Case</th>
              <th className="text-center py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Last 10 Avg</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => (
              <tr key={i} className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${i % 2 === 0 ? "" : "bg-slate-50/40"}`}>
                <td className="py-2.5 px-3 font-medium text-slate-800 max-w-[220px]">
                  <div className="truncate">{row.procedure}</div>
                </td>
                <td className="py-2.5 px-3 text-slate-500 text-xs">
                  {row.surgeon || <span className="text-slate-300 italic">—</span>}
                </td>
                <td className="py-2.5 px-3 text-center">
                  <span className="bg-teal-100 text-teal-700 text-xs font-bold px-2 py-0.5 rounded-full">{row.totalCases}</span>
                </td>
                <td className="py-2.5 px-3 text-center">
                  <span className="text-slate-700 font-semibold text-sm">{row.bookedAvg}m</span>
                </td>
                <td className="py-2.5 px-3 text-center">
                  <DiffBadge value={row.lastCase} reference={row.bookedAvg} />
                </td>
                <td className="py-2.5 px-3 text-center">
                  <DiffBadge value={row.avg10Cases} reference={row.bookedAvg} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-8 text-slate-400 text-sm">No matching procedures found</div>
        )}
      </div>
    </div>
  );
}
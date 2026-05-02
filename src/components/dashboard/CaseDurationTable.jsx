import React, { useMemo, useState } from "react";
import { Clock, TrendingUp, TrendingDown, Minus } from "lucide-react";

function DiffBadge({ booked, actual }) {
  if (!booked || !actual) return <span className="text-slate-300 text-xs">—</span>;
  const diff = actual - booked;
  if (Math.abs(diff) < 5) return (
    <span className="flex items-center gap-0.5 text-xs font-semibold text-slate-400">
      <Minus className="w-3 h-3" /> On time
    </span>
  );
  if (diff > 0) return (
    <span className="flex items-center gap-0.5 text-xs font-semibold text-amber-600">
      <TrendingUp className="w-3 h-3" /> +{diff}m over
    </span>
  );
  return (
    <span className="flex items-center gap-0.5 text-xs font-semibold text-emerald-600">
      <TrendingDown className="w-3 h-3" /> {diff}m under
    </span>
  );
}

export default function CaseDurationTable({ cases, isLoading }) {
  const [search, setSearch] = useState("");

  // Group cases by procedure name, then compute stats
  const procedureStats = useMemo(() => {
    const groups = {};
    cases.forEach(c => {
      if (!c.procedure_name || !c.estimated_duration) return;
      const key = c.procedure_name.toLowerCase();
      if (!groups[key]) groups[key] = { name: c.procedure_name, cases: [] };
      groups[key].cases.push(c);
    });

    return Object.values(groups)
      .map(({ name, cases: procCases }) => {
        // Sort by date descending to find "last case" and "last 10"
        const sorted = [...procCases].sort(
          (a, b) => new Date(b.scheduled_date + "T" + (b.scheduled_time || "00:00")) - new Date(a.scheduled_date + "T" + (a.scheduled_time || "00:00"))
        );

        const lastCase = sorted[0];
        const last10 = sorted.slice(0, 10);
        const avg10 = last10.length
          ? Math.round(last10.reduce((sum, c) => sum + (c.estimated_duration || 0), 0) / last10.length)
          : null;

        // Most common booked duration
        const bookedDurations = procCases.map(c => c.estimated_duration).filter(Boolean);
        const bookedModeMap = {};
        bookedDurations.forEach(d => { bookedModeMap[d] = (bookedModeMap[d] || 0) + 1; });
        const bookedMode = Object.entries(bookedModeMap).sort((a, b) => b[1] - a[1])[0];
        const typicalBooked = bookedMode ? parseInt(bookedMode[0]) : null;

        return {
          name,
          totalCases: procCases.length,
          typicalBooked,
          lastDuration: lastCase?.estimated_duration || null,
          lastSurgeon: lastCase?.surgeon || null,
          lastDate: lastCase?.scheduled_date || null,
          avg10,
          last10Count: last10.length,
        };
      })
      .sort((a, b) => b.totalCases - a.totalCases);
  }, [cases]);

  const filtered = useMemo(() =>
    search.trim()
      ? procedureStats.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
      : procedureStats,
    [procedureStats, search]
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-5 gap-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-500" />
          <h2 className="text-base font-bold text-slate-800">Case Duration Averages</h2>
          <span className="text-xs text-slate-400 ml-1">Booked length vs last case vs last 10 avg</span>
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search procedure…"
          className="text-sm border border-slate-200 rounded-xl px-3 py-1.5 w-56 focus:outline-none focus:ring-1 focus:ring-indigo-400"
        />
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-slate-300 text-sm">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-slate-300 text-sm">No procedures found</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide pb-3 pr-4">Procedure</th>
                <th className="text-center text-xs font-semibold text-slate-400 uppercase tracking-wide pb-3 px-3">Cases</th>
                <th className="text-center text-xs font-semibold text-slate-400 uppercase tracking-wide pb-3 px-3">Typical Booked</th>
                <th className="text-center text-xs font-semibold text-slate-400 uppercase tracking-wide pb-3 px-3">Last Case</th>
                <th className="text-center text-xs font-semibold text-slate-400 uppercase tracking-wide pb-3 px-3">vs Booked</th>
                <th className="text-center text-xs font-semibold text-slate-400 uppercase tracking-wide pb-3 px-3">Last 10 Avg</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide pb-3 pl-3">Last Surgeon / Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((p) => (
                <tr key={p.name} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 pr-4 font-semibold text-slate-800 max-w-[220px]">
                    <div className="truncate" title={p.name}>{p.name}</div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="inline-block bg-indigo-50 text-indigo-700 font-bold text-xs px-2 py-0.5 rounded-full">
                      {p.totalCases}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    {p.typicalBooked
                      ? <span className="font-semibold text-slate-700">{p.typicalBooked}m</span>
                      : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {p.lastDuration
                      ? <span className="font-semibold text-slate-700">{p.lastDuration}m</span>
                      : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <DiffBadge booked={p.typicalBooked} actual={p.lastDuration} />
                  </td>
                  <td className="py-3 px-3 text-center">
                    {p.avg10 != null
                      ? (
                        <div>
                          <span className="font-bold text-amber-600">{p.avg10}m</span>
                          {p.last10Count < 10 && (
                            <span className="text-slate-300 text-[10px] ml-1">({p.last10Count})</span>
                          )}
                        </div>
                      )
                      : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="py-3 pl-3">
                    {p.lastSurgeon && (
                      <div className="text-xs text-slate-600 font-medium">{p.lastSurgeon}</div>
                    )}
                    {p.lastDate && (
                      <div className="text-[11px] text-slate-400">{p.lastDate}</div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
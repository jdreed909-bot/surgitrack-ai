import React from "react";

// Time helpers
const TIME_START = 6;   // 6am
const TIME_END   = 24;  // midnight
const TOTAL_HOURS = TIME_END - TIME_START;

function timeToDecimal(timeStr) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(":").map(Number);
  return h + m / 60;
}

function pct(t) {
  return ((t - TIME_START) / TOTAL_HOURS) * 100;
}

// Standard shift bands (reference lines)
const SHIFT_BANDS = [
  { label: "7a (7 rooms)", start: 7,  end: 15.5, color: "rgba(20,184,166,0.08)"  },
  { label: "3p (7 rooms)", start: 15, end: 17,   color: "rgba(99,102,241,0.08)"  },
  { label: "5p (3 rooms)", start: 17, end: 20,   color: "rgba(245,158,11,0.08)"  },
  { label: "8p (1 room)",  start: 20, end: 24,   color: "rgba(239,68,68,0.08)"   },
];

const SHIFT_MARKERS = [
  { t: 7,  label: "7a" },
  { t: 15, label: "3p" },
  { t: 17, label: "5p" },
  { t: 20, label: "8p" },
];

const HOUR_MARKS = [6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24];

export default function StaffingGantt({ orRooms, assignmentMap }) {
  // Build rows: one per OR room, split into RN and ST
  const rows = [];
  orRooms.forEach((room) => {
    const a = assignmentMap[room];
    const start = timeToDecimal(a?.shift_start);
    const end   = timeToDecimal(a?.shift_end);
    rows.push({ room, role: "RN",  name: a?.rn_name,         start, end, color: "#0d9488" });
    rows.push({ room, role: "ST",  name: a?.scrub_tech_name, start, end, color: "#6366f1" });
  });

  const ROW_H = 32;
  const LABEL_W = 120;
  const totalH = rows.length * ROW_H + 36 + 28; // header + shift labels

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mt-4">
      <div className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-teal-500 inline-block" />
        Staffing Coverage — Gantt
        <span className="ml-2 flex items-center gap-3 text-xs font-normal text-slate-400">
          <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm bg-teal-500 inline-block" /> RN</span>
          <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm bg-indigo-500 inline-block" /> Scrub Tech</span>
        </span>
      </div>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${LABEL_W + 680} ${totalH}`}
          style={{ minWidth: 600, width: "100%", display: "block" }}
          fontFamily="sans-serif"
        >
          {/* --- Shift band backgrounds --- */}
          {SHIFT_BANDS.map((b, i) => (
            <rect
              key={i}
              x={LABEL_W + (pct(b.start) / 100) * 680}
              y={28}
              width={(pct(b.end) - pct(b.start)) / 100 * 680}
              height={rows.length * ROW_H}
              fill={b.color}
            />
          ))}

          {/* --- Hour grid lines --- */}
          {HOUR_MARKS.map((h) => (
            <g key={h}>
              <line
                x1={LABEL_W + (pct(h) / 100) * 680}
                y1={28}
                x2={LABEL_W + (pct(h) / 100) * 680}
                y2={28 + rows.length * ROW_H}
                stroke="#f1f5f9" strokeWidth="1"
              />
              <text
                x={LABEL_W + (pct(h) / 100) * 680}
                y={20}
                textAnchor="middle"
                fontSize="9"
                fill="#94a3b8"
              >
                {h === 12 ? "12p" : h > 12 ? `${h - 12}p` : `${h}a`}
              </text>
            </g>
          ))}

          {/* --- Shift markers (bold lines at 7,15,17,20) --- */}
          {SHIFT_MARKERS.map((m) => (
            <g key={m.t}>
              <line
                x1={LABEL_W + (pct(m.t) / 100) * 680}
                y1={24}
                x2={LABEL_W + (pct(m.t) / 100) * 680}
                y2={28 + rows.length * ROW_H}
                stroke="#94a3b8" strokeWidth="0.8" strokeDasharray="3,2"
              />
              <text
                x={LABEL_W + (pct(m.t) / 100) * 680 + 2}
                y={28 + rows.length * ROW_H + 14}
                fontSize="8.5" fill="#6366f1" fontWeight="600"
              >
                {m.label}
              </text>
            </g>
          ))}

          {/* --- Rows --- */}
          {rows.map((row, i) => {
            const y = 28 + i * ROW_H;
            const isNewRoom = i === 0 || rows[i - 1].room !== row.room;
            const barX = row.start != null ? LABEL_W + (pct(row.start) / 100) * 680 : null;
            const barW = row.start != null && row.end != null ? ((row.end - row.start) / TOTAL_HOURS) * 680 : 0;

            return (
              <g key={i}>
                {/* Row bg alternating */}
                <rect
                  x={0} y={y} width={LABEL_W + 680} height={ROW_H}
                  fill={isNewRoom ? (Math.floor(i / 2) % 2 === 0 ? "#f8fafc" : "#ffffff") : (Math.floor(i / 2) % 2 === 0 ? "#f1f5f9" : "#f8fafc")}
                />

                {/* Room label (only on RN row) */}
                {row.role === "RN" && (
                  <text x={6} y={y + ROW_H / 2 + 4} fontSize="9.5" fontWeight="700" fill="#0f172a">
                    {row.room}
                  </text>
                )}

                {/* Role label */}
                <rect x={60} y={y + ROW_H / 2 - 7} width={22} height={14} rx="3"
                  fill={row.role === "RN" ? "#ccfbf1" : "#e0e7ff"} />
                <text x={71} y={y + ROW_H / 2 + 4} textAnchor="middle" fontSize="8" fontWeight="600"
                  fill={row.role === "RN" ? "#0f766e" : "#4338ca"}>
                  {row.role}
                </text>

                {/* Name */}
                <text x={88} y={y + ROW_H / 2 + 3.5} fontSize="9" fill={row.name ? "#334155" : "#cbd5e1"}>
                  {row.name || "—"}
                </text>

                {/* Bar */}
                {barX != null && barW > 0 && (
                  <g>
                    <rect
                      x={barX} y={y + 7} width={barW} height={ROW_H - 14}
                      rx="3" fill={row.color} opacity={row.name ? 0.85 : 0.25}
                    />
                    {barW > 30 && row.name && (
                      <text x={barX + barW / 2} y={y + ROW_H / 2 + 4}
                        textAnchor="middle" fontSize="8" fill="white" fontWeight="600">
                        {row.name}
                      </text>
                    )}
                  </g>
                )}

                {/* Row divider */}
                {row.role === "ST" && (
                  <line x1={0} y1={y + ROW_H} x2={LABEL_W + 680} y2={y + ROW_H}
                    stroke="#e2e8f0" strokeWidth="0.8" />
                )}
              </g>
            );
          })}

          {/* Outer border */}
          <rect x={0} y={28} width={LABEL_W + 680} height={rows.length * ROW_H}
            fill="none" stroke="#e2e8f0" strokeWidth="1" />
        </svg>
      </div>

      {/* Shift summary legend */}
      <div className="flex flex-wrap gap-3 mt-3">
        {SHIFT_BANDS.map((b) => (
          <div key={b.label} className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-3 h-3 rounded-sm inline-block border border-slate-200" style={{ background: b.color.replace("0.08", "0.4") }} />
            {b.label}
          </div>
        ))}
      </div>
    </div>
  );
}
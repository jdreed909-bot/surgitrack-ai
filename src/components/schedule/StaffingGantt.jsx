import React from "react";

// Time helpers
const TIME_START = 6;   // 6am
const TIME_END   = 24;  // midnight
const TOTAL_HOURS = TIME_END - TIME_START;
const CHART_W = 680;

function timeToDecimal(timeStr) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(":").map(Number);
  return h + m / 60;
}

function pct(t) {
  return ((t - TIME_START) / TOTAL_HOURS) * 100;
}

function toX(t) {
  return LABEL_W + (pct(t) / 100) * CHART_W;
}

function formatTime(t) {
  if (t == null) return "";
  const h = Math.floor(t);
  const m = Math.round((t - h) * 60);
  const suffix = h >= 12 ? "p" : "a";
  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return m === 0 ? `${displayH}${suffix}` : `${displayH}:${m.toString().padStart(2,"0")}${suffix}`;
}

// Label column width
const LABEL_W = 130;

// Shift band backgrounds
const SHIFT_BANDS = [
  { label: "7a–3:30p",  start: 7,  end: 15.5, color: "rgba(20,184,166,0.07)"  },
  { label: "3p–5p",     start: 15, end: 17,   color: "rgba(99,102,241,0.07)"  },
  { label: "5p–8p",     start: 17, end: 20,   color: "rgba(245,158,11,0.07)"  },
  { label: "8p–12a",    start: 20, end: 24,   color: "rgba(239,68,68,0.07)"   },
];

const SHIFT_MARKERS = [7, 15, 17, 20];
const HOUR_MARKS = [6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24];

// Role config
const ROLE_CONFIGS = [
  { key: "rn",         label: "RN",      startKey: "rn_shift_start",         endKey: "rn_shift_end",         nameKey: "rn_name",         color: "#0d9488", bg: "#ccfbf1", textColor: "#0f766e" },
  { key: "st",         label: "ST",      startKey: "scrub_tech_shift_start",  endKey: "scrub_tech_shift_end",  nameKey: "scrub_tech_name", color: "#6366f1", bg: "#e0e7ff", textColor: "#4338ca" },
  { key: "charge",     label: "CRN",     startKey: "charge_rn_shift_start",   endKey: "charge_rn_shift_end",   nameKey: "charge_rn_name",  color: "#d97706", bg: "#fef3c7", textColor: "#92400e" },
];

const ROW_H = 30;
const HEADER_H = 28;
const FOOTER_H = 18;

export default function StaffingGantt({ orRooms, assignmentMap }) {
  // Build rows: RN, ST, CRN per OR room
  const rows = [];
  orRooms.forEach((room) => {
    const a = assignmentMap[room] || {};
    ROLE_CONFIGS.forEach((rc) => {
      // Fall back to legacy shift_start/end if per-role not set
      const start = timeToDecimal(a[rc.startKey] || a.shift_start);
      const end   = timeToDecimal(a[rc.endKey]   || a.shift_end);
      rows.push({ room, ...rc, name: a[rc.nameKey] || "", start, end });
    });
  });

  const totalH = HEADER_H + rows.length * ROW_H + FOOTER_H + 8;

  // Staffing gap detection: for each OR room, find hours where coverage drops to 0
  // (used to paint red "gap" zones)
  const roomGaps = {};
  orRooms.forEach((room) => {
    const a = assignmentMap[room] || {};
    const times = ROLE_CONFIGS
      .map((rc) => ({
        start: timeToDecimal(a[rc.startKey] || a.shift_start),
        end:   timeToDecimal(a[rc.endKey]   || a.shift_end),
        name:  a[rc.nameKey],
      }))
      .filter((r) => r.name && r.start != null && r.end != null);
    roomGaps[room] = times;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mt-4">
      <div className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2 flex-wrap">
        <span className="w-2 h-2 rounded-full bg-teal-500 inline-block" />
        Staffing Coverage — Gantt
        <span className="ml-2 flex items-center gap-3 text-xs font-normal text-slate-400">
          {ROLE_CONFIGS.map((rc) => (
            <span key={rc.key} className="flex items-center gap-1">
              <span className="w-3 h-2 rounded-sm inline-block" style={{ background: rc.color }} />
              {rc.label === "CRN" ? "Charge RN" : rc.label === "ST" ? "Scrub Tech" : "RN"}
            </span>
          ))}
        </span>
      </div>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${LABEL_W + CHART_W} ${totalH}`}
          style={{ minWidth: 620, width: "100%", display: "block" }}
          fontFamily="sans-serif"
        >
          {/* Shift band backgrounds */}
          {SHIFT_BANDS.map((b, i) => (
            <rect
              key={i}
              x={toX(b.start)}
              y={HEADER_H}
              width={((b.end - b.start) / TOTAL_HOURS) * CHART_W}
              height={rows.length * ROW_H}
              fill={b.color}
            />
          ))}

          {/* Hour grid lines + labels */}
          {HOUR_MARKS.map((h) => (
            <g key={h}>
              <line
                x1={toX(h)} y1={HEADER_H}
                x2={toX(h)} y2={HEADER_H + rows.length * ROW_H}
                stroke="#f1f5f9" strokeWidth="1"
              />
              <text x={toX(h)} y={16} textAnchor="middle" fontSize="9" fill="#94a3b8">
                {h === 12 ? "12p" : h > 12 ? `${h - 12}p` : `${h}a`}
              </text>
            </g>
          ))}

          {/* Shift markers */}
          {SHIFT_MARKERS.map((t) => (
            <line key={t}
              x1={toX(t)} y1={HEADER_H - 4}
              x2={toX(t)} y2={HEADER_H + rows.length * ROW_H}
              stroke="#94a3b8" strokeWidth="0.8" strokeDasharray="3,2"
            />
          ))}

          {/* Rows */}
          {rows.map((row, i) => {
            const y = HEADER_H + i * ROW_H;
            const isFirstInRoom = i === 0 || rows[i - 1].room !== row.room;
            const isLastInRoom  = i === rows.length - 1 || rows[i + 1].room !== row.room;

            // alternating room bg
            const roomIdx = orRooms.indexOf(row.room);
            const rowBg = roomIdx % 2 === 0 ? "#f8fafc" : "#ffffff";
            // inner role stripe slightly darker
            const innerBg = isFirstInRoom ? rowBg : (roomIdx % 2 === 0 ? "#f1f5f9" : "#f8fafc");

            const hasBar = row.start != null && row.end != null && row.name;
            const barX = row.start != null ? toX(Math.max(row.start, TIME_START)) : null;
            const barEnd = row.end != null ? toX(Math.min(row.end, TIME_END)) : null;
            const barW = hasBar ? barEnd - barX : 0;

            return (
              <g key={i}>
                {/* Row background */}
                <rect x={0} y={y} width={LABEL_W + CHART_W} height={ROW_H} fill={innerBg} />

                {/* Room label — only on first role row */}
                {isFirstInRoom && (
                  <text x={6} y={y + ROW_H / 2 + 4} fontSize="9.5" fontWeight="700" fill="#0f172a">
                    {row.room}
                  </text>
                )}

                {/* Role badge */}
                <rect x={62} y={y + ROW_H / 2 - 7} width={26} height={14} rx="3" fill={row.bg} />
                <text x={75} y={y + ROW_H / 2 + 4} textAnchor="middle" fontSize="7.5" fontWeight="700" fill={row.textColor}>
                  {row.label}
                </text>

                {/* Name label */}
                <text x={93} y={y + ROW_H / 2 + 3.5} fontSize="8.5" fill={row.name ? "#334155" : "#cbd5e1"}>
                  {row.name || "—"}
                </text>

                {/* Shift bar */}
                {hasBar && barW > 0 && (
                  <g>
                    <rect
                      x={barX} y={y + 6} width={barW} height={ROW_H - 12}
                      rx="3" fill={row.color} opacity={0.82}
                    />
                    {/* Start time label */}
                    <text x={barX + 3} y={y + ROW_H / 2 + 3.5} fontSize="7.5" fill="white" opacity={0.9}>
                      {formatTime(row.start)}
                    </text>
                    {/* End time label (right-aligned inside bar) */}
                    {barW > 40 && (
                      <text x={barX + barW - 3} y={y + ROW_H / 2 + 3.5} textAnchor="end" fontSize="7.5" fill="white" opacity={0.9}>
                        {formatTime(row.end)}
                      </text>
                    )}
                    {/* Name in center if wide enough */}
                    {barW > 80 && (
                      <text x={barX + barW / 2} y={y + ROW_H / 2 + 3.5}
                        textAnchor="middle" fontSize="8" fill="white" fontWeight="600" opacity={0.95}>
                        {row.name}
                      </text>
                    )}
                  </g>
                )}

                {/* No-staff indicator */}
                {!row.name && (
                  <rect
                    x={toX(TIME_START)} y={y + 8}
                    width={CHART_W} height={ROW_H - 16}
                    rx="3" fill="rgba(239,68,68,0.07)" stroke="rgba(239,68,68,0.2)" strokeWidth="0.8" strokeDasharray="4,3"
                  />
                )}

                {/* Row divider — heavier after last role in room */}
                <line
                  x1={0} y1={y + ROW_H} x2={LABEL_W + CHART_W} y2={y + ROW_H}
                  stroke={isLastInRoom ? "#cbd5e1" : "#e2e8f0"}
                  strokeWidth={isLastInRoom ? "1" : "0.5"}
                />
              </g>
            );
          })}

          {/* Outer border */}
          <rect x={0} y={HEADER_H} width={LABEL_W + CHART_W} height={rows.length * ROW_H}
            fill="none" stroke="#e2e8f0" strokeWidth="1" />

          {/* Shift marker labels at bottom */}
          {SHIFT_MARKERS.map((t) => (
            <text key={t}
              x={toX(t) + 2}
              y={HEADER_H + rows.length * ROW_H + 13}
              fontSize="8.5" fill="#6366f1" fontWeight="600">
              {t === 7 ? "7a" : t === 15 ? "3p" : t === 17 ? "5p" : "8p"}
            </text>
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-3">
        {SHIFT_BANDS.map((b) => (
          <div key={b.label} className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-3 h-3 rounded-sm inline-block border border-slate-200"
              style={{ background: b.color.replace("0.07", "0.35") }} />
            {b.label}
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 ml-2">
          <span className="w-3 h-3 rounded-sm inline-block border border-red-200" style={{ background: "rgba(239,68,68,0.15)" }} />
          Unstaffed
        </div>
      </div>
    </div>
  );
}
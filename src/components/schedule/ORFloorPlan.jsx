import React from "react";
import { Plus, Edit2, User, Wrench } from "lucide-react";

// Silhouette layout for up to 7 OR rooms arranged like a real OR suite
const LAYOUT_POSITIONS = [
  { id: 0, x: 4,   y: 4,   w: 28, h: 22 },
  { id: 1, x: 36,  y: 4,   w: 28, h: 22 },
  { id: 2, x: 68,  y: 4,   w: 28, h: 22 },
  { id: 3, x: 4,   y: 32,  w: 28, h: 22 },
  { id: 4, x: 36,  y: 32,  w: 28, h: 22 },
  { id: 5, x: 68,  y: 32,  w: 28, h: 22 },
  { id: 6, x: 36,  y: 60,  w: 28, h: 22 },
];

// Corridor rectangles (the hallway between rooms)
const CORRIDORS = [
  { x: 0, y: 27, w: 100, h: 4 },  // horizontal main corridor
  { x: 0, y: 55, w: 100, h: 4 },  // lower corridor
];

export default function ORFloorPlan({ orRooms, assignmentMap, onEdit }) {
  const visiblePositions = LAYOUT_POSITIONS.slice(0, orRooms.length);

  return (
    <div className="bg-slate-900 rounded-2xl p-4 overflow-hidden">
      <div className="text-xs text-slate-400 mb-3 font-medium uppercase tracking-widest text-center">Main OR Suite — Floor Plan</div>
      <svg
        viewBox="0 0 100 86"
        className="w-full"
        style={{ maxHeight: 340 }}
      >
        {/* Background floor */}
        <rect x="0" y="0" width="100" height="86" fill="#1e293b" rx="1" />

        {/* Corridors */}
        {CORRIDORS.map((c, i) => (
          <rect key={i} x={c.x} y={c.y} width={c.w} height={c.h} fill="#334155" />
        ))}
        <text x="2" y="30.2" fontSize="1.6" fill="#64748b" fontFamily="sans-serif">CORRIDOR</text>
        <text x="2" y="57.5" fontSize="1.6" fill="#64748b" fontFamily="sans-serif">CORRIDOR</text>

        {/* OR Rooms */}
        {visiblePositions.map((pos) => {
          const room = orRooms[pos.id];
          const assignment = assignmentMap[room];
          const hasRN = !!assignment?.rn_name;
          const hasST = !!assignment?.scrub_tech_name;
          const fullyStaffed = hasRN && hasST;
          const partiallyStaffed = hasRN || hasST;
          const shift = assignment?.shift_start ? `${assignment.shift_start}–${assignment.shift_end}` : null;

          const roomColor = fullyStaffed ? "#0d9488" : partiallyStaffed ? "#d97706" : "#374151";
          const borderColor = fullyStaffed ? "#14b8a6" : partiallyStaffed ? "#f59e0b" : "#4b5563";
          const textColor = fullyStaffed ? "#ccfbf1" : partiallyStaffed ? "#fef3c7" : "#9ca3af";

          return (
            <g key={pos.id} style={{ cursor: "pointer" }} onClick={() => onEdit(room)}>
              {/* Room body */}
              <rect
                x={pos.x} y={pos.y} width={pos.w} height={pos.h}
                fill={roomColor} stroke={borderColor} strokeWidth="0.5" rx="1"
              />
              {/* Door notch */}
              <rect x={pos.x + pos.w / 2 - 2.5} y={pos.y + pos.h - 0.4} width="5" height="0.8" fill={borderColor} />

              {/* OR Table silhouette */}
              <rect
                x={pos.x + pos.w / 2 - 4} y={pos.y + pos.h / 2 - 2.5}
                width="8" height="5" rx="0.5"
                fill="rgba(0,0,0,0.25)" stroke="rgba(255,255,255,0.15)" strokeWidth="0.3"
              />
              {/* Overhead light circle */}
              <circle
                cx={pos.x + pos.w / 2} cy={pos.y + 3.5} r="2"
                fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.2)" strokeWidth="0.3"
              />

              {/* Room label */}
              <text x={pos.x + pos.w / 2} y={pos.y + 2.8} textAnchor="middle" fontSize="2" fontWeight="bold" fill={textColor} fontFamily="sans-serif">
                {room}
              </text>

              {/* RN name */}
              <text x={pos.x + 1.5} y={pos.y + pos.h - 5.5} fontSize="1.5" fill={hasRN ? "#5eead4" : "#4b5563"} fontFamily="sans-serif">
                RN: {assignment?.rn_name || "—"}
              </text>
              {/* ST name */}
              <text x={pos.x + 1.5} y={pos.y + pos.h - 3.5} fontSize="1.5" fill={hasST ? "#fcd34d" : "#4b5563"} fontFamily="sans-serif">
                ST: {assignment?.scrub_tech_name || "—"}
              </text>
              {/* Shift */}
              {shift && (
                <text x={pos.x + 1.5} y={pos.y + pos.h - 1.5} fontSize="1.4" fill="#94a3b8" fontFamily="sans-serif">
                  {shift}
                </text>
              )}

              {/* Edit hint overlay */}
              <rect x={pos.x} y={pos.y} width={pos.w} height={pos.h} fill="transparent" rx="1" />
            </g>
          );
        })}

        {/* Legend */}
        <rect x="1" y="79" width="3" height="2" fill="#0d9488" rx="0.3" />
        <text x="5.5" y="80.6" fontSize="1.6" fill="#94a3b8" fontFamily="sans-serif">Fully Staffed</text>
        <rect x="28" y="79" width="3" height="2" fill="#d97706" rx="0.3" />
        <text x="32.5" y="80.6" fontSize="1.6" fill="#94a3b8" fontFamily="sans-serif">Partial</text>
        <rect x="48" y="79" width="3" height="2" fill="#374151" rx="0.3" />
        <text x="52.5" y="80.6" fontSize="1.6" fill="#94a3b8" fontFamily="sans-serif">Unassigned</text>
        <text x="75" y="80.6" fontSize="1.4" fill="#4b5563" fontFamily="sans-serif">Click room to edit</text>
      </svg>
    </div>
  );
}
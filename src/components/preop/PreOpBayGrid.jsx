import React from "react";
import { Plus, CheckCircle2, Circle, Clock, User, Bed } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";

const DEFAULT_PREOP_BAYS = [12, 13, 14, 15, 16, 17, 18, 19];

function formatElapsed(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

function ElapsedTimer({ startTime }) {
  const [elapsed, setElapsed] = React.useState(0);
  React.useEffect(() => {
    if (!startTime) return;
    const calc = () => setElapsed(Math.max(0, Math.floor((Date.now() - new Date(startTime).getTime()) / 1000)));
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [startTime]);
  const color = elapsed < 1800 ? "text-emerald-300" : elapsed < 3600 ? "text-amber-300" : "text-red-300";
  return <span className={`font-mono text-sm font-bold tracking-wide ${color}`}>{formatElapsed(elapsed)}</span>;
}

// Returns header bg based on elapsed seconds (and overrides if good-to-go)
function getHeaderStyle(elapsed, isGoodToGo) {
  if (isGoodToGo) return "bg-emerald-500";
  if (elapsed < 1800) return "bg-blue-600";        // < 30 min — normal
  if (elapsed < 3600) return "bg-amber-500";        // 30–60 min — caution
  return "bg-red-600";                              // > 60 min — urgent
}

function getCardBorder(elapsed, isGoodToGo) {
  if (isGoodToGo) return "bg-emerald-50 border-emerald-400 ring-2 ring-emerald-200";
  if (elapsed < 1800) return "bg-white border-slate-200";
  if (elapsed < 3600) return "bg-amber-50 border-amber-300 ring-1 ring-amber-200";
  return "bg-red-50 border-red-400 ring-2 ring-red-200";
}

const SPECIALTY_COLORS = {
  OR:  "bg-blue-500 text-white",
  CCL: "bg-rose-500 text-white",
  IR:  "bg-purple-500 text-white",
  GI:  "bg-amber-500 text-white",
};

const SPECIALTY_ROOMS = {
  GI:  ["PR1", "PR2", "PR3"],
  CCL: ["CCL1"],
  IR:  ["IR1"],
  OR:  ["OR 1", "OR 2", "OR 3", "OR 4", "OR 5", "OR 6", "OR 7"],
};

const VISITS = [
  { key: "surgeon_visited", label: "Surg", atKey: "surgeon_visited_at" },
  { key: "anesthesia_visited", label: "Anes", atKey: "anesthesia_visited_at" },
  { key: "or_rn_visited", label: "OR RN", atKey: "or_rn_visited_at" },
];

function OccupiedBay({ patient, bay }) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["preop-patients"] });
  const [elapsed, setElapsed] = React.useState(0);
  const [selectedRoom, setSelectedRoom] = React.useState("");

  React.useEffect(() => {
    if (!patient.checked_in_at) return;
    const calc = () => setElapsed(Math.max(0, Math.floor((Date.now() - new Date(patient.checked_in_at).getTime()) / 1000)));
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [patient.checked_in_at]);

  const isGoodToGo = !!patient.good_to_go;
  const allVisited = VISITS.every(v => patient[v.key]);

  const toggleVisit = async (key, atKey) => {
    const visited = !patient[key];
    await base44.entities.PreOpPatient.update(patient.id, {
      [key]: visited,
      [atKey]: visited ? new Date().toISOString() : null,
    });
    invalidate();
  };

  const toggleGoodToGo = async () => {
    await base44.entities.PreOpPatient.update(patient.id, { good_to_go: !isGoodToGo });
    invalidate();
  };

  const roomOptions = SPECIALTY_ROOMS[patient.specialty] || SPECIALTY_ROOMS.OR;

  const sendToOR = async (room) => {
    await base44.entities.PreOpPatient.update(patient.id, {
      status: "Intra-Op",
      intraop_start: new Date().toISOString(),
      or_room: room || patient.or_room || "",
    });
    invalidate();
  };

  const moveToPacu = async () => {
    // Move to PACU with NO bay assigned — drops into the PACU intake queue
    await base44.entities.PreOpPatient.update(patient.id, {
      status: "PACU",
      pacu_start: new Date().toISOString(),
      bay_number: null,
    });
    invalidate();
  };

  const remove = async () => {
    await base44.entities.PreOpPatient.delete(patient.id);
    invalidate();
  };

  const cardBg = getCardBorder(elapsed, isGoodToGo);
  const headerBg = getHeaderStyle(elapsed, isGoodToGo);

  return (
    <div className={`rounded-2xl border shadow-sm flex flex-col overflow-hidden h-full ${cardBg}`}>
      {/* Bay header */}
      <div className={`px-3 py-2.5 flex items-center justify-between ${headerBg}`}>
        <div className="flex items-center gap-1.5">
          <span className="text-white font-bold text-sm">Bay {bay}</span>
          {patient.specialty && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${SPECIALTY_COLORS[patient.specialty] || "bg-white/20 text-white"}`}>
              {patient.specialty}
            </span>
          )}
          {patient.is_inpatient && (
            <span className="flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-400 text-white">
              <Bed className="w-3 h-3" /> IP
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-white/70" />
          <ElapsedTimer startTime={patient.checked_in_at} />
          <button
            title="Reset timer"
            onClick={async () => {
              await base44.entities.PreOpPatient.update(patient.id, { checked_in_at: new Date().toISOString() });
              invalidate();
            }}
            className="ml-1 text-white/60 hover:text-white text-[10px] font-bold border border-white/30 hover:border-white/60 rounded px-1 py-0.5 transition-all"
          >
            ↺
          </button>
        </div>
      </div>

      {/* Patient info */}
      <div className="px-3 pt-2.5 pb-1 flex-1 flex flex-col gap-2">
        <div>
          <div className="font-bold text-slate-800 text-sm leading-tight truncate">{patient.patient_initials}</div>
          <div className="text-[11px] text-slate-500 truncate">{patient.procedure_name}</div>
          {patient.surgeon && <div className="text-[10px] text-slate-400 truncate">{patient.surgeon}</div>}
          {patient.or_room && (
            <span className="inline-block mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-teal-100 text-teal-700">{patient.or_room}</span>
          )}
        </div>

        {/* Prepped by */}
        <div className="text-[10px] text-slate-500 flex items-center gap-1">
          <User className="w-3 h-3" />
          <span className="truncate">{patient.prepped_by || <em>No staff assigned</em>}</span>
        </div>

        {/* Visit checks */}
        <div className="grid grid-cols-3 gap-1">
          {VISITS.map(({ key, label, atKey }) => {
            const checked = !!patient[key];
            return (
              <button
                key={key}
                onClick={() => toggleVisit(key, atKey)}
                className={`flex flex-col items-center py-1.5 rounded-lg border text-[10px] font-semibold transition-all
                  ${checked ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-slate-50 border-slate-200 text-slate-400 hover:border-teal-300"}`}
              >
                {checked ? <CheckCircle2 className="w-3 h-3 mb-0.5" /> : <Circle className="w-3 h-3 mb-0.5" />}
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="px-3 pb-3 flex flex-col gap-1.5">
        <button
          onClick={toggleGoodToGo}
          className={`w-full text-[11px] font-bold py-2 rounded-lg border transition-all
            ${isGoodToGo
              ? "bg-emerald-500 text-white border-emerald-500"
              : "bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50"}`}
        >
          {isGoodToGo ? "✓ Good to Go!" : "✓ Mark Good to Go"}
        </button>
        <div className="flex gap-1.5">
          <select
            value={selectedRoom}
            onChange={e => setSelectedRoom(e.target.value)}
            className="flex-1 text-[10px] border border-blue-200 bg-blue-50 text-blue-700 rounded-lg px-1 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
          >
            <option value="">Room...</option>
            {roomOptions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <button
            onClick={() => sendToOR(selectedRoom)}
            disabled={!selectedRoom}
            className="text-[10px] font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 rounded-lg py-1.5 px-2 transition-colors">
            → Go
          </button>
          <button onClick={remove}
            className="text-[10px] font-semibold text-slate-400 border border-slate-200 hover:border-red-200 hover:text-red-400 rounded-lg py-1.5 px-2 transition-colors">
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyBay({ bay, onCheckIn }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white flex flex-col overflow-hidden">
      <div className="px-3 py-2 bg-slate-50 border-b border-slate-200">
        <span className="text-slate-500 font-bold text-sm">Bay {bay}</span>
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
        <button
          onClick={() => onCheckIn(bay)}
          className="flex flex-col items-center gap-1.5 text-slate-300 hover:text-teal-500 transition-colors group"
        >
          <div className="w-8 h-8 rounded-full border-2 border-dashed border-current flex items-center justify-center group-hover:border-teal-400">
            <Plus className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-semibold">Check In</span>
        </button>
      </div>
    </div>
  );
}

export default function PreOpBayGrid({ patients, onCheckIn, bays = DEFAULT_PREOP_BAYS }) {
  const patientByBay = {};
  patients
    .filter(p => p.status === "Pre-Op" || p.status === "Ready")
    .forEach(p => { if (p.bay_number) patientByBay[p.bay_number] = p; });

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
      {bays.map(bay => (
        <div key={bay} className="min-h-[280px] flex flex-col">
          {patientByBay[bay]
            ? <OccupiedBay patient={patientByBay[bay]} bay={bay} />
            : <EmptyBay bay={bay} onCheckIn={onCheckIn} />
          }
        </div>
      ))}
    </div>
  );
}
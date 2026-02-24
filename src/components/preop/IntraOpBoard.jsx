import React from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Clock } from "lucide-react";

const OR_ROOMS = ["OR 1", "OR 2", "OR 3", "OR 4", "OR 5", "OR 6", "OR 7"];

const OR_STATUSES = [
  { value: "Case In Progress", label: "Case In Progress", color: "bg-blue-500", light: "bg-blue-50 border-blue-300 text-blue-800", dot: "bg-blue-500" },
  { value: "Turnover In Progress", label: "Turnover", color: "bg-amber-500", light: "bg-amber-50 border-amber-300 text-amber-800", dot: "bg-amber-400" },
  { value: "Ready for Next Case", label: "Ready", color: "bg-emerald-500", light: "bg-emerald-50 border-emerald-300 text-emerald-800", dot: "bg-emerald-500" },
];

function ElapsedTimer({ startTime }) {
  const [elapsed, setElapsed] = React.useState(0);
  React.useEffect(() => {
    if (!startTime) return;
    const calc = () => setElapsed(Math.max(0, Math.floor((Date.now() - new Date(startTime).getTime()) / 1000)));
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [startTime]);
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  const display = h > 0 ? `${h}h ${m}m` : `${m}m ${String(s).padStart(2,"0")}s`;
  return <span className="font-mono text-xs font-semibold text-slate-500">{display}</span>;
}

function ORTile({ room, patient, orRoomStatus, onStatusChange, onSendToPacu, queryClient }) {
  const statusConfig = OR_STATUSES.find(s => s.value === orRoomStatus) || null;
  const hasPatient = !!patient;

  return (
    <div className={`rounded-2xl border-2 flex flex-col overflow-hidden transition-all
      ${hasPatient && orRoomStatus === "Case In Progress" ? "border-blue-300 shadow-md" :
        hasPatient && orRoomStatus === "Turnover In Progress" ? "border-amber-300 shadow-md" :
        hasPatient && orRoomStatus === "Ready for Next Case" ? "border-emerald-300 shadow-md" :
        "border-slate-200 bg-white"}`}>
      {/* Room header */}
      <div className={`px-4 py-3 flex items-center justify-between
        ${orRoomStatus === "Case In Progress" ? "bg-blue-500" :
          orRoomStatus === "Turnover In Progress" ? "bg-amber-400" :
          orRoomStatus === "Ready for Next Case" ? "bg-emerald-500" :
          "bg-slate-100"}`}>
        <span className={`font-bold text-sm ${orRoomStatus ? "text-white" : "text-slate-600"}`}>{room}</span>
        {hasPatient && patient.intraop_start && (
          <div className="flex items-center gap-1">
            <ElapsedTimer startTime={patient.intraop_start} />
            <button
              title="Reset timer"
              onClick={async () => {
                await base44.entities.PreOpPatient.update(patient.id, { intraop_start: new Date().toISOString() });
                queryClient.invalidateQueries({ queryKey: ["preop-patients"] });
              }}
              className="text-white/60 hover:text-white text-[10px] font-bold border border-white/30 hover:border-white/60 rounded px-1 py-0.5 transition-all"
            >
              ↺
            </button>
          </div>
        )}
        {orRoomStatus && (
          <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full
            ${orRoomStatus === "Case In Progress" ? "bg-blue-400 text-white" :
              orRoomStatus === "Turnover In Progress" ? "bg-amber-300 text-amber-900" :
              "bg-emerald-400 text-white"}`}>
            {orRoomStatus === "Case In Progress" ? "In Progress" :
             orRoomStatus === "Turnover In Progress" ? "Turnover" : "Ready"}
          </span>
        )}
      </div>

      {/* Patient info or empty */}
      <div className="flex-1 p-3 bg-white">
        {hasPatient ? (
          <div>
            <div className="font-bold text-slate-800 text-sm leading-tight truncate">{patient.procedure_name}</div>
            {patient.patient_initials && <div className="text-xs text-slate-500 mt-0.5">{patient.patient_initials}</div>}
            {patient.surgeon && <div className="text-xs text-slate-400 truncate">{patient.surgeon}</div>}
          </div>
        ) : (
          <div className="text-xs text-slate-300 italic text-center py-2">No active case</div>
        )}
      </div>

      {/* Status buttons */}
      <div className="p-2 border-t border-slate-100 bg-slate-50 flex flex-col gap-1.5">
        {OR_STATUSES.map(({ value, label, light }) => (
          <button
            key={value}
            onClick={() => onStatusChange(room, value)}
            className={`w-full text-[11px] font-semibold py-1.5 px-2 rounded-lg border transition-all
              ${orRoomStatus === value ? light + " shadow-sm" : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"}`}
          >
            {label}
          </button>
        ))}
        {hasPatient && orRoomStatus === "Case In Progress" && (
          <button
            onClick={() => onSendToPacu(patient)}
            className="w-full text-[11px] font-semibold py-1.5 px-2 rounded-lg border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 transition-all mt-0.5"
          >
            → PACU
          </button>
        )}
      </div>
    </div>
  );
}

export default function IntraOpBoard({ patients, orRoomStatuses, onStatusChange }) {
  const queryClient = useQueryClient();

  // Build map of or_room → active intraop patient
  const intraOpPatientByRoom = {};
  patients
    .filter(p => p.status === "Intra-Op")
    .forEach(p => { if (p.or_room) intraOpPatientByRoom[p.or_room] = p; });

  const sendToPacu = async (patient) => {
    await base44.entities.PreOpPatient.update(patient.id, {
      status: "PACU",
      pacu_start: new Date().toISOString(),
    });
    queryClient.invalidateQueries({ queryKey: ["preop-patients"] });
  };

  return (
    <section className="mb-10">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xl font-bold text-slate-800">Intra-Op</h2>
        <div className="flex items-center gap-3 ml-2">
          {OR_STATUSES.map(({ value, dot, label }) => (
            <div key={value} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
              <span className="text-xs text-slate-500">{label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {OR_ROOMS.map(room => (
          <ORTile
            key={room}
            room={room}
            patient={intraOpPatientByRoom[room] || null}
            orRoomStatus={orRoomStatuses[room] || null}
            onStatusChange={onStatusChange}
            onSendToPacu={sendToPacu}
          />
        ))}
      </div>
    </section>
  );
}
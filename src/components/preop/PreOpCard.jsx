import React, { useState, useEffect } from "react";
import { CheckCircle2, Circle, Clock, User, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";

function formatElapsed(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${String(s).padStart(2, "0")}s`;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

function getTimerColor(seconds) {
  if (seconds < 1800) return "text-emerald-600";
  if (seconds < 3600) return "text-amber-500";
  return "text-red-500";
}

function getTimerBg(seconds, isPacu) {
  if (isPacu) return "bg-purple-50";
  if (seconds >= 3600) return "bg-red-50";
  if (seconds >= 1800) return "bg-amber-50";
  return "bg-slate-50";
}

const VISITS = [
  { key: "surgeon_visited", label: "Surgeon", icon: "🩺", atKey: "surgeon_visited_at" },
  { key: "anesthesia_visited", label: "Anesthesia", icon: "💉", atKey: "anesthesia_visited_at" },
  { key: "or_rn_visited", label: "OR RN", icon: "👩‍⚕️", atKey: "or_rn_visited_at" },
];

export default function PreOpCard({ patient }) {
  const [elapsed, setElapsed] = useState(0);
  const [editingPreppedBy, setEditingPreppedBy] = useState(false);
  const [preppedByInput, setPreppedByInput] = useState(patient.prepped_by || "");
  const queryClient = useQueryClient();

  useEffect(() => {
    const startTime = patient.status === "PACU" ? patient.pacu_start : patient.checked_in_at;
    if (!startTime) return;
    const calc = () => setElapsed(Math.max(0, Math.floor((Date.now() - new Date(startTime).getTime()) / 1000)));
    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [patient.checked_in_at, patient.pacu_start, patient.status]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["preop-patients"] });

  const toggleVisit = async (key, atKey) => {
    const visited = !patient[key];
    await base44.entities.PreOpPatient.update(patient.id, {
      [key]: visited,
      [atKey]: visited ? new Date().toISOString() : null,
    });
    invalidate();
  };

  const savePrepBy = async () => {
    await base44.entities.PreOpPatient.update(patient.id, { prepped_by: preppedByInput });
    setEditingPreppedBy(false);
    invalidate();
  };

  const moveToPacu = async () => {
    await base44.entities.PreOpPatient.update(patient.id, { status: "PACU", pacu_start: new Date().toISOString() });
    invalidate();
  };

  const discharge = async () => {
    await base44.entities.PreOpPatient.update(patient.id, { status: "Discharged" });
    invalidate();
  };

  const remove = async () => {
    await base44.entities.PreOpPatient.delete(patient.id);
    invalidate();
  };

  const isPacu = patient.status === "PACU";
  const isDischarged = patient.status === "Discharged";
  const allVisited = VISITS.every(v => patient[v.key]);
  const timerColor = getTimerColor(elapsed);
  const timerBg = getTimerBg(elapsed, isPacu);

  const cardBorder = isPacu
    ? "border-purple-200 ring-1 ring-purple-100"
    : isDischarged
    ? "border-slate-200 opacity-60"
    : allVisited
    ? "border-emerald-300 ring-1 ring-emerald-100"
    : "border-slate-200";

  return (
    <div className={`bg-white rounded-2xl border shadow-sm p-5 flex flex-col gap-4 relative ${cardBorder}`}>
      {/* Remove button */}
      <button onClick={remove} className="absolute top-3 right-3 text-slate-300 hover:text-red-400 transition-colors z-10">
        <X className="w-4 h-4" />
      </button>

      {/* Header */}
      <div className="flex items-start gap-3 pr-6">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-base font-bold shrink-0
          ${isPacu ? "bg-purple-100 text-purple-700" : allVisited ? "bg-emerald-100 text-emerald-700" : "bg-teal-100 text-teal-700"}`}>
          {(patient.patient_initials || "??").substring(0, 3).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-bold text-slate-800 text-sm leading-tight">{patient.procedure_name}</div>
          {patient.surgeon && <div className="text-xs text-slate-400 mt-0.5">{patient.surgeon}</div>}
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {patient.or_room && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-teal-200 text-teal-700">{patient.or_room}</Badge>
            )}
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border
              ${isPacu ? "bg-purple-100 text-purple-700 border-purple-200"
              : allVisited ? "bg-emerald-100 text-emerald-700 border-emerald-200"
              : isDischarged ? "bg-slate-100 text-slate-500 border-slate-200"
              : "bg-blue-100 text-blue-700 border-blue-200"}`}>
              {patient.status}
            </span>
          </div>
        </div>
      </div>

      {/* Timer */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${timerBg}`}>
        <Clock className={`w-5 h-5 shrink-0 ${timerColor}`} />
        <div>
          <div className={`text-2xl font-mono font-bold tracking-tight ${timerColor}`}>{formatElapsed(elapsed)}</div>
          <div className="text-[11px] text-slate-400">{isPacu ? "Time in PACU" : "Time in Pre-Op"}</div>
        </div>
      </div>

      {/* Prepped By */}
      <div className="flex items-center gap-2 min-w-0">
        <User className="w-4 h-4 text-slate-400 shrink-0" />
        {editingPreppedBy ? (
          <div className="flex gap-1 flex-1">
            <input
              autoFocus
              value={preppedByInput}
              onChange={e => setPreppedByInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") savePrepBy(); if (e.key === "Escape") setEditingPreppedBy(false); }}
              className="flex-1 text-sm border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-teal-400"
              placeholder="Staff name..."
            />
            <button onClick={savePrepBy} className="text-xs text-teal-600 font-medium px-2 py-1 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100">✓</button>
            <button onClick={() => setEditingPreppedBy(false)} className="text-xs text-slate-400 font-medium px-2 py-1 border border-slate-200 rounded-lg hover:bg-slate-50">✕</button>
          </div>
        ) : (
          <button onClick={() => { setPreppedByInput(patient.prepped_by || ""); setEditingPreppedBy(true); }}
            className="text-sm text-slate-700 hover:text-teal-700 truncate text-left">
            {patient.prepped_by || <span className="text-slate-400 italic text-xs">Tap to assign staff...</span>}
          </button>
        )}
      </div>

      {/* Visit Checks */}
      <div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Visit Checklist</div>
        <div className="grid grid-cols-3 gap-2">
          {VISITS.map(({ key, label, icon, atKey }) => {
            const checked = !!patient[key];
            return (
              <button
                key={key}
                onClick={() => toggleVisit(key, atKey)}
                className={`flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl border transition-all
                  ${checked
                    ? "bg-emerald-50 border-emerald-300 shadow-sm"
                    : "bg-slate-50 border-slate-200 hover:border-teal-300 hover:bg-teal-50"}`}
              >
                <span className="text-lg leading-none">{icon}</span>
                <span className={`text-[10px] font-semibold leading-tight ${checked ? "text-emerald-700" : "text-slate-500"}`}>{label}</span>
                {checked
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  : <Circle className="w-4 h-4 text-slate-300" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      {!isDischarged && (
        <div className="flex gap-2 pt-1 border-t border-slate-100">
          {!isPacu && (
            <button onClick={moveToPacu}
              className="flex-1 text-xs font-medium text-purple-600 hover:text-purple-800 border border-purple-200 hover:border-purple-400 rounded-lg px-3 py-2 transition-colors bg-purple-50 hover:bg-purple-100">
              → Move to PACU
            </button>
          )}
          {isPacu && (
            <button onClick={discharge}
              className="flex-1 text-xs font-medium text-slate-600 hover:text-slate-800 border border-slate-200 hover:border-slate-400 rounded-lg px-3 py-2 transition-colors hover:bg-slate-50">
              ✓ Discharge
            </button>
          )}
        </div>
      )}
    </div>
  );
}
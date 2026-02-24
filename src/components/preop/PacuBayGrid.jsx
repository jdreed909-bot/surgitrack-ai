import React, { useState } from "react";
import { Plus, Clock, Bed, Hash } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";

const PACU_BAYS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

const ADMIT_STATUSES = ["Outpatient", "23-Hour Obs", "Inpatient", "ICU"];

const ADMIT_COLORS = {
  "Outpatient": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "23-Hour Obs": "bg-amber-100 text-amber-700 border-amber-200",
  "Inpatient": "bg-blue-100 text-blue-700 border-blue-200",
  "ICU": "bg-red-100 text-red-700 border-red-200",
};

function formatTime(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatElapsed(startIso) {
  const secs = Math.max(0, Math.floor((Date.now() - new Date(startIso).getTime()) / 1000));
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function WaitingBedTimer({ startIso }) {
  const [, tick] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => tick(n => n + 1), 30000);
    return () => clearInterval(t);
  }, []);
  return <span className="font-mono text-xs font-bold text-orange-600">{formatElapsed(startIso)}</span>;
}

function OccupiedPacuBay({ patient, bay }) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["preop-patients"] });

  const [editingHbs, setEditingHbs] = useState(false);
  const [hbsInput, setHbsInput] = useState(patient.hbs_number || "");

  const saveHbs = async () => {
    await base44.entities.PreOpPatient.update(patient.id, { hbs_number: hbsInput });
    setEditingHbs(false);
    invalidate();
  };

  const setAdmitStatus = async (val) => {
    await base44.entities.PreOpPatient.update(patient.id, { admit_status: val });
    invalidate();
  };

  const setTimeZero = async () => {
    const ts = patient.time_zero ? null : new Date().toISOString();
    await base44.entities.PreOpPatient.update(patient.id, { time_zero: ts });
    invalidate();
  };

  const toggleWaitingOnBed = async () => {
    const now = new Date().toISOString();
    if (patient.waiting_on_bed) {
      await base44.entities.PreOpPatient.update(patient.id, { waiting_on_bed: false, waiting_on_bed_at: null });
    } else {
      await base44.entities.PreOpPatient.update(patient.id, { waiting_on_bed: true, waiting_on_bed_at: now });
    }
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

  return (
    <div className={`rounded-2xl border shadow-sm flex flex-col overflow-hidden h-full
      ${patient.waiting_on_bed ? "border-orange-300 ring-2 ring-orange-200" : "border-purple-200"}`}>
      {/* Bay header */}
      <div className={`px-3 py-2 flex items-center justify-between ${patient.waiting_on_bed ? "bg-orange-400" : "bg-purple-600"}`}>
        <span className="text-white font-bold text-sm">Bay {bay}</span>
        {patient.pacu_start && (
          <span className="text-white/80 text-[10px] font-mono">
            {formatElapsed(patient.pacu_start)} in PACU
          </span>
        )}
      </div>

      <div className="px-3 pt-2.5 pb-1 flex-1 flex flex-col gap-2.5 overflow-hidden">
        {/* Patient */}
        <div>
          <div className="font-bold text-slate-800 text-sm leading-tight">{patient.patient_initials}</div>
          <div className="text-[11px] text-slate-500 truncate">{patient.procedure_name}</div>
          {patient.surgeon && <div className="text-[10px] text-slate-400 truncate">{patient.surgeon}</div>}
        </div>

        {/* Admit Status */}
        <div>
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Admit Status</div>
          <div className="grid grid-cols-2 gap-1">
            {ADMIT_STATUSES.map(s => (
              <button
                key={s}
                onClick={() => setAdmitStatus(s)}
                className={`text-[10px] font-semibold py-1 px-1 rounded-lg border transition-all truncate
                  ${patient.admit_status === s ? ADMIT_COLORS[s] : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* HBS # */}
        <div>
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">
            <Hash className="w-3 h-3" /> HBS #
          </div>
          {editingHbs ? (
            <div className="flex gap-1">
              <input
                autoFocus
                value={hbsInput}
                onChange={e => setHbsInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") saveHbs(); if (e.key === "Escape") setEditingHbs(false); }}
                className="flex-1 text-xs border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-400"
                placeholder="HBS number..."
              />
              <button onClick={saveHbs} className="text-[10px] text-purple-600 font-semibold px-2 py-1 bg-purple-50 border border-purple-200 rounded-lg">✓</button>
            </div>
          ) : (
            <button
              onClick={() => { setHbsInput(patient.hbs_number || ""); setEditingHbs(true); }}
              className="text-xs text-slate-700 hover:text-purple-700 w-full text-left px-2 py-1.5 rounded-lg border border-slate-200 hover:border-purple-300 bg-slate-50 truncate"
            >
              {patient.hbs_number || <span className="text-slate-300 italic">Tap to enter...</span>}
            </button>
          )}
        </div>

        {/* Time Zero */}
        <div>
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Time Zero
          </div>
          <button
            onClick={setTimeZero}
            className={`w-full text-[11px] font-semibold py-1.5 px-2 rounded-lg border transition-all
              ${patient.time_zero
                ? "bg-teal-50 border-teal-300 text-teal-700"
                : "bg-white border-slate-200 text-slate-400 hover:border-teal-300 hover:text-teal-600"}`}
          >
            {patient.time_zero ? `⏱ ${formatTime(patient.time_zero)}` : "Set Time Zero"}
          </button>
        </div>

        {/* Waiting on Bed */}
        <div>
          <button
            onClick={toggleWaitingOnBed}
            className={`w-full flex items-center justify-between text-[11px] font-semibold py-2 px-2.5 rounded-lg border transition-all
              ${patient.waiting_on_bed
                ? "bg-orange-50 border-orange-400 text-orange-700"
                : "bg-white border-slate-200 text-slate-400 hover:border-orange-300 hover:text-orange-500"}`}
          >
            <span className="flex items-center gap-1.5">
              <Bed className="w-3 h-3" />
              {patient.waiting_on_bed ? "Waiting on Bed" : "Mark Waiting on Bed"}
            </span>
            {patient.waiting_on_bed && patient.waiting_on_bed_at && (
              <WaitingBedTimer startIso={patient.waiting_on_bed_at} />
            )}
          </button>
          {patient.waiting_on_bed && patient.waiting_on_bed_at && (
            <div className="text-[10px] text-orange-500 mt-0.5 text-right">since {formatTime(patient.waiting_on_bed_at)}</div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="px-3 pb-3 flex gap-1.5 pt-1 border-t border-slate-100">
        <button onClick={discharge}
          className="flex-1 text-[10px] font-semibold text-slate-600 border border-slate-200 hover:border-slate-300 rounded-lg py-1.5 hover:bg-slate-50 transition-colors">
          ✓ Discharge
        </button>
        <button onClick={remove}
          className="text-[10px] font-semibold text-slate-400 border border-slate-200 hover:border-red-200 hover:text-red-400 rounded-lg py-1.5 px-2 transition-colors">
          ✕
        </button>
      </div>
    </div>
  );
}

function EmptyPacuBay({ bay, onAssign }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50/30 flex flex-col overflow-hidden">
      <div className="px-3 py-2 bg-purple-50 border-b border-purple-200">
        <span className="text-purple-400 font-bold text-sm">Bay {bay}</span>
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
        <button
          onClick={() => onAssign(bay)}
          className="flex flex-col items-center gap-1.5 text-purple-200 hover:text-purple-500 transition-colors group"
        >
          <div className="w-8 h-8 rounded-full border-2 border-dashed border-current flex items-center justify-center">
            <Plus className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-semibold">Assign</span>
        </button>
      </div>
    </div>
  );
}

export default function PacuBayGrid({ patients, onAssign }) {
  const patientByBay = {};
  patients
    .filter(p => p.status === "PACU")
    .forEach(p => { if (p.bay_number) patientByBay[p.bay_number] = p; });

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11 gap-3">
      {PACU_BAYS.map(bay => (
        <div key={bay} className="min-h-[360px] flex flex-col">
          {patientByBay[bay]
            ? <OccupiedPacuBay patient={patientByBay[bay]} bay={bay} />
            : <EmptyPacuBay bay={bay} onAssign={onAssign} />
          }
        </div>
      ))}
    </div>
  );
}
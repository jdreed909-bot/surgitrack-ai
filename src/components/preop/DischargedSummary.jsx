import React from "react";

const SPECIALTY_COLORS = {
  OR:  "bg-blue-100 text-blue-700 border-blue-200",
  CCL: "bg-rose-100 text-rose-700 border-rose-200",
  IR:  "bg-purple-100 text-purple-700 border-purple-200",
  GI:  "bg-amber-100 text-amber-700 border-amber-200",
};

const ADMIT_COLORS = {
  "Outpatient":    "bg-emerald-100 text-emerald-700",
  "23-Hour Obs":   "bg-amber-100 text-amber-700",
  "Inpatient":     "bg-blue-100 text-blue-700",
  "ICU":           "bg-red-100 text-red-700",
};

function formatDuration(ms) {
  if (!ms || ms < 0) return null;
  const totalMins = Math.floor(ms / 60000);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function PatientRow({ p }) {
  // Pre-Op time: checked_in_at → intraop_start (or pacu_start if no intraop)
  const preOpEnd = p.intraop_start || p.pacu_start;
  const preOpDuration = p.checked_in_at && preOpEnd
    ? new Date(preOpEnd) - new Date(p.checked_in_at)
    : null;

  // PACU time: pacu_start → updated_date (discharge)
  const pacuDuration = p.pacu_start && p.updated_date
    ? new Date(p.updated_date) - new Date(p.pacu_start)
    : null;

  // Time Zero to discharge
  const timeZeroDuration = p.time_zero && p.updated_date
    ? new Date(p.updated_date) - new Date(p.time_zero)
    : null;

  // Total time: checked_in_at → discharge
  const totalDuration = p.checked_in_at && p.updated_date
    ? new Date(p.updated_date) - new Date(p.checked_in_at)
    : null;

  const disposition = p.admit_status || "Outpatient";
  const isInpatient = disposition !== "Outpatient";

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-col gap-2">
      {/* Header */}
      <div className="flex items-start justify-between gap-1">
        <div>
          <div className="font-bold text-sm text-slate-800">{p.patient_initials}</div>
          <div className="text-[11px] text-slate-500 truncate">{p.procedure_name}</div>
          {p.surgeon && <div className="text-[10px] text-slate-400 truncate">{p.surgeon}</div>}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {p.specialty && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${SPECIALTY_COLORS[p.specialty] || "bg-slate-100 text-slate-500 border-slate-200"}`}>
              {p.specialty}
            </span>
          )}
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${ADMIT_COLORS[disposition] || "bg-slate-100 text-slate-500"}`}>
            {isInpatient ? `→ ${disposition}` : "Discharge Home"}
          </span>
        </div>
      </div>

      {/* Time stats */}
      <div className="grid grid-cols-2 gap-1 text-[10px]">
        {preOpDuration != null && (
          <div className="bg-blue-50 rounded-lg px-2 py-1">
            <div className="text-slate-400 font-semibold">Pre-Op</div>
            <div className="font-bold text-blue-700">{formatDuration(preOpDuration)}</div>
          </div>
        )}
        {pacuDuration != null && (
          <div className="bg-purple-50 rounded-lg px-2 py-1">
            <div className="text-slate-400 font-semibold">PACU</div>
            <div className="font-bold text-purple-700">{formatDuration(pacuDuration)}</div>
          </div>
        )}
        {timeZeroDuration != null && (
          <div className="bg-teal-50 rounded-lg px-2 py-1">
            <div className="text-slate-400 font-semibold">Since T-Zero</div>
            <div className="font-bold text-teal-700">{formatDuration(timeZeroDuration)}</div>
          </div>
        )}
        {totalDuration != null && (
          <div className="bg-slate-50 rounded-lg px-2 py-1">
            <div className="text-slate-400 font-semibold">Total Time</div>
            <div className="font-bold text-slate-700">{formatDuration(totalDuration)}</div>
          </div>
        )}
      </div>
    </div>
  );
}

const SECTION_ORDER = ["Pre-Op", "CDA", "2nd Floor Pavilion", "PACU Direct"];
const SECTION_COLORS = {
  "Pre-Op": "bg-blue-50 border-blue-200 text-blue-700",
  "CDA": "bg-teal-50 border-teal-200 text-teal-700",
  "2nd Floor Pavilion": "bg-indigo-50 border-indigo-200 text-indigo-700",
  "PACU Direct": "bg-purple-50 border-purple-200 text-purple-700",
};

export default function DischargedSummary({ patients }) {
  // Group by origin section
  const groups = {};
  patients.forEach(p => {
    const key = p.origin_section || "Pre-Op";
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  });

  const orderedKeys = [
    ...SECTION_ORDER.filter(s => groups[s]),
    ...Object.keys(groups).filter(k => !SECTION_ORDER.includes(k)),
  ];

  return (
    <div className="space-y-8">
      {orderedKeys.map(section => (
        <div key={section}>
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border font-bold text-sm mb-4 ${SECTION_COLORS[section] || "bg-slate-50 border-slate-200 text-slate-600"}`}>
            {section}
            <span className="font-normal text-xs opacity-70">{groups[section].length} patient{groups[section].length !== 1 ? "s" : ""}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {groups[section].map(p => <PatientRow key={p.id} p={p} />)}
          </div>
        </div>
      ))}
    </div>
  );
}
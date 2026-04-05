import React from "react";
import { Clock, ArrowRight, User } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";

const PACU_BAYS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];



function QueueTimer({ startIso }) {
  const [elapsed, setElapsed] = React.useState(0);
  React.useEffect(() => {
    if (!startIso) return;
    const calc = () => setElapsed(Math.max(0, Math.floor((Date.now() - new Date(startIso).getTime()) / 1000)));
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [startIso]);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const color = elapsed < 600 ? "text-emerald-600" : elapsed < 1200 ? "text-amber-500" : "text-red-600";
  const bgColor = elapsed < 600 ? "bg-emerald-50" : elapsed < 1200 ? "bg-amber-50" : "bg-red-50";
  const label = mins > 0 ? `${mins}m ${String(secs).padStart(2, "0")}s` : `${secs}s`;

  return (
    <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded-full ${color} ${bgColor}`}>
      {label} waiting
    </span>
  );
}

function QueueCard({ patient, index, occupiedBays, onAssign }) {
  const queryClient = useQueryClient();
  const [selectedBay, setSelectedBay] = React.useState("");
  const [assigning, setAssigning] = React.useState(false);

  const availableBays = PACU_BAYS.filter(b => !occupiedBays.includes(b));

  const handleAssign = async () => {
    if (!selectedBay) return;
    setAssigning(true);
    await base44.entities.PreOpPatient.update(patient.id, {
      status: "PACU",
      bay_number: parseInt(selectedBay),
      pacu_start: patient.pacu_start || new Date().toISOString(),
    });
    queryClient.invalidateQueries({ queryKey: ["preop-patients"] });
    setAssigning(false);
  };

  return (
    <div className="bg-white border border-purple-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Position badge + timer */}
      <div className="bg-purple-600 px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-white/20 text-white font-bold text-xs flex items-center justify-center">
            {index + 1}
          </span>
          <span className="text-white font-bold text-sm">{patient.patient_initials}</span>
        </div>
        <QueueTimer startIso={patient.pacu_start} />
      </div>

      <div className="px-3 py-2.5 flex flex-col gap-2">
        <div>
          <div className="text-[11px] text-slate-500 truncate">{patient.procedure_name}</div>
          {patient.surgeon && (
            <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
              <User className="w-3 h-3" />{patient.surgeon}
            </div>
          )}
          {patient.or_room && (
            <span className="inline-block mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-teal-100 text-teal-700">
              {patient.or_room}
            </span>
          )}
        </div>

        {/* Bay assignment */}
        <div className="flex gap-1.5 items-center">
          <select
            value={selectedBay}
            onChange={e => setSelectedBay(e.target.value)}
            className="flex-1 text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-400 bg-white"
          >
            <option value="">Assign bay...</option>
            {availableBays.map(b => (
              <option key={b} value={b}>Bay {b}</option>
            ))}
          </select>
          <button
            onClick={handleAssign}
            disabled={!selectedBay || assigning}
            className="flex items-center gap-1 text-[11px] font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-40 rounded-lg px-2.5 py-1.5 transition-colors"
          >
            <ArrowRight className="w-3 h-3" />
            {assigning ? "..." : "Go"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PacuIntakeQueue({ patients }) {
  // Patients in PACU status but with NO bay assigned yet = intake queue
  const queuePatients = patients
    .filter(p => p.status === "PACU" && !p.bay_number)
    .sort((a, b) => new Date(a.pacu_start || a.created_date) - new Date(b.pacu_start || b.created_date));

  // Occupied bays
  const occupiedBays = patients
    .filter(p => p.status === "PACU" && p.bay_number)
    .map(p => p.bay_number);

  if (queuePatients.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-bold text-slate-800">PACU Intake Queue</h3>
        </div>
        <span className="text-sm font-semibold px-3 py-0.5 rounded-full border bg-purple-100 text-purple-700 border-purple-200 animate-pulse">
          {queuePatients.length} awaiting bay
        </span>
        <span className="text-xs text-slate-400 ml-1">Assign bays below — ordered by arrival time</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {queuePatients.map((patient, i) => (
          <QueueCard
            key={patient.id}
            patient={patient}
            index={i}
            occupiedBays={occupiedBays}
          />
        ))}
      </div>
    </div>
  );
}
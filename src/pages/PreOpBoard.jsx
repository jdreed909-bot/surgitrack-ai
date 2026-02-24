import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Plus, RefreshCw, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import CheckInModal from "@/components/preop/CheckInModal";
import IntraOpBoard from "@/components/preop/IntraOpBoard";
import PreOpBayGrid from "@/components/preop/PreOpBayGrid";
import PacuBayGrid from "@/components/preop/PacuBayGrid";
import PacuIntakeQueue from "@/components/preop/PacuIntakeQueue";

const OR_ROOMS = ["OR 1", "OR 2", "OR 3", "OR 4", "OR 5", "OR 6", "OR 7"];

export default function PreOpBoard() {
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkInDefaultBay, setCheckInDefaultBay] = useState(null);
  const [checkInStatus, setCheckInStatus] = useState("Pre-Op");
  const [showDischarged, setShowDischarged] = useState(false);

  const [orRoomStatuses, setOrRoomStatuses] = useState(() => {
    const init = {};
    OR_ROOMS.forEach(r => { init[r] = null; });
    return init;
  });

  const { data: patients = [], refetch, isFetching } = useQuery({
    queryKey: ["preop-patients"],
    queryFn: () => base44.entities.PreOpPatient.list("-checked_in_at", 200),
    refetchInterval: 15000,
  });

  const preOpPatients = patients.filter(p => p.status === "Pre-Op" || p.status === "Ready");
  const intraOpPatients = patients.filter(p => p.status === "Intra-Op");
  const pacuPatients = patients.filter(p => p.status === "PACU");
  const discharged = patients.filter(p => p.status === "Discharged");

  const handleORStatusChange = (room, status) => {
    setOrRoomStatuses(prev => ({ ...prev, [room]: status }));
  };

  const openCheckIn = (bay = null, status = "Pre-Op") => {
    setCheckInDefaultBay(bay);
    setCheckInStatus(status);
    setCheckInOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-700 rounded-2xl flex items-center justify-center shadow-md">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Pre-Op & PACU Board</h1>
            <p className="text-sm text-slate-500 mt-0.5">Live patient tracking · Bay assignments · Prep timers</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className={`p-2.5 rounded-xl text-slate-400 hover:text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 transition-all ${isFetching ? "animate-spin text-teal-500" : ""}`}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Button onClick={() => openCheckIn(null, "Pre-Op")} className="bg-teal-600 hover:bg-teal-700 gap-2 rounded-xl px-5">
            <Plus className="w-4 h-4" />
            Check In Patient
          </Button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "In Pre-Op", count: preOpPatients.length, color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
          { label: "Intra-Op", count: intraOpPatients.length, color: "text-teal-700", bg: "bg-teal-50", border: "border-teal-200" },
          { label: "In PACU", count: pacuPatients.length, color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200" },
          { label: "Discharged Today", count: discharged.length, color: "text-slate-600", bg: "bg-white", border: "border-slate-200" },
        ].map(({ label, count, color, bg, border }) => (
          <div key={label} className={`${bg} ${border} border rounded-2xl px-5 py-4`}>
            <div className={`text-3xl font-bold ${color}`}>{count}</div>
            <div className="text-sm text-slate-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Pre-Op Section — Bays 12–19 */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-xl font-bold text-slate-800">Pre-Op</h2>
          <span className="text-sm font-semibold px-3 py-0.5 rounded-full border bg-blue-100 text-blue-700 border-blue-200">
            Bays 12–19
          </span>
          <span className="text-sm font-semibold px-3 py-0.5 rounded-full border bg-slate-100 text-slate-600 border-slate-200">
            {preOpPatients.length} patient{preOpPatients.length !== 1 ? "s" : ""}
          </span>
        </div>
        <PreOpBayGrid patients={patients} onCheckIn={(bay) => openCheckIn(bay, "Pre-Op")} />
      </section>

      {/* Intra-Op Board */}
      <IntraOpBoard
        patients={patients}
        orRoomStatuses={orRoomStatuses}
        onStatusChange={handleORStatusChange}
      />

      {/* PACU Section — Bays 1–11 */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-xl font-bold text-slate-800">PACU</h2>
          <span className="text-sm font-semibold px-3 py-0.5 rounded-full border bg-purple-100 text-purple-700 border-purple-200">
            Bays 1–11
          </span>
          <span className="text-sm font-semibold px-3 py-0.5 rounded-full border bg-slate-100 text-slate-600 border-slate-200">
            {pacuPatients.length} patient{pacuPatients.length !== 1 ? "s" : ""}
          </span>
          <button
            onClick={() => openCheckIn(null, "PACU")}
            className="ml-auto text-xs font-semibold text-purple-600 border border-purple-200 bg-purple-50 hover:bg-purple-100 rounded-lg px-3 py-1.5 transition-colors"
          >
            + Assign PACU Bay
          </button>
        </div>
        <PacuBayGrid patients={patients} onAssign={(bay) => openCheckIn(bay, "PACU")} />
      </section>

      {/* Discharged (collapsible) */}
      {discharged.length > 0 && (
        <section>
          <button
            onClick={() => setShowDischarged(s => !s)}
            className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-700 mb-4 transition-colors"
          >
            <span className="text-base">{showDischarged ? "▾" : "▸"}</span>
            Discharged Today ({discharged.length})
          </button>
          {showDischarged && (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 text-sm text-slate-600">
              {discharged.map(p => (
                <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-3 opacity-60">
                  <div className="font-bold text-xs">{p.patient_initials}</div>
                  <div className="text-[11px] text-slate-400 truncate">{p.procedure_name}</div>
                  {p.bay_number && <div className="text-[10px] text-slate-400">Bay {p.bay_number}</div>}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <CheckInModal
        open={checkInOpen}
        onClose={() => setCheckInOpen(false)}
        defaultBay={checkInDefaultBay}
        defaultStatus={checkInStatus}
      />
    </div>
  );
}
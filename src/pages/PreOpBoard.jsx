import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Plus, RefreshCw, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import PreOpCard from "@/components/preop/PreOpCard";
import CheckInModal from "@/components/preop/CheckInModal";

function SectionHeader({ title, count, color = "slate" }) {
  const colorMap = {
    slate: "bg-slate-100 text-slate-600 border-slate-200",
    purple: "bg-purple-100 text-purple-700 border-purple-200",
    emerald: "bg-emerald-100 text-emerald-700 border-emerald-200",
  };
  return (
    <div className="flex items-center gap-3 mb-4">
      <h2 className="text-xl font-bold text-slate-800">{title}</h2>
      <span className={`text-sm font-semibold px-3 py-0.5 rounded-full border ${colorMap[color]}`}>
        {count} patient{count !== 1 ? "s" : ""}
      </span>
    </div>
  );
}

export default function PreOpBoard() {
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [showDischarged, setShowDischarged] = useState(false);

  const { data: patients = [], refetch, isFetching } = useQuery({
    queryKey: ["preop-patients"],
    queryFn: () => base44.entities.PreOpPatient.list("-checked_in_at", 200),
    refetchInterval: 15000,
  });

  const preOpPatients = patients.filter(p => p.status === "Pre-Op" || p.status === "Ready");
  const pacuPatients  = patients.filter(p => p.status === "PACU");
  const discharged    = patients.filter(p => p.status === "Discharged");

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
            <p className="text-sm text-slate-500 mt-0.5">Live patient tracking · Visit checklist · Prep timers</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className={`p-2.5 rounded-xl text-slate-400 hover:text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 transition-all ${isFetching ? "animate-spin text-teal-500" : ""}`}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Button onClick={() => setCheckInOpen(true)} className="bg-teal-600 hover:bg-teal-700 gap-2 rounded-xl px-5">
            <Plus className="w-4 h-4" />
            Check In Patient
          </Button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "In Pre-Op", count: preOpPatients.length, color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
          { label: "In PACU", count: pacuPatients.length, color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200" },
          { label: "Discharged Today", count: discharged.length, color: "text-slate-600", bg: "bg-white", border: "border-slate-200" },
        ].map(({ label, count, color, bg, border }) => (
          <div key={label} className={`${bg} ${border} border rounded-2xl px-5 py-4`}>
            <div className={`text-3xl font-bold ${color}`}>{count}</div>
            <div className="text-sm text-slate-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Pre-Op Section */}
      <section className="mb-10">
        <SectionHeader title="Pre-Op" count={preOpPatients.length} color="slate" />
        {preOpPatients.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-14 text-center">
            <p className="text-slate-400 text-sm">No patients currently in Pre-Op</p>
            <button onClick={() => setCheckInOpen(true)} className="mt-2 text-teal-600 text-sm font-semibold hover:underline">
              + Check in a patient
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {preOpPatients.map(p => <PreOpCard key={p.id} patient={p} />)}
          </div>
        )}
      </section>

      {/* PACU Section */}
      <section className="mb-10">
        <SectionHeader title="PACU" count={pacuPatients.length} color="purple" />
        {pacuPatients.length === 0 ? (
          <div className="bg-purple-50 rounded-2xl border-2 border-dashed border-purple-200 p-14 text-center">
            <p className="text-purple-300 text-sm">No patients currently in PACU</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {pacuPatients.map(p => <PreOpCard key={p.id} patient={p} />)}
          </div>
        )}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {discharged.map(p => <PreOpCard key={p.id} patient={p} />)}
            </div>
          )}
        </section>
      )}

      <CheckInModal open={checkInOpen} onClose={() => setCheckInOpen(false)} />
    </div>
  );
}
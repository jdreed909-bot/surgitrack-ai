import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { ArrowDownToLine } from "lucide-react";

const OR_ROOMS = ["OR 1", "OR 2", "OR 3", "OR 4", "OR 5", "OR 6", "OR 7"];
const PREOP_BAYS = [12, 13, 14, 15, 16, 17, 18, 19];
const PACU_BAYS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

const defaultForm = {
  patient_initials: "",
  procedure_name: "",
  surgeon: "",
  or_room: "",
  prepped_by: "",
  bay_number: "",
  notes: "",
};

export default function CheckInModal({ open, onClose, defaultBay = null, defaultStatus = "Pre-Op" }) {
  const [form, setForm] = useState({ ...defaultForm, bay_number: defaultBay || "" });
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState("manual"); // "manual" | "pull"
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [pullBay, setPullBay] = useState(defaultBay || "");
  const queryClient = useQueryClient();

  const { data: allPatients = [] } = useQuery({
    queryKey: ["preop-patients"],
    queryFn: () => base44.entities.PreOpPatient.list("-checked_in_at", 200),
    enabled: open && defaultStatus === "PACU",
  });

  const orPatients = allPatients.filter(p => p.status === "Intra-Op" || p.status === "Pre-Op" || p.status === "Ready");

  React.useEffect(() => {
    if (open) {
      setForm({ ...defaultForm, bay_number: defaultBay || "" });
      setMode("manual");
      setSelectedPatientId("");
      setPullBay(defaultBay || "");
    }
  }, [open, defaultBay]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const bays = defaultStatus === "PACU" ? PACU_BAYS : PREOP_BAYS;

  const handleSave = async () => {
    if (!form.patient_initials || !form.procedure_name) return;
    setSaving(true);
    await base44.entities.PreOpPatient.create({
      ...form,
      bay_number: form.bay_number ? Number(form.bay_number) : null,
      status: defaultStatus,
      checked_in_at: new Date().toISOString(),
      pacu_start: defaultStatus === "PACU" ? new Date().toISOString() : undefined,
      surgeon_visited: false,
      anesthesia_visited: false,
      or_rn_visited: false,
    });
    queryClient.invalidateQueries({ queryKey: ["preop-patients"] });
    setSaving(false);
    onClose();
  };

  const handlePull = async () => {
    if (!selectedPatientId || !pullBay) return;
    setSaving(true);
    await base44.entities.PreOpPatient.update(selectedPatientId, {
      status: "PACU",
      pacu_start: new Date().toISOString(),
      bay_number: Number(pullBay),
    });
    queryClient.invalidateQueries({ queryKey: ["preop-patients"] });
    setSaving(false);
    onClose();
  };

  const selectedPatient = orPatients.find(p => p.id === selectedPatientId);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {defaultStatus === "PACU" ? "Assign PACU Bay" : "Check In Patient — Pre-Op"}
          </DialogTitle>
        </DialogHeader>

        {/* Mode toggle — only for PACU */}
        {defaultStatus === "PACU" && (
          <div className="flex rounded-xl border border-slate-200 overflow-hidden">
            <button
              onClick={() => setMode("pull")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold transition-all
                ${mode === "pull" ? "bg-purple-600 text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}
            >
              <ArrowDownToLine className="w-4 h-4" />
              Pull from OR
            </button>
            <button
              onClick={() => setMode("manual")}
              className={`flex-1 py-2 text-sm font-semibold transition-all
                ${mode === "manual" ? "bg-purple-600 text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}
            >
              Manual Entry
            </button>
          </div>
        )}

        {/* Pull from OR mode */}
        {defaultStatus === "PACU" && mode === "pull" ? (
          <div className="space-y-4 pt-1">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Select OR Patient</label>
              {orPatients.length === 0 ? (
                <div className="text-sm text-slate-400 italic py-4 text-center">No active OR / Pre-Op patients found</div>
              ) : (
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {orPatients.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPatientId(p.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all
                        ${selectedPatientId === p.id
                          ? "border-purple-400 bg-purple-50 ring-1 ring-purple-300"
                          : "border-slate-200 bg-white hover:border-purple-200 hover:bg-purple-50/40"}`}
                    >
                      <div className="font-bold text-sm text-slate-800">{p.patient_initials}</div>
                      <div className="text-xs text-slate-500 truncate">{p.procedure_name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        {p.or_room && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-teal-100 text-teal-700">{p.or_room}</span>}
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded
                          ${p.status === "Intra-Op" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"}`}>
                          {p.status}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedPatient && (
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Assign to PACU Bay</label>
                <select
                  value={pullBay}
                  onChange={e => setPullBay(e.target.value)}
                  className="w-full border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring bg-background"
                >
                  <option value="">Select bay...</option>
                  {PACU_BAYS.map(b => <option key={b} value={b}>Bay {b}</option>)}
                </select>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
              <Button
                onClick={handlePull}
                disabled={saving || !selectedPatientId || !pullBay}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                {saving ? "Moving..." : "→ Move to PACU"}
              </Button>
            </div>
          </div>
        ) : (
          /* Manual entry mode */
          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Patient Initials *</label>
                <Input placeholder="e.g. J.D." value={form.patient_initials} onChange={e => set("patient_initials", e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">
                  {defaultStatus === "PACU" ? "PACU Bay" : "Pre-Op Bay"}
                </label>
                <select
                  value={form.bay_number}
                  onChange={e => set("bay_number", e.target.value)}
                  className="w-full border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring bg-background"
                >
                  <option value="">Select bay...</option>
                  {bays.map(b => <option key={b} value={b}>Bay {b}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Procedure *</label>
              <Input placeholder="e.g. Total Knee Arthroplasty" value={form.procedure_name} onChange={e => set("procedure_name", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Surgeon</label>
              <Input placeholder="Surgeon name" value={form.surgeon} onChange={e => set("surgeon", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">OR Room</label>
                <select
                  value={form.or_room}
                  onChange={e => set("or_room", e.target.value)}
                  className="w-full border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring bg-background"
                >
                  <option value="">Select room...</option>
                  {OR_ROOMS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              {defaultStatus !== "PACU" && (
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Prepped By</label>
                  <Input placeholder="Staff name" value={form.prepped_by} onChange={e => set("prepped_by", e.target.value)} />
                </div>
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
              <Button
                onClick={handleSave}
                disabled={saving || !form.patient_initials || !form.procedure_name}
                className={`flex-1 ${defaultStatus === "PACU" ? "bg-purple-600 hover:bg-purple-700" : "bg-teal-600 hover:bg-teal-700"}`}
              >
                {saving ? "Saving..." : defaultStatus === "PACU" ? "Assign to PACU" : "✓ Check In"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
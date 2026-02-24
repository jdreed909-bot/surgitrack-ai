import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";

const OR_ROOMS = ["OR 1", "OR 2", "OR 3", "OR 4", "OR 5", "OR 6", "OR 7"];

const defaultForm = {
  patient_initials: "",
  procedure_name: "",
  surgeon: "",
  or_room: "",
  prepped_by: "",
  notes: "",
};

export default function CheckInModal({ open, onClose }) {
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = async () => {
    if (!form.patient_initials || !form.procedure_name) return;
    setSaving(true);
    await base44.entities.PreOpPatient.create({
      ...form,
      status: "Pre-Op",
      checked_in_at: new Date().toISOString(),
      surgeon_visited: false,
      anesthesia_visited: false,
      or_rn_visited: false,
    });
    queryClient.invalidateQueries({ queryKey: ["preop-patients"] });
    setSaving(false);
    setForm(defaultForm);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Check In Patient</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Patient Initials *</label>
              <Input placeholder="e.g. J.D." value={form.patient_initials} onChange={e => set("patient_initials", e.target.value)} />
            </div>
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
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Procedure *</label>
            <Input placeholder="e.g. Total Knee Arthroplasty" value={form.procedure_name} onChange={e => set("procedure_name", e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Surgeon</label>
            <Input placeholder="Surgeon name" value={form.surgeon} onChange={e => set("surgeon", e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Prepped By</label>
            <Input placeholder="Staff member name" value={form.prepped_by} onChange={e => set("prepped_by", e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Notes</label>
            <Input placeholder="Optional notes..." value={form.notes} onChange={e => set("notes", e.target.value)} />
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.patient_initials || !form.procedure_name}
              className="flex-1 bg-teal-600 hover:bg-teal-700"
            >
              {saving ? "Checking In..." : "✓ Check In"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
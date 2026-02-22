import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Calendar, X, Plus } from "lucide-react";

export default function AddCaseModal({ onClose, onCreated, allSets, defaultDate }) {
  const [form, setForm] = useState({
    case_number: `CASE-${Date.now().toString().slice(-6)}`,
    patient_initials: "",
    procedure_name: "",
    scheduled_date: defaultDate || "",
    scheduled_time: "07:00",
    estimated_duration: "",
    or_room: "",
    surgeon: "",
    required_sets: [],
    special_requests: "",
    special_limitations: "",
    notes: "",
    status: "Scheduled",
  });
  const [saving, setSaving] = useState(false);
  const [setSearch, setSetSearch] = useState("");

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const toggleSet = (id) => {
    setForm((f) => ({
      ...f,
      required_sets: f.required_sets.includes(id)
        ? f.required_sets.filter((s) => s !== id)
        : [...f.required_sets, id],
    }));
  };

  const filteredSets = allSets.filter((s) =>
    s.name?.toLowerCase().includes(setSearch.toLowerCase()) ||
    s.set_code?.toLowerCase().includes(setSearch.toLowerCase())
  );

  const handleSave = async () => {
    if (!form.procedure_name || !form.scheduled_date) return;
    setSaving(true);
    await base44.entities.SurgicalCase.create({
      ...form,
      estimated_duration: form.estimated_duration ? Number(form.estimated_duration) : undefined,
    });
    setSaving(false);
    onCreated();
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl rounded-2xl p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-br from-teal-600 to-teal-700 px-6 pt-6 pb-5">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2 text-xl">
              <Calendar className="w-5 h-5" /> Schedule New Case
            </DialogTitle>
          </DialogHeader>
        </div>
        <div className="p-6 space-y-5">
          {/* Case basics */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Case Number">
              <Input value={form.case_number} onChange={(e) => update("case_number", e.target.value)} className="rounded-xl border-slate-200 font-mono text-sm" />
            </Field>
            <Field label="Patient Initials">
              <Input value={form.patient_initials} onChange={(e) => update("patient_initials", e.target.value.toUpperCase())} placeholder="J.D." className="rounded-xl border-slate-200" />
            </Field>
          </div>

          <Field label="Procedure Name *">
            <Input value={form.procedure_name} onChange={(e) => update("procedure_name", e.target.value)} placeholder="e.g. Laparoscopic Cholecystectomy" className="rounded-xl border-slate-200" />
          </Field>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Field label="Date *">
              <Input type="date" value={form.scheduled_date} onChange={(e) => update("scheduled_date", e.target.value)} className="rounded-xl border-slate-200" />
            </Field>
            <Field label="Time">
              <Input type="time" value={form.scheduled_time} onChange={(e) => update("scheduled_time", e.target.value)} className="rounded-xl border-slate-200" />
            </Field>
            <Field label="Duration (min)">
              <Input type="number" value={form.estimated_duration} onChange={(e) => update("estimated_duration", e.target.value)} placeholder="120" className="rounded-xl border-slate-200" />
            </Field>
            <Field label="OR Room">
              <Select value={form.or_room} onValueChange={(v) => update("or_room", v)}>
                <SelectTrigger className="rounded-xl border-slate-200"><SelectValue placeholder="Room" /></SelectTrigger>
                <SelectContent>
                  {["OR 1","OR 2","OR 3","OR 4","OR 5","OR 6"].map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Surgeon">
              <Input value={form.surgeon} onChange={(e) => update("surgeon", e.target.value)} placeholder="Last name" className="rounded-xl border-slate-200" />
            </Field>
            <Field label="Status">
              <Select value={form.status} onValueChange={(v) => update("status", v)}>
                <SelectTrigger className="rounded-xl border-slate-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Scheduled","In Progress","Completed","Cancelled","Delayed"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>

          {/* Instrument Sets */}
          <div>
            <Label className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2 block">Required Instrument Sets</Label>
            {form.required_sets.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {form.required_sets.map((id) => {
                  const s = allSets.find((x) => x.id === id);
                  return s ? (
                    <div key={id} className="flex items-center gap-1.5 bg-teal-50 border border-teal-200 text-teal-700 text-xs font-medium px-2.5 py-1.5 rounded-lg">
                      {s.name}
                      <button onClick={() => toggleSet(id)} className="text-teal-400 hover:text-teal-700 ml-0.5"><X className="w-3 h-3" /></button>
                    </div>
                  ) : null;
                })}
              </div>
            )}
            <Input
              value={setSearch}
              onChange={(e) => setSetSearch(e.target.value)}
              placeholder="Search sets to add..."
              className="rounded-xl border-slate-200 text-sm mb-2"
            />
            <div className="max-h-40 overflow-y-auto space-y-1 border border-slate-100 rounded-xl p-2 bg-slate-50">
              {filteredSets.slice(0, 20).map((s) => {
                const selected = form.required_sets.includes(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => toggleSet(s.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${selected ? "bg-teal-100 text-teal-800 font-medium" : "hover:bg-white text-slate-700"}`}
                  >
                    <span>{s.name} <span className="text-slate-400 font-mono text-xs">({s.set_code})</span></span>
                    <span className={`text-xs ${s.status === "Available" ? "text-emerald-600" : "text-amber-600"}`}>{s.status}</span>
                  </button>
                );
              })}
              {filteredSets.length === 0 && <div className="text-center text-slate-400 text-sm py-4">No sets found</div>}
            </div>
          </div>

          {/* Special requests */}
          <Field label="Special Equipment Requests">
            <Textarea value={form.special_requests} onChange={(e) => update("special_requests", e.target.value)} placeholder="Any special equipment needed..." className="rounded-xl border-slate-200 text-sm" rows={2} />
          </Field>
          <Field label="Limitations / Restrictions">
            <Textarea value={form.special_limitations} onChange={(e) => update("special_limitations", e.target.value)} placeholder="Known limitations or restrictions..." className="rounded-xl border-slate-200 text-sm" rows={2} />
          </Field>
          <Field label="Notes">
            <Textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Additional notes..." className="rounded-xl border-slate-200 text-sm" rows={2} />
          </Field>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl border-slate-200">Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.procedure_name || !form.scheduled_date}
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white rounded-xl"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Schedule Case
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</Label>
      {children}
    </div>
  );
}
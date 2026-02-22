import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Package } from "lucide-react";

export default function AddSetModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name: "", set_code: "", category: "", status: "Available",
    location: "Sterile Processing", vendor_name: "", vendor_contact: "",
    tray_count: "", instrument_count: "", notes: "", is_loaner: false,
  });
  const [saving, setSaving] = useState(false);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name || !form.set_code) return;
    setSaving(true);
    await base44.entities.SurgicalSet.create({
      ...form,
      tray_count: form.tray_count ? Number(form.tray_count) : undefined,
      instrument_count: form.instrument_count ? Number(form.instrument_count) : undefined,
    });
    setSaving(false);
    onCreated();
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg rounded-2xl p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 px-6 pt-6 pb-5">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2 text-xl">
              <Package className="w-5 h-5" /> Add New Instrument Set
            </DialogTitle>
          </DialogHeader>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Set Name *">
              <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. Laparotomy Set" className="rounded-xl border-slate-200" />
            </Field>
            <Field label="Set Code / Barcode *">
              <Input value={form.set_code} onChange={(e) => update("set_code", e.target.value.toUpperCase())} placeholder="e.g. LAP-001" className="rounded-xl border-slate-200 font-mono" />
            </Field>
          </div>

          <Field label="Category">
            <Select value={form.category} onValueChange={(v) => update("category", v)}>
              <SelectTrigger className="rounded-xl border-slate-200"><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {["General Surgery","Orthopedic","Cardiovascular","Neurosurgery","OB/GYN","ENT","Ophthalmology","Urology","Plastics","Laparoscopic"].map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Initial Status">
              <Select value={form.status} onValueChange={(v) => update("status", v)}>
                <SelectTrigger className="rounded-xl border-slate-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Available","In Use","Sterilizing","Under Repair","Missing","Loaned Out"].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Location">
              <Select value={form.location} onValueChange={(v) => update("location", v)}>
                <SelectTrigger className="rounded-xl border-slate-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Sterile Processing","OR 1","OR 2","OR 3","OR 4","OR 5","OR 6","Storage Room A","Storage Room B","Vendor"].map((l) => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Vendor Name">
              <Input value={form.vendor_name} onChange={(e) => update("vendor_name", e.target.value)} placeholder="Vendor" className="rounded-xl border-slate-200" />
            </Field>
            <Field label="Vendor Contact">
              <Input value={form.vendor_contact} onChange={(e) => update("vendor_contact", e.target.value)} placeholder="Phone or email" className="rounded-xl border-slate-200" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Tray Count">
              <Input type="number" value={form.tray_count} onChange={(e) => update("tray_count", e.target.value)} placeholder="0" className="rounded-xl border-slate-200" />
            </Field>
            <Field label="Instrument Count">
              <Input type="number" value={form.instrument_count} onChange={(e) => update("instrument_count", e.target.value)} placeholder="0" className="rounded-xl border-slate-200" />
            </Field>
          </div>

          <Field label="Notes / Limitations">
            <Textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Special notes, limitations..." className="rounded-xl border-slate-200 text-sm" rows={3} />
          </Field>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_loaner"
              checked={form.is_loaner}
              onChange={(e) => update("is_loaner", e.target.checked)}
              className="w-4 h-4 accent-teal-600"
            />
            <label htmlFor="is_loaner" className="text-sm text-slate-600">This is a loaner set from vendor</label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl border-slate-200">Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.name || !form.set_code}
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white rounded-xl"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Add Set
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
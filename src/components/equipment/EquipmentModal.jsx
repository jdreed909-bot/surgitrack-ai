import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Wrench } from "lucide-react";

const CATEGORIES = [
  "Imaging & Visualization",
  "Navigation & Robotics",
  "Energy Devices",
  "Retraction Systems",
  "Perfusion Equipment",
  "Anesthesia Equipment",
  "Power Tools",
  "Microscopes & Scopes",
  "Other",
];

export default function EquipmentModal({ item, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: item?.name || "",
    equipment_code: item?.equipment_code || "",
    category: item?.category || "",
    quantity: item?.quantity ?? 1,
    location: item?.location || "",
    vendor_name: item?.vendor_name || "",
    notes: item?.notes || "",
  });
  const [saving, setSaving] = useState(false);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name) return;
    setSaving(true);
    const data = { ...form, quantity: Number(form.quantity) };
    if (item?.id) {
      await base44.entities.SpecialtyEquipment.update(item.id, data);
    } else {
      await base44.entities.SpecialtyEquipment.create(data);
    }
    setSaving(false);
    onSaved();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden">
        <div className="bg-gradient-to-br from-teal-600 to-teal-800 px-6 pt-6 pb-5">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2 text-xl">
              <Wrench className="w-5 h-5" />
              {item ? "Edit Equipment" : "Add Specialty Equipment"}
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-4">
          <Field label="Name *">
            <Input value={form.name} onChange={(e) => update("name", e.target.value)}
              placeholder="e.g. C-Arm Fluoroscopy Unit" className="rounded-xl border-slate-200" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Equipment Code">
              <Input value={form.equipment_code} onChange={(e) => update("equipment_code", e.target.value)}
                placeholder="EQ-001" className="rounded-xl border-slate-200 font-mono text-sm" />
            </Field>
            <Field label="Quantity *">
              <Input type="number" min={1} value={form.quantity} onChange={(e) => update("quantity", e.target.value)}
                className="rounded-xl border-slate-200" />
            </Field>
          </div>

          <Field label="Category">
            <Select value={form.category} onValueChange={(v) => update("category", v)}>
              <SelectTrigger className="rounded-xl border-slate-200">
                <SelectValue placeholder="Select category..." />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Location">
            <Input value={form.location} onChange={(e) => update("location", e.target.value)}
              placeholder="e.g. Equipment Room B" className="rounded-xl border-slate-200" />
          </Field>

          <Field label="Vendor">
            <Input value={form.vendor_name} onChange={(e) => update("vendor_name", e.target.value)}
              placeholder="Vendor name" className="rounded-xl border-slate-200" />
          </Field>

          <Field label="Notes">
            <Textarea value={form.notes} onChange={(e) => update("notes", e.target.value)}
              placeholder="Additional notes..." className="rounded-xl border-slate-200 text-sm" rows={2} />
          </Field>

          <div className="flex gap-3 pt-1">
            <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl border-slate-200">Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.name}
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white rounded-xl"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {item ? "Save Changes" : "Add Equipment"}
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
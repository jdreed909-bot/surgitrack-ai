import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Building2, Check } from "lucide-react";

const SPECIALTIES = [
  "General Surgery", "Orthopedic", "Cardiovascular", "Neurosurgery",
  "OB/GYN", "ENT", "Ophthalmology", "Urology", "Plastics", "Laparoscopic",
];

export default function VendorModal({ vendor, onClose, onSaved }) {
  const [form, setForm] = useState({
    company_name: vendor?.company_name || "",
    contact_name: vendor?.contact_name || "",
    phone: vendor?.phone || "",
    email: vendor?.email || "",
    website: vendor?.website || "",
    specialties: vendor?.specialties || [],
    notes: vendor?.notes || "",
    is_active: vendor?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const toggleSpecialty = (s) => {
    setForm((f) => ({
      ...f,
      specialties: f.specialties.includes(s)
        ? f.specialties.filter((x) => x !== s)
        : [...f.specialties, s],
    }));
  };

  const handleSave = async () => {
    if (!form.company_name) return;
    setSaving(true);
    if (vendor?.id) {
      await base44.entities.Vendor.update(vendor.id, form);
    } else {
      await base44.entities.Vendor.create(form);
    }
    setSaving(false);
    onSaved();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg rounded-2xl p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-br from-teal-600 to-teal-800 px-6 pt-6 pb-5">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2 text-xl">
              <Building2 className="w-5 h-5" />
              {vendor ? "Edit Vendor" : "Add Vendor"}
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-4">
          <Field label="Company Name *">
            <Input value={form.company_name} onChange={(e) => update("company_name", e.target.value)}
              placeholder="e.g. Stryker Medical" className="rounded-xl border-slate-200" />
          </Field>

          <Field label="Contact Name">
            <Input value={form.contact_name} onChange={(e) => update("contact_name", e.target.value)}
              placeholder="Primary contact person" className="rounded-xl border-slate-200" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone">
              <Input value={form.phone} onChange={(e) => update("phone", e.target.value)}
                placeholder="(555) 000-0000" className="rounded-xl border-slate-200" />
            </Field>
            <Field label="Email">
              <Input value={form.email} onChange={(e) => update("email", e.target.value)}
                placeholder="contact@vendor.com" className="rounded-xl border-slate-200" type="email" />
            </Field>
          </div>

          <Field label="Website">
            <Input value={form.website} onChange={(e) => update("website", e.target.value)}
              placeholder="https://..." className="rounded-xl border-slate-200" />
          </Field>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Surgical Specialties</Label>
            <div className="flex flex-wrap gap-2">
              {SPECIALTIES.map((s) => {
                const selected = form.specialties.includes(s);
                return (
                  <button
                    key={s}
                    onClick={() => toggleSpecialty(s)}
                    className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all flex items-center gap-1 ${
                      selected
                        ? "bg-teal-600 text-white border-teal-600"
                        : "bg-white text-slate-600 border-slate-200 hover:border-teal-300"
                    }`}
                  >
                    {selected && <Check className="w-3 h-3" />}
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          <Field label="Notes">
            <Textarea value={form.notes} onChange={(e) => update("notes", e.target.value)}
              placeholder="Additional notes..." className="rounded-xl border-slate-200 text-sm" rows={2} />
          </Field>

          <div className="flex gap-3 pt-1">
            <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl border-slate-200">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.company_name}
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white rounded-xl"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {vendor ? "Save Changes" : "Add Vendor"}
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
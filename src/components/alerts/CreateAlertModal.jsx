import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Bell } from "lucide-react";

export default function CreateAlertModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    type: "Set Not Returned",
    severity: "High",
    message: "",
  });
  const [saving, setSaving] = useState(false);
  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.message) return;
    setSaving(true);
    await base44.entities.Alert.create({ ...form, is_resolved: false });
    setSaving(false);
    onCreated();
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 px-6 pt-6 pb-5">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2 text-xl">
              <Bell className="w-5 h-5" /> Create Alert
            </DialogTitle>
          </DialogHeader>
        </div>
        <div className="p-6 space-y-4">
          <Field label="Alert Type">
            <Select value={form.type} onValueChange={(v) => update("type", v)}>
              <SelectTrigger className="rounded-xl border-slate-200"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Set Not Returned","Sterilization Overdue","Case Conflict","Set Missing","Vendor Notification"].map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Severity">
            <Select value={form.severity} onValueChange={(v) => update("severity", v)}>
              <SelectTrigger className="rounded-xl border-slate-200"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Critical","High","Medium","Low"].map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Message *">
            <Textarea value={form.message} onChange={(e) => update("message", e.target.value)} placeholder="Describe the alert..." className="rounded-xl border-slate-200 text-sm" rows={3} />
          </Field>
          <div className="flex gap-3 pt-1">
            <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl border-slate-200">Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.message} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white rounded-xl">
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Create Alert
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
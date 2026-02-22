import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, TriangleAlert, CheckCircle2 } from "lucide-react";

const ISSUE_TYPES = [
  "Missing Instrument",
  "Missing Filter",
  "Bioburden",
  "Packaging Compromised",
  "Damaged Instrument",
  "Rust / Corrosion",
  "Incorrect Count",
  "Sterilization Failure",
  "Other",
];

const SEVERITY_CONFIG = {
  Critical: "bg-red-50 border-red-300 text-red-700",
  High:     "bg-orange-50 border-orange-300 text-orange-700",
  Medium:   "bg-amber-50 border-amber-200 text-amber-700",
  Low:      "bg-slate-50 border-slate-200 text-slate-600",
};

export default function ReportIssueModal({ set, onClose, onReported }) {
  const [form, setForm] = useState({
    issue_type: "",
    severity: "High",
    description: "",
    affected_instruments: "",
  });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.issue_type || !form.description) return;
    setSaving(true);
    const user = await base44.auth.me();

    await base44.entities.IssueReport.create({
      set_id: set.id,
      set_name: set.name,
      set_code: set.set_code,
      ...form,
      reported_by: user.email,
      status: "Open",
    });

    // Auto-create an alert for critical/high issues
    if (form.severity === "Critical" || form.severity === "High") {
      await base44.entities.Alert.create({
        type: "Set Missing",
        severity: form.severity,
        set_id: set.id,
        message: `Issue reported on ${set.name} (${set.set_code}): ${form.issue_type} — ${form.description}`,
        is_resolved: false,
      });
    }

    // If critical, mark set as Under Repair
    if (form.severity === "Critical") {
      await base44.entities.SurgicalSet.update(set.id, { status: "Under Repair" });
    }

    setSaving(false);
    setDone(true);
    setTimeout(() => {
      onReported();
      onClose();
    }, 1600);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-red-600 to-rose-700 px-6 pt-6 pb-5">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2 text-xl">
              <TriangleAlert className="w-5 h-5" /> Report Instrument Issue
            </DialogTitle>
            <p className="text-red-100 text-sm mt-1 font-mono">{set.name} · {set.set_code}</p>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-4">
          {done ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-emerald-600" />
              </div>
              <p className="font-semibold text-slate-800">Issue Reported</p>
              <p className="text-slate-500 text-sm text-center">The issue has been logged and an alert has been created if needed.</p>
            </div>
          ) : (
            <>
              {/* Issue type */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Issue Type *</Label>
                <Select value={form.issue_type} onValueChange={(v) => update("issue_type", v)}>
                  <SelectTrigger className="rounded-xl border-slate-200">
                    <SelectValue placeholder="Select issue type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ISSUE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Severity */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Severity</Label>
                <div className="grid grid-cols-4 gap-2">
                  {["Critical", "High", "Medium", "Low"].map((s) => (
                    <button
                      key={s}
                      onClick={() => update("severity", s)}
                      className={`text-xs font-semibold py-2 px-1 rounded-xl border-2 transition-all ${
                        form.severity === s
                          ? `${SEVERITY_CONFIG[s]} border-current`
                          : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                {form.severity === "Critical" && (
                  <p className="text-xs text-red-600 font-medium flex items-center gap-1">
                    <TriangleAlert className="w-3 h-3" /> Set will be automatically marked "Under Repair"
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Description *</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  placeholder="Describe the issue in detail..."
                  className="rounded-xl border-slate-200 text-sm"
                  rows={3}
                />
              </div>

              {/* Affected instruments */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Affected Instruments (optional)</Label>
                <Input
                  value={form.affected_instruments}
                  onChange={(e) => update("affected_instruments", e.target.value)}
                  placeholder="e.g. Kelly clamp #3, needle holder..."
                  className="rounded-xl border-slate-200 text-sm"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl border-slate-200">
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={saving || !form.issue_type || !form.description}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Submit Report
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Minus } from "lucide-react";

export default function ORSettingsModal({ settings, settingsId, onClose, onSaved }) {
  const [count, setCount] = useState(settings.or_count || 6);
  const [names, setNames] = useState(
    Array.from({ length: settings.or_count || 6 }, (_, i) => (settings.or_names || [])[i] || `OR ${i + 1}`)
  );
  const [saving, setSaving] = useState(false);

  const updateCount = (newCount) => {
    const clamped = Math.max(1, Math.min(20, newCount));
    setNames((prev) => {
      const next = [...prev];
      while (next.length < clamped) next.push(`OR ${next.length + 1}`);
      return next.slice(0, clamped);
    });
    setCount(clamped);
  };

  const handleSave = async () => {
    setSaving(true);
    const data = { or_count: count, or_names: names };
    if (settingsId) {
      await base44.entities.ORSettings.update(settingsId, data);
    } else {
      await base44.entities.ORSettings.create(data);
    }
    setSaving(false);
    onSaved();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>OR Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">Number of Operating Rooms</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => updateCount(count - 1)}
                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50"
              >
                <Minus className="w-4 h-4 text-slate-600" />
              </button>
              <span className="text-xl font-bold text-slate-900 w-8 text-center">{count}</span>
              <button
                onClick={() => updateCount(count + 1)}
                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50"
              >
                <Plus className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">Room Names</label>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {names.map((name, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 w-6 text-right">{i + 1}.</span>
                  <Input
                    value={name}
                    onChange={(e) => {
                      const next = [...names];
                      next[i] = e.target.value;
                      setNames(next);
                    }}
                    className="h-8 text-sm"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" className="rounded-xl" onClick={onClose}>Cancel</Button>
          <Button className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save Settings"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
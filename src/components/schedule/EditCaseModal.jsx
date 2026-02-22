import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";

export default function EditCaseModal({ open, onClose, caseData }) {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    surgeon: caseData?.surgeon || "",
    scheduled_time: caseData?.scheduled_time || "",
    estimated_duration: caseData?.estimated_duration || "",
    special_requests: caseData?.special_requests || "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!caseData?.id) return;
    setLoading(true);
    try {
      await base44.entities.SurgicalCase.update(caseData.id, formData);
      queryClient.invalidateQueries(["schedule-cases"]);
      queryClient.invalidateQueries(["cases-5day"]);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Case Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">
              Procedure
            </Label>
            <div className="px-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-600 border border-slate-200">
              {caseData?.procedure_name}
            </div>
          </div>

          <div>
            <Label htmlFor="surgeon" className="text-xs font-semibold text-slate-700 mb-1.5 block">
              Surgeon
            </Label>
            <Input
              id="surgeon"
              name="surgeon"
              value={formData.surgeon}
              onChange={handleChange}
              placeholder="Surgeon name"
              className="text-sm"
            />
          </div>

          <div>
            <Label htmlFor="scheduled_time" className="text-xs font-semibold text-slate-700 mb-1.5 block">
              Start Time (HH:MM)
            </Label>
            <Input
              id="scheduled_time"
              name="scheduled_time"
              type="time"
              value={formData.scheduled_time}
              onChange={handleChange}
              className="text-sm"
            />
          </div>

          <div>
            <Label htmlFor="estimated_duration" className="text-xs font-semibold text-slate-700 mb-1.5 block">
              Duration (minutes)
            </Label>
            <Input
              id="estimated_duration"
              name="estimated_duration"
              type="number"
              value={formData.estimated_duration}
              onChange={handleChange}
              placeholder="0"
              className="text-sm"
            />
          </div>

          <div>
            <Label htmlFor="special_requests" className="text-xs font-semibold text-slate-700 mb-1.5 block">
              Special Comments
            </Label>
            <Textarea
              id="special_requests"
              name="special_requests"
              value={formData.special_requests}
              onChange={handleChange}
              placeholder="Add any special notes or comments..."
              className="text-sm resize-none"
              rows="3"
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading} className="bg-teal-600 hover:bg-teal-700">
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
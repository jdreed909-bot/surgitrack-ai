import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus } from "lucide-react";

const ROLES = ["admin", "manager", "charge_nurse", "user"];
const DURATIONS = [
  { value: "1-day", label: "1 Day" },
  { value: "7-days", label: "7 Days" },
  { value: "30-days", label: "30 Days" },
  { value: "permanent", label: "Permanent" },
];

export default function TemporaryPermissionsModal({ open, onClose, staff, onGrant }) {
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedDuration, setSelectedDuration] = useState("");

  const handleGrant = async () => {
    if (!selectedRole || !selectedDuration) return;
    await onGrant(staff.id, selectedRole, selectedDuration);
    setSelectedRole("");
    setSelectedDuration("");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Grant Temporary Permission</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Staff: {staff?.full_name}</label>
          </div>
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={selectedDuration} onValueChange={setSelectedDuration}>
            <SelectTrigger>
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              {DURATIONS.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
            </SelectContent>
          </Select>
          {staff?.temporary_permissions && staff.temporary_permissions.length > 0 && (
            <div className="bg-slate-50 p-3 rounded-lg space-y-2">
              <div className="text-sm font-semibold">Active Permissions</div>
              {staff.temporary_permissions.map((perm, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs bg-white p-2 rounded border border-slate-200">
                  <span>{perm.role} ({perm.duration})</span>
                  <span className="text-slate-500">{new Date(perm.expires_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleGrant} disabled={!selectedRole || !selectedDuration} className="bg-teal-600 hover:bg-teal-700">Grant Permission</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
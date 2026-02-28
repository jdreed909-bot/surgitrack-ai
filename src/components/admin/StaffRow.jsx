import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SPECIALTIES = ["General Surgery", "Orthopedic", "Cardiovascular", "Neurosurgery", "OB/GYN", "ENT", "Ophthalmology", "Urology", "Plastics", "Laparoscopic", "Mixed"];
const ROLES = [
  { value: "admin", label: "Admin" },
  { value: "anm", label: "ANM (Asst. Nurse Manager)" },
  { value: "charge_nurse", label: "Charge Nurse" },
  { value: "prepacu_nurse", label: "Pre/PACU Nurse" },
  { value: "or_nurse", label: "OR Nurse" },
  { value: "surgical_tech", label: "Surgical Technician" },
];

export default function StaffRow({ staff, onUpdate, onDelete, canModify }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: staff.full_name,
    subtitle: staff.subtitle || "",
    specialty: staff.specialty || "",
    role: staff.role,
  });

  const handleSave = async () => {
    await onUpdate(staff.id, formData);
    setIsEditing(false);
  };

  if (isEditing && canModify) {
    return (
      <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
        <Input
          value={formData.full_name}
          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          className="flex-1 text-sm"
          placeholder="Name"
        />
        <Input
          value={formData.subtitle}
          onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
          className="flex-1 text-sm"
          placeholder="Subtitle (e.g., Service Lead)"
        />
        <Select value={formData.specialty} onValueChange={(v) => setFormData({ ...formData, specialty: v })}>
          <SelectTrigger className="w-32 text-sm">
            <SelectValue placeholder="Specialty" />
          </SelectTrigger>
          <SelectContent>
            {SPECIALTIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
          <SelectTrigger className="w-24 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={handleSave} className="bg-teal-600 hover:bg-teal-700 text-xs">Save</Button>
        <Button size="sm" variant="outline" onClick={() => setIsEditing(false)} className="text-xs"><X className="w-3 h-3" /></Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
      <div className="flex-1">
        <div className="font-semibold text-sm text-slate-900">{staff.full_name}</div>
        {staff.subtitle && <div className="text-xs text-slate-500">{staff.subtitle}</div>}
      </div>
      <div className="text-xs text-slate-600">{staff.email}</div>
      <div className="text-xs font-medium text-teal-700 bg-teal-50 px-2 py-1 rounded">{staff.specialty || "—"}</div>
      <div className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded">{staff.role}</div>
      {canModify && (
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)} className="h-7 w-7"><Edit2 className="w-3 h-3" /></Button>
          <Button size="sm" variant="ghost" onClick={() => onDelete(staff.id)} className="h-7 w-7 text-red-600 hover:text-red-700"><Trash2 className="w-3 h-3" /></Button>
        </div>
      )}
    </div>
  );
}
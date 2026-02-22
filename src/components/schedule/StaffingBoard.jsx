import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Users, Check, X, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ORSettingsModal from "./ORSettingsModal";
import ORFloorPlan from "./ORFloorPlan";
import StaffingGantt from "./StaffingGantt";
import VoceraNotificationPanel from "./VoceraNotificationPanel";

// Dropdown selector for staff by role
function StaffSelect({ role, value, voceraId, roster, onChange }) {
  const filtered = roster.filter((s) => s.role === role && s.is_active !== false);
  const selected = filtered.find((s) => s.name === value);

  const handleChange = (e) => {
    const person = filtered.find((s) => s.name === e.target.value);
    onChange({ name: person?.name || "", vocera_id: person?.vocera_id || "" });
  };

  return (
    <select
      value={value || ""}
      onChange={handleChange}
      className="w-full h-8 rounded-lg border border-slate-200 text-sm px-2 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-400"
    >
      <option value="">— Unassigned —</option>
      {filtered.map((s) => (
        <option key={s.id} value={s.name}>
          {s.name}{s.vocera_id ? ` (${s.vocera_id})` : ""}
        </option>
      ))}
    </select>
  );
}

export default function StaffingBoard({ date }) {
  const queryClient = useQueryClient();
  const [editingRoom, setEditingRoom] = useState(null);
  const [editData, setEditData] = useState({});
  const [settingsOpen, setSettingsOpen] = useState(false);

  // OR Settings
  const { data: settingsList = [] } = useQuery({
    queryKey: ["or_settings"],
    queryFn: () => base44.entities.ORSettings.list("-created_date", 1),
  });
  const settings = settingsList[0] || { or_count: 7, or_names: [] };
  const orCount = settings.or_count || 7;
  const orNames = settings.or_names || [];
  const orRooms = Array.from({ length: orCount }, (_, i) => orNames[i] || `OR ${i + 1}`);

  // Staff Roster
  const { data: roster = [] } = useQuery({
    queryKey: ["staff_roster"],
    queryFn: () => base44.entities.StaffRoster.list("name", 200),
  });

  // Assignments for the day
  const { data: assignments = [], refetch: refetchAssignments } = useQuery({
    queryKey: ["staff_assignments", date],
    queryFn: () => base44.entities.StaffAssignment.filter({ date }, "or_room", 50),
  });

  const assignmentMap = Object.fromEntries(assignments.map((a) => [a.or_room, a]));

  const startEdit = (room) => {
    const existing = assignmentMap[room] || {};
    setEditData({
      rn_name:              existing.rn_name || "",
      rn_vocera_id:         existing.rn_vocera_id || "",
      scrub_tech_name:      existing.scrub_tech_name || "",
      scrub_tech_vocera_id: existing.scrub_tech_vocera_id || "",
      charge_rn_name:       existing.charge_rn_name || "",
      charge_rn_vocera_id:  existing.charge_rn_vocera_id || "",
      shift_start:          existing.shift_start || "07:00",
      shift_end:            existing.shift_end || "15:30",
      notes:                existing.notes || "",
    });
    setEditingRoom(room);
  };

  const cancelEdit = () => { setEditingRoom(null); setEditData({}); };

  const saveEdit = async (room) => {
    const existing = assignmentMap[room];
    const payload = { ...editData, date, or_room: room };
    if (existing?.id) {
      await base44.entities.StaffAssignment.update(existing.id, payload);
    } else {
      await base44.entities.StaffAssignment.create(payload);
    }
    await queryClient.invalidateQueries(["staff_assignments", date]);
    setEditingRoom(null);
  };

  return (
    <div className="mt-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-teal-600" />
          <span className="font-semibold text-slate-800 text-base">Staffing Assignments</span>
          <span className="text-xs text-slate-400 ml-1">{date}</span>
        </div>
        <Button variant="outline" size="sm" className="rounded-xl border-slate-200 text-xs gap-1" onClick={() => setSettingsOpen(true)}>
          <Settings className="w-3.5 h-3.5" /> OR Settings
        </Button>
      </div>

      {/* Floor Plan */}
      <ORFloorPlan orRooms={orRooms} assignmentMap={assignmentMap} onEdit={startEdit} />

      {/* Edit Panel */}
      {editingRoom && (
        <div className="bg-white rounded-2xl border border-teal-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold text-teal-700 text-sm">Editing: {editingRoom}</span>
            <button onClick={cancelEdit} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            {/* RN */}
            <div>
              <label className="text-xs text-slate-500 mb-1 block font-medium">RN</label>
              <StaffSelect
                role="RN"
                value={editData.rn_name}
                vocera_id={editData.rn_vocera_id}
                roster={roster}
                onChange={({ name, vocera_id }) => setEditData((d) => ({ ...d, rn_name: name, rn_vocera_id: vocera_id }))}
              />
            </div>
            {/* Scrub Tech */}
            <div>
              <label className="text-xs text-slate-500 mb-1 block font-medium">Scrub Tech</label>
              <StaffSelect
                role="Scrub Tech"
                value={editData.scrub_tech_name}
                vocera_id={editData.scrub_tech_vocera_id}
                roster={roster}
                onChange={({ name, vocera_id }) => setEditData((d) => ({ ...d, scrub_tech_name: name, scrub_tech_vocera_id: vocera_id }))}
              />
            </div>
            {/* Charge RN */}
            <div>
              <label className="text-xs text-slate-500 mb-1 block font-medium">Charge RN</label>
              <StaffSelect
                role="Charge RN"
                value={editData.charge_rn_name}
                vocera_id={editData.charge_rn_vocera_id}
                roster={roster}
                onChange={({ name, vocera_id }) => setEditData((d) => ({ ...d, charge_rn_name: name, charge_rn_vocera_id: vocera_id }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block font-medium">Shift Start</label>
              <Input type="time" value={editData.shift_start} onChange={(e) => setEditData((d) => ({ ...d, shift_start: e.target.value }))} className="h-8 text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block font-medium">Shift End</label>
              <Input type="time" value={editData.shift_end} onChange={(e) => setEditData((d) => ({ ...d, shift_end: e.target.value }))} className="h-8 text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block font-medium">Notes</label>
              <Input value={editData.notes} onChange={(e) => setEditData((d) => ({ ...d, notes: e.target.value }))} placeholder="Optional notes" className="h-8 text-sm" />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg h-8 text-xs gap-1" onClick={() => saveEdit(editingRoom)}>
              <Check className="w-3.5 h-3.5" /> Save
            </Button>
            <Button size="sm" variant="outline" className="rounded-lg h-8 text-xs gap-1" onClick={cancelEdit}>
              <X className="w-3.5 h-3.5" /> Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Gantt */}
      <StaffingGantt orRooms={orRooms} assignmentMap={assignmentMap} />

      {/* Vocera Panel */}
      <VoceraNotificationPanel
        date={date}
        orRooms={orRooms}
        assignmentMap={assignmentMap}
        onNotified={() => queryClient.invalidateQueries(["staff_assignments", date])}
      />

      {settingsOpen && (
        <ORSettingsModal
          settings={settings}
          settingsId={settingsList[0]?.id}
          onClose={() => setSettingsOpen(false)}
          onSaved={() => {
            queryClient.invalidateQueries(["or_settings"]);
            setSettingsOpen(false);
          }}
        />
      )}
    </div>
  );
}
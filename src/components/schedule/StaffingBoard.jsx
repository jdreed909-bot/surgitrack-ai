import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Users, Edit2, Check, X, Plus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ORSettingsModal from "./ORSettingsModal";

export default function StaffingBoard({ date }) {
  const queryClient = useQueryClient();
  const [editingRoom, setEditingRoom] = useState(null); // or_room string
  const [editData, setEditData] = useState({});
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Load OR settings
  const { data: settingsList = [] } = useQuery({
    queryKey: ["or_settings"],
    queryFn: () => base44.entities.ORSettings.list("-created_date", 1),
  });
  const settings = settingsList[0] || { or_count: 6, or_names: [] };
  const orCount = settings.or_count || 6;
  const orNames = settings.or_names || [];
  const orRooms = Array.from({ length: orCount }, (_, i) => orNames[i] || `OR ${i + 1}`);

  // Load assignments for the day
  const { data: assignments = [] } = useQuery({
    queryKey: ["staff_assignments", date],
    queryFn: () => base44.entities.StaffAssignment.filter({ date }, "or_room", 50),
  });

  const assignmentMap = Object.fromEntries(assignments.map((a) => [a.or_room, a]));

  const startEdit = (room) => {
    const existing = assignmentMap[room] || {};
    setEditData({
      rn_name: existing.rn_name || "",
      scrub_tech_name: existing.scrub_tech_name || "",
      shift_start: existing.shift_start || "07:00",
      shift_end: existing.shift_end || "15:30",
      notes: existing.notes || "",
    });
    setEditingRoom(room);
  };

  const cancelEdit = () => {
    setEditingRoom(null);
    setEditData({});
  };

  const saveEdit = async (room) => {
    const existing = assignmentMap[room];
    if (existing?.id) {
      await base44.entities.StaffAssignment.update(existing.id, { ...editData, date, or_room: room });
    } else {
      await base44.entities.StaffAssignment.create({ ...editData, date, or_room: room });
    }
    await queryClient.invalidateQueries(["staff_assignments", date]);
    setEditingRoom(null);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm mt-6">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-teal-600" />
          <span className="font-semibold text-slate-800 text-base">Staffing Assignments</span>
          <span className="text-xs text-slate-400 ml-1">{date}</span>
        </div>
        <Button variant="outline" size="sm" className="rounded-xl border-slate-200 text-xs gap-1" onClick={() => setSettingsOpen(true)}>
          <Settings className="w-3.5 h-3.5" /> OR Settings
        </Button>
      </div>

      <div className="divide-y divide-slate-50">
        {orRooms.map((room) => {
          const a = assignmentMap[room];
          const isEditing = editingRoom === room;

          return (
            <div key={room} className={`px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3 transition-colors ${isEditing ? "bg-teal-50/40" : "hover:bg-slate-50/60"}`}>
              {/* Room label */}
              <div className="w-20 flex-shrink-0">
                <span className="text-sm font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg">{room}</span>
              </div>

              {isEditing ? (
                <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">RN</label>
                    <Input value={editData.rn_name} onChange={(e) => setEditData((d) => ({ ...d, rn_name: e.target.value }))} placeholder="RN Name" className="h-8 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Scrub Tech</label>
                    <Input value={editData.scrub_tech_name} onChange={(e) => setEditData((d) => ({ ...d, scrub_tech_name: e.target.value }))} placeholder="Tech Name" className="h-8 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Shift Start</label>
                    <Input type="time" value={editData.shift_start} onChange={(e) => setEditData((d) => ({ ...d, shift_start: e.target.value }))} className="h-8 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Shift End</label>
                    <Input type="time" value={editData.shift_end} onChange={(e) => setEditData((d) => ({ ...d, shift_end: e.target.value }))} className="h-8 text-sm" />
                  </div>
                  <div className="col-span-2 sm:col-span-4">
                    <Input value={editData.notes} onChange={(e) => setEditData((d) => ({ ...d, notes: e.target.value }))} placeholder="Notes (optional)" className="h-8 text-sm" />
                  </div>
                  <div className="col-span-2 sm:col-span-4 flex gap-2">
                    <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg h-8 text-xs gap-1" onClick={() => saveEdit(room)}>
                      <Check className="w-3.5 h-3.5" /> Save
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-lg h-8 text-xs gap-1" onClick={cancelEdit}>
                      <X className="w-3.5 h-3.5" /> Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1 text-sm">
                  <StaffCell label="RN" value={a?.rn_name} />
                  <StaffCell label="Scrub Tech" value={a?.scrub_tech_name} />
                  <StaffCell label="Shift" value={a?.shift_start && a?.shift_end ? `${a.shift_start} – ${a.shift_end}` : null} />
                  <StaffCell label="Notes" value={a?.notes} />
                </div>
              )}

              {!isEditing && (
                <button onClick={() => startEdit(room)} className="text-slate-400 hover:text-teal-600 transition-colors flex-shrink-0">
                  {a ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </button>
              )}
            </div>
          );
        })}
      </div>

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

function StaffCell({ label, value }) {
  return (
    <div>
      <div className="text-xs text-slate-400">{label}</div>
      <div className={value ? "text-slate-800 font-medium" : "text-slate-300 italic text-xs"}>{value || "Unassigned"}</div>
    </div>
  );
}
import React, { useState, useMemo, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, Users, CalendarDays, Plus, X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Shift templates
const WEEKDAY_SHIFTS = [
  { time: "7a",      label: "RN / ST",         color: "bg-teal-50 border-teal-200 text-teal-700" },
  { time: "3p",      label: "RN / ST",         color: "bg-sky-50 border-sky-200 text-sky-700" },
  { time: "5p",      label: "RN / ST",         color: "bg-violet-50 border-violet-200 text-violet-700" },
  { time: "8p",      label: "RN / ST",         color: "bg-orange-50 border-orange-200 text-orange-700" },
  { time: "11p–7a",  label: "RN / ST Call",    color: "bg-slate-100 border-slate-300 text-slate-500", call: true },
];

const WEEKEND_SHIFTS = [
  { time: "7a",      label: "RN / ST",         color: "bg-teal-50 border-teal-200 text-teal-700" },
  { time: "3p",      label: "RN / ST",         color: "bg-sky-50 border-sky-200 text-sky-700" },
  { time: "5p",      label: "RN / ST",         color: "bg-violet-50 border-violet-200 text-violet-700" },
  { time: "7p",      label: "RN / ST",         color: "bg-orange-50 border-orange-200 text-orange-700" },
  { time: "5–11p",   label: "RN Call",         color: "bg-rose-50 border-rose-200 text-rose-600", call: true },
  { time: "7–11p",   label: "ST Call",         color: "bg-pink-50 border-pink-200 text-pink-600", call: true },
  { time: "11p–7a",  label: "RN / ST Call",    color: "bg-slate-100 border-slate-300 text-slate-500", call: true },
];

// Map shift time labels → matching shift_start prefixes for StaffAssignment records
const SHIFT_START_MAP = {
  "7a":     ["07:00", "7:00"],
  "3p":     ["15:00", "15:3"],
  "5p":     ["17:00", "17:3"],
  "8p":     ["20:00"],
  "7p":     ["19:00"],
  "11p–7a": ["23:00"],
  "5–11p":  ["17:00", "17:3"],
  "7–11p":  ["19:00"],
};

function getStaffForShift(shiftTime, staff, assignments) {
  // Match staff whose shift_start aligns with the shift time bucket
  const prefixes = SHIFT_START_MAP[shiftTime] || [];
  if (prefixes.length === 0) return [];

  // Find assignment records that have a shift_start matching the bucket
  const matched = [];
  assignments.forEach((a) => {
    const start = a.rn_shift_start || a.shift_start || "";
    const stStart = a.scrub_tech_shift_start || a.shift_start || "";
    const crStart = a.charge_rn_shift_start || a.shift_start || "";

    if (a.rn_name && prefixes.some((p) => start.startsWith(p))) {
      matched.push({ name: a.rn_name, role: "RN", room: a.or_room, shiftStart: start, shiftEnd: a.rn_shift_end || a.shift_end || "" });
    }
    if (a.scrub_tech_name && prefixes.some((p) => stStart.startsWith(p))) {
      matched.push({ name: a.scrub_tech_name, role: "Scrub Tech", room: a.or_room, shiftStart: stStart, shiftEnd: a.scrub_tech_shift_end || a.shift_end || "" });
    }
    if (a.charge_rn_name && prefixes.some((p) => crStart.startsWith(p))) {
      matched.push({ name: a.charge_rn_name, role: "Charge RN", room: a.or_room, shiftStart: crStart, shiftEnd: a.charge_rn_shift_end || a.shift_end || "" });
    }
  });
  return matched;
}

function ShiftPopover({ shift, staff, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    function handle(e) { if (ref.current && !ref.current.contains(e.target)) onClose(); }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute z-50 left-0 mt-0.5 w-56 bg-white border border-slate-200 rounded-xl shadow-xl p-3"
      style={{ top: "100%" }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-bold text-slate-700">{shift.time} — {shift.label}</span>
        </div>
        <button onClick={onClose} className="text-slate-300 hover:text-slate-500"><X className="w-3 h-3" /></button>
      </div>
      {staff.length === 0 ? (
        <p className="text-[11px] text-slate-400 italic">No staff assigned to this shift yet.</p>
      ) : (
        <div className="space-y-1.5">
          {staff.map((p, i) => (
            <div key={i} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                  p.role === "RN" ? "bg-teal-50 border-teal-200 text-teal-700" :
                  p.role === "Scrub Tech" ? "bg-indigo-50 border-indigo-200 text-indigo-700" :
                  "bg-amber-50 border-amber-200 text-amber-700"
                }`}>{p.role === "Scrub Tech" ? "ST" : p.role === "Charge RN" ? "CRN" : "RN"}</span>
                <span className="text-xs text-slate-800 font-medium truncate">{p.name}</span>
              </div>
              <div className="text-[10px] text-slate-400 shrink-0">
                {p.shiftStart && p.shiftEnd ? `${p.shiftStart}–${p.shiftEnd}` : p.room}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ShiftSlot({ s, dayAssignments }) {
  const [open, setOpen] = useState(false);
  const staff = getStaffForShift(s.time, [], dayAssignments);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-1 px-1 py-0.5 rounded border text-[9px] leading-tight transition-opacity hover:opacity-80 active:scale-95 ${s.color}`}
      >
        <span className="font-bold shrink-0 w-10">{s.time}</span>
        <span className="opacity-75 truncate">{s.label}</span>
        {staff.length > 0 && (
          <span className="ml-auto shrink-0 font-bold">{staff.length}</span>
        )}
      </button>
      {open && <ShiftPopover shift={s} staff={staff} onClose={() => setOpen(false)} />}
    </div>
  );
}

function ShiftSlots({ isWeekend, dayAssignments }) {
  const shifts = isWeekend ? WEEKEND_SHIFTS : WEEKDAY_SHIFTS;
  return (
    <div className="mt-1 border-t border-slate-100 pt-1 space-y-0.5">
      {shifts.map((s) => (
        <ShiftSlot key={s.time} s={s} dayAssignments={dayAssignments} />
      ))}
    </div>
  );
}

function roleBadgeColor(role) {
  if (role === "RN") return "bg-teal-100 text-teal-800 border-teal-300";
  if (role === "Scrub Tech") return "bg-indigo-100 text-indigo-800 border-indigo-300";
  if (role === "Charge RN") return "bg-amber-100 text-amber-800 border-amber-300";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

// Build list of 4-week period start dates (Sunday) relative to today
function buildPeriodOptions() {
  const today = new Date();
  const base = startOfWeek(today, { weekStartsOn: 0 });
  const options = [];
  for (let i = -4; i <= 4; i++) {
    const start = addWeeks(base, i * 4);
    const end = addDays(addWeeks(start, 4), -1);
    options.push({
      label: `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`,
      start,
    });
  }
  return options;
}

export default function StaffingSchedule() {
  const periodOptions = useMemo(() => buildPeriodOptions(), []);
  const todayBase = startOfWeek(new Date(), { weekStartsOn: 0 });
  const currentIndex = periodOptions.findIndex((o) => isSameDay(o.start, todayBase)) ?? 4;
  const [periodIdx, setPeriodIdx] = useState(currentIndex >= 0 ? currentIndex : 4);
  const [addModal, setAddModal] = useState(null); // { date: "YYYY-MM-DD" }

  const queryClient = useQueryClient();

  const periodStart = periodOptions[periodIdx].start;
  // 28 days in the period
  const days = Array.from({ length: 28 }, (_, i) => addDays(periodStart, i));

  // Date range for fetching
  const startStr = format(periodStart, "yyyy-MM-dd");
  const endStr = format(addDays(periodStart, 27), "yyyy-MM-dd");

  const { data: roster = [] } = useQuery({
    queryKey: ["staff_roster"],
    queryFn: () => base44.entities.StaffRoster.filter({ is_active: true }, "name", 200),
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["staff_assignments_schedule", startStr, endStr],
    queryFn: () => base44.entities.StaffAssignment.list("-date", 500),
  });

  // Filter assignments to this period
  const periodAssignments = assignments.filter((a) => a.date >= startStr && a.date <= endStr);

  // Group by date — chips
  const byDate = useMemo(() => {
    const map = {};
    periodAssignments.forEach((a) => {
      if (!map[a.date]) map[a.date] = [];
      if (a.rn_name) map[a.date].push({ name: a.rn_name, role: "RN", room: a.or_room, id: a.id });
      if (a.scrub_tech_name) map[a.date].push({ name: a.scrub_tech_name, role: "Scrub Tech", room: a.or_room, id: a.id });
      if (a.charge_rn_name) map[a.date].push({ name: a.charge_rn_name, role: "Charge RN", room: a.or_room, id: a.id });
    });
    return map;
  }, [periodAssignments]);

  // Group raw assignment records by date (for shift popover lookup)
  const assignmentsByDate = useMemo(() => {
    const map = {};
    periodAssignments.forEach((a) => {
      if (!map[a.date]) map[a.date] = [];
      map[a.date].push(a);
    });
    return map;
  }, [periodAssignments]);

  return (
    <div className="min-h-screen bg-[#F0F4F8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              <CalendarDays className="w-7 h-7 text-teal-600" />
              Staffing Schedule
            </h1>
            <p className="text-slate-500 mt-1 text-sm">4-week department staffing view</p>
          </div>

          {/* Period selector */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPeriodIdx((i) => Math.max(0, i - 1))}
              disabled={periodIdx === 0}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <select
              value={periodIdx}
              onChange={(e) => setPeriodIdx(Number(e.target.value))}
              className="text-sm border border-slate-200 rounded-xl px-3 py-1.5 bg-white text-slate-700 font-medium shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-400"
            >
              {periodOptions.map((opt, i) => (
                <option key={i} value={i}>{opt.label}</option>
              ))}
            </select>
            <button
              onClick={() => setPeriodIdx((i) => Math.min(periodOptions.length - 1, i + 1))}
              disabled={periodIdx === periodOptions.length - 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Staff legend */}
        <div className="flex flex-wrap gap-2 mb-5">
          {roster.map((s) => (
            <span key={s.id} className={`px-2.5 py-1 rounded-full border text-xs font-medium ${roleBadgeColor(s.role)}`}>
              {s.name}
            </span>
          ))}
          {roster.length === 0 && (
            <span className="text-xs text-slate-400 italic">No staff in roster yet — add staff via the Staff Roster page</span>
          )}
        </div>

        {/* 4-week grid */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
          {/* Day-of-week header */}
          <div className="grid grid-cols-7 border-b border-slate-100">
            {DAY_LABELS.map((d) => (
              <div key={d} className="py-2 text-center text-xs font-bold text-slate-500 uppercase tracking-wide border-r border-slate-100 last:border-r-0">
                {d}
              </div>
            ))}
          </div>

          {/* 4 rows of 7 days */}
          {[0, 1, 2, 3].map((week) => {
            const weekDays = days.slice(week * 7, week * 7 + 7);
            return (
              <div key={week} className="grid grid-cols-7 border-b border-slate-100 last:border-b-0">
                {weekDays.map((day) => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  const isToday = isSameDay(day, new Date());
                  const staff = byDate[dateStr] || [];
                  const dayOfWeek = day.getDay(); // 0=Sun, 6=Sat
                  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                  return (
                    <div
                      key={dateStr}
                      className={`min-h-[200px] border-r border-slate-100 last:border-r-0 p-1.5 flex flex-col gap-1 ${
                        isToday ? "bg-teal-50/60" : "hover:bg-slate-50/50"
                      }`}
                    >
                      {/* Date number */}
                      <div className={`text-xs font-bold mb-0.5 w-6 h-6 flex items-center justify-center rounded-full ${
                        isToday ? "bg-teal-600 text-white" : "text-slate-500"
                      }`}>
                        {format(day, "d")}
                      </div>

                      {/* Staff chips */}
                      <div className="flex flex-col gap-0.5 flex-1">
                        {staff.map((p, idx) => (
                          <div
                            key={`${p.name}-${idx}`}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium border truncate ${roleBadgeColor(p.role)}`}
                            title={`${p.name} (${p.role}) — ${p.room}`}
                          >
                            <span className="truncate block">{p.name}</span>
                          </div>
                        ))}
                      </div>

                      {/* Add staff button */}
                      <button
                        onClick={() => setAddModal({ date: dateStr })}
                        className="mt-1 text-[10px] text-slate-300 hover:text-teal-500 flex items-center gap-0.5 transition-colors"
                      >
                        <Plus className="w-3 h-3" /> Add
                      </button>

                      {/* Shift slots */}
                      <ShiftSlots isWeekend={isWeekend} />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Role legend */}
        <div className="flex flex-wrap gap-4 mt-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-teal-200 border border-teal-300 inline-block" /> RN</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-indigo-200 border border-indigo-300 inline-block" /> Scrub Tech</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-200 border border-amber-300 inline-block" /> Charge RN</span>
        </div>
      </div>

      {/* Add Staff Modal */}
      {addModal && (
        <AddStaffModal
          date={addModal.date}
          roster={roster}
          onClose={() => setAddModal(null)}
          onSaved={() => {
            queryClient.invalidateQueries(["staff_assignments_schedule"]);
            setAddModal(null);
          }}
        />
      )}
    </div>
  );
}

// ── AddStaffModal ─────────────────────────────────────────────────────────────
function AddStaffModal({ date, roster, onClose, onSaved }) {
  const [selectedName, setSelectedName] = useState("");
  const [orRoom, setOrRoom] = useState("OR 1");
  const [saving, setSaving] = useState(false);

  const selectedPerson = roster.find((s) => s.name === selectedName);

  async function handleSave() {
    if (!selectedName || !selectedPerson) return;
    setSaving(true);
    const roleField =
      selectedPerson.role === "RN" ? "rn_name" :
      selectedPerson.role === "Scrub Tech" ? "scrub_tech_name" :
      "charge_rn_name";
    await base44.entities.StaffAssignment.create({
      date,
      or_room: orRoom,
      [roleField]: selectedName,
    });
    onSaved();
  }

  const OR_ROOMS = ["OR 1","OR 2","OR 3","OR 4","OR 5","OR 6"];

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800">Add Staff — {format(parseISO(date), "EEE, MMM d")}</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-slate-400" /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-500 font-medium mb-1 block">Staff Member</label>
            <select
              value={selectedName}
              onChange={(e) => setSelectedName(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-teal-400"
            >
              <option value="">Select staff…</option>
              {roster.map((s) => (
                <option key={s.id} value={s.name}>{s.name} ({s.role})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-500 font-medium mb-1 block">OR Room</label>
            <select
              value={orRoom}
              onChange={(e) => setOrRoom(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-teal-400"
            >
              {OR_ROOMS.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <Button variant="outline" className="flex-1 rounded-xl" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!selectedName || saving}
            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white rounded-xl"
            onClick={handleSave}
          >
            {saving ? "Saving…" : "Add"}
          </Button>
        </div>
      </div>
    </div>
  );
}
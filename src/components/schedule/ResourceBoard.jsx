import React, { useState, useMemo } from "react";
import { Users, ArrowLeftRight, Coffee, Utensils, Briefcase, X, Plus } from "lucide-react";

// ── helpers ──────────────────────────────────────────────────────────────────
function roleBadgeColor(role) {
  if (role === "RN") return { bg: "bg-teal-100", text: "text-teal-800", border: "border-teal-300" };
  if (role === "Scrub Tech") return { bg: "bg-indigo-100", text: "text-indigo-800", border: "border-indigo-300" };
  if (role === "Charge RN") return { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-300" };
  return { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-300" };
}

function formatShift(start, end) {
  if (!start && !end) return null;
  const fmt = (t) => {
    if (!t) return "?";
    const [h, m] = t.split(":").map(Number);
    const suffix = h >= 12 ? "p" : "a";
    const dh = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return m === 0 ? `${dh}${suffix}` : `${dh}:${m.toString().padStart(2, "0")}${suffix}`;
  };
  return `${fmt(start)}–${fmt(end)}`;
}

// ── StaffChip ─────────────────────────────────────────────────────────────────
function StaffChip({ person, onRemove, draggable, onDragStart }) {
  const { bg, text, border } = roleBadgeColor(person.role);
  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-medium cursor-grab select-none ${bg} ${text} ${border} shadow-sm`}
    >
      <span className="truncate max-w-[90px]">{person.name}</span>
      {person.shift && <span className="opacity-60 text-[10px] shrink-0">{person.shift}</span>}
      {onRemove && (
        <button onClick={onRemove} className="ml-0.5 opacity-50 hover:opacity-100">
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

// ── DropSlot ──────────────────────────────────────────────────────────────────
function DropSlot({ label, icon: Icon, iconColor, accepts, occupant, onDrop, onRemove, dragOver, onDragOver, onDragLeave }) {
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); onDragOver(); }}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`flex flex-col gap-1 min-h-[52px] rounded-lg border-2 border-dashed p-1.5 transition-colors ${
        dragOver ? "border-teal-400 bg-teal-50" : "border-slate-200 bg-slate-50/50"
      }`}
    >
      <div className={`flex items-center gap-1 text-[10px] font-semibold ${iconColor} mb-0.5`}>
        <Icon className="w-3 h-3" />
        {label}
      </div>
      {occupant ? (
        <StaffChip person={occupant} onRemove={onRemove} draggable onDragStart={(e) => e.dataTransfer.setData("text/plain", JSON.stringify(occupant))} />
      ) : (
        <div className="text-[10px] text-slate-300 italic px-1">
          {accepts ? `Drop ${accepts} here` : "Drop here"}
        </div>
      )}
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────
export default function ResourceBoard({ orRooms, assignmentMap, roster }) {
  // Local state: resource assignments per room
  // shape: { [room]: { resource_rn, resource_st, break_rn, break_st, lunch_rn, lunch_st } }
  // each value is a person object { name, role, shift } or null
  const [resources, setResources] = useState({});
  const [dragOver, setDragOver] = useState(null); // "depot" | "{room}_{slot}"

  // Build depot: everyone in the roster who has an assignment today, not yet slotted
  const depotPeople = useMemo(() => {
    const slottedNames = new Set();
    Object.values(resources).forEach((slots) => {
      Object.values(slots).forEach((p) => { if (p) slottedNames.add(p.name); });
    });
    // Also exclude people already assigned to an OR as primary
    orRooms.forEach((room) => {
      const a = assignmentMap[room];
      if (a?.rn_name) slottedNames.add(a.rn_name);
      if (a?.scrub_tech_name) slottedNames.add(a.scrub_tech_name);
      if (a?.charge_rn_name) slottedNames.add(a.charge_rn_name);
    });

    const people = [];
    roster.filter((s) => s.is_active !== false).forEach((s) => {
      if (!slottedNames.has(s.name)) {
        people.push({
          name: s.name,
          role: s.role,
          shift: formatShift(null, null), // no assignment shift available at depot level
        });
      }
    });
    return people;
  }, [roster, resources, assignmentMap, orRooms]);

  // All people assigned for the day (primary OR assignments) with their shifts
  const todayStaff = useMemo(() => {
    const people = [];
    orRooms.forEach((room) => {
      const a = assignmentMap[room];
      if (a?.rn_name) people.push({ name: a.rn_name, role: "RN", shift: formatShift(a.rn_shift_start || a.shift_start, a.rn_shift_end || a.shift_end), primaryRoom: room });
      if (a?.scrub_tech_name) people.push({ name: a.scrub_tech_name, role: "Scrub Tech", shift: formatShift(a.scrub_tech_shift_start || a.shift_start, a.scrub_tech_shift_end || a.shift_end), primaryRoom: room });
      if (a?.charge_rn_name) people.push({ name: a.charge_rn_name, role: "Charge RN", shift: formatShift(a.charge_rn_shift_start || a.shift_start, a.charge_rn_shift_end || a.shift_end), primaryRoom: room });
    });
    return people;
  }, [assignmentMap, orRooms]);

  // people in the depot = today's staff minus anyone placed in resource slots
  const slottedNames = useMemo(() => {
    const s = new Set();
    Object.values(resources).forEach((slots) => {
      Object.values(slots).forEach((p) => { if (p) s.add(p.name); });
    });
    return s;
  }, [resources]);

  const depotStaff = todayStaff.filter((p) => !slottedNames.has(p.name));

  function getSlot(room, slot) {
    return resources[room]?.[slot] || null;
  }

  function setSlot(room, slot, person) {
    setResources((prev) => {
      const roomData = { ...(prev[room] || {}) };
      // If this person is already somewhere else, clear them first
      const updated = { ...prev };
      Object.keys(updated).forEach((r) => {
        const rd = { ...updated[r] };
        Object.keys(rd).forEach((s) => {
          if (rd[s]?.name === person?.name) rd[s] = null;
        });
        updated[r] = rd;
      });
      updated[room] = { ...updated[room], [slot]: person };
      return updated;
    });
  }

  function clearSlot(room, slot) {
    setResources((prev) => ({
      ...prev,
      [room]: { ...(prev[room] || {}), [slot]: null },
    }));
  }

  function handleDrop(e, room, slot, accepts) {
    e.preventDefault();
    setDragOver(null);
    const person = JSON.parse(e.dataTransfer.getData("text/plain") || "null");
    if (!person) return;
    // Enforce role constraints for resource_rn / break_rn / lunch_rn → RN only
    // resource_st / break_st / lunch_st → Scrub Tech only
    if (accepts === "RN" && person.role !== "RN" && person.role !== "Charge RN") return;
    if (accepts === "ST" && person.role !== "Scrub Tech") return;
    setSlot(room, slot, person);
  }

  function handleDropDepot(e) {
    e.preventDefault();
    setDragOver(null);
    const person = JSON.parse(e.dataTransfer.getData("text/plain") || "null");
    if (!person) return;
    // Remove from wherever they are
    setResources((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((r) => {
        const rd = { ...updated[r] };
        Object.keys(rd).forEach((s) => {
          if (rd[s]?.name === person.name) rd[s] = null;
        });
        updated[r] = rd;
      });
      return updated;
    });
  }

  const SLOTS = [
    { key: "resource_rn", label: "Resource RN",    icon: Users,          iconColor: "text-teal-600",   accepts: "RN" },
    { key: "resource_st", label: "Resource ST",    icon: Briefcase,      iconColor: "text-indigo-600", accepts: "ST" },
    { key: "break_rn",    label: "Break RN",       icon: Coffee,         iconColor: "text-orange-500", accepts: "RN" },
    { key: "break_st",    label: "Break ST",       icon: Coffee,         iconColor: "text-orange-400", accepts: "ST" },
    { key: "lunch_rn",    label: "Lunch RN",       icon: Utensils,       iconColor: "text-rose-500",   accepts: "RN" },
    { key: "lunch_st",    label: "Lunch ST",       icon: Utensils,       iconColor: "text-rose-400",   accepts: "ST" },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm mt-4">
      <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
        <ArrowLeftRight className="w-4 h-4 text-teal-600" />
        <span className="font-semibold text-slate-800 text-sm">Resource & Coverage Board</span>
        <span className="text-xs text-slate-400 ml-1">— drag staff into slots</span>
      </div>

      <div className="p-4 space-y-4">
        {/* OR Columns */}
        <div className="overflow-x-auto">
          <div className="flex gap-3" style={{ minWidth: orRooms.length * 180 }}>
            {orRooms.map((room) => (
              <div key={room} className="flex-none w-44">
                {/* Room header */}
                <div className="bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-t-lg text-center">
                  {room}
                </div>
                <div className="border border-slate-200 rounded-b-lg p-2 space-y-2 bg-white">
                  {SLOTS.map((slot) => (
                    <DropSlot
                      key={slot.key}
                      label={slot.label}
                      icon={slot.icon}
                      iconColor={slot.iconColor}
                      accepts={slot.accepts === "RN" ? "RN/Charge RN" : "Scrub Tech"}
                      occupant={getSlot(room, slot.key)}
                      dragOver={dragOver === `${room}_${slot.key}`}
                      onDragOver={() => setDragOver(`${room}_${slot.key}`)}
                      onDragLeave={() => setDragOver(null)}
                      onDrop={(e) => handleDrop(e, room, slot.key, slot.accepts)}
                      onRemove={() => clearSlot(room, slot.key)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Staffing Depot */}
        <DepotSection
          depotStaff={depotStaff}
          roster={roster}
          dragOver={dragOver}
          setDragOver={setDragOver}
          onDrop={handleDropDepot}
          onAddFromRoster={(person) => {
            // Just make them draggable from depot by adding to a local "extra" list via state — handled inside DepotSection
          }}
          slottedNames={slottedNames}
          onAddPerson={(person) => {
            // person is already in depotStaff via roster, nothing to do; this is handled inside
          }}
        />

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs text-slate-400 pt-1 border-t border-slate-100">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal-500" /> RN / Charge RN slots</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500" /> Scrub Tech slots</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400" /> Break coverage</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-400" /> Lunch coverage</span>
        </div>
      </div>
    </div>
  );
}
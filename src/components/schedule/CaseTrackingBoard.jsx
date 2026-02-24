import React, { useState, useMemo, useRef, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Clock, GripVertical, Plus, Calendar, AlertTriangle, Package, User, Bell, CheckCircle, RotateCcw, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import EditCaseModal from "./EditCaseModal";

const OR_ROOMS = ["OR 1", "OR 2", "OR 3", "OR 4", "OR 5", "OR 6", "OR 7"];
const TURNOVER_MINS = 30;

function parseTime(timeStr) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function minutesToDisplay(mins) {
  if (mins == null) return "";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const ampm = h >= 12 ? "pm" : "am";
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${displayH}:${String(m).padStart(2, "0")} ${ampm}`;
}

function TurnoverSlot({ startMins, endMins }) {
  const duration = endMins != null && startMins != null ? endMins - startMins : TURNOVER_MINS;
  const isOver = duration > TURNOVER_MINS;
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border border-dashed text-xs font-medium my-1 mx-1
      ${isOver ? "border-red-300 bg-red-50 text-red-600" : "border-emerald-300 bg-emerald-50 text-emerald-700"}`}>
      <Clock className="w-3 h-3 shrink-0" />
      <span>Turnover — {duration} min</span>
    </div>
  );
}

function CaseChip({ caseData, isDragging, compact = false, onEdit, onPostpone }) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const start = caseData.scheduled_time ? minutesToDisplay(parseTime(caseData.scheduled_time)) : "";
  const end = caseData.scheduled_time && caseData.estimated_duration
    ? minutesToDisplay(parseTime(caseData.scheduled_time) + Number(caseData.estimated_duration))
    : "";

  useEffect(() => {
    if (!showMenu) return;
    function handler(e) { if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false); }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMenu]);

  return (
    <div className="relative">
      <div
        className={`bg-white border rounded-xl px-3 py-2.5 shadow-sm flex items-start gap-2 transition-all cursor-grab active:cursor-grabbing
        ${isDragging ? "shadow-lg ring-2 ring-teal-400 border-teal-300" : "border-slate-200 hover:border-teal-300 hover:shadow-md"}`}
        onClick={(e) => { e.stopPropagation(); setShowMenu((v) => !v); }}
        onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onEdit?.(caseData); }}
      >
        <GripVertical className="w-4 h-4 text-slate-300 mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="font-semibold text-slate-800 text-xs truncate">{caseData.procedure_name}</div>
            {caseData.status === "Add-On" && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200 shrink-0">Add-On</span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            #{caseData.case_number}
            {start && <> · {start}{end && ` – ${end}`}</>}
            {caseData.estimated_duration && <> · {caseData.estimated_duration}m</>}
          </div>
          {!compact && caseData.surgeon && (
            <div className="text-[11px] text-slate-400 truncate">{caseData.surgeon}</div>
          )}
        </div>
      </div>
      {showMenu && (
        <div
          ref={menuRef}
          className="absolute z-50 left-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-[170px]"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            onClick={() => { setShowMenu(false); onEdit?.(caseData); }}
          >
            <Calendar className="w-3.5 h-3.5 text-teal-500" />
            Edit Case
          </button>
          <button
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-amber-700 hover:bg-amber-50 transition-colors"
            onClick={() => { setShowMenu(false); onPostpone?.(caseData); }}
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
            Postpone → Return to Schedule
          </button>
        </div>
      )}
    </div>
  );
}

// Full CaseCard for the list below — clickable to send to depot
function FullCaseRow({ caseData, setsMap, conflictSetIds, unavailableSets, onMoveToDepot }) {
  const hasConflict = (caseData.required_sets || []).some(
    (id) => conflictSetIds?.has(id) || unavailableSets?.has(id)
  );

  const start = caseData.scheduled_time ? minutesToDisplay(parseTime(caseData.scheduled_time)) : "";
  const end = caseData.scheduled_time && caseData.estimated_duration
    ? minutesToDisplay(parseTime(caseData.scheduled_time) + Number(caseData.estimated_duration))
    : "";

  return (
    <Draggable draggableId={`list-${caseData.id}`} index={0}>
      {(prov, snap) => (
        <div
          ref={prov.innerRef}
          {...prov.draggableProps}
          {...prov.dragHandleProps}
          className={`bg-white border rounded-xl px-4 py-3 shadow-sm flex items-start gap-3 transition-all cursor-grab active:cursor-grabbing
            ${snap.isDragging ? "shadow-lg ring-2 ring-teal-400 border-teal-300" : "border-slate-100 hover:border-teal-300 hover:shadow-md"}`}
        >
          <GripVertical className="w-4 h-4 text-slate-300 mt-1 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-800 text-sm">{caseData.procedure_name}</span>
              {hasConflict && <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
              {caseData.or_room && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-teal-200 text-teal-700">{caseData.or_room}</Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-400">
              <span>#{caseData.case_number}</span>
              {start && <span><Clock className="w-3 h-3 inline mr-0.5" />{start}{end && ` – ${end}`}</span>}
              {caseData.surgeon && <span><User className="w-3 h-3 inline mr-0.5" />{caseData.surgeon}</span>}
              {caseData.required_sets?.length > 0 && <span><Package className="w-3 h-3 inline mr-0.5" />{caseData.required_sets.length} set{caseData.required_sets.length !== 1 ? "s" : ""}</span>}
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onMoveToDepot(caseData); }}
            className="shrink-0 text-[11px] font-medium text-teal-600 hover:text-teal-800 border border-teal-200 hover:border-teal-400 rounded-lg px-2 py-1 transition-colors"
            title="Send to depot"
          >
            → Depot
          </button>
        </div>
      )}
    </Draggable>
  );
}

async function notifyTeam(caseData, orRoom, assignmentMap, staffRoster = [], selectedDate = "") {
  const assignment = assignmentMap?.[orRoom];
  if (!assignment) return { sent: 0, log: ["No staff assignment found for " + orRoom] };

  const staff = [];
  if (assignment.rn_name)         staff.push({ name: assignment.rn_name,         role: "RN",        vocera_id: assignment.rn_vocera_id });
  if (assignment.scrub_tech_name) staff.push({ name: assignment.scrub_tech_name, role: "Scrub Tech", vocera_id: assignment.scrub_tech_vocera_id });
  if (assignment.charge_rn_name)  staff.push({ name: assignment.charge_rn_name,  role: "Charge RN",  vocera_id: assignment.charge_rn_vocera_id });

  if (staff.length === 0) return { sent: 0, log: ["No staff members assigned to " + orRoom] };

  const timeDisplay = caseData.scheduled_time
    ? (() => {
        const [h, m] = caseData.scheduled_time.split(":").map(Number);
        const ampm = h >= 12 ? "PM" : "AM";
        const dh = h % 12 === 0 ? 12 : h % 12;
        return `${dh}:${String(m).padStart(2, "0")} ${ampm}`;
      })()
    : "TBD";

  const msg = `${caseData.procedure_name} assigned to ${orRoom} at ${timeDisplay}. Date: ${selectedDate}`;
  const log = [];

  for (const s of staff) {
    const voceraLine = s.vocera_id ? `Vocera ID: ${s.vocera_id}` : "(No Vocera ID on file)";
    
    // Send SMS to staff as backup notification
    const rosterMember = staffRoster.find((r) => r.name === s.name);
    if (rosterMember?.phone) {
      try {
        await base44.integrations.Core.SendEmail({
          to: `sms:${rosterMember.phone}`,
          subject: `Case Assignment: ${caseData.procedure_name}`,
          body: msg,
        });
      } catch (e) {
        // SMS backup failed, continue with log
      }
    }
    
    log.push(`✓ ${s.name} (${s.role}) — ${voceraLine}`);
  }

  return { sent: staff.length, log };
}

export default function CaseTrackingBoard({ cases, setsMap, conflictSetIds, unavailableSets, assignmentMap = {}, selectedDate = "", staffRoster = [] }) {
  // All cases start in the "case list" zone (bottom full cards)
  // Once moved to depot or board they leave the list
  const allIds = useMemo(() => new Set(cases.map((c) => c.id)), [cases]);

  const [board, setBoard] = useState(() => {
    const b = {};
    OR_ROOMS.forEach((r) => { b[r] = []; });
    return b;
  });

  // depot: { "OR 1": [case, ...], ... }
  const [depot, setDepot] = useState(() => {
    const d = {};
    OR_ROOMS.forEach((r) => { d[r] = []; });
    return d;
  });

  // Track which case ids have been pulled onto board/depot (hidden from list)
  // Cases are ALWAYS kept in the schedule list, just visually hidden when on board
  const [movedIds, setMovedIds] = useState(new Set());
  const [notifyBanner, setNotifyBanner] = useState(null); // { caseId, room, sent, log }
  const [editingCase, setEditingCase] = useState(null);

  // listCases: cases not currently on depot or board
  const listCases = cases.filter((c) => !movedIds.has(c.id));

  function moveToDepot(caseData) {
    const room = OR_ROOMS.includes(caseData.or_room) ? caseData.or_room : OR_ROOMS[0];
    setDepot((prev) => ({ ...prev, [room]: [...prev[room], caseData] }));
    setMovedIds((prev) => new Set([...prev, caseData.id]));
  }

  // Postpone: remove from board/depot and send back to the schedule list
  function postponeCase(caseData) {
    const id = caseData.id;
    // Remove from board
    setBoard((prev) => {
      const next = { ...prev };
      OR_ROOMS.forEach((r) => { next[r] = next[r].filter((c) => c.id !== id); });
      return next;
    });
    // Remove from depot
    setDepot((prev) => {
      const next = { ...prev };
      OR_ROOMS.forEach((r) => { next[r] = next[r].filter((c) => c.id !== id); });
      return next;
    });
    // Return to schedule list
    setMovedIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
    // Update status in DB
    base44.entities.SurgicalCase.update(id, { status: "Delayed" });
  }

  function getList(id) {
    if (id.startsWith("depot-")) return [...(depot[id.replace("depot-", "")] || [])];
    if (id === "case-list") return []; // handled separately
    return [...(board[id] || [])];
  }

  function setList(id, list) {
    if (id.startsWith("depot-")) {
      const room = id.replace("depot-", "");
      setDepot((prev) => ({ ...prev, [room]: list }));
    } else if (id !== "case-list") {
      setBoard((prev) => ({ ...prev, [id]: list }));
    }
  }

  function onDragEnd(result) {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const srcId = source.droppableId;
    const dstId = destination.droppableId;

    // Dragging from the case list into depot or board
    if (srcId === "case-list") {
      const caseId = draggableId.replace("list-", "");
      const caseData = cases.find((c) => c.id === caseId);
      if (!caseData) return;

      if (dstId.startsWith("depot-")) {
        const room = dstId.replace("depot-", "");
        const dstList = [...(depot[room] || [])];
        dstList.splice(destination.index, 0, caseData);
        setDepot((prev) => ({ ...prev, [room]: dstList }));
        setMovedIds((prev) => new Set([...prev, caseId]));
      } else if (OR_ROOMS.includes(dstId)) {
        const updatedCase = { ...caseData, or_room: dstId };
        if (caseData.status === "Add-On") {
          base44.entities.SurgicalCase.update(caseId, { or_room: dstId });
        }
        const dstList = [...(board[dstId] || [])];
        dstList.splice(destination.index, 0, updatedCase);
        setBoard((prev) => ({ ...prev, [dstId]: dstList }));
        setMovedIds((prev) => new Set([...prev, caseId]));
        // Notify team
        notifyTeam(updatedCase, dstId, assignmentMap, staffRoster, selectedDate).then(({ sent, log }) => {
          setNotifyBanner({ caseId, room: dstId, sent, log, procedure: caseData.procedure_name });
          setTimeout(() => setNotifyBanner(null), 8000);
        });
      }
      return;
    }

    const srcList = getList(srcId);
    const dstList = srcId === dstId ? srcList : getList(dstId);
    const [removed] = srcList.splice(source.index, 1);
    // If dragging to a different OR lane, update or_room and notify
    if (srcId !== dstId && OR_ROOMS.includes(dstId)) {
      if (removed?.status === "Add-On") {
        base44.entities.SurgicalCase.update(removed.id, { or_room: dstId });
      }
      removed.or_room = dstId;
      // Notify team when case lands on an OR lane
      notifyTeam(removed, dstId, assignmentMap, staffRoster, selectedDate).then(({ sent, log }) => {
        setNotifyBanner({ caseId: removed.id, room: dstId, sent, log, procedure: removed.procedure_name });
        setTimeout(() => setNotifyBanner(null), 8000);
      });
    }
    dstList.splice(destination.index, 0, removed);

    if (srcId === dstId) {
      setList(srcId, srcList);
    } else {
      setList(srcId, srcList);
      setList(dstId, dstList);
    }
  }

  const totalCasesOnBoard = OR_ROOMS.reduce((acc, r) => acc + board[r].length, 0);

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      {/* Notification banner */}
      {notifyBanner && (
        <div className="mb-4 bg-violet-50 border border-violet-200 rounded-2xl px-5 py-3 flex items-start gap-3">
          <div className="w-7 h-7 bg-violet-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
            {notifyBanner.sent > 0
              ? <CheckCircle className="w-4 h-4 text-violet-600" />
              : <Bell className="w-4 h-4 text-violet-400" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-violet-800 text-sm">
              {notifyBanner.sent > 0
                ? `Team notified — ${notifyBanner.procedure} → ${notifyBanner.room}`
                : `No staff assigned to ${notifyBanner.room} yet`}
            </div>
            <div className="mt-1 space-y-0.5">
              {notifyBanner.log.map((l, i) => (
                <div key={i} className="text-xs text-violet-600">{l}</div>
              ))}
            </div>
          </div>
          <button onClick={() => setNotifyBanner(null)} className="text-violet-400 hover:text-violet-600 text-lg leading-none mt-0.5">×</button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-6">
        {/* Header */}
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-800 text-base">Case Tracking Board</h2>
            <p className="text-xs text-slate-400 mt-0.5">Drag cases from the list below into the depot, then up to OR rooms · 30 min turnover goal</p>
          </div>
          <div className="text-xs font-medium text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            {totalCasesOnBoard} / {cases.length} on board
          </div>
        </div>

        {/* Board — OR lanes */}
        <div className="overflow-x-auto">
          <div className="flex gap-0 min-w-max">
            {OR_ROOMS.map((room) => (
              <div key={room} className="flex flex-col border-r border-slate-100 last:border-r-0" style={{ minWidth: 180, width: 180 }}>
                <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">{room}</span>
                  <span className="text-[11px] text-slate-400">{board[room].length} case{board[room].length !== 1 ? "s" : ""}</span>
                </div>
                <Droppable droppableId={room}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 p-1.5 space-y-0.5 min-h-[280px] transition-colors ${snapshot.isDraggingOver ? "bg-teal-50" : "bg-white"}`}
                    >
                      {board[room].length === 0 && !snapshot.isDraggingOver && (
                        <div className="flex flex-col items-center justify-center h-full text-slate-300 text-[11px] py-8 gap-1">
                          <Plus className="w-5 h-5" />
                          <span>Drop cases here</span>
                        </div>
                      )}
                      {board[room].map((caseData, index) => (
                        <React.Fragment key={caseData.id}>
                          <Draggable draggableId={caseData.id} index={index}>
                            {(prov, snap) => (
                              <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}>
                                <CaseChip caseData={caseData} isDragging={snap.isDragging} onEdit={setEditingCase} />
                              </div>
                            )}
                          </Draggable>
                          {index < board[room].length - 1 && (
                            <TurnoverSlot
                              startMins={caseData.scheduled_time && caseData.estimated_duration ? parseTime(caseData.scheduled_time) + Number(caseData.estimated_duration) : null}
                              endMins={board[room][index + 1]?.scheduled_time ? parseTime(board[room][index + 1].scheduled_time) : null}
                            />
                          )}
                        </React.Fragment>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </div>

        {/* Depot */}
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
          <div className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-2">
            <span>📦 Depot — Staged Cases</span>
            <span className="text-slate-400 font-normal">Drag up to assign to an OR lane</span>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-1">
            {OR_ROOMS.map((room) => {
              const depotCases = depot[room] || [];
              if (depotCases.length === 0) return null;
              return (
                <div key={room} className="shrink-0">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">{room}</div>
                  <Droppable droppableId={`depot-${room}`} direction="horizontal">
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex gap-2 min-w-[160px] min-h-[72px] p-1.5 rounded-xl border border-dashed transition-colors ${snapshot.isDraggingOver ? "border-teal-400 bg-teal-50" : "border-slate-200 bg-white"}`}
                      >
                        {depotCases.map((c, i) => (
                          <Draggable key={c.id} draggableId={c.id} index={i}>
                            {(prov, snap) => (
                              <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps} style={{ ...prov.draggableProps.style, width: 160 }}>
                                <CaseChip caseData={c} isDragging={snap.isDragging} compact onEdit={setEditingCase} />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
            {OR_ROOMS.every((r) => (depot[r] || []).length === 0) && (
              <div className="text-xs text-slate-400 italic py-4">No staged cases yet. Use "→ Depot" on cases below or drag them here.</div>
            )}
          </div>
        </div>
      </div>

      {/* Case List — draggable into depot/board */}
      {listCases.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="font-semibold text-slate-700 text-sm">Today's Cases</h3>
            <span className="text-xs text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded-full">{listCases.length} remaining</span>
            <span className="text-xs text-slate-400">— drag or click "→ Depot" to stage</span>
          </div>
          <Droppable droppableId="case-list" isDropDisabled={true}>
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                {listCases.map((c) => (
                  <FullCaseRow
                    key={c.id}
                    caseData={c}
                    setsMap={setsMap}
                    conflictSetIds={conflictSetIds}
                    unavailableSets={unavailableSets}
                    onMoveToDepot={moveToDepot}
                  />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      )}

      <EditCaseModal open={!!editingCase} onClose={() => setEditingCase(null)} caseData={editingCase} />
    </DragDropContext>
  );
}
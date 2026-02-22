import React, { useState, useMemo } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Clock, GripVertical, Plus, Calendar, AlertTriangle, Package, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";

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

function CaseChip({ caseData, isDragging, compact = false }) {
  const start = caseData.scheduled_time ? minutesToDisplay(parseTime(caseData.scheduled_time)) : "";
  const end = caseData.scheduled_time && caseData.estimated_duration
    ? minutesToDisplay(parseTime(caseData.scheduled_time) + Number(caseData.estimated_duration))
    : "";

  return (
    <div className={`bg-white border rounded-xl px-3 py-2.5 shadow-sm flex items-start gap-2 transition-all cursor-grab active:cursor-grabbing
      ${isDragging ? "shadow-lg ring-2 ring-teal-400 border-teal-300" : "border-slate-200 hover:border-teal-300 hover:shadow-md"}`}>
      <GripVertical className="w-4 h-4 text-slate-300 mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-slate-800 text-xs truncate">{caseData.procedure_name}</div>
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

export default function CaseTrackingBoard({ cases, setsMap, conflictSetIds, unavailableSets }) {
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

  // Track which case ids have been moved out of the list
  const [movedIds, setMovedIds] = useState(new Set());

  const listCases = cases.filter((c) => !movedIds.has(c.id));

  function moveToDepot(caseData) {
    const room = OR_ROOMS.includes(caseData.or_room) ? caseData.or_room : OR_ROOMS[0];
    setDepot((prev) => ({ ...prev, [room]: [...prev[room], caseData] }));
    setMovedIds((prev) => new Set([...prev, caseData.id]));
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
      }
      return;
    }

    const srcList = getList(srcId);
    const dstList = srcId === dstId ? srcList : getList(dstId);
    const [removed] = srcList.splice(source.index, 1);
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
                                <CaseChip caseData={caseData} isDragging={snap.isDragging} />
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
                                <CaseChip caseData={c} isDragging={snap.isDragging} compact />
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
    </DragDropContext>
  );
}
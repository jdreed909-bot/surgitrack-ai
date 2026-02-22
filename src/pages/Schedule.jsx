import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, isToday, isTomorrow, parseISO, addHours, isBefore } from "date-fns";
import { Calendar, Clock, AlertTriangle, CheckCircle2, User, ChevronDown, ChevronUp, Bell, Package, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CaseCard from "../components/schedule/CaseCard";
import AddCaseModal from "../components/schedule/AddCaseModal";
import StaffingBoard from "../components/schedule/StaffingBoard";
import { useQuery as useAssignmentsQuery } from "@tanstack/react-query";

export default function Schedule() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [addOpen, setAddOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: cases = [], isLoading: casesLoading } = useQuery({
    queryKey: ["cases", selectedDate],
    queryFn: () => base44.entities.SurgicalCase.filter({ scheduled_date: selectedDate }, "scheduled_time", 50),
    refetchInterval: 20000,
  });

  const { data: allSets = [] } = useQuery({
    queryKey: ["sets"],
    queryFn: () => base44.entities.SurgicalSet.list("-updated_date", 200),
    refetchInterval: 20000,
  });

  // Build a map of set_id → set
  const setsMap = Object.fromEntries(allSets.map((s) => [s.id, s]));

  // Detect conflicts: same set required by multiple cases on same day
  const setUsageMap = {};
  cases.forEach((c) => {
    (c.required_sets || []).forEach((setId) => {
      if (!setUsageMap[setId]) setUsageMap[setId] = [];
      setUsageMap[setId].push(c.id);
    });
  });
  const conflictSetIds = new Set(
    Object.entries(setUsageMap)
      .filter(([, caseIds]) => caseIds.length > 1)
      .map(([setId]) => setId)
  );

  // Determine which sets are unavailable (not Available status)
  const unavailableSets = new Set(
    allSets.filter((s) => s.status !== "Available").map((s) => s.id)
  );

  // Generate date tabs (yesterday, today, tomorrow, day after)
  const dates = [-1, 0, 1, 2].map((d) => {
    const dt = new Date();
    dt.setDate(dt.getDate() + d);
    return format(dt, "yyyy-MM-dd");
  });

  const dateLabel = (d) => {
    const parsed = parseISO(d);
    if (isToday(parsed)) return "Today";
    if (isTomorrow(parsed)) return "Tomorrow";
    return format(parsed, "EEE, MMM d");
  };

  const totalConflicts = cases.reduce((acc, c) => {
    const hasConflict = (c.required_sets || []).some(
      (id) => conflictSetIds.has(id) || unavailableSets.has(id)
    );
    return acc + (hasConflict ? 1 : 0);
  }, 0);

  return (
    <div className="min-h-screen bg-[#F0F4F8]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Surgical Schedule</h1>
            <p className="text-slate-500 mt-1 text-sm">Cases and instrument set availability</p>
          </div>
          <Button
            onClick={() => setAddOpen(true)}
            className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-sm w-full sm:w-auto"
          >
            <Calendar className="w-4 h-4 mr-2" /> Add Case
          </Button>
        </div>

        {/* Date Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {dates.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDate(d)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                selectedDate === d
                  ? "bg-teal-600 text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-teal-300"
              }`}
            >
              {dateLabel(d)}
            </button>
          ))}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm border border-slate-200 bg-white text-slate-600 focus:outline-none focus:border-teal-400"
          />
        </div>

        {/* Summary bar */}
        {cases.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 px-5 py-4 mb-6 flex flex-wrap gap-4">
            <SummaryPill icon={<Calendar className="w-4 h-4 text-teal-600" />} label={`${cases.length} Case${cases.length !== 1 ? "s" : ""}`} />
            {totalConflicts > 0 && (
              <SummaryPill
                icon={<AlertTriangle className="w-4 h-4 text-amber-500" />}
                label={`${totalConflicts} Conflict${totalConflicts !== 1 ? "s" : ""}`}
                highlight
              />
            )}
            <SummaryPill icon={<Package className="w-4 h-4 text-slate-400" />} label={`${new Set(cases.flatMap((c) => c.required_sets || [])).size} Sets Required`} />
          </div>
        )}

        {/* Staffing */}
        <StaffingBoard date={selectedDate} />

        {/* Cases */}
        {casesLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-44 bg-white rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : cases.length === 0 ? (
          <div className="text-center py-24">
            <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">No cases scheduled for {dateLabel(selectedDate)}</p>
            <Button onClick={() => setAddOpen(true)} variant="outline" className="mt-4 rounded-xl border-slate-200">
              Add a Case
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {cases.map((c) => (
              <CaseCard
                key={c.id}
                caseData={c}
                setsMap={setsMap}
                conflictSetIds={conflictSetIds}
                unavailableSets={unavailableSets}
                onUpdated={() => {
                  queryClient.invalidateQueries(["cases"]);
                  queryClient.invalidateQueries(["sets"]);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {addOpen && (
        <AddCaseModal
          onClose={() => setAddOpen(false)}
          onCreated={() => queryClient.invalidateQueries(["cases"])}
          allSets={allSets}
          defaultDate={selectedDate}
        />
      )}
    </div>
  );
}

function SummaryPill({ icon, label, highlight }) {
  return (
    <div className={`flex items-center gap-2 text-sm font-medium ${highlight ? "text-amber-700" : "text-slate-700"}`}>
      {icon}
      <span>{label}</span>
    </div>
  );
}
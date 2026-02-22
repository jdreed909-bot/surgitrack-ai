import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import CaseTrackingBoard from "@/components/schedule/CaseTrackingBoard";

export default function CaseTracking() {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  const queryClient = useQueryClient();

  const { data: cases = [] } = useQuery({
    queryKey: ["cases", selectedDate],
    queryFn: () => base44.entities.SurgicalCase.filter(
      { scheduled_date: selectedDate },
      "scheduled_time",
      100
    ),
    refetchInterval: 20000,
  });

  const { data: surgicalSets = [] } = useQuery({
    queryKey: ["sets"],
    queryFn: () => base44.entities.SurgicalSet.list("-created_date", 200),
    refetchInterval: 30000,
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["assignments", selectedDate],
    queryFn: () => base44.entities.StaffAssignment.filter(
      { date: selectedDate },
      "or_room",
      50
    ),
    refetchInterval: 30000,
  });

  const { data: staffRoster = [] } = useQuery({
    queryKey: ["staff"],
    queryFn: () => base44.entities.StaffRoster.list("name", 100),
    refetchInterval: 30000,
  });

  // Build maps for efficient lookups
  const setsMap = surgicalSets.reduce((acc, s) => {
    acc[s.id] = s;
    return acc;
  }, {});

  const assignmentMap = assignments.reduce((acc, a) => {
    acc[a.or_room] = a;
    return acc;
  }, {});

  // Identify conflicts and unavailable sets
  const conflictSetIds = new Set();
  const unavailableSets = new Set();
  const setUsage = {};

  cases.forEach(c => {
    (c.required_sets || []).forEach(setId => {
      setUsage[setId] = (setUsage[setId] || 0) + 1;
    });
  });

  Object.entries(setUsage).forEach(([setId, count]) => {
    if (count > 1) conflictSetIds.add(setId);
  });

  surgicalSets.forEach(s => {
    if (s.status !== "Available") {
      unavailableSets.add(s.id);
    }
  });

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    queryClient.invalidateQueries({ queryKey: ["cases"] });
    queryClient.invalidateQueries({ queryKey: ["assignments"] });
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] p-6">
      <div className="max-w-full">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Case Tracking Board</h1>
          <input
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <CaseTrackingBoard
          cases={cases}
          setsMap={setsMap}
          conflictSetIds={conflictSetIds}
          unavailableSets={unavailableSets}
          assignmentMap={assignmentMap}
          selectedDate={selectedDate}
          staffRoster={staffRoster}
        />
      </div>
    </div>
  );
}
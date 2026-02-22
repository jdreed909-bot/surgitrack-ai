import React from "react";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import { format } from "date-fns";

export default function HolidaySchedule({ callSchedules, role, year = 2026 }) {
  const holidays = [
    { name: "MLK Day", month: 0, day: 19 },
    { name: "Presidents Day", month: 1, day: 16 },
    { name: "Memorial Day", month: 4, day: 25 },
    { name: "4th of July", month: 6, day: 4 },
    { name: "Labor Day", month: 8, day: 7 },
    { name: "Thanksgiving", month: 10, day: 23 },
    { name: "Christmas", month: 11, day: 25 },
    { name: "New Years", month: 0, day: 1, year: 2027 },
  ];

  const shifts = [
    { label: "Night Before", start: "11:00 PM", end: "7:00 AM", offset: -1 },
    { label: "Day Of (AM)", start: "7:00 AM", end: "3:00 PM", offset: 0 },
    { label: "Day Of (PM)", start: "3:00 PM", end: "11:00 PM", offset: 0 },
  ];

  const getStaffForShift = (holidayDate, shiftIndex) => {
    const dateStr = format(holidayDate, "yyyy-MM-dd");
    const matchingCalls = callSchedules.filter(
      (call) => call.call_date === dateStr && call.role === role
    );
    if (matchingCalls.length > 0) {
      return matchingCalls[shiftIndex]?.staff_member || "Unassigned";
    }
    return "Unassigned";
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-4 h-4 text-slate-600" />
        <h2 className="text-sm font-bold text-slate-900">Holiday Schedule</h2>
      </div>

      <div className="space-y-4">
        {holidays.map((holiday, idx) => {
          const holidayYear = holiday.year || year;
          const holidayDate = new Date(holidayYear, holiday.month, holiday.day);

          return (
            <div key={idx} className="border border-slate-200 rounded-lg p-3">
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-slate-900">
                  {holiday.name}
                </h3>
                <p className="text-xs text-slate-600">
                  {format(holidayDate, "EEEE, MMMM d, yyyy")}
                </p>
              </div>

              <div className="space-y-2">
                {shifts.map((shift, shiftIdx) => {
                  const shiftDate = new Date(holidayDate);
                  shiftDate.setDate(shiftDate.getDate() + shift.offset);
                  const staff = getStaffForShift(shiftDate, shiftIdx);
                  const isUnassigned = staff === "Unassigned";

                  return (
                    <div
                      key={shiftIdx}
                      className="flex items-center justify-between gap-2 text-xs p-2 rounded bg-slate-50 border border-slate-100"
                    >
                      <div className="flex-1">
                        <div className="font-semibold text-slate-900">
                          {shift.label}
                        </div>
                        <div className="text-slate-600">
                          {shift.start} — {shift.end}
                        </div>
                      </div>
                      <Badge
                        className={
                          isUnassigned
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                        }
                      >
                        {staff}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
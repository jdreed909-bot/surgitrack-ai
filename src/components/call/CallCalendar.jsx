import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addDays, format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from "date-fns";

export default function CallCalendar({ selectedDate, onDateSelect, callSchedules, role }) {
  const [viewDate, setViewDate] = useState(new Date());
  const [direction, setDirection] = useState("future"); // "past" or "future"

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const handlePrevMonth = () => {
    setViewDate(addDays(viewDate, -32));
  };

  const handleNextMonth = () => {
    setViewDate(addDays(viewDate, 32));
  };

  const getCallsForDay = (day) => {
    const dateStr = format(day, "yyyy-MM-dd");
    return callSchedules.filter((call) => call.call_date === dateStr && call.role === role);
  };

  const getDayNumber = (day) => {
    const calls = getCallsForDay(day);
    return calls.length > 0 ? calls.length : null;
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-900">{format(viewDate, "MMMM yyyy")}</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={handlePrevMonth}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={handleNextMonth}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="text-xs font-semibold text-slate-600 text-center py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {daysInMonth.map((day) => {
          const callCount = getDayNumber(day);
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());

          return (
            <button
              key={day.toString()}
              onClick={() => onDateSelect(day)}
              className={`p-2 rounded text-xs font-semibold transition-all ${
                isSelected
                  ? "bg-teal-600 text-white"
                  : isToday
                  ? "bg-blue-100 text-blue-900 border border-blue-300"
                  : "bg-slate-50 text-slate-900 hover:bg-slate-100"
              }`}
            >
              <div className="text-center">{format(day, "d")}</div>
              {callCount && (
                <div className="text-[10px] mt-0.5 opacity-75">{callCount} call{callCount !== 1 ? "s" : ""}</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
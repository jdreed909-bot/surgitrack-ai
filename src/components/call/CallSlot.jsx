import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, User, MoreVertical } from "lucide-react";

export default function CallSlot({ call, onPickup, onGiveaway, isCurrentUser, canModify = true, isPending }) {
  const getStatusColor = (status) => {
    switch (status) {
      case "Available":
        return "bg-amber-100 text-amber-800";
      case "Assigned":
        return isCurrentUser ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-800";
      case "Picked Up":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <div className="border border-slate-200 rounded-lg p-3 space-y-2">
      <div className="flex items-start justify-between">
        <div className="space-y-1 flex-1">
          <div className="text-sm font-semibold text-slate-900">{call.staff_member}</div>
          <div className="flex items-center gap-1 text-xs text-slate-600">
            <Clock className="w-3 h-3" />
            {call.start_time} — {call.end_time}
          </div>
        </div>
        <Badge className={getStatusColor(call.status)}>{call.status}</Badge>
      </div>

      {canModify && isCurrentUser && call.status === "Assigned" && !isPending && (
        <div className="flex gap-2 pt-2">
          <Button
            onClick={() => onGiveaway(call)}
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
          >
            Give Away
          </Button>
        </div>
      )}

      {canModify && call.status === "Available" && !isCurrentUser && !isPending && (
        <div className="pt-2">
          <Button
            onClick={() => onPickup(call)}
            variant="outline"
            size="sm"
            className="w-full text-xs"
          >
            Pick Up
          </Button>
        </div>
      )}

      {isPending && (
        <div className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded">
          ⏳ Pending Approval
        </div>
      )}
    </div>
  );
}
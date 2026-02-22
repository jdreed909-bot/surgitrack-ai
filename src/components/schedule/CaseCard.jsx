import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, Clock, MapPin, User, Package, Bell, ChevronDown, ChevronUp, Loader2, Wrench } from "lucide-react";

const STATUS_BADGE = {
  Available:    "bg-emerald-100 text-emerald-700 border-emerald-200",
  "In Use":     "bg-blue-100 text-blue-700 border-blue-200",
  Sterilizing:  "bg-purple-100 text-purple-700 border-purple-200",
  "Under Repair": "bg-amber-100 text-amber-700 border-amber-200",
  Missing:      "bg-red-100 text-red-700 border-red-200",
  "Loaned Out": "bg-slate-100 text-slate-600 border-slate-200",
};

export default function CaseCard({ caseData, setsMap, conflictSetIds, unavailableSets, onUpdated }) {
  const [expanded, setExpanded] = useState(false);
  const [notifying, setNotifying] = useState(false);

  const requiredSets = (caseData.required_sets || []).map((id) => setsMap[id]).filter(Boolean);
  const hasConflict = requiredSets.some((s) => conflictSetIds.has(s.id) || unavailableSets.has(s.id));

  const conflictSets = requiredSets.filter((s) => conflictSetIds.has(s.id) || unavailableSets.has(s.id));

  const handleNotifyVendor = async () => {
    setNotifying(true);
    const user = await base44.auth.me();
    await base44.entities.SurgicalCase.update(caseData.id, {
      vendor_notification_sent: true,
      vendor_notified_at: new Date().toISOString(),
      vendor_notified_by: user.email,
    });
    // Create alert log
    await base44.entities.Alert.create({
      type: "Vendor Notification",
      severity: "Medium",
      case_id: caseData.id,
      message: `Vendor notified for case ${caseData.case_number} – ${caseData.procedure_name} by ${user.email}`,
      is_resolved: true,
      resolved_by: user.email,
      resolved_at: new Date().toISOString(),
    });
    setNotifying(false);
    onUpdated();
  };

  const caseStatusColor = {
    Scheduled: "bg-slate-100 text-slate-600",
    "In Progress": "bg-blue-100 text-blue-700",
    Completed: "bg-emerald-100 text-emerald-700",
    Cancelled: "bg-red-100 text-red-600",
    Delayed: "bg-amber-100 text-amber-700",
  };

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${hasConflict ? "border-amber-300 ring-1 ring-amber-100" : "border-slate-100"}`}>
      {/* Conflict top bar */}
      {hasConflict && (
        <div className="bg-amber-50 border-b border-amber-200 px-5 py-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span className="text-xs text-amber-800 font-semibold">
            Instrument conflict detected — {conflictSets.length} set{conflictSets.length !== 1 ? "s" : ""} unavailable or double-booked
          </span>
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          {/* Left */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-mono text-xs text-slate-400">{caseData.case_number}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${caseStatusColor[caseData.status] || caseStatusColor.Scheduled}`}>
                {caseData.status}
              </span>
            </div>
            <h3 className="font-bold text-slate-900 text-base leading-tight mb-2">{caseData.procedure_name}</h3>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{caseData.scheduled_time}{caseData.estimated_duration ? ` · ${caseData.estimated_duration} min` : ""}</span>
              {caseData.or_room && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{caseData.or_room}</span>}
              {caseData.surgeon && <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" />Dr. {caseData.surgeon}</span>}
              {caseData.patient_initials && <span className="flex items-center gap-1.5">Patient: <strong>{caseData.patient_initials}</strong></span>}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col items-end gap-2">
            {hasConflict && !caseData.vendor_notification_sent && (
              <Button
                size="sm"
                onClick={handleNotifyVendor}
                disabled={notifying}
                className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs h-8"
              >
                {notifying ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Bell className="w-3 h-3 mr-1" />}
                Notify Vendor
              </Button>
            )}
            {caseData.vendor_notification_sent && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">
                <CheckCircle2 className="w-3.5 h-3.5" /> Vendor Notified
              </div>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setExpanded(!expanded)}
              className="text-slate-400 rounded-lg h-8 px-2"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Sets summary (compact) */}
        {requiredSets.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {requiredSets.map((s) => {
              const isConflict = conflictSetIds.has(s.id) || unavailableSets.has(s.id);
              return (
                <div
                  key={s.id}
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border font-medium ${
                    isConflict
                      ? "bg-red-50 border-red-200 text-red-700"
                      : "bg-slate-50 border-slate-200 text-slate-600"
                  }`}
                >
                  <Package className="w-3 h-3" />
                  {s.name}
                  {isConflict && <AlertTriangle className="w-3 h-3 text-red-500" />}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50 px-5 py-4 space-y-4">
          {/* Instrument sets detail */}
          {requiredSets.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">Required Instrument Sets</h4>
              <div className="space-y-2">
                {requiredSets.map((s) => {
                  const isDoubleBooked = conflictSetIds.has(s.id);
                  const isUnavailable = unavailableSets.has(s.id);
                  const isConflict = isDoubleBooked || isUnavailable;
                  return (
                    <div key={s.id} className={`flex items-center justify-between p-3 rounded-xl border ${isConflict ? "bg-red-50 border-red-200" : "bg-white border-slate-100"}`}>
                      <div>
                        <div className="font-medium text-sm text-slate-800">{s.name}</div>
                        <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                          <span className="font-mono">{s.set_code}</span>
                          {s.location && <><span>·</span><MapPin className="w-3 h-3" />{s.location}</>}
                          {s.vendor_name && <><span>·</span>{s.vendor_name}</>}
                        </div>
                        {isDoubleBooked && <div className="text-xs text-red-600 font-semibold mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Double-booked on this day</div>}
                        {isUnavailable && !isDoubleBooked && <div className="text-xs text-red-600 font-semibold mt-1 flex items-center gap-1"><Wrench className="w-3 h-3" />Not available — currently {s.status}</div>}
                      </div>
                      <Badge className={`text-xs border rounded-lg ${STATUS_BADGE[s.status] || ""}`}>{s.status}</Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Vendor notification */}
          {caseData.vendor_notification_sent && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-xs text-emerald-700 space-y-1">
              <div className="font-semibold flex items-center gap-1.5"><Bell className="w-3.5 h-3.5" />Vendor Notification Sent</div>
              {caseData.vendor_notified_by && <div>By: {caseData.vendor_notified_by}</div>}
              {caseData.vendor_notified_at && <div>At: {new Date(caseData.vendor_notified_at).toLocaleString()}</div>}
            </div>
          )}

          {/* Special requests / limitations */}
          {(caseData.special_requests || caseData.special_limitations) && (
            <div className="space-y-2">
              {caseData.special_requests && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs text-blue-800">
                  <div className="font-semibold mb-0.5">Special Equipment Requests</div>
                  <div>{caseData.special_requests}</div>
                </div>
              )}
              {caseData.special_limitations && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800">
                  <div className="font-semibold mb-0.5">Limitations / Restrictions</div>
                  <div>{caseData.special_limitations}</div>
                </div>
              )}
            </div>
          )}

          {caseData.notes && (
            <div className="text-xs text-slate-500 bg-white border border-slate-100 rounded-xl px-4 py-3">
              <span className="font-semibold text-slate-600">Notes: </span>{caseData.notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
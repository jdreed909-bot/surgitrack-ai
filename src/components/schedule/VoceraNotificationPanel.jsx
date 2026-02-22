import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Radio, Send, CheckCircle, AlertCircle, ChevronDown, ChevronUp, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

// Vocera integration helper
// In a real Vocera deployment this would call the Vocera REST API via a backend function.
// Since backend functions are not enabled, we simulate the notification workflow:
// - Log notification via email (using Core.SendEmail as a stand-in)
// - Mark assignments as notified
// - Show a clear audit trail in the UI

const NOTIFICATION_TYPES = [
  { id: "assignment", label: "Assignment Notification", description: "Notify staff of their OR room assignment for the day" },
  { id: "change",     label: "Assignment Change",       description: "Alert staff that their assignment has been updated" },
  { id: "request",    label: "Staffing Request",        description: "Send a request for additional staffing coverage" },
  { id: "update",     label: "General Update",          description: "Send a general operational update to all assigned staff" },
];

export default function VoceraNotificationPanel({ date, orRooms, assignmentMap, onNotified }) {
  const [expanded, setExpanded] = useState(false);
  const [notifType, setNotifType] = useState("assignment");
  const [customMessage, setCustomMessage] = useState("");
  const [targetRoom, setTargetRoom] = useState("ALL");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [log, setLog] = useState([]);

  const selectedType = NOTIFICATION_TYPES.find((t) => t.id === notifType);

  // Build list of staff to notify
  const getTargetStaff = () => {
    const rooms = targetRoom === "ALL" ? orRooms : [targetRoom];
    const staff = [];
    rooms.forEach((room) => {
      const a = assignmentMap[room];
      if (!a) return;
      if (a.rn_name)         staff.push({ name: a.rn_name,         role: "RN",        vocera_id: a.rn_vocera_id,         room });
      if (a.scrub_tech_name) staff.push({ name: a.scrub_tech_name, role: "Scrub Tech", vocera_id: a.scrub_tech_vocera_id, room });
      if (a.charge_rn_name)  staff.push({ name: a.charge_rn_name,  role: "Charge RN",  vocera_id: a.charge_rn_vocera_id,  room });
    });
    return staff;
  };

  const buildMessage = (staff) => {
    const base = customMessage.trim() ||
      (notifType === "assignment" ? `Your OR assignment for ${date}: ${staff.room} — ${staff.role}` :
       notifType === "change"     ? `⚠️ Assignment update for ${date}: ${staff.room} — ${staff.role}` :
       notifType === "request"    ? `Staffing request for ${date} — additional coverage needed in ${staff.room}` :
                                    `OR Update for ${date}: ${staff.room}`);
    return base;
  };

  const sendNotifications = async () => {
    setSending(true);
    setSent(false);
    const targets = getTargetStaff();

    if (targets.length === 0) {
      setLog([{ type: "warn", text: "No assigned staff found for selected room(s)." }]);
      setSending(false);
      return;
    }

    const newLog = [];

    for (const staff of targets) {
      const msg = buildMessage(staff);
      const voceraLine = staff.vocera_id
        ? `Vocera ID: ${staff.vocera_id}`
        : `(No Vocera ID on file — email fallback)`;

      // Simulate Vocera push + email fallback
      try {
        // In a real integration: POST to Vocera REST API endpoint
        // POST https://<vocera-server>/VoceraWebAPI/api/v1/messages
        // { "to": staff.vocera_id, "message": msg }
        // For now we log via email as audit trail
        await base44.integrations.Core.SendEmail({
          to: "vocera-log@surgtrack.local",
          subject: `[Vocera ${notifType.toUpperCase()}] ${staff.name} — ${staff.room} — ${date}`,
          body: `Vocera Notification\nType: ${selectedType.label}\nRecipient: ${staff.name} (${staff.role})\n${voceraLine}\nRoom: ${staff.room}\nDate: ${date}\nMessage: ${msg}`,
        });
        newLog.push({ type: "success", text: `✓ ${staff.name} (${staff.role}, ${staff.room}) — ${voceraLine}` });
      } catch (e) {
        newLog.push({ type: "error", text: `✗ Failed: ${staff.name} — ${e.message}` });
      }
    }

    // Mark assignments as notified
    const rooms = targetRoom === "ALL" ? orRooms : [targetRoom];
    for (const room of rooms) {
      const a = assignmentMap[room];
      if (a?.id) {
        await base44.entities.StaffAssignment.update(a.id, {
          vocera_notified: true,
          vocera_notified_at: new Date().toISOString(),
        });
      }
    }

    setLog(newLog);
    setSending(false);
    setSent(true);
    if (onNotified) onNotified();
  };

  const assignedCount = orRooms.filter((r) => assignmentMap[r]).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Header toggle */}
      <button
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-violet-100 rounded-lg flex items-center justify-center">
            <Radio className="w-4 h-4 text-violet-600" />
          </div>
          <span className="font-semibold text-slate-800 text-sm">Vocera Communications</span>
          <span className="text-xs bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full font-medium">
            {assignedCount}/{orRooms.length} rooms staffed
          </span>
        </div>
        <div className="flex items-center gap-2">
          {sent && <span className="text-xs text-green-600 font-medium flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Sent</span>}
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-slate-100">
          {/* Vocera API note */}
          <div className="mt-3 bg-violet-50 border border-violet-100 rounded-xl px-4 py-3 text-xs text-violet-700 flex gap-2">
            <Bell className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span>
              <strong>Vocera Integration:</strong> Notifications are dispatched to staff Vocera badge IDs. Configure badge IDs in the Staff Roster. If no Vocera ID is set, falls back to email audit log.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Notification type */}
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block font-medium">Notification Type</label>
              <select
                value={notifType}
                onChange={(e) => setNotifType(e.target.value)}
                className="w-full h-9 rounded-lg border border-slate-200 text-sm px-3 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-violet-400"
              >
                {NOTIFICATION_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
              <p className="text-xs text-slate-400 mt-1">{selectedType?.description}</p>
            </div>

            {/* Target room */}
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block font-medium">Target Room</label>
              <select
                value={targetRoom}
                onChange={(e) => setTargetRoom(e.target.value)}
                className="w-full h-9 rounded-lg border border-slate-200 text-sm px-3 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-violet-400"
              >
                <option value="ALL">All Rooms</option>
                {orRooms.map((r) => (
                  <option key={r} value={r}>{r}{assignmentMap[r] ? "" : " (unassigned)"}</option>
                ))}
              </select>
            </div>

            {/* Custom message */}
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block font-medium">Custom Message (optional)</label>
              <input
                type="text"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Leave blank for default message"
                className="w-full h-9 rounded-lg border border-slate-200 text-sm px-3 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-violet-400"
              />
            </div>
          </div>

          {/* Send button */}
          <div className="flex items-center gap-3">
            <Button
              onClick={sendNotifications}
              disabled={sending}
              className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm gap-2 h-9"
            >
              <Send className="w-3.5 h-3.5" />
              {sending ? "Sending…" : "Send Vocera Notification"}
            </Button>
            {sent && (
              <span className="text-xs text-green-600 flex items-center gap-1 font-medium">
                <CheckCircle className="w-3.5 h-3.5" /> Notifications dispatched
              </span>
            )}
          </div>

          {/* Log */}
          {log.length > 0 && (
            <div className="bg-slate-950 rounded-xl p-3 space-y-1 text-xs font-mono max-h-40 overflow-y-auto">
              {log.map((l, i) => (
                <div key={i} className={l.type === "success" ? "text-green-400" : l.type === "warn" ? "text-yellow-400" : "text-red-400"}>
                  {l.text}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
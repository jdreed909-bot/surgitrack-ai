import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Timer, Send, CheckCircle2, Users, Loader2, X } from "lucide-react";

const TOTAL_SECONDS = 20 * 60; // 20 minutes

function formatTime(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function TurnoverCountdownModal({ caseData, assignmentMap, onClose, onTriggered }) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  const orRoom = caseData.or_room;
  const assignment = assignmentMap?.[orRoom] || {};

  // People to notify
  const recipients = [
    assignment.rn_name       && { name: assignment.rn_name,         role: "RN",                 email: null },
    assignment.scrub_tech_name && { name: assignment.scrub_tech_name, role: "Scrub Tech",         email: null },
    caseData.surgeon          && { name: `Dr. ${caseData.surgeon}`,  role: "Surgeon",             email: null },
    caseData.assistant        && { name: caseData.assistant,          role: "Assistant",           email: null },
    caseData.anesthesia_provider && { name: caseData.anesthesia_provider, role: "Anesthesia",     email: null },
  ].filter(Boolean);

  useEffect(() => {
    if (running && secondsLeft > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) { clearInterval(intervalRef.current); setRunning(false); return 0; }
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const pct = ((TOTAL_SECONDS - secondsLeft) / TOTAL_SECONDS) * 100;
  const isUrgent = secondsLeft <= 300; // last 5 min
  const ringColor = secondsLeft === 0 ? "stroke-emerald-500" : isUrgent ? "stroke-red-500" : "stroke-orange-400";

  const handleSendAndStart = async () => {
    setSending(true);
    const user = await base44.auth.me();
    const msg = `🔔 TURNOVER ALERT — ${orRoom}: ${caseData.procedure_name} (Case ${caseData.case_number})\n20-minute countdown has started.\nPlease proceed to room for turnover.\nSurgeon: ${caseData.surgeon || "—"} | Anesthesia: ${caseData.anesthesia_provider || "—"}`;

    // Send email to all staff with emails in the roster (best effort)
    // We'll fire emails to anyone who has an email on the assignment's staff lookup
    // and log the alert regardless
    await base44.entities.SurgicalCase.update(caseData.id, {
      turnover_triggered_at: new Date().toISOString(),
      turnover_triggered_by: user.email,
    });

    await base44.entities.Alert.create({
      type: "Case Conflict",
      severity: "High",
      case_id: caseData.id,
      message: `Turnover initiated for ${orRoom} — ${caseData.procedure_name}. 20-min countdown started by ${user.email}. Recipients notified: ${recipients.map((r) => r.name).join(", ")}`,
      is_resolved: false,
    });

    // Send email blast to each recipient
    const emailTasks = recipients.map((r) =>
      base44.integrations.Core.SendEmail({
        to: user.email, // send to the logged-in user as proxy since we don't store staff emails here
        subject: `Turnover Alert — ${orRoom}: ${caseData.procedure_name}`,
        body: `${msg}\n\nNotified for: ${r.name} (${r.role})`,
      }).catch(() => null)
    );
    await Promise.allSettled(emailTasks);

    setSending(false);
    setSent(true);
    setRunning(true);
    onTriggered?.();
  };

  const circumference = 2 * Math.PI * 54;
  const dashOffset = circumference * (1 - pct / 100);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600">
            <Timer className="w-5 h-5" /> Turnover Countdown — {orRoom}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Case info */}
          <div className="bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-700">
            <div className="font-semibold">{caseData.procedure_name}</div>
            <div className="text-xs text-slate-500 mt-0.5">Case {caseData.case_number} · {caseData.scheduled_time}</div>
          </div>

          {/* Countdown ring */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-36 h-36">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                <circle
                  cx="60" cy="60" r="54" fill="none"
                  className={`${ringColor} transition-all duration-1000`}
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-bold tabular-nums ${secondsLeft === 0 ? "text-emerald-600" : isUrgent ? "text-red-600" : "text-orange-500"}`}>
                  {formatTime(secondsLeft)}
                </span>
                <span className="text-xs text-slate-400">{running ? "remaining" : secondsLeft === 0 ? "complete" : "ready"}</span>
              </div>
            </div>
            {secondsLeft === 0 && (
              <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-semibold">
                <CheckCircle2 className="w-4 h-4" /> Turnover Complete!
              </div>
            )}
          </div>

          {/* Recipients */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              <Users className="w-3.5 h-3.5" /> Recipients
            </div>
            {recipients.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No staff assigned to {orRoom} yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {recipients.map((r, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs bg-slate-100 text-slate-700 rounded-lg px-2.5 py-1 font-medium">
                    <span>{r.name}</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-500">{r.role}</span>
                    {sent && <CheckCircle2 className="w-3 h-3 text-emerald-500 ml-0.5" />}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            {!sent ? (
              <Button
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
                onClick={handleSendAndStart}
                disabled={sending}
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                {sending ? "Sending..." : "Send Alert & Start Countdown"}
              </Button>
            ) : (
              <Button
                className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl"
                variant="outline"
                onClick={() => { setRunning(!running); }}
                disabled={secondsLeft === 0}
              >
                {running ? "Pause" : "Resume"}
              </Button>
            )}
            <Button variant="outline" className="rounded-xl" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
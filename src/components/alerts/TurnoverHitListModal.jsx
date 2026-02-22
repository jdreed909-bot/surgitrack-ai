import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Zap, Send, CheckSquare, Clock, Users } from "lucide-react";
import { format } from "date-fns";

export default function TurnoverHitListModal({ onClose, onSent }) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const { data: cases = [], isLoading: loadingCases } = useQuery({
    queryKey: ["turnover-cases", today],
    queryFn: () => base44.entities.SurgicalCase.filter({ scheduled_date: today }, "scheduled_time", 50),
  });

  const { data: staff = [] } = useQuery({
    queryKey: ["staff_roster"],
    queryFn: () => base44.entities.StaffRoster.filter({ is_active: true }, "name", 200),
  });

  const { data: sets = [] } = useQuery({
    queryKey: ["sets-map"],
    queryFn: () => base44.entities.SurgicalSet.list("name", 200),
  });

  const setsMap = Object.fromEntries(sets.map((s) => [s.id, s]));

  // Build turnaround items: each case transition (i → i+1) is a turnover
  const turnovers = cases.slice(0, -1).map((c, i) => ({
    from: c,
    to: cases[i + 1],
    requiredSets: (cases[i + 1].required_sets || []).map((id) => setsMap[id]).filter(Boolean),
  }));

  const buildMessage = () => {
    const lines = [`🔄 TURNOVER HIT LIST — ${format(new Date(), "EEEE, MMM d")}\n`];
    lines.push(`${turnovers.length} rapid turnover(s) needed today:\n`);
    turnovers.forEach((t, i) => {
      lines.push(`▶ Turnover ${i + 1}: ${t.from.procedure_name || t.from.case_number} → ${t.to.procedure_name || t.to.case_number}`);
      lines.push(`  Time: ~${t.from.scheduled_time}`);
      if (t.requiredSets.length > 0) {
        lines.push(`  Sets needed: ${t.requiredSets.map((s) => s.name).join(", ")}`);
      }
      lines.push("");
    });
    lines.push("Please ensure rooms are turned over promptly. — SurgTrack");
    return lines.join("\n");
  };

  const handleSend = async () => {
    setSending(true);
    const message = buildMessage();

    // Send email to all active staff with emails
    const staffWithEmail = staff.filter((s) => s.email);
    for (const s of staffWithEmail) {
      await base44.integrations.Core.SendEmail({
        to: s.email,
        subject: `[SurgTrack] Turnover Hit List — ${format(new Date(), "MMM d")}`,
        body: message,
      });
    }

    // Save as alert
    await base44.entities.Alert.create({
      type: "Case Conflict",
      severity: "High",
      message: `Turnover Hit List sent to ${staffWithEmail.length} staff — ${turnovers.length} turnovers flagged for ${format(new Date(), "MMM d")}`,
      is_resolved: false,
    });

    setSending(false);
    setSent(true);
    setTimeout(() => { onSent(); onClose(); }, 1200);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg rounded-2xl p-0 overflow-hidden">
        <div className="bg-gradient-to-br from-orange-500 to-rose-600 px-6 pt-6 pb-5">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2 text-xl">
              <Zap className="w-5 h-5" /> Turnover Hit List
            </DialogTitle>
            <p className="text-orange-100 text-sm mt-1">
              Today's rapid turnovers — notify all staff
            </p>
          </DialogHeader>
        </div>

        <div className="p-5 space-y-4">
          {loadingCases ? (
            <div className="flex items-center justify-center py-10 text-slate-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading today's schedule…
            </div>
          ) : turnovers.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              <CheckSquare className="w-10 h-10 mx-auto mb-2 text-emerald-300" />
              No turnovers required today — only {cases.length} case(s) scheduled.
            </div>
          ) : (
            <div className="space-y-3">
              {turnovers.map((t, i) => (
                <div key={i} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">Turnover {i + 1}</span>
                    <span className="text-xs text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" />{t.from.scheduled_time}</span>
                  </div>
                  <div className="text-sm font-medium text-slate-700">
                    {t.from.procedure_name || t.from.case_number}
                    <span className="text-slate-400 mx-2">→</span>
                    {t.to.procedure_name || t.to.case_number}
                  </div>
                  {t.requiredSets.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {t.requiredSets.map((s) => (
                        <span key={s.id} className={`text-xs px-2 py-0.5 rounded-md border font-medium ${
                          s.status === "Available" ? "bg-green-50 text-green-700 border-green-200" :
                          s.status === "Sterilizing" ? "bg-amber-50 text-amber-700 border-amber-200" :
                          "bg-red-50 text-red-700 border-red-200"
                        }`}>
                          {s.name} <span className="opacity-60">({s.status})</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {staff.filter((s) => s.email).length > 0 && (
            <div className="text-xs text-slate-400 flex items-center gap-1.5 bg-slate-50 rounded-lg px-3 py-2">
              <Users className="w-3.5 h-3.5" />
              Will notify {staff.filter((s) => s.email).length} staff member(s) by email
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl border-slate-200">Cancel</Button>
            <Button
              onClick={handleSend}
              disabled={sending || sent || turnovers.length === 0}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-xl gap-2"
            >
              {sent ? (
                <><CheckSquare className="w-4 h-4" /> Sent!</>
              ) : sending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
              ) : (
                <><Send className="w-4 h-4" /> Send to All Staff</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
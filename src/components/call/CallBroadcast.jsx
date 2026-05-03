import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Radio, Send, ChevronDown, ChevronUp, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const ACCENT = {
  RN: { btn: "bg-blue-600 hover:bg-blue-700", border: "border-blue-200", header: "bg-blue-50", text: "text-blue-700", check: "accent-blue-600" },
  ST: { btn: "bg-purple-600 hover:bg-purple-700", border: "border-purple-200", header: "bg-purple-50", text: "text-purple-700", check: "accent-purple-600" },
};

const ROSTER_ROLE = { RN: ["RN", "Charge RN"], ST: ["Scrub Tech"] };

function buildMessage(caseInfo, need, includeText) {
  if (!includeText) return null;
  const casePart = caseInfo.trim() ? `Case: ${caseInfo.trim()}. ` : "";
  const needPart = need.trim() ? `We need: ${need.trim()}. ` : "";
  return `${casePart}${needPart}Please reply if available. Thank you for your support! 🙏`;
}

export default function CallBroadcast({ role }) {
  const [open, setOpen] = useState(false);
  const [caseInfo, setCaseInfo] = useState("");
  const [need, setNeed] = useState("");
  const [includeText, setIncludeText] = useState(true);
  const [selectedRoles, setSelectedRoles] = useState(ROSTER_ROLE[role]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const c = ACCENT[role] || ACCENT.RN;

  const { data: roster = [] } = useQuery({
    queryKey: ["staff-roster-broadcast"],
    queryFn: () => base44.entities.StaffRoster.filter({ is_active: true }, "seniority_date", 200),
    enabled: open,
  });

  const targets = roster
    .filter(s => selectedRoles.includes(s.role))
    .sort((a, b) => {
      if (!a.seniority_date) return 1;
      if (!b.seniority_date) return -1;
      return new Date(a.seniority_date) - new Date(b.seniority_date);
    });

  const previewMessage = buildMessage(caseInfo, need, includeText);

  const toggleRole = (r) => {
    setSelectedRoles(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
  };

  const handleSend = async () => {
    if (!caseInfo.trim() && !need.trim()) return;
    setSending(true);

    const subject = `[Call Broadcast] ${caseInfo || need}`;
    const body = previewMessage || `Case: ${caseInfo}\nNeed: ${need}\n\nThank you for your support!`;

    for (const staff of targets) {
      if (staff.email) {
        await base44.integrations.Core.SendEmail({
          to: staff.email,
          subject,
          body: `Hi ${staff.name},\n\n${body}\n\n— OR Team`,
        });
      }
    }

    await base44.entities.StaffNotification.create({
      type: "General",
      message: body,
      target_roles: selectedRoles,
      sent_to: targets.map(s => s.name),
      status: "Sent",
      sent_at: new Date().toISOString(),
    });

    setSending(false);
    setSent(true);
    setCaseInfo("");
    setNeed("");
    setTimeout(() => { setSent(false); setOpen(false); }, 2500);
  };

  const allRoles = role === "RN" ? ["RN", "Charge RN", "Scrub Tech"] : ["Scrub Tech", "RN", "Charge RN"];

  return (
    <div className={`bg-white rounded-lg border ${c.border} overflow-hidden`}>
      {/* Header toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-4 py-3 ${c.header} hover:opacity-90 transition-opacity`}
      >
        <div className="flex items-center gap-2">
          <Radio className={`w-4 h-4 ${c.text}`} />
          <span className={`text-sm font-semibold ${c.text}`}>Broadcast to Staff</span>
          <span className="text-xs text-slate-400">{targets.length} recipient{targets.length !== 1 ? "s" : ""}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      {open && (
        <div className="p-4 space-y-3">
          {/* Case & Need */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Case / Procedure</label>
              <Input
                value={caseInfo}
                onChange={e => setCaseInfo(e.target.value)}
                placeholder="e.g. Total Hip Arthroplasty OR 3"
                className="text-sm h-9"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">What's Needed</label>
              <Input
                value={need}
                onChange={e => setNeed(e.target.value)}
                placeholder="e.g. RN call pickup 11p–7a tonight"
                className="text-sm h-9"
              />
            </div>
          </div>

          {/* Role toggles */}
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Send To</label>
            <div className="flex gap-2 flex-wrap">
              {allRoles.map(r => (
                <button
                  key={r}
                  onClick={() => toggleRole(r)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all
                    ${selectedRoles.includes(r)
                      ? role === "RN" ? "bg-blue-600 text-white border-blue-600" : "bg-purple-600 text-white border-purple-600"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Text message toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`include-text-${role}`}
              checked={includeText}
              onChange={e => setIncludeText(e.target.checked)}
              className={`w-4 h-4 rounded ${c.check}`}
            />
            <label htmlFor={`include-text-${role}`} className="text-xs font-semibold text-slate-600 flex items-center gap-1 cursor-pointer">
              <MessageSquare className="w-3.5 h-3.5" /> Include formatted text message with thank-you
            </label>
          </div>

          {/* Preview */}
          {includeText && (caseInfo || need) && (
            <div className="bg-slate-50 rounded-lg px-3 py-2.5 border border-slate-200">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Message Preview</div>
              <p className="text-xs text-slate-700 leading-relaxed">{previewMessage}</p>
            </div>
          )}

          {/* Recipients preview */}
          {targets.length > 0 && (
            <div className="text-[11px] text-slate-400">
              Notifying: {targets.slice(0, 5).map(s => s.name).join(", ")}{targets.length > 5 ? ` +${targets.length - 5} more` : ""}
            </div>
          )}

          {/* Send button */}
          {sent ? (
            <div className="text-sm font-semibold text-emerald-600 py-1">✓ Broadcast sent successfully!</div>
          ) : (
            <button
              onClick={handleSend}
              disabled={sending || (!caseInfo.trim() && !need.trim()) || targets.length === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-40 ${c.btn}`}
            >
              <Send className="w-4 h-4" />
              {sending ? "Sending…" : `Send to ${targets.length} Staff`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
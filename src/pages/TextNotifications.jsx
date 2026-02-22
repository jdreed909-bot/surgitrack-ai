import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Send, Plus, Users, Clock, CheckCircle, ChevronDown, ChevronUp, Trash2, Edit2, Calendar, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

const NOTIF_TYPES = ["Shift Available", "Call Shift Pickup", "General"];
const ROLES = ["RN", "Scrub Tech", "Charge RN"];

const TYPE_COLORS = {
  "Shift Available":   "bg-teal-100 text-teal-700",
  "Call Shift Pickup": "bg-amber-100 text-amber-800",
  "General":           "bg-slate-100 text-slate-600",
};

const STATUS_COLORS = {
  Draft:   "bg-slate-100 text-slate-500",
  Sent:    "bg-blue-100 text-blue-700",
  Claimed: "bg-green-100 text-green-700",
};

const EMPTY_FORM = {
  type: "Shift Available",
  message: "",
  shift_date: new Date().toISOString().split("T")[0],
  shift_start: "07:00",
  shift_end: "15:30",
  or_room: "",
  target_roles: ["RN", "Scrub Tech"],
};

export default function TextNotifications() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState("send"); // "send" | "roster"

  // Roster state
  const [rosterForm, setRosterForm] = useState({ name: "", role: "RN", phone: "", seniority_date: "", is_active: true });
  const [editingRoster, setEditingRoster] = useState(null);
  const [savingRoster, setSavingRoster] = useState(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ["staff_notifications"],
    queryFn: () => base44.entities.StaffNotification.list("-created_date", 50),
  });

  const { data: roster = [] } = useQuery({
    queryKey: ["staff_roster"],
    queryFn: () => base44.entities.StaffRoster.list("name", 200),
  });

  // Sort active staff by seniority (oldest date first = most senior)
  const seniorityOrder = (staff) =>
    [...staff]
      .filter((s) => s.is_active !== false)
      .sort((a, b) => {
        if (!a.seniority_date) return 1;
        if (!b.seniority_date) return -1;
        return new Date(a.seniority_date) - new Date(b.seniority_date);
      });

  const toggleRole = (role) => {
    setForm((f) => ({
      ...f,
      target_roles: f.target_roles.includes(role)
        ? f.target_roles.filter((r) => r !== role)
        : [...f.target_roles, role],
    }));
  };

  const sendNotification = async () => {
    setSending(true);

    // Get staff in seniority order for targeted roles
    const targets = seniorityOrder(roster).filter((s) =>
      form.target_roles.includes(s.role)
    );

    const sentTo = targets.map((s) => s.name);

    // Build message
    const typeLabel = form.type;
    const shiftInfo = form.shift_date
      ? `${form.shift_date} ${form.shift_start}–${form.shift_end}${form.or_room ? ` (${form.or_room})` : ""}`
      : "";
    const fullMessage = form.message || `${typeLabel}${shiftInfo ? ` — ${shiftInfo}` : ""}`;

    // Send email notifications in seniority order (simulating SMS/Vocera)
    for (const staff of targets) {
      if (staff.email) {
        await base44.integrations.Core.SendEmail({
          to: staff.email,
          subject: `[SurgTrack] ${typeLabel}${shiftInfo ? ` — ${shiftInfo}` : ""}`,
          body: `Hi ${staff.name},\n\n${fullMessage}\n\nPlease respond to claim or confirm.\n\n— SurgTrack`,
        });
      }
    }

    // Save notification record
    await base44.entities.StaffNotification.create({
      type: form.type,
      message: fullMessage,
      shift_date: form.shift_date,
      shift_start: form.shift_start,
      shift_end: form.shift_end,
      or_room: form.or_room,
      target_roles: form.target_roles,
      sent_to: sentTo,
      status: "Sent",
      sent_at: new Date().toISOString(),
    });

    await queryClient.invalidateQueries(["staff_notifications"]);
    setSending(false);
    setShowForm(false);
    setForm(EMPTY_FORM);
  };

  const markClaimed = async (notif, staffName) => {
    await base44.entities.StaffNotification.update(notif.id, { status: "Claimed", claimed_by: staffName });
    queryClient.invalidateQueries(["staff_notifications"]);
  };

  const deleteNotif = async (id) => {
    await base44.entities.StaffNotification.delete(id);
    queryClient.invalidateQueries(["staff_notifications"]);
  };

  // Roster CRUD
  const saveRoster = async () => {
    setSavingRoster(true);
    if (editingRoster === "new") {
      await base44.entities.StaffRoster.create(rosterForm);
    } else {
      await base44.entities.StaffRoster.update(editingRoster.id, rosterForm);
    }
    await queryClient.invalidateQueries(["staff_roster"]);
    setSavingRoster(false);
    setEditingRoster(null);
    setRosterForm({ name: "", role: "RN", phone: "", seniority_date: "", is_active: true });
  };

  const openRosterEdit = (s) => {
    setRosterForm({ ...s });
    setEditingRoster(s);
  };

  const deleteRoster = async (id) => {
    await base44.entities.StaffRoster.delete(id);
    queryClient.invalidateQueries(["staff_roster"]);
  };

  const orderedRoster = seniorityOrder(roster);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-teal-600" /> Text Notifications
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Send shift availability & call shift pickups to staff in seniority order</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
        {[
          { id: "send",   label: "Notifications", icon: Send },
          { id: "roster", label: "Staff & Seniority", icon: Users },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* ── NOTIFICATIONS TAB ── */}
      {activeTab === "send" && (
        <div className="space-y-4">
          <Button
            onClick={() => setShowForm((v) => !v)}
            className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl gap-2"
          >
            <Plus className="w-4 h-4" /> New Notification
          </Button>

          {/* Compose Form */}
          {showForm && (
            <div className="bg-white rounded-2xl border border-teal-200 shadow-sm p-5 space-y-4">
              <h3 className="font-semibold text-teal-700 text-sm">Compose Notification</h3>

              {/* Type */}
              <div>
                <label className="text-xs text-slate-500 mb-2 block font-medium">Notification Type</label>
                <div className="flex gap-2 flex-wrap">
                  {NOTIF_TYPES.map((t) => (
                    <button
                      key={t}
                      onClick={() => setForm((f) => ({ ...f, type: t }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        form.type === t ? "bg-teal-600 text-white border-teal-600" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Shift details (hidden for General) */}
              {form.type !== "General" && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block font-medium">Shift Date</label>
                    <Input type="date" value={form.shift_date} onChange={(e) => setForm((f) => ({ ...f, shift_date: e.target.value }))} className="h-8 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block font-medium">Start Time</label>
                    <Input type="time" value={form.shift_start} onChange={(e) => setForm((f) => ({ ...f, shift_start: e.target.value }))} className="h-8 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block font-medium">End Time</label>
                    <Input type="time" value={form.shift_end} onChange={(e) => setForm((f) => ({ ...f, shift_end: e.target.value }))} className="h-8 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block font-medium">OR Room</label>
                    <Input value={form.or_room} onChange={(e) => setForm((f) => ({ ...f, or_room: e.target.value }))} placeholder="e.g. OR 3" className="h-8 text-sm" />
                  </div>
                </div>
              )}

              {/* Message */}
              <div>
                <label className="text-xs text-slate-500 mb-1 block font-medium">Message (optional — auto-generated if blank)</label>
                <Input value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} placeholder="Leave blank for default message" className="h-9 text-sm" />
              </div>

              {/* Target roles */}
              <div>
                <label className="text-xs text-slate-500 mb-2 block font-medium">Send To (roles)</label>
                <div className="flex gap-2 flex-wrap">
                  {ROLES.map((r) => (
                    <button
                      key={r}
                      onClick={() => toggleRole(r)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        form.target_roles.includes(r) ? "bg-indigo-600 text-white border-indigo-600" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Seniority preview */}
              <div className="bg-slate-50 rounded-xl p-3">
                <div className="text-xs text-slate-500 mb-2 font-medium flex items-center gap-1">
                  <Users className="w-3 h-3" /> Will notify {seniorityOrder(roster).filter((s) => form.target_roles.includes(s.role)).length} staff in seniority order:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {seniorityOrder(roster)
                    .filter((s) => form.target_roles.includes(s.role))
                    .map((s, i) => (
                      <span key={s.id} className="text-xs bg-white border border-slate-200 rounded-md px-2 py-0.5 text-slate-700">
                        <span className="text-slate-400 mr-1">#{i + 1}</span>{s.name}
                        {s.seniority_date && <span className="text-slate-400 ml-1">({s.seniority_date})</span>}
                      </span>
                    ))}
                  {seniorityOrder(roster).filter((s) => form.target_roles.includes(s.role)).length === 0 && (
                    <span className="text-xs text-slate-400 italic">No staff found for selected roles</span>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={sendNotification} disabled={sending} className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl gap-2 text-sm">
                  <Send className="w-3.5 h-3.5" /> {sending ? "Sending…" : "Send Notifications"}
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)} className="rounded-xl text-sm">Cancel</Button>
              </div>
            </div>
          )}

          {/* Notification History */}
          <div className="space-y-3">
            {notifications.length === 0 && (
              <div className="text-center text-slate-400 py-10 text-sm">No notifications sent yet.</div>
            )}
            {notifications.map((n) => (
              <div key={n.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[n.type] || "bg-slate-100 text-slate-600"}`}>{n.type}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[n.status] || ""}`}>{n.status}</span>
                      {n.sent_at && <span className="text-xs text-slate-400">{format(new Date(n.sent_at), "MMM d, h:mm a")}</span>}
                    </div>
                    <p className="text-sm text-slate-700 font-medium">{n.message}</p>
                    {(n.shift_date || n.or_room) && (
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {n.shift_date} {n.shift_start && `${n.shift_start}–${n.shift_end}`} {n.or_room && `· ${n.or_room}`}
                      </p>
                    )}
                    {n.sent_to?.length > 0 && (
                      <p className="text-xs text-slate-400 mt-1">
                        Sent to {n.sent_to.length} staff: {n.sent_to.slice(0, 5).join(", ")}{n.sent_to.length > 5 ? ` +${n.sent_to.length - 5} more` : ""}
                      </p>
                    )}
                    {n.claimed_by && (
                      <p className="text-xs text-green-600 font-medium mt-1 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Claimed by {n.claimed_by}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {n.status === "Sent" && n.sent_to?.length > 0 && (
                      <select
                        onChange={(e) => e.target.value && markClaimed(n, e.target.value)}
                        className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-600 focus:outline-none"
                        defaultValue=""
                      >
                        <option value="">Mark claimed…</option>
                        {(n.sent_to || []).map((name) => <option key={name} value={name}>{name}</option>)}
                      </select>
                    )}
                    <button onClick={() => deleteNotif(n.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ROSTER / SENIORITY TAB ── */}
      {activeTab === "roster" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Staff are sorted by seniority date (earliest = most senior) when sending notifications.</p>
            <Button onClick={() => { setRosterForm({ name: "", role: "RN", phone: "", seniority_date: "", is_active: true }); setEditingRoster("new"); }}
              className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl gap-2 text-sm">
              <Plus className="w-4 h-4" /> Add Staff
            </Button>
          </div>

          {/* Roster form */}
          {editingRoster && (
            <div className="bg-white rounded-2xl border border-teal-200 shadow-sm p-5">
              <h3 className="font-semibold text-teal-700 text-sm mb-4">{editingRoster === "new" ? "Add Staff Member" : `Edit: ${rosterForm.name}`}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block font-medium">Full Name *</label>
                  <Input value={rosterForm.name} onChange={(e) => setRosterForm((f) => ({ ...f, name: e.target.value }))} placeholder="First Last" className="h-8 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block font-medium">Role *</label>
                  <select value={rosterForm.role} onChange={(e) => setRosterForm((f) => ({ ...f, role: e.target.value }))}
                    className="w-full h-8 rounded-lg border border-slate-200 text-sm px-2 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-400">
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block font-medium flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-teal-500" /> Seniority Date *
                  </label>
                  <Input type="date" value={rosterForm.seniority_date} onChange={(e) => setRosterForm((f) => ({ ...f, seniority_date: e.target.value }))} className="h-8 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block font-medium">Phone (for SMS)</label>
                  <Input value={rosterForm.phone} onChange={(e) => setRosterForm((f) => ({ ...f, phone: e.target.value }))} placeholder="555-0100" className="h-8 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block font-medium">Email</label>
                  <Input value={rosterForm.email || ""} onChange={(e) => setRosterForm((f) => ({ ...f, email: e.target.value }))} placeholder="staff@hospital.org" className="h-8 text-sm" />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                    <input type="checkbox" checked={rosterForm.is_active !== false} onChange={(e) => setRosterForm((f) => ({ ...f, is_active: e.target.checked }))} className="rounded" />
                    Active
                  </label>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button size="sm" onClick={saveRoster} disabled={!rosterForm.name || savingRoster} className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg h-8 text-xs">
                  {savingRoster ? "Saving…" : "Save"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditingRoster(null)} className="rounded-lg h-8 text-xs">Cancel</Button>
              </div>
            </div>
          )}

          {/* Seniority list */}
          {orderedRoster.length === 0 ? (
            <div className="text-center text-slate-400 py-10 text-sm">No staff added yet.</div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 grid grid-cols-12 text-xs font-semibold text-slate-500">
                <div className="col-span-1">#</div>
                <div className="col-span-3">Name</div>
                <div className="col-span-2">Role</div>
                <div className="col-span-2">Seniority Date</div>
                <div className="col-span-2">Phone</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-1" />
              </div>
              {orderedRoster.map((s, i) => (
                <div key={s.id} className="px-5 py-3 grid grid-cols-12 items-center text-sm border-b border-slate-50 hover:bg-slate-50/60 transition-colors last:border-0">
                  <div className="col-span-1 text-slate-400 font-bold text-xs">#{i + 1}</div>
                  <div className="col-span-3 font-medium text-slate-800">{s.name}</div>
                  <div className="col-span-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      s.role === "RN" ? "bg-teal-100 text-teal-700" :
                      s.role === "Scrub Tech" ? "bg-indigo-100 text-indigo-700" :
                      "bg-amber-100 text-amber-800"
                    }`}>{s.role}</span>
                  </div>
                  <div className="col-span-2 text-slate-500 text-xs">{s.seniority_date || <span className="italic text-slate-300">Not set</span>}</div>
                  <div className="col-span-2 text-slate-500 text-xs">{s.phone || "—"}</div>
                  <div className="col-span-1">
                    <span className={`text-xs font-medium ${s.is_active !== false ? "text-green-600" : "text-slate-400"}`}>
                      {s.is_active !== false ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="col-span-1 flex justify-end gap-1">
                    <button onClick={() => openRosterEdit(s)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-teal-600 transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deleteRoster(s.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
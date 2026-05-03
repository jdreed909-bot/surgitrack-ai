import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Users, Plus, Edit2, Trash2, Search, Upload, Radio, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ImportStaffModal from "../components/staff/ImportStaffModal";
import { format, parseISO } from "date-fns";

// Primary directory categories shown as tabs
const DIRECTORY_TABS = [
  { id: "RN",         label: "RN",         roles: ["RN", "Charge RN"], color: "bg-teal-600",   light: "bg-teal-50 text-teal-700 border-teal-200" },
  { id: "ST",         label: "Scrub Tech",  roles: ["Scrub Tech"],      color: "bg-indigo-600", light: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { id: "PCT",        label: "PCT",         roles: ["PCT"],             color: "bg-amber-600",  light: "bg-amber-50 text-amber-800 border-amber-200" },
  { id: "UA",         label: "UA",          roles: ["UA"],              color: "bg-rose-600",   light: "bg-rose-50 text-rose-700 border-rose-200" },
  { id: "Other",      label: "Other",       roles: ["Surgeon", "Anesthesia Provider", "RNFA", "PA", "NP", "CRNA"], color: "bg-slate-600", light: "bg-slate-50 text-slate-700 border-slate-200" },
  { id: "ALL",        label: "All Staff",   roles: null,                color: "bg-slate-800",  light: "bg-slate-100 text-slate-700 border-slate-200" },
];

const ALL_ROLES = ["RN", "Charge RN", "Scrub Tech", "PCT", "UA", "Surgeon", "Anesthesia Provider", "RNFA", "PA", "NP", "CRNA"];

const FTE_COLORS = {
  "Full-Time":  "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Part-Time":  "bg-amber-100 text-amber-700 border-amber-200",
  "Per Diem":   "bg-slate-100 text-slate-600 border-slate-200",
};

const ROLE_COLORS = {
  "RN":                   "bg-teal-100 text-teal-700",
  "Charge RN":            "bg-amber-100 text-amber-800",
  "Scrub Tech":           "bg-indigo-100 text-indigo-700",
  "PCT":                  "bg-orange-100 text-orange-700",
  "UA":                   "bg-rose-100 text-rose-700",
  "Surgeon":              "bg-emerald-100 text-emerald-700",
  "Anesthesia Provider":  "bg-pink-100 text-pink-700",
  "RNFA":                 "bg-purple-100 text-purple-700",
  "PA":                   "bg-blue-100 text-blue-700",
  "NP":                   "bg-cyan-100 text-cyan-700",
  "CRNA":                 "bg-violet-100 text-violet-700",
};

const EMPTY = { name: "", role: "RN", seniority_date: "", fte_status: "Full-Time", phone: "", email: "", vocera_id: "", vocera_group: "", is_active: true };

function seniorityYears(dateStr) {
  if (!dateStr) return null;
  const d = parseISO(dateStr);
  const now = new Date();
  const yrs = now.getFullYear() - d.getFullYear() - (now < new Date(d.setFullYear(now.getFullYear())) ? 1 : 0);
  return yrs > 0 ? `${yrs}yr` : "< 1yr";
}

export default function StaffRoster() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("RN");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importRole, setImportRole] = useState("RN");

  const { data: roster = [], isLoading } = useQuery({
    queryKey: ["staff_roster"],
    queryFn: () => base44.entities.StaffRoster.list("seniority_date", 500),
  });

  const tab = DIRECTORY_TABS.find(t => t.id === activeTab);
  const inTab = tab?.roles ? roster.filter(s => tab.roles.includes(s.role)) : roster;

  const filtered = inTab.filter(s => {
    const matchSearch = !search || s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.phone?.includes(search) || s.email?.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  }).sort((a, b) => {
    if (!a.seniority_date && !b.seniority_date) return 0;
    if (!a.seniority_date) return 1;
    if (!b.seniority_date) return -1;
    return new Date(a.seniority_date) - new Date(b.seniority_date);
  });

  const openNew = () => {
    const defaultRole = tab?.roles?.[0] || "RN";
    setForm({ ...EMPTY, role: defaultRole });
    setEditing("new");
  };
  const openEdit = (s) => { setForm({ ...s }); setEditing(s); };
  const closeEdit = () => { setEditing(null); setForm(EMPTY); };

  const save = async () => {
    setSaving(true);
    if (editing === "new") {
      await base44.entities.StaffRoster.create(form);
    } else {
      await base44.entities.StaffRoster.update(editing.id, form);
    }
    await queryClient.invalidateQueries(["staff_roster"]);
    setSaving(false);
    closeEdit();
  };

  const remove = async (id) => {
    if (!confirm("Remove this staff member?")) return;
    await base44.entities.StaffRoster.delete(id);
    queryClient.invalidateQueries(["staff_roster"]);
  };

  // Counts per tab
  const tabCounts = DIRECTORY_TABS.reduce((acc, t) => {
    acc[t.id] = t.roles ? roster.filter(s => t.roles.includes(s.role) && s.is_active !== false).length : roster.filter(s => s.is_active !== false).length;
    return acc;
  }, {});

  const fteBreakdown = (members) => ({
    ft: members.filter(s => !s.fte_status || s.fte_status === "Full-Time").length,
    pt: members.filter(s => s.fte_status === "Part-Time").length,
    prn: members.filter(s => s.fte_status === "Per Diem").length,
  });
  const breakdown = fteBreakdown(inTab.filter(s => s.is_active !== false));

  return (
    <div className="min-h-screen bg-[#F0F4F8] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-6 h-6 text-teal-600" /> Staff Directory
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">Central staff registry — feeds assignments, call schedules & notifications</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => { setImportRole(tab?.roles?.[0] || "RN"); setImportOpen(true); }} variant="outline" className="border-slate-200 text-slate-700 rounded-xl gap-2">
              <Upload className="w-4 h-4" /> Import Excel
            </Button>
            <Button onClick={openNew} className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl gap-2">
              <Plus className="w-4 h-4" /> Add Staff
            </Button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-1 mb-5 bg-white border border-slate-100 rounded-2xl p-1 w-fit shadow-sm flex-wrap">
          {DIRECTORY_TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === t.id ? `${t.color} text-white shadow-sm` : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {t.label}
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${activeTab === t.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
                {tabCounts[t.id]}
              </span>
            </button>
          ))}
        </div>

        {/* FTE Summary bar */}
        <div className="flex items-center gap-4 mb-5 flex-wrap">
          <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border ${FTE_COLORS["Full-Time"]}`}>
            Full-Time: {breakdown.ft}
          </div>
          <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border ${FTE_COLORS["Part-Time"]}`}>
            Part-Time: {breakdown.pt}
          </div>
          <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border ${FTE_COLORS["Per Diem"]}`}>
            Per Diem / PRN: {breakdown.prn}
          </div>
          <div className="text-xs text-slate-400 ml-auto">{inTab.filter(s => s.is_active !== false).length} active · {inTab.filter(s => s.is_active === false).length} inactive</div>
        </div>

        {/* Search */}
        <div className="relative mb-4 max-w-sm">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, phone, email…" className="pl-9 h-9 bg-white" />
        </div>

        {/* Add/Edit Form */}
        {editing && (
          <div className="bg-white rounded-2xl border border-teal-200 shadow-sm p-5 mb-5">
            <h3 className="font-semibold text-teal-700 text-sm mb-4">{editing === "new" ? "Add New Staff Member" : `Edit: ${form.name}`}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block font-medium">Full Name *</label>
                <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="First Last" className="h-8 text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block font-medium">Role *</label>
                <select value={form.role} onChange={(e) => setForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full h-8 rounded-lg border border-slate-200 text-sm px-2 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-400">
                  {ALL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block font-medium">FTE Status</label>
                <select value={form.fte_status || "Full-Time"} onChange={(e) => setForm(f => ({ ...f, fte_status: e.target.value }))}
                  className="w-full h-8 rounded-lg border border-slate-200 text-sm px-2 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-400">
                  <option>Full-Time</option>
                  <option>Part-Time</option>
                  <option>Per Diem</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block font-medium">Seniority / Hire Date</label>
                <Input type="date" value={form.seniority_date || ""} onChange={(e) => setForm(f => ({ ...f, seniority_date: e.target.value }))} className="h-8 text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block font-medium">Phone</label>
                <Input value={form.phone || ""} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="555-0100" className="h-8 text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block font-medium">Email</label>
                <Input value={form.email || ""} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} placeholder="staff@hospital.org" className="h-8 text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block font-medium">Vocera Badge ID</label>
                <Input value={form.vocera_id || ""} onChange={(e) => setForm(f => ({ ...f, vocera_id: e.target.value }))} placeholder="e.g. 1042" className="h-8 text-sm" />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                  <input type="checkbox" checked={form.is_active !== false} onChange={(e) => setForm(f => ({ ...f, is_active: e.target.checked }))} className="rounded" />
                  Active
                </label>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button size="sm" variant="outline" className="rounded-lg h-8 text-xs" onClick={closeEdit}>Cancel</Button>
              <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg h-8 text-xs" onClick={save} disabled={!form.name || saving}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        )}

        {/* Table */}
        {isLoading ? (
          <div className="text-center text-slate-400 py-12 text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-slate-400 py-16 text-sm">
            No staff found. Add staff or import an Excel file to get started.
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500">#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">FTE</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Seniority</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 hidden md:table-cell">Phone</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 hidden lg:table-cell">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((s, idx) => (
                  <tr key={s.id} className={`hover:bg-slate-50/60 transition-colors ${s.is_active === false ? "opacity-50" : ""}`}>
                    <td className="px-5 py-3 text-xs text-slate-400 font-bold">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{s.name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ROLE_COLORS[s.role] || "bg-slate-100 text-slate-600"}`}>{s.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded border text-xs font-semibold ${FTE_COLORS[s.fte_status] || FTE_COLORS["Full-Time"]}`}>
                        {s.fte_status === "Full-Time" ? "FT" : s.fte_status === "Part-Time" ? "PT" : s.fte_status === "Per Diem" ? "PRN" : "FT"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {s.seniority_date ? (
                        <div>
                          <div className="text-xs text-slate-700">{format(parseISO(s.seniority_date), "MM/dd/yyyy")}</div>
                          <div className="text-[10px] text-slate-400">{seniorityYears(s.seniority_date)}</div>
                        </div>
                      ) : <span className="text-slate-300 text-xs italic">—</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs hidden md:table-cell">{s.phone || "—"}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs hidden lg:table-cell">{s.email || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${s.is_active !== false ? "text-emerald-600" : "text-slate-400"}`}>
                        {s.is_active !== false ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 justify-end">
                        <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-teal-600 transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => remove(s.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {importOpen && (
        <ImportStaffModal
          defaultRole={importRole}
          onClose={() => setImportOpen(false)}
          onSuccess={() => queryClient.invalidateQueries(["staff_roster"])}
        />
      )}
    </div>
  );
}
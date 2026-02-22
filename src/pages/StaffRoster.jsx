import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Users, Plus, Edit2, Trash2, Radio, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ROLES = ["RN", "Scrub Tech", "Charge RN"];
const ROLE_COLORS = {
  "RN":         "bg-teal-100 text-teal-700",
  "Scrub Tech": "bg-indigo-100 text-indigo-700",
  "Charge RN":  "bg-amber-100 text-amber-800",
};

const EMPTY = { name: "", role: "RN", vocera_id: "", vocera_group: "", phone: "", email: "", is_active: true };

export default function StaffRoster() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [editing, setEditing] = useState(null); // null | "new" | record
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const { data: roster = [], isLoading } = useQuery({
    queryKey: ["staff_roster"],
    queryFn: () => base44.entities.StaffRoster.list("name", 200),
  });

  const filtered = roster.filter((s) => {
    const matchSearch = !search || s.name?.toLowerCase().includes(search.toLowerCase());
    const matchRole   = roleFilter === "ALL" || s.role === roleFilter;
    return matchSearch && matchRole;
  });

  const openNew = () => { setForm({ ...EMPTY }); setEditing("new"); };
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
    await base44.entities.StaffRoster.delete(id);
    queryClient.invalidateQueries(["staff_roster"]);
  };

  const counts = ROLES.reduce((acc, r) => ({ ...acc, [r]: roster.filter((s) => s.role === r && s.is_active !== false).length }), {});

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-teal-600" /> Staff Roster
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage OR staff with Vocera badge IDs for automated notifications</p>
        </div>
        <Button onClick={openNew} className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl gap-2">
          <Plus className="w-4 h-4" /> Add Staff
        </Button>
      </div>

      {/* Summary pills */}
      <div className="flex gap-3 mb-5 flex-wrap">
        {ROLES.map((r) => (
          <div key={r} className={`px-3 py-1.5 rounded-full text-xs font-semibold ${ROLE_COLORS[r]}`}>
            {counts[r]} {r}{counts[r] !== 1 ? "s" : ""}
          </div>
        ))}
        <div className="px-3 py-1.5 rounded-full text-xs font-semibold bg-violet-100 text-violet-700 flex items-center gap-1">
          <Radio className="w-3 h-3" /> Vocera-enabled: {roster.filter((s) => s.vocera_id).length}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search staff..." className="pl-9 h-9" />
        </div>
        <div className="flex gap-1">
          {["ALL", ...ROLES].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${roleFilter === r ? "bg-teal-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Add/Edit form */}
      {editing && (
        <div className="bg-white rounded-2xl border border-teal-200 shadow-sm p-5 mb-5">
          <h3 className="font-semibold text-teal-700 text-sm mb-4">{editing === "new" ? "Add New Staff Member" : `Edit: ${form.name}`}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block font-medium">Full Name *</label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="First Last" className="h-8 text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block font-medium">Role *</label>
              <select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                className="w-full h-8 rounded-lg border border-slate-200 text-sm px-2 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-400"
              >
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block font-medium flex items-center gap-1">
                <Radio className="w-3 h-3 text-violet-500" /> Vocera Badge ID
              </label>
              <Input value={form.vocera_id} onChange={(e) => setForm((f) => ({ ...f, vocera_id: e.target.value }))} placeholder="e.g. 1042 or @JSmith" className="h-8 text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block font-medium">Vocera Group</label>
              <Input value={form.vocera_group} onChange={(e) => setForm((f) => ({ ...f, vocera_group: e.target.value }))} placeholder="e.g. @OR Nurses" className="h-8 text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block font-medium">Phone</label>
              <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="555-0100" className="h-8 text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block font-medium">Email</label>
              <Input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="staff@hospital.org" className="h-8 text-sm" />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} className="rounded" />
              Active
            </label>
            <div className="ml-auto flex gap-2">
              <Button size="sm" variant="outline" className="rounded-lg h-8 text-xs" onClick={closeEdit}>Cancel</Button>
              <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg h-8 text-xs" onClick={save} disabled={!form.name || saving}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="text-center text-slate-400 py-12 text-sm">Loading roster…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-slate-400 py-12 text-sm">No staff found. Add staff members to get started.</div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Vocera ID</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 hidden sm:table-cell">Group</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 hidden md:table-cell">Phone / Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3 font-medium text-slate-800">{s.name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ROLE_COLORS[s.role] || "bg-slate-100 text-slate-600"}`}>{s.role}</span>
                  </td>
                  <td className="px-4 py-3">
                    {s.vocera_id ? (
                      <span className="flex items-center gap-1 text-violet-700 font-mono text-xs bg-violet-50 px-2 py-0.5 rounded-md w-fit">
                        <Radio className="w-3 h-3" /> {s.vocera_id}
                      </span>
                    ) : (
                      <span className="text-slate-300 text-xs italic">Not set</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs hidden sm:table-cell">{s.vocera_group || "—"}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs hidden md:table-cell">{s.phone || s.email || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${s.is_active !== false ? "text-green-600" : "text-slate-400"}`}>
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
  );
}
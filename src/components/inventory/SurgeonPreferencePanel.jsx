import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, ChevronDown, Trash2, Edit2, Check, X } from "lucide-react";

const FIELDS = [
  { key: "procedure_name", label: "Procedure", placeholder: "Procedure name" },
  { key: "patient_position", label: "Position", placeholder: "e.g. Supine, Lateral" },
  { key: "glove_size", label: "Glove Size", placeholder: "e.g. 7.5" },
  { key: "sets_required", label: "Sets Required", placeholder: "Instrument sets needed" },
  { key: "equipment", label: "Equipment", placeholder: "Special equipment" },
  { key: "suture_preferences", label: "Sutures", placeholder: "Suture preferences" },
  { key: "notes", label: "Notes", placeholder: "Additional notes", multiline: true },
];

const emptyCard = { surgeon: "", procedure_name: "", patient_position: "", glove_size: "", sets_required: "", equipment: "", suture_preferences: "", notes: "" };

function PreferenceCard({ card, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(card);

  const save = async () => {
    await onUpdate(card.id, form);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="bg-white border border-teal-200 rounded-xl p-3 space-y-2">
        {FIELDS.filter(f => f.key !== "procedure_name").map(({ key, label, placeholder, multiline }) => (
          <div key={key}>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{label}</label>
            {multiline ? (
              <textarea
                value={form[key] || ""}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                rows={2}
                className="w-full mt-0.5 text-xs border border-slate-200 rounded-lg px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-teal-400"
              />
            ) : (
              <input
                value={form[key] || ""}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full mt-0.5 text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-400"
              />
            )}
          </div>
        ))}
        <div className="flex gap-1.5 pt-1">
          <button onClick={save} className="flex-1 flex items-center justify-center gap-1 text-[11px] font-semibold bg-teal-600 text-white rounded-lg py-1.5 hover:bg-teal-700">
            <Check className="w-3 h-3" /> Save
          </button>
          <button onClick={() => setEditing(false)} className="flex-1 flex items-center justify-center gap-1 text-[11px] font-semibold border border-slate-200 text-slate-500 rounded-lg py-1.5 hover:bg-slate-50">
            <X className="w-3 h-3" /> Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
      <div className="flex items-start justify-between gap-1 mb-1.5">
        <span className="text-sm font-bold text-slate-800">{card.procedure_name}</span>
        <div className="flex gap-1 shrink-0">
          <button onClick={() => { setForm(card); setEditing(true); }} className="text-slate-400 hover:text-teal-600 transition-colors">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(card.id)} className="text-slate-400 hover:text-red-500 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="space-y-0.5">
        {FIELDS.filter(f => f.key !== "procedure_name" && card[f.key]).map(({ key, label }) => (
          <div key={key} className="text-[11px] text-slate-600">
            <span className="font-semibold text-slate-400">{label}: </span>{card[key]}
          </div>
        ))}
      </div>
    </div>
  );
}

function AddCardForm({ surgeon, onAdded, onCancel }) {
  const [form, setForm] = useState({ ...emptyCard, surgeon });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.procedure_name) return;
    setSaving(true);
    await base44.entities.SurgeonPreferenceCard.create({ ...form, surgeon });
    setSaving(false);
    onAdded();
  };

  return (
    <div className="bg-white border border-teal-200 rounded-xl p-3 space-y-2 mt-2">
      {FIELDS.map(({ key, label, placeholder, multiline }) => (
        <div key={key}>
          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{label}{key === "procedure_name" ? " *" : ""}</label>
          {multiline ? (
            <textarea
              value={form[key] || ""}
              onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              placeholder={placeholder}
              rows={2}
              className="w-full mt-0.5 text-xs border border-slate-200 rounded-lg px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-teal-400"
            />
          ) : (
            <input
              value={form[key] || ""}
              onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              placeholder={placeholder}
              className="w-full mt-0.5 text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-400"
            />
          )}
        </div>
      ))}
      <div className="flex gap-1.5 pt-1">
        <button onClick={save} disabled={saving || !form.procedure_name}
          className="flex-1 text-[11px] font-semibold bg-teal-600 text-white rounded-lg py-1.5 hover:bg-teal-700 disabled:opacity-40">
          {saving ? "Saving..." : "Add Card"}
        </button>
        <button onClick={onCancel}
          className="flex-1 text-[11px] font-semibold border border-slate-200 text-slate-500 rounded-lg py-1.5 hover:bg-slate-50">
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function SurgeonPreferencePanel() {
  const queryClient = useQueryClient();
  const [selectedSurgeon, setSelectedSurgeon] = useState("");
  const [addingCard, setAddingCard] = useState(false);

  const { data: surgeons = [] } = useQuery({
    queryKey: ["surgeon-contacts"],
    queryFn: () => base44.entities.SurgeonContact.filter({ type: "Surgeon" }, "name", 100),
  });

  const { data: cards = [] } = useQuery({
    queryKey: ["preference-cards", selectedSurgeon],
    queryFn: () => base44.entities.SurgeonPreferenceCard.filter({ surgeon: selectedSurgeon }, "procedure_name", 100),
    enabled: !!selectedSurgeon,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["preference-cards", selectedSurgeon] });

  const handleDelete = async (id) => {
    await base44.entities.SurgeonPreferenceCard.delete(id);
    invalidate();
  };

  const handleUpdate = async (id, data) => {
    await base44.entities.SurgeonPreferenceCard.update(id, data);
    invalidate();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 flex flex-col gap-4">
      <div>
        <h2 className="text-base font-bold text-slate-800 mb-0.5">Surgeon Preference Cards</h2>
        <p className="text-[11px] text-slate-400">Per-procedure preferences by surgeon</p>
      </div>

      {/* Surgeon selector */}
      <div>
        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Select Surgeon</label>
        <select
          value={selectedSurgeon}
          onChange={e => { setSelectedSurgeon(e.target.value); setAddingCard(false); }}
          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-400 bg-white"
        >
          <option value="">Choose a surgeon...</option>
          {surgeons.map(s => (
            <option key={s.id} value={s.name}>{s.name}{s.title ? `, ${s.title}` : ""}</option>
          ))}
        </select>
      </div>

      {selectedSurgeon && (
        <div className="flex flex-col gap-3">
          {cards.length === 0 && !addingCard && (
            <div className="text-xs text-slate-400 italic text-center py-3">No preference cards yet</div>
          )}
          {cards.map(card => (
            <PreferenceCard key={card.id} card={card} onDelete={handleDelete} onUpdate={handleUpdate} />
          ))}
          {addingCard ? (
            <AddCardForm surgeon={selectedSurgeon} onAdded={() => { invalidate(); setAddingCard(false); }} onCancel={() => setAddingCard(false)} />
          ) : (
            <button
              onClick={() => setAddingCard(true)}
              className="flex items-center justify-center gap-1.5 w-full border-2 border-dashed border-teal-200 text-teal-600 hover:border-teal-400 hover:bg-teal-50 rounded-xl py-2 text-xs font-semibold transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Add Preference Card
            </button>
          )}
        </div>
      )}
    </div>
  );
}
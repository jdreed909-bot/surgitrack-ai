import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Upload, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const SPECIALTIES = [
  "General Surgery", "Robotics-GYN", "GEN", "URO", "HPB",
  "Hepatobiliary-HPB", "GYN", "Plastics-Reimplantations", "Flaps",
  "ORTHO", "ORTHO-Trauma", "SPINE", "PODIATRY", "VASCULAR",
];

export default function ResourceModal({ resource, defaultSpecialty, onClose, onSaved }) {
  const editing = !!resource;

  const [form, setForm] = useState({
    specialty: resource?.specialty || defaultSpecialty || SPECIALTIES[0],
    title: resource?.title || "",
    category: resource?.category || "Case",
    description: resource?.description || "",
    equipment_list: resource?.equipment_list || "",
    images: resource?.images || [],
    tags: resource?.tags || [],
  });

  const [saving, setSaving] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState(null);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleImageUpload(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploadingIdx("uploading");
    const newUrls = [];
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      newUrls.push(file_url);
    }
    set("images", [...form.images, ...newUrls]);
    setUploadingIdx(null);
  }

  function removeImage(idx) {
    set("images", form.images.filter((_, i) => i !== idx));
  }

  async function handleSave() {
    if (!form.title.trim()) return;
    setSaving(true);
    if (editing) {
      await base44.entities.EducationalResource.update(resource.id, form);
    } else {
      await base44.entities.EducationalResource.create(form);
    }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800 text-lg">{editing ? "Edit Resource" : "Add Resource"}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {/* Specialty + Category row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Specialty</label>
              <select
                value={form.specialty}
                onChange={(e) => set("specialty", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-teal-400"
              >
                {SPECIALTIES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Category</label>
              <select
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-teal-400"
              >
                <option>Case</option>
                <option>Equipment</option>
                <option>Room Layout</option>
              </select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Title *</label>
            <input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Laparoscopic Cholecystectomy"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-teal-400"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Description / Notes</label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Procedure overview, room setup notes, special considerations…"
              rows={4}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-teal-400 resize-none"
            />
          </div>

          {/* Equipment list */}
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Equipment List</label>
            <textarea
              value={form.equipment_list}
              onChange={(e) => set("equipment_list", e.target.value)}
              placeholder="List instruments, sets, or equipment needed…"
              rows={3}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-teal-400 resize-none"
            />
          </div>

          {/* Image upload */}
          <div>
            <label className="text-xs font-medium text-slate-500 mb-2 block">Images (room setup, back tables, demonstrations)</label>
            <label className={`flex items-center gap-2 px-4 py-3 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
              uploadingIdx ? "border-teal-300 bg-teal-50" : "border-slate-200 hover:border-teal-400 hover:bg-teal-50/30"
            }`}>
              {uploadingIdx ? (
                <><Loader2 className="w-4 h-4 text-teal-500 animate-spin" /><span className="text-sm text-teal-600">Uploading…</span></>
              ) : (
                <><Upload className="w-4 h-4 text-slate-400" /><span className="text-sm text-slate-500">Click to upload images</span></>
              )}
              <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} disabled={!!uploadingIdx} />
            </label>

            {form.images.length > 0 && (
              <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
                {form.images.map((url, i) => (
                  <div key={i} className="relative group">
                    <img src={url} alt="" className="h-20 w-full object-cover rounded-xl border border-slate-100" />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-6 py-4 border-t border-slate-100">
          <Button variant="outline" className="flex-1 rounded-xl" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!form.title.trim() || saving}
            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white rounded-xl"
            onClick={handleSave}
          >
            {saving ? "Saving…" : editing ? "Save Changes" : "Add Resource"}
          </Button>
        </div>
      </div>
    </div>
  );
}
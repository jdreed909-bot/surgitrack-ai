import React, { useState } from "react";
import { FileText, Wrench, LayoutPanelLeft, Image, Pencil, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { base44 } from "@/api/base44Client";

const CATEGORY_CONFIG = {
  "Case": { icon: FileText, color: "bg-teal-50 border-teal-200 text-teal-700", dot: "bg-teal-500" },
  "Equipment": { icon: Wrench, color: "bg-indigo-50 border-indigo-200 text-indigo-700", dot: "bg-indigo-500" },
  "Room Layout": { icon: LayoutPanelLeft, color: "bg-amber-50 border-amber-200 text-amber-700", dot: "bg-amber-500" },
};

export default function ResourceCard({ resource, onEdit, onDeleted }) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  const config = CATEGORY_CONFIG[resource.category] || CATEGORY_CONFIG["Case"];
  const Icon = config.icon;
  const images = resource.images || [];

  async function handleDelete() {
    if (!confirm(`Delete "${resource.title}"?`)) return;
    setDeleting(true);
    await base44.entities.EducationalResource.delete(resource.id);
    onDeleted();
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col">
        {/* Header */}
        <div className="p-4 flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 min-w-0">
            <div className={`p-2 rounded-xl border shrink-0 ${config.color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${config.color} mb-1 inline-block`}>
                {resource.category}
              </span>
              <h3 className="font-semibold text-slate-800 text-sm leading-tight truncate">{resource.title}</h3>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={handleDelete} disabled={deleting} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Image strip */}
        {images.length > 0 && (
          <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
            {images.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`Image ${i + 1}`}
                onClick={() => setLightbox(url)}
                className="h-20 w-28 object-cover rounded-xl border border-slate-100 cursor-pointer hover:opacity-90 shrink-0"
              />
            ))}
          </div>
        )}

        {/* Description preview */}
        {resource.description && (
          <div className="px-4 pb-2">
            <p className={`text-xs text-slate-500 leading-relaxed ${!expanded ? "line-clamp-2" : ""}`}>
              {resource.description}
            </p>
          </div>
        )}

        {/* Expand for equipment list */}
        {resource.equipment_list && (
          <div className="px-4 pb-3">
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium"
            >
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {expanded ? "Hide" : "Show"} equipment list
            </button>
            {expanded && (
              <div className="mt-2 bg-slate-50 rounded-xl p-3 text-xs text-slate-600 whitespace-pre-wrap leading-relaxed border border-slate-100">
                {resource.equipment_list}
              </div>
            )}
          </div>
        )}

        {/* Footer: image count */}
        {images.length > 0 && (
          <div className="px-4 pb-3 flex items-center gap-1 text-[11px] text-slate-400 mt-auto">
            <Image className="w-3 h-3" />
            {images.length} image{images.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="Full view" className="max-h-[90vh] max-w-[90vw] rounded-2xl shadow-2xl" />
        </div>
      )}
    </>
  );
}
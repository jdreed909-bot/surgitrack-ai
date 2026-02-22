import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, X, Wrench, Pencil, Trash2 } from "lucide-react";
import EquipmentModal from "../components/equipment/EquipmentModal";

const CATEGORY_COLORS = {
  "Imaging & Visualization":  "bg-blue-100 text-blue-700",
  "Navigation & Robotics":    "bg-purple-100 text-purple-700",
  "Energy Devices":           "bg-amber-100 text-amber-700",
  "Retraction Systems":       "bg-green-100 text-green-700",
  "Perfusion Equipment":      "bg-red-100 text-red-700",
  "Anesthesia Equipment":     "bg-cyan-100 text-cyan-700",
  "Power Tools":              "bg-orange-100 text-orange-700",
  "Microscopes & Scopes":     "bg-indigo-100 text-indigo-700",
  "Other":                    "bg-slate-100 text-slate-600",
};

export default function SpecialtyEquipment() {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const qc = useQueryClient();

  const { data: equipment = [], isLoading } = useQuery({
    queryKey: ["specialty-equipment"],
    queryFn: () => base44.entities.SpecialtyEquipment.list("-created_date", 100),
  });

  const filtered = equipment.filter((e) => {
    const q = search.toLowerCase();
    return (
      e.name?.toLowerCase().includes(q) ||
      e.equipment_code?.toLowerCase().includes(q) ||
      e.category?.toLowerCase().includes(q) ||
      e.vendor_name?.toLowerCase().includes(q)
    );
  });

  const handleClose = () => { setModalOpen(false); setEditing(null); };

  return (
    <div className="min-h-screen bg-[#F0F4F8] p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Specialty Equipment</h1>
            <p className="text-slate-500 text-sm mt-0.5">{equipment.length} item{equipment.length !== 1 ? "s" : ""} in library</p>
          </div>
          <Button
            onClick={() => setModalOpen(true)}
            className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl gap-2"
          >
            <Plus className="w-4 h-4" /> Add Equipment
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, code, category, or vendor..."
            className="pl-10 rounded-xl border-slate-200 bg-white"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-16 text-slate-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Wrench className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">{search ? "No equipment matches your search" : "No equipment yet"}</p>
            {!search && <p className="text-sm mt-1">Click "Add Equipment" to get started</p>}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item) => (
              <EquipmentCard
                key={item.id}
                item={item}
                onEdit={() => { setEditing(item); setModalOpen(true); }}
                onDelete={async () => {
                  await base44.entities.SpecialtyEquipment.delete(item.id);
                  qc.invalidateQueries({ queryKey: ["specialty-equipment"] });
                }}
              />
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <EquipmentModal
          item={editing}
          onClose={handleClose}
          onSaved={() => { qc.invalidateQueries({ queryKey: ["specialty-equipment"] }); handleClose(); }}
        />
      )}
    </div>
  );
}

function EquipmentCard({ item, onEdit, onDelete }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Wrench className="w-4 h-4 text-teal-600" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-slate-900 text-sm leading-tight truncate">{item.name}</h3>
              {item.equipment_code && (
                <span className="font-mono text-xs text-slate-400">{item.equipment_code}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-1 ml-2 flex-shrink-0">
          <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        {item.category && (
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${CATEGORY_COLORS[item.category] || CATEGORY_COLORS["Other"]}`}>
            {item.category}
          </span>
        )}
        <div className={`ml-auto text-sm font-bold px-3 py-1 rounded-xl ${item.quantity <= 1 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
          Qty: {item.quantity}
        </div>
      </div>

      {item.location && (
        <p className="text-xs text-slate-500 mb-1">📍 {item.location}</p>
      )}
      {item.vendor_name && (
        <p className="text-xs text-slate-500 mb-1">🏭 {item.vendor_name}</p>
      )}
      {item.notes && (
        <p className="text-xs text-slate-400 italic mt-2 line-clamp-2">{item.notes}</p>
      )}
    </div>
  );
}
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Phone, Mail, Globe, Building2, Pencil, Trash2, X, Check } from "lucide-react";
import VendorModal from "../components/vendors/VendorModal";

const SPECIALTY_COLORS = {
  "General Surgery":   "bg-blue-100 text-blue-700",
  "Orthopedic":        "bg-green-100 text-green-700",
  "Cardiovascular":    "bg-red-100 text-red-700",
  "Neurosurgery":      "bg-purple-100 text-purple-700",
  "OB/GYN":            "bg-pink-100 text-pink-700",
  "ENT":               "bg-amber-100 text-amber-700",
  "Ophthalmology":     "bg-cyan-100 text-cyan-700",
  "Urology":           "bg-indigo-100 text-indigo-700",
  "Plastics":          "bg-rose-100 text-rose-700",
  "Laparoscopic":      "bg-teal-100 text-teal-700",
};

export default function Vendors() {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const qc = useQueryClient();

  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ["vendors"],
    queryFn: () => base44.entities.Vendor.list("-created_date", 100),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Vendor.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vendors"] }),
  });

  const filtered = vendors.filter((v) => {
    const q = search.toLowerCase();
    return (
      v.company_name?.toLowerCase().includes(q) ||
      v.contact_name?.toLowerCase().includes(q) ||
      v.email?.toLowerCase().includes(q) ||
      v.specialties?.some((s) => s.toLowerCase().includes(q))
    );
  });

  const handleClose = () => { setModalOpen(false); setEditing(null); };
  const handleEdit = (v) => { setEditing(v); setModalOpen(true); };

  return (
    <div className="min-h-screen bg-[#F0F4F8] p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Vendor Library</h1>
            <p className="text-slate-500 text-sm mt-0.5">{vendors.length} vendor{vendors.length !== 1 ? "s" : ""} on file</p>
          </div>
          <Button
            onClick={() => setModalOpen(true)}
            className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl gap-2"
          >
            <Plus className="w-4 h-4" /> Add Vendor
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, contact, email, or specialty..."
            className="pl-10 rounded-xl border-slate-200 bg-white"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="text-center py-16 text-slate-400">Loading vendors...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">{search ? "No vendors match your search" : "No vendors yet"}</p>
            {!search && <p className="text-sm mt-1">Click "Add Vendor" to get started</p>}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((vendor) => (
              <VendorCard
                key={vendor.id}
                vendor={vendor}
                onEdit={() => handleEdit(vendor)}
                onDelete={() => deleteMutation.mutate(vendor.id)}
              />
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <VendorModal
          vendor={editing}
          onClose={handleClose}
          onSaved={() => { qc.invalidateQueries({ queryKey: ["vendors"] }); handleClose(); }}
        />
      )}
    </div>
  );
}

function VendorCard({ vendor, onEdit, onDelete }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Building2 className="w-4 h-4 text-teal-600" />
            </div>
            <h3 className="font-semibold text-slate-900 text-sm leading-tight truncate">{vendor.company_name}</h3>
          </div>
          {vendor.contact_name && (
            <p className="text-xs text-slate-500 mt-1 ml-10">{vendor.contact_name}</p>
          )}
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

      <div className="space-y-1.5 mb-4">
        {vendor.phone && (
          <a href={`tel:${vendor.phone}`} className="flex items-center gap-2 text-xs text-slate-600 hover:text-teal-600 transition-colors group">
            <Phone className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-500" />
            {vendor.phone}
          </a>
        )}
        {vendor.email && (
          <a href={`mailto:${vendor.email}`} className="flex items-center gap-2 text-xs text-slate-600 hover:text-teal-600 transition-colors group">
            <Mail className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-500" />
            <span className="truncate">{vendor.email}</span>
          </a>
        )}
        {vendor.website && (
          <a href={vendor.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-slate-600 hover:text-teal-600 transition-colors group">
            <Globe className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-500" />
            <span className="truncate">{vendor.website.replace(/^https?:\/\//, "")}</span>
          </a>
        )}
      </div>

      {vendor.specialties?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {vendor.specialties.map((s) => (
            <span key={s} className={`text-xs px-2 py-0.5 rounded-full font-medium ${SPECIALTY_COLORS[s] || "bg-slate-100 text-slate-600"}`}>
              {s}
            </span>
          ))}
        </div>
      )}

      {vendor.notes && (
        <p className="text-xs text-slate-400 mt-3 italic line-clamp-2">{vendor.notes}</p>
      )}
    </div>
  );
}
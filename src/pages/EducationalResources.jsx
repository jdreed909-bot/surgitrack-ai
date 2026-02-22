import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Plus, Search, ChevronRight, Image, Wrench, LayoutPanelLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import ResourceCard from "../components/education/ResourceCard";
import ResourceModal from "../components/education/ResourceModal";

const SPECIALTIES = [
  "General Surgery",
  "Robotics-GYN",
  "GEN",
  "URO",
  "HPB",
  "Hepatobiliary-HPB",
  "GYN",
  "Plastics-Reimplantations",
  "Flaps",
  "ORTHO",
  "ORTHO-Trauma",
  "SPINE",
  "PODIATRY",
  "VASCULAR",
];

const CATEGORY_ICONS = {
  "Case": FileText,
  "Equipment": Wrench,
  "Room Layout": LayoutPanelLeft,
};

const CATEGORY_COLORS = {
  "Case": "bg-teal-50 border-teal-200 text-teal-700",
  "Equipment": "bg-indigo-50 border-indigo-200 text-indigo-700",
  "Room Layout": "bg-amber-50 border-amber-200 text-amber-700",
};

export default function EducationalResources() {
  const [activeSpecialty, setActiveSpecialty] = useState(SPECIALTIES[0]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const queryClient = useQueryClient();

  const { data: resources = [], isLoading } = useQuery({
    queryKey: ["educational_resources"],
    queryFn: () => base44.entities.EducationalResource.list("-created_date", 500),
  });

  const filtered = resources.filter((r) => {
    const matchSpec = r.specialty === activeSpecialty;
    const matchCat = categoryFilter === "All" || r.category === categoryFilter;
    const matchSearch =
      !search ||
      r.title?.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase());
    return matchSpec && matchCat && matchSearch;
  });

  const counts = {
    "Case": resources.filter((r) => r.specialty === activeSpecialty && r.category === "Case").length,
    "Equipment": resources.filter((r) => r.specialty === activeSpecialty && r.category === "Equipment").length,
    "Room Layout": resources.filter((r) => r.specialty === activeSpecialty && r.category === "Room Layout").length,
  };

  function openAdd() {
    setEditingResource(null);
    setModalOpen(true);
  }

  function openEdit(resource) {
    setEditingResource(resource);
    setModalOpen(true);
  }

  function onSaved() {
    queryClient.invalidateQueries(["educational_resources"]);
    setModalOpen(false);
  }

  return (
    <div className="min-h-screen bg-[#F0F4F8] flex">
      {/* Specialty sidebar */}
      <aside className="w-52 shrink-0 bg-white border-r border-slate-100 shadow-sm min-h-screen pt-6">
        <div className="px-4 mb-4">
          <div className="flex items-center gap-2 text-teal-700 font-bold text-sm">
            <BookOpen className="w-4 h-4" />
            Specialties
          </div>
        </div>
        <nav className="px-2 space-y-0.5">
          {SPECIALTIES.map((sp) => {
            const count = resources.filter((r) => r.specialty === sp).length;
            return (
              <button
                key={sp}
                onClick={() => setActiveSpecialty(sp)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium text-left transition-all ${
                  activeSpecialty === sp
                    ? "bg-teal-50 text-teal-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span className="truncate">{sp}</span>
                {count > 0 && (
                  <span className={`ml-1 text-xs font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                    activeSpecialty === sp ? "bg-teal-100 text-teal-700" : "bg-slate-100 text-slate-500"
                  }`}>{count}</span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 p-6 overflow-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{activeSpecialty}</h1>
            <p className="text-slate-500 text-sm mt-0.5">Educational resources, cases, equipment & room layouts</p>
          </div>
          <Button
            onClick={openAdd}
            className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Resource
          </Button>
        </div>

        {/* Category filter + search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex gap-1 bg-white border border-slate-100 rounded-xl p-1 shadow-sm w-fit">
            {["All", "Case", "Equipment", "Room Layout"].map((cat) => {
              const Icon = CATEGORY_ICONS[cat];
              const active = categoryFilter === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    active ? "bg-teal-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  {cat}
                  {cat !== "All" && counts[cat] > 0 && (
                    <span className={`text-xs font-bold px-1 rounded-full ${active ? "bg-teal-500 text-white" : "bg-slate-100 text-slate-500"}`}>
                      {counts[cat]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search resources…"
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-1 focus:ring-teal-400"
            />
          </div>
        </div>

        {/* Resource grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-white rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <BookOpen className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-lg font-medium">No resources yet</p>
            <p className="text-sm mt-1">Click "Add Resource" to get started for {activeSpecialty}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((r) => (
              <ResourceCard
                key={r.id}
                resource={r}
                onEdit={() => openEdit(r)}
                onDeleted={() => queryClient.invalidateQueries(["educational_resources"])}
              />
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <ResourceModal
          resource={editingResource}
          defaultSpecialty={activeSpecialty}
          onClose={() => setModalOpen(false)}
          onSaved={onSaved}
        />
      )}
    </div>
  );
}
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Phone, Search, User, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const SPECIALTY_COLORS = {
  "General Surgery":  { bg: "bg-blue-50",    border: "border-blue-200",   dot: "bg-blue-500",    text: "text-blue-700" },
  "Plastic Surgery":  { bg: "bg-pink-50",     border: "border-pink-200",   dot: "bg-pink-500",    text: "text-pink-700" },
  "Orthopedics":      { bg: "bg-emerald-50",  border: "border-emerald-200",dot: "bg-emerald-500", text: "text-emerald-700" },
  "Podiatry":         { bg: "bg-amber-50",    border: "border-amber-200",  dot: "bg-amber-500",   text: "text-amber-700" },
  "OB/GYN":           { bg: "bg-purple-50",   border: "border-purple-200", dot: "bg-purple-500",  text: "text-purple-700" },
  "Ophthalmology":    { bg: "bg-teal-50",     border: "border-teal-200",   dot: "bg-teal-500",    text: "text-teal-700" },
  "Head & Neck":      { bg: "bg-orange-50",   border: "border-orange-200", dot: "bg-orange-500",  text: "text-orange-700" },
  "Urology":          { bg: "bg-indigo-50",   border: "border-indigo-200", dot: "bg-indigo-500",  text: "text-indigo-700" },
};

const SPECIALTIES = Object.keys(SPECIALTY_COLORS);

function ContactCard({ contact }) {
  const isMD = contact.type === "Surgeon";
  return (
    <div className="flex items-center justify-between px-3 py-2.5 bg-white border border-slate-100 rounded-xl hover:shadow-sm transition-all group">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isMD ? "bg-teal-100" : "bg-slate-100"}`}>
          <User className={`w-3.5 h-3.5 ${isMD ? "text-teal-600" : "text-slate-500"}`} />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-800 truncate">{contact.name}</div>
          {contact.title && <div className="text-[10px] text-slate-400">{contact.title}</div>}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${isMD ? "border-teal-200 text-teal-700" : "border-slate-200 text-slate-500"}`}>
          {isMD ? "MD" : "PA/NP"}
        </Badge>
        {contact.phone ? (
          <a
            href={`tel:${contact.phone}`}
            className="flex items-center gap-1.5 text-sm font-mono text-slate-700 hover:text-teal-600 transition-colors"
          >
            <Phone className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-500" />
            {contact.phone}
          </a>
        ) : (
          <span className="text-xs text-slate-300 italic">No number</span>
        )}
      </div>
    </div>
  );
}

function SpecialtySection({ specialty, contacts, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const colors = SPECIALTY_COLORS[specialty] || { bg: "bg-slate-50", border: "border-slate-200", dot: "bg-slate-400", text: "text-slate-700" };
  const mds = contacts.filter(c => c.type === "Surgeon");
  const pas = contacts.filter(c => c.type === "PA/NP");

  return (
    <div className={`rounded-2xl border-2 ${colors.border} ${colors.bg} overflow-hidden`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:brightness-95 transition-all"
      >
        <div className="flex items-center gap-3">
          <span className={`w-3 h-3 rounded-full ${colors.dot}`} />
          <span className={`font-bold text-base ${colors.text}`}>{specialty}</span>
          <span className="text-sm text-slate-400 font-normal">
            {mds.length} MD{mds.length !== 1 ? "s" : ""}
            {pas.length > 0 && ` · ${pas.length} PA/NP`}
          </span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-1.5">
          {mds.length > 0 && (
            <>
              {mds.length > 0 && pas.length > 0 && (
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pt-1 pb-0.5">Surgeons</div>
              )}
              {mds.map(c => <ContactCard key={c.id} contact={c} />)}
            </>
          )}
          {pas.length > 0 && (
            <>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pt-2 pb-0.5">PA / NP</div>
              {pas.map(c => <ContactCard key={c.id} contact={c} />)}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function SurgeonDirectory() {
  const [search, setSearch] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("All");

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ["surgeon-contacts"],
    queryFn: () => base44.entities.SurgeonContact.list("-name", 500),
  });

  const filtered = contacts.filter(c => {
    const matchSearch = !search || c.name?.toLowerCase().includes(search.toLowerCase());
    const matchSpecialty = selectedSpecialty === "All" || c.specialty === selectedSpecialty;
    return matchSearch && matchSpecialty;
  });

  // Group by specialty
  const grouped = {};
  SPECIALTIES.forEach(s => { grouped[s] = []; });
  filtered.forEach(c => {
    if (grouped[c.specialty]) grouped[c.specialty].push(c);
    else grouped[c.specialty] = [c];
  });

  const specialtiesWithContacts = SPECIALTIES.filter(s => grouped[s]?.length > 0);

  return (
    <div className="min-h-screen bg-[#F0F4F8] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Surgeon & PA Directory</h1>
          <p className="text-sm text-slate-500 mt-1">Cell phone contacts organized by specialty</p>
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by name…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {["All", ...SPECIALTIES].map(s => {
              const colors = SPECIALTY_COLORS[s];
              const active = selectedSpecialty === s;
              return (
                <button
                  key={s}
                  onClick={() => setSelectedSpecialty(s)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                    active
                      ? colors ? `${colors.bg} ${colors.border} ${colors.text}` : "bg-teal-50 border-teal-300 text-teal-700"
                      : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                  }`}
                >
                  {s === "All" ? "All Specialties" : s}
                </button>
              );
            })}
          </div>
        </div>

        {/* Specialty Sections */}
        {isLoading ? (
          <div className="text-center py-16 text-slate-400">Loading directory…</div>
        ) : specialtiesWithContacts.length === 0 ? (
          <div className="text-center py-16 text-slate-400">No contacts found</div>
        ) : (
          <div className="space-y-4">
            {specialtiesWithContacts.map((specialty, idx) => (
              <SpecialtySection
                key={specialty}
                specialty={specialty}
                contacts={grouped[specialty]}
                defaultOpen={idx === 0}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
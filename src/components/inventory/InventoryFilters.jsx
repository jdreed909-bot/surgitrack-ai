import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

export default function InventoryFilters({ filters, onChange }) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          placeholder="Search sets by name or code..."
          className="pl-9 rounded-xl border-slate-200 bg-white"
        />
      </div>
      <Select value={filters.status} onValueChange={(v) => onChange({ ...filters, status: v })}>
        <SelectTrigger className="w-full sm:w-44 rounded-xl border-slate-200 bg-white">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          {["Available", "In Use", "Sterilizing", "Under Repair", "Missing", "Loaned Out"].map((s) => (
            <SelectItem key={s} value={s}>{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={filters.location} onValueChange={(v) => onChange({ ...filters, location: v })}>
        <SelectTrigger className="w-full sm:w-48 rounded-xl border-slate-200 bg-white">
          <SelectValue placeholder="All Locations" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Locations</SelectItem>
          {["Sterile Processing", "OR 1", "OR 2", "OR 3", "OR 4", "OR 5", "OR 6", "Storage Room A", "Storage Room B", "Vendor"].map((l) => (
            <SelectItem key={l} value={l}>{l}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
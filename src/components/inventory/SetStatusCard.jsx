import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Clock, Wrench, Package, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const STATUS_CONFIG = {
  Available:    { color: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  "In Use":     { color: "bg-blue-100 text-blue-700 border-blue-200",          dot: "bg-blue-500" },
  Sterilizing:  { color: "bg-purple-100 text-purple-700 border-purple-200",    dot: "bg-purple-500" },
  "Under Repair":{ color: "bg-amber-100 text-amber-700 border-amber-200",      dot: "bg-amber-500" },
  Missing:      { color: "bg-red-100 text-red-700 border-red-200",             dot: "bg-red-500 animate-pulse" },
  "Loaned Out": { color: "bg-slate-100 text-slate-600 border-slate-200",       dot: "bg-slate-400" },
};

const LOCATION_OPTIONS = ["Sterile Processing", "OR 1", "OR 2", "OR 3", "OR 4", "OR 5", "OR 6", "Storage Room A", "Storage Room B", "Vendor", "Unknown"];
const STATUS_OPTIONS = ["Available", "In Use", "Sterilizing", "Under Repair", "Missing", "Loaned Out"];

export default function SetStatusCard({ set, onUpdated }) {
  const [expanded, setExpanded] = useState(false);
  const [editStatus, setEditStatus] = useState(false);
  const [saving, setSaving] = useState(false);

  const cfg = STATUS_CONFIG[set.status] || STATUS_CONFIG["Available"];

  const handleQuickUpdate = async (field, value) => {
    setSaving(true);
    const user = await base44.auth.me();
    await base44.entities.SurgicalSet.update(set.id, {
      [field]: value,
      last_scan_by: user.email,
    });
    await base44.entities.ScanLog.create({
      set_id: set.id,
      set_code: set.set_code,
      set_name: set.name,
      action: "Status Update",
      from_status: set.status,
      to_status: field === "status" ? value : set.status,
      from_location: set.location,
      to_location: field === "location" ? value : set.location,
      scanned_by: user.email,
    });
    setSaving(false);
    setEditStatus(false);
    onUpdated();
  };

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md ${set.status === "Missing" ? "border-red-300 ring-1 ring-red-200" : "border-slate-100"}`}>
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
              <h3 className="font-semibold text-slate-900 text-sm leading-tight truncate">{set.name}</h3>
            </div>
            <span className="font-mono text-xs text-slate-400">{set.set_code}</span>
          </div>
          <Badge className={`text-xs border font-medium rounded-lg px-2 py-1 flex-shrink-0 ${cfg.color}`}>
            {set.status}
          </Badge>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-3">
          <MapPin className="w-3.5 h-3.5" />
          <span>{set.location || "Unknown"}</span>
          {set.is_loaner && (
            <Badge className="ml-2 bg-orange-100 text-orange-700 border-orange-200 text-xs px-1.5 py-0.5 rounded-md">
              Loaner
            </Badge>
          )}
        </div>

        {/* Meta row */}
        <div className="grid grid-cols-2 gap-2 text-xs mb-4">
          {set.last_sterilized && (
            <div className="flex items-center gap-1.5 text-slate-500">
              <CheckCircle2 className="w-3 h-3 text-purple-400" />
              <span className="truncate">Sterilized {formatDistanceToNow(new Date(set.last_sterilized), { addSuffix: true })}</span>
            </div>
          )}
          {set.tray_count && (
            <div className="flex items-center gap-1.5 text-slate-500">
              <Package className="w-3 h-3" />
              <span>{set.tray_count} tray{set.tray_count !== 1 ? "s" : ""}</span>
            </div>
          )}
        </div>

        {/* Quick status update */}
        {!editStatus ? (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditStatus(true)}
              className="flex-1 text-xs rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Quick Update
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setExpanded(!expanded)}
              className="text-slate-400 rounded-lg px-2"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Select defaultValue={set.status} onValueChange={(v) => handleQuickUpdate("status", v)}>
              <SelectTrigger className="rounded-lg text-xs h-8 border-slate-200">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select defaultValue={set.location} onValueChange={(v) => handleQuickUpdate("location", v)}>
              <SelectTrigger className="rounded-lg text-xs h-8 border-slate-200">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                {LOCATION_OPTIONS.map((l) => <SelectItem key={l} value={l} className="text-xs">{l}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button size="sm" variant="ghost" onClick={() => setEditStatus(false)} className="w-full text-xs text-slate-400 rounded-lg">
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50 px-5 py-4 space-y-2">
          {set.category && <InfoRow label="Category" value={set.category} />}
          {set.vendor_name && <InfoRow label="Vendor" value={set.vendor_name} />}
          {set.vendor_contact && <InfoRow label="Contact" value={set.vendor_contact} />}
          {set.instrument_count && <InfoRow label="Instruments" value={`${set.instrument_count} items`} />}
          {set.notes && <InfoRow label="Notes" value={set.notes} />}
          {set.last_scan_by && <InfoRow label="Last Scanned By" value={set.last_scan_by} />}
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-slate-400 font-medium">{label}</span>
      <span className="text-slate-700 text-right max-w-[60%] truncate">{value}</span>
    </div>
  );
}
import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ScanModal from "../components/inventory/ScanModal";
import SetStatusCard from "../components/inventory/SetStatusCard";
import InventoryFilters from "../components/inventory/InventoryFilters";
import AlertBanner from "../components/inventory/AlertBanner";
import FiveDayLookout from "../components/inventory/FiveDayLookout";
import { Button } from "@/components/ui/button";
import { ScanLine, Plus, Bell, Building2, Upload } from "lucide-react";
import AddSetModal from "../components/inventory/AddSetModal";
import ImportSetsModal from "../components/inventory/ImportSetsModal";

export default function Inventory() {
  const [scanOpen, setScanOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [filters, setFilters] = useState({ status: "all", location: "all", search: "" });
  const [tab, setTab] = useState("hospital"); // "hospital" | "consignment"
  const queryClient = useQueryClient();

  const { data: sets = [], isLoading } = useQuery({
    queryKey: ["sets"],
    queryFn: () => base44.entities.SurgicalSet.list("-updated_date", 100),
    refetchInterval: 15000,
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ["alerts"],
    queryFn: () => base44.entities.Alert.filter({ is_resolved: false }, "-created_date", 20),
    refetchInterval: 15000,
  });

  const activeAlerts = alerts.filter((a) => !a.is_resolved);

  const tabSets = tab === "consignment" ? sets.filter((s) => s.is_loaner) : sets.filter((s) => !s.is_loaner);

  const filtered = tabSets.filter((s) => {
    const matchStatus = filters.status === "all" || s.status === filters.status;
    const matchLocation = filters.location === "all" || s.location === filters.location;
    const matchSearch =
      !filters.search ||
      s.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      s.set_code?.toLowerCase().includes(filters.search.toLowerCase());
    return matchStatus && matchLocation && matchSearch;
  });

  const statusCounts = {
    Available: tabSets.filter((s) => s.status === "Available").length,
    "In Use": tabSets.filter((s) => s.status === "In Use").length,
    Sterilizing: tabSets.filter((s) => s.status === "Sterilizing").length,
    "Under Repair": tabSets.filter((s) => s.status === "Under Repair").length,
    Missing: tabSets.filter((s) => s.status === "Missing").length,
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar - 5 Day Lookout */}
          <div className="lg:col-span-1">
            <FiveDayLookout />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Surgical Instrument Sets</h1>
            <p className="text-slate-500 mt-1 text-sm">Real-time tracking of all surgical sets</p>
          </div>
          <div className="flex items-center gap-3">
            {activeAlerts.length > 0 && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-xl text-sm font-medium">
                <Bell className="w-4 h-4" />
                {activeAlerts.length} Active Alert{activeAlerts.length !== 1 ? "s" : ""}
              </div>
            )}
            <Button
              onClick={() => setImportOpen(true)}
              variant="outline"
              className="border-slate-200 text-slate-700 rounded-xl"
            >
              <Upload className="w-4 h-4 mr-2" /> Import Sets
            </Button>
            <Button
              onClick={() => setAddOpen(true)}
              variant="outline"
              className="border-slate-200 text-slate-700 rounded-xl"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Set
            </Button>
            <Button
              onClick={() => setScanOpen(true)}
              className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-sm"
            >
              <ScanLine className="w-4 h-4 mr-2" /> Scan Set
            </Button>
          </div>
        </div>

        {/* Sub-category Tabs */}
        <div className="flex gap-1 mb-6 bg-white border border-slate-100 rounded-2xl p-1 w-fit shadow-sm">
          <button
            onClick={() => setTab("hospital")}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-all ${tab === "hospital" ? "bg-teal-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
          >
            <ScanLine className="w-4 h-4" />
            Hospital Sets
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${tab === "hospital" ? "bg-teal-500 text-white" : "bg-slate-100 text-slate-500"}`}>
              {sets.filter((s) => !s.is_loaner).length}
            </span>
          </button>
          <button
            onClick={() => setTab("consignment")}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-all ${tab === "consignment" ? "bg-purple-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
          >
            <Building2 className="w-4 h-4" />
            Consignment / Vendor Sets
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${tab === "consignment" ? "bg-purple-500 text-white" : "bg-slate-100 text-slate-500"}`}>
              {sets.filter((s) => s.is_loaner).length}
            </span>
          </button>
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
          {Object.entries(statusCounts).map(([status, count]) => (
            <StatusSummaryCard key={status} status={status} count={count} total={sets.length} />
          ))}
        </div>

        {/* Alerts */}
        {activeAlerts.length > 0 && (
          <AlertBanner alerts={activeAlerts} onResolve={() => queryClient.invalidateQueries(["alerts"])} />
        )}

        {/* Filters */}
        <InventoryFilters filters={filters} onChange={setFilters} />

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-white rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <ScanLine className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg">No sets found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((set) => (
              <SetStatusCard
                key={set.id}
                set={set}
                onUpdated={() => queryClient.invalidateQueries(["sets"])}
              />
            ))}
          </div>
        )}
      </div>

      {scanOpen && (
        <ScanModal
          onClose={() => setScanOpen(false)}
          onScanned={() => {
            queryClient.invalidateQueries(["sets"]);
            queryClient.invalidateQueries(["scan-logs"]);
          }}
          sets={sets}
        />
      )}

      {addOpen && (
        <AddSetModal
          onClose={() => setAddOpen(false)}
          onCreated={() => queryClient.invalidateQueries(["sets"])}
        />
      )}

      {importOpen && (
        <ImportSetsModal
          onClose={() => setImportOpen(false)}
          onSuccess={() => queryClient.invalidateQueries(["sets"])}
        />
      )}
    </div>
  );
}

function StatusSummaryCard({ status, count, total }) {
  const config = {
    Available: { color: "bg-emerald-50 border-emerald-200 text-emerald-700", dot: "bg-emerald-500" },
    "In Use": { color: "bg-blue-50 border-blue-200 text-blue-700", dot: "bg-blue-500" },
    Sterilizing: { color: "bg-purple-50 border-purple-200 text-purple-700", dot: "bg-purple-500" },
    "Under Repair": { color: "bg-amber-50 border-amber-200 text-amber-700", dot: "bg-amber-500" },
    Missing: { color: "bg-red-50 border-red-200 text-red-700", dot: "bg-red-500" },
  };
  const c = config[status] || { color: "bg-slate-50 border-slate-200 text-slate-700", dot: "bg-slate-400" };
  return (
    <div className={`border rounded-2xl p-4 ${c.color}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className={`w-2 h-2 rounded-full ${c.dot}`} />
        <span className="text-xs font-medium truncate">{status}</span>
      </div>
      <div className="text-2xl font-bold">{count}</div>
      <div className="text-xs opacity-60">of {total} sets</div>
    </div>
  );
}
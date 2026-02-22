import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { ScanLine, Clock, ArrowRight, User, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const ACTION_COLORS = {
  "Checked Out": "bg-blue-100 text-blue-700 border-blue-200",
  "Checked In": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Status Update": "bg-purple-100 text-purple-700 border-purple-200",
  "Location Update": "bg-slate-100 text-slate-600 border-slate-200",
};

export default function ScanHistory() {
  const [search, setSearch] = useState("");

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["scan-logs"],
    queryFn: () => base44.entities.ScanLog.list("-created_date", 200),
    refetchInterval: 20000,
  });

  const filtered = logs.filter(
    (l) =>
      !search ||
      l.set_name?.toLowerCase().includes(search.toLowerCase()) ||
      l.set_code?.toLowerCase().includes(search.toLowerCase()) ||
      l.scanned_by?.toLowerCase().includes(search.toLowerCase())
  );

  // Group by date
  const grouped = filtered.reduce((acc, log) => {
    const dateKey = log.created_date
      ? format(parseISO(log.created_date), "yyyy-MM-dd")
      : "Unknown";
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(log);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#F0F4F8]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Scan History</h1>
          <p className="text-slate-500 mt-1 text-sm">Full audit trail of all set scans and updates</p>
        </div>

        <div className="relative mb-6">
          <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by set name, code, or nurse..."
            className="pl-9 rounded-xl border-slate-200 bg-white"
          />
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="text-center py-24 text-slate-400">
            <ScanLine className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No scan history yet</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a)).map(([dateKey, dateLogs]) => (
              <div key={dateKey}>
                <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 pl-1">
                  {dateKey === format(new Date(), "yyyy-MM-dd") ? "Today" : format(parseISO(dateKey), "EEEE, MMMM d, yyyy")}
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
                  {dateLogs.map((log) => (
                    <div key={log.id} className="px-5 py-4 flex items-start gap-4 hover:bg-slate-50 transition-colors">
                      <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                        <ScanLine className="w-4 h-4 text-slate-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-slate-800 text-sm">{log.set_name}</span>
                          <span className="font-mono text-xs text-slate-400">{log.set_code}</span>
                          <Badge className={`text-xs border rounded-lg px-2 py-0.5 ${ACTION_COLORS[log.action] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                            {log.action}
                          </Badge>
                        </div>
                        {(log.from_status || log.to_status) && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                            <span className="bg-slate-100 px-2 py-0.5 rounded">{log.from_status || "—"}</span>
                            <ArrowRight className="w-3 h-3" />
                            <span className="bg-slate-100 px-2 py-0.5 rounded">{log.to_status || "—"}</span>
                            {log.from_location !== log.to_location && (
                              <>
                                <span className="mx-1 text-slate-300">|</span>
                                <span>{log.from_location}</span>
                                <ArrowRight className="w-3 h-3" />
                                <span>{log.to_location}</span>
                              </>
                            )}
                          </div>
                        )}
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          <span className="flex items-center gap-1"><User className="w-3 h-3" />{log.scanned_by}</span>
                          {log.created_date && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(parseISO(log.created_date), "h:mm a")}
                            </span>
                          )}
                          {log.notes && <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{log.notes}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
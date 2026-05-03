import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, CheckCircle2, AlertTriangle, FileSpreadsheet } from "lucide-react";

const ALL_ROLES = ["RN", "Charge RN", "Scrub Tech", "PCT", "UA", "Surgeon", "Anesthesia Provider", "RNFA", "PA", "NP", "CRNA"];

// Normalize FTE values from various Excel spellings
function normalizeFTE(val) {
  if (!val) return "Full-Time";
  const v = String(val).toLowerCase().trim();
  if (v.includes("full") || v === "ft") return "Full-Time";
  if (v.includes("part") || v === "pt") return "Part-Time";
  if (v.includes("per") || v.includes("diem") || v === "prn") return "Per Diem";
  return "Full-Time";
}

// Normalize role — map common abbreviations
function normalizeRole(val, defaultRole) {
  if (!val) return defaultRole || "RN";
  const v = String(val).trim();
  const map = {
    "ST": "Scrub Tech", "SCRUB": "Scrub Tech", "SCRUB TECH": "Scrub Tech",
    "CHARGE": "Charge RN", "CHARGE RN": "Charge RN",
    "ANESTHESIA": "Anesthesia Provider",
  };
  return map[v.toUpperCase()] || ALL_ROLES.find(r => r.toLowerCase() === v.toLowerCase()) || defaultRole || v;
}

export default function ImportStaffModal({ onClose, onSuccess, defaultRole = "RN" }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [fullData, setFullData] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setError(null);
    setSuccess(null);
    setPreview(null);
    setFullData(null);
    setParsing(true);

    try {
      // Upload the file first to get a URL
      const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedFile });

      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: {
            name:           { type: "string", description: "Full name of staff member" },
            role:           { type: "string", description: "Job role (RN, Scrub Tech, PCT, UA, etc.)" },
            phone:          { type: "string", description: "Phone number" },
            email:          { type: "string", description: "Email address" },
            seniority_date: { type: "string", description: "Hire date or seniority date in any date format" },
            fte_status:     { type: "string", description: "Employment status: Full-Time, Part-Time, or Per Diem / PRN" },
            vocera_id:      { type: "string", description: "Vocera badge ID" },
            is_active:      { type: "boolean", description: "Active status (true/false)" },
          },
          required: ["name"],
        },
      });

      if (result.status === "success") {
        const rows = Array.isArray(result.output) ? result.output : [result.output];
        const normalized = rows
          .filter(r => r.name)
          .map(r => ({
            name:           String(r.name || "").trim(),
            role:           normalizeRole(r.role, defaultRole),
            phone:          String(r.phone || "").trim(),
            email:          String(r.email || "").trim(),
            seniority_date: r.seniority_date ? String(r.seniority_date).trim() : "",
            fte_status:     normalizeFTE(r.fte_status),
            vocera_id:      String(r.vocera_id || "").trim(),
            is_active:      r.is_active !== false,
          }));
        setFullData(normalized);
        setPreview(normalized.slice(0, 5));
      } else {
        setError(`Could not parse file: ${result.details}`);
      }
    } catch (err) {
      setError(`Error reading file: ${err.message}`);
    } finally {
      setParsing(false);
    }
  };

  const handleImport = async () => {
    if (!fullData?.length) return;
    setUploading(true);
    setError(null);
    await base44.entities.StaffRoster.bulkCreate(fullData);
    setSuccess(`Successfully imported ${fullData.length} staff members!`);
    setUploading(false);
    setTimeout(() => { onSuccess(); onClose(); }, 1500);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl rounded-2xl p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-br from-teal-600 to-teal-700 px-6 pt-6 pb-5">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2 text-xl">
              <FileSpreadsheet className="w-5 h-5" /> Import Staff from Excel / CSV
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-4">
          {/* Format guide */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
            <p className="font-semibold mb-1">Expected Excel/CSV columns:</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-blue-700 mt-1">
              <span><strong>name</strong> — Full name (required)</span>
              <span><strong>role</strong> — RN, Scrub Tech, PCT, UA, etc.</span>
              <span><strong>phone</strong> — Phone number</span>
              <span><strong>email</strong> — Email address</span>
              <span><strong>seniority_date</strong> — Hire / seniority date</span>
              <span><strong>fte_status</strong> — Full-Time / Part-Time / PRN</span>
            </div>
            <p className="text-xs text-blue-600 mt-2">Column names are flexible — the AI will map them automatically.</p>
          </div>

          {/* File drop zone */}
          <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-8 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer text-center">
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            {parsing ? (
              <div className="flex flex-col items-center gap-2 text-teal-600">
                <Loader2 className="w-7 h-7 animate-spin" />
                <p className="text-sm font-semibold">Parsing file…</p>
              </div>
            ) : file ? (
              <div className="flex flex-col items-center gap-1.5">
                <FileSpreadsheet className="w-7 h-7 text-teal-500" />
                <p className="font-semibold text-slate-700 text-sm">{file.name}</p>
                <p className="text-xs text-slate-400">Click to change file</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 pointer-events-none">
                <Upload className="w-7 h-7 text-slate-400" />
                <p className="font-semibold text-slate-700 text-sm">Drop Excel / CSV here or click to browse</p>
                <p className="text-xs text-slate-400">.xlsx, .xls, .csv supported</p>
              </div>
            )}
          </div>

          {/* Preview table */}
          {preview && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
                Preview — {fullData?.length} rows found (showing first 5)
              </p>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-xs">
                  <thead className="bg-slate-100 border-b border-slate-200">
                    <tr>
                      {["Name", "Role", "FTE", "Seniority Date", "Phone", "Email"].map(h => (
                        <th key={h} className="px-3 py-2 text-left font-semibold text-slate-600">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, idx) => (
                      <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-3 py-2 font-medium text-slate-800">{row.name}</td>
                        <td className="px-3 py-2">
                          <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-semibold">{row.role}</span>
                        </td>
                        <td className="px-3 py-2 text-slate-600">{row.fte_status === "Full-Time" ? "FT" : row.fte_status === "Part-Time" ? "PT" : "PRN"}</td>
                        <td className="px-3 py-2 text-slate-600">{row.seniority_date || "—"}</td>
                        <td className="px-3 py-2 text-slate-600">{row.phone || "—"}</td>
                        <td className="px-3 py-2 text-slate-600">{row.email || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {error && (
            <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl border-slate-200">Cancel</Button>
            <Button
              onClick={handleImport}
              disabled={uploading || !fullData?.length}
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white rounded-xl"
            >
              {uploading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {uploading ? "Importing…" : `Import ${fullData?.length || 0} Staff`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
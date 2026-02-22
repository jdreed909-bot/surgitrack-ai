import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, X, CheckCircle2, AlertTriangle } from "lucide-react";

export default function ImportStaffModal({ onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);
    setSuccess(null);

    try {
      const fileData = await selectedFile.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(fileData)));
      const fileUrl = `data:${selectedFile.type};base64,${base64}`;

      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: fileUrl,
        json_schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            role: { type: "string" },
            vocera_id: { type: "string" },
            vocera_group: { type: "string" },
            phone: { type: "string" },
            email: { type: "string" },
            is_active: { type: "boolean" },
          },
          required: ["name", "role"],
        },
      });

      if (result.status === "success") {
        const staff = Array.isArray(result.output) ? result.output : [result.output];
        setPreview(staff.slice(0, 5));
      } else {
        setError(`Failed to parse file: ${result.details}`);
      }
    } catch (err) {
      setError(`Error reading file: ${err.message}`);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const fileData = await file.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(fileData)));
      const fileUrl = `data:${file.type};base64,${base64}`;

      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: fileUrl,
        json_schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            role: { type: "string" },
            vocera_id: { type: "string" },
            vocera_group: { type: "string" },
            phone: { type: "string" },
            email: { type: "string" },
            is_active: { type: "boolean" },
          },
          required: ["name", "role"],
        },
      });

      if (result.status !== "success") {
        setError(`Import failed: ${result.details}`);
        setUploading(false);
        return;
      }

      const staff = Array.isArray(result.output) ? result.output : [result.output];
      const formattedStaff = staff.map((s) => ({
        name: s.name,
        role: s.role,
        vocera_id: s.vocera_id || "",
        vocera_group: s.vocera_group || "",
        phone: s.phone || "",
        email: s.email || "",
        is_active: s.is_active !== false,
      }));

      await base44.entities.StaffRoster.bulkCreate(formattedStaff);
      setSuccess(`Successfully imported ${formattedStaff.length} staff members!`);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      setError(`Import error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl rounded-2xl p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-br from-teal-600 to-teal-700 px-6 pt-6 pb-5">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2 text-xl">
              <Upload className="w-5 h-5" /> Import Staff Members
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-800">
              <strong>CSV/Excel Format Expected:</strong> name, role, vocera_id (optional), vocera_group (optional), phone (optional), email (optional), is_active (optional)
            </p>
            <p className="text-xs text-blue-700 mt-2">
              <strong>Valid roles:</strong> RN, Scrub Tech, Charge RN, Surgeon, Anesthesia Provider
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file-upload" className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Select File
            </Label>
            <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-6 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
              <input
                id="file-upload"
                type="file"
                accept=".csv,.xlsx,.xls,.json"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center gap-2 text-center pointer-events-none">
                <Upload className="w-6 h-6 text-slate-400" />
                <div>
                  {file ? (
                    <p className="font-semibold text-slate-700">{file.name}</p>
                  ) : (
                    <>
                      <p className="font-semibold text-slate-700">Drop file here or click</p>
                      <p className="text-xs text-slate-400">CSV, Excel, or JSON</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {preview && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Preview (first 5 rows)</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-100 border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-slate-600">Name</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-600">Role</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-600">Vocera ID</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-600">Phone</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-600">Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, idx) => (
                      <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-3 py-2 text-slate-700">{row.name}</td>
                        <td className="px-3 py-2 text-slate-600">{row.role}</td>
                        <td className="px-3 py-2 text-slate-600 font-mono text-[10px]">{row.vocera_id || "—"}</td>
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
            <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl border-slate-200">
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={uploading || !preview}
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white rounded-xl"
            >
              {uploading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {uploading ? "Importing..." : `Import ${preview?.length || 0} Staff`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
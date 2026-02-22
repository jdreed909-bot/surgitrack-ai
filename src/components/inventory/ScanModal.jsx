import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScanLine, CheckCircle2, AlertCircle, Loader2, Camera, X } from "lucide-react";

const STATUS_OPTIONS = ["Available", "In Use", "Sterilizing", "Under Repair", "Missing", "Loaned Out"];
const LOCATION_OPTIONS = ["Sterile Processing", "OR 1", "OR 2", "OR 3", "OR 4", "OR 5", "OR 6", "Storage Room A", "Storage Room B", "Vendor", "Unknown"];

export default function ScanModal({ onClose, onScanned, sets }) {
  const [scanCode, setScanCode] = useState("");
  const [foundSet, setFoundSet] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [issuePhoto, setIssuePhoto] = useState(null);
  const inputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  useEffect(() => {
    if (cameraActive && videoRef.current) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then((stream) => {
          videoRef.current.srcObject = stream;
        })
        .catch((err) => console.error("Camera error:", err));
    }
    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraActive]);

  const captureBarcode = () => {
    if (canvasRef.current && videoRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx.drawImage(videoRef.current, 0, 0);
      const imageData = canvasRef.current.toDataURL("image/jpeg");
      setIssuePhoto(imageData);
      setCameraActive(false);
    }
  };

  const captureIssuePhoto = () => {
    if (canvasRef.current && videoRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx.drawImage(videoRef.current, 0, 0);
      const imageData = canvasRef.current.toDataURL("image/jpeg");
      setIssuePhoto(imageData);
      setCameraActive(false);
    }
  };

  const handleScan = (code) => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    const match = sets.find(
      (s) => s.set_code?.toUpperCase() === trimmed || s.id === trimmed
    );
    if (match) {
      setFoundSet(match);
      setNewStatus(match.status);
      setNewLocation(match.location);
      setNotFound(false);
    } else {
      setFoundSet(null);
      setNotFound(true);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleScan(scanCode);
  };

  const handleConfirm = async () => {
    if (!foundSet) return;
    setSaving(true);
    const user = await base44.auth.me();
    const prevStatus = foundSet.status;
    const prevLocation = foundSet.location;

    await base44.entities.SurgicalSet.update(foundSet.id, {
      status: newStatus,
      location: newLocation,
      last_scan_by: user.email,
      ...(newStatus === "Sterilizing" ? { last_sterilized: new Date().toISOString() } : {}),
    });

    const action =
      newStatus === "In Use" ? "Checked Out" :
      newStatus === "Available" ? "Checked In" :
      "Status Update";

    await base44.entities.ScanLog.create({
      set_id: foundSet.id,
      set_code: foundSet.set_code,
      set_name: foundSet.name,
      action,
      from_status: prevStatus,
      to_status: newStatus,
      from_location: prevLocation,
      to_location: newLocation,
      scanned_by: user.email,
      notes,
    });

    // If returned from In Use → resolve any "not returned" alerts
    if (prevStatus === "In Use" && (newStatus === "Sterilizing" || newStatus === "Available")) {
      const openAlerts = await base44.entities.Alert.filter({ set_id: foundSet.id, is_resolved: false });
      for (const alert of openAlerts) {
        await base44.entities.Alert.update(alert.id, {
          is_resolved: true,
          resolved_by: user.email,
          resolved_at: new Date().toISOString(),
          resolution_notes: `Set scanned back in by ${user.email}`,
        });
      }
    }

    setSaving(false);
    setSaved(true);
    onScanned();
    setTimeout(() => {
      setSaved(false);
      setScanCode("");
      setFoundSet(null);
      setNotes("");
      inputRef.current?.focus();
    }, 1800);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden">
        <div className="bg-gradient-to-br from-teal-600 to-teal-700 px-6 pt-6 pb-5">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2 text-xl">
              <ScanLine className="w-5 h-5" /> Scan Instrument Set
            </DialogTitle>
            <p className="text-teal-100 text-sm mt-1">Scan barcode or enter set code manually</p>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-5">
          <div className="space-y-2">
            <Label className="text-slate-600 text-xs font-semibold uppercase tracking-wide">Set Code / Barcode</Label>
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={scanCode}
                onChange={(e) => { setScanCode(e.target.value); setNotFound(false); setFoundSet(null); }}
                onKeyDown={handleKeyDown}
                placeholder="Scan or type set code..."
                className="rounded-xl border-slate-200 font-mono text-sm"
              />
              <Button onClick={() => handleScan(scanCode)} className="bg-teal-600 hover:bg-teal-700 rounded-xl px-4">
                <ScanLine className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {notFound && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700 text-sm font-medium">Set code not found. Please verify and try again.</p>
            </div>
          )}

          {foundSet && !saved && (
            <div className="space-y-4">
              <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  <span className="font-semibold text-teal-800">{foundSet.name}</span>
                </div>
                <p className="text-teal-600 text-xs font-mono">{foundSet.set_code}</p>
                <div className="flex gap-3 mt-2 text-xs text-teal-700">
                  <span>Current: <strong>{foundSet.status}</strong></span>
                  <span>•</span>
                  <span>{foundSet.location}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Update Status</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger className="rounded-xl border-slate-200 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Update Location</Label>
                  <Select value={newLocation} onValueChange={setNewLocation}>
                    <SelectTrigger className="rounded-xl border-slate-200 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LOCATION_OPTIONS.map((l) => (
                        <SelectItem key={l} value={l}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Notes (optional)</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add scan notes..."
                  className="rounded-xl border-slate-200 text-sm"
                />
              </div>

              <Button
                onClick={handleConfirm}
                disabled={saving}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl py-3"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Confirm Scan & Update
              </Button>
            </div>
          )}

          {saved && (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-emerald-600" />
              </div>
              <p className="font-semibold text-slate-800">Set Updated Successfully</p>
              <p className="text-slate-500 text-sm">Ready for next scan...</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
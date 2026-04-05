import React from "react";
import SurgeonPreferencePanel from "../components/inventory/SurgeonPreferencePanel";
import { ClipboardList } from "lucide-react";

export default function SurgeonPreferenceCards() {
  return (
    <div className="min-h-screen bg-[#F0F4F8] p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-700 rounded-2xl flex items-center justify-center shadow-md">
            <ClipboardList className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Surgeon Preference Cards</h1>
            <p className="text-sm text-slate-500 mt-0.5">Per-procedure preferences by surgeon</p>
          </div>
        </div>

        <SurgeonPreferencePanel />
      </div>
    </div>
  );
}
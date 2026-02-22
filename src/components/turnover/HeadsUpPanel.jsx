import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

const DURATIONS = [
  { value: "10-mins", label: "10 Minutes" },
  { value: "15-mins", label: "15 Minutes" },
  { value: "30-mins", label: "30 Minutes" },
];

export default function HeadsUpPanel({ turnover, onHeadsUp }) {
  const [selectedDuration, setSelectedDuration] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleHeadsUp = async (duration) => {
    setIsLoading(true);
    await onHeadsUp(duration);
    setIsLoading(false);
    setSelectedDuration(null);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
      <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-amber-600" /> Heads Up Notification
      </h3>
      
      <p className="text-sm text-slate-600 mb-4">Send room closing notification via Vocera to assigned staff</p>

      <div className="grid grid-cols-3 gap-3">
        {DURATIONS.map(d => (
          <Button
            key={d.value}
            onClick={() => handleHeadsUp(d.value)}
            disabled={isLoading}
            variant={selectedDuration === d.value ? "default" : "outline"}
            className="text-sm"
          >
            {d.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
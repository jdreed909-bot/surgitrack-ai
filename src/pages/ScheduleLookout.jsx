import React from "react";
import FiveDayLookout from "../components/inventory/FiveDayLookout";

export default function ScheduleLookout() {
  return (
    <div className="min-h-screen bg-[#F0F4F8]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <FiveDayLookout />
      </div>
    </div>
  );
}
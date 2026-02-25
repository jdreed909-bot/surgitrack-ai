import React, { useEffect, useState } from "react";
import FiveDayLookout from "../components/inventory/FiveDayLookout";
import { canModify } from "../lib/PageNotFound";
import { base44 } from "@/api/base44Client";

export default function ScheduleLookout() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => null);
  }, []);

  return (
    <div className="min-h-screen bg-[#F0F4F8]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <FiveDayLookout canModify={currentUser && canModify(currentUser.role, "ScheduleLookout")} />
      </div>
    </div>
  );
}
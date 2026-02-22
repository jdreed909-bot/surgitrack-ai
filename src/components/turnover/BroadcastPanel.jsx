import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

const BROADCAST_ROLES = ["RN", "Scrub Tech", "Charge RN", "Anesthesia Provider"];

export default function BroadcastPanel({ turnover, onBroadcast }) {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { data: staff = [] } = useQuery({
    queryKey: ["staff-roster"],
    queryFn: () => base44.entities.StaffRoster.list("-created_date", 100),
  });

  const staffByRole = BROADCAST_ROLES.reduce((acc, role) => {
    acc[role] = staff.filter(s => s.role === role);
    return acc;
  }, {});

  const handleBroadcast = async () => {
    setIsLoading(true);
    // Collect all recipients by role
    const recipients = [];
    Object.entries(staffByRole).forEach(([role, members]) => {
      members.forEach(member => {
        if (member.email) recipients.push({ email: member.email, name: member.name, role });
      });
    });

    await onBroadcast({
      message,
      recipients,
      roles: Object.keys(staffByRole),
    });
    setMessage("");
    setIsLoading(false);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
      <h3 className="font-bold text-slate-900 mb-4">📢 Broadcast Message</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        {Object.entries(staffByRole).map(([role, members]) => (
          <div key={role} className="bg-slate-50 rounded-lg p-3">
            <div className="text-xs font-bold text-slate-700 uppercase mb-2">{role}</div>
            <div className="space-y-1">
              {members.length === 0 ? (
                <div className="text-xs text-slate-400">No staff</div>
              ) : (
                members.map((m, idx) => (
                  <div key={idx} className="text-xs text-slate-600">{m.name}</div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      <Textarea
        placeholder="Enter broadcast message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="mb-3"
        rows="3"
      />

      <Button
        onClick={handleBroadcast}
        disabled={!message || isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        <Send className="w-4 h-4 mr-2" /> Send Broadcast
      </Button>
    </div>
  );
}
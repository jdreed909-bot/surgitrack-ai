import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Phone, AlertCircle, Lock } from "lucide-react";
import CallCalendar from "../components/call/CallCalendar";
import CallSlot from "../components/call/CallSlot";
import SwitchLedger from "../components/call/SwitchLedger";
import HolidaySchedule from "../components/call/HolidaySchedule";
import StaffCallPanel from "../components/call/StaffCallPanel";
import CallBroadcast from "../components/call/CallBroadcast";
import { canModify } from "../lib/PageNotFound";

export default function RNCall() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [switchDialogOpen, setSwitchDialogOpen] = useState(false);
  const [switchType, setSwitchType] = useState(null); // "giveaway" or "pickup"
  const [selectedCall, setSelectedCall] = useState(null);
  const [reason, setReason] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const queryClient = useQueryClient();

  // Get current user
  React.useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => null);
  }, []);

  const canUserModify = currentUser && canModify(currentUser.role, "RNCall");

  const { data: schedules = [] } = useQuery({
    queryKey: ["call-schedules-rn"],
    queryFn: () => base44.entities.CallSchedule.filter({ role: "RN" }, "-call_date", 200),
    refetchInterval: 30000,
  });

  const { data: switches = [] } = useQuery({
    queryKey: ["call-switches-rn"],
    queryFn: () => base44.entities.CallSwitch.filter({ role: "RN" }, "-created_date", 100),
    refetchInterval: 30000,
  });

  const createSwitchMutation = useMutation({
    mutationFn: async (switchData) => {
      const autoApprove = switchData.switch_type === "Switch";
      return base44.entities.CallSwitch.create({
        ...switchData,
        status: autoApprove ? "Auto-Approved" : "Pending",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["call-switches-rn"]);
      queryClient.invalidateQueries(["call-schedules-rn"]);
      setSwitchDialogOpen(false);
      setReason("");
      setSelectedCall(null);
    },
  });

  const approveSwitchMutation = useMutation({
    mutationFn: (switchId) =>
      base44.entities.CallSwitch.update(switchId, {
        status: "Approved",
        approved_by: currentUser?.email,
        approved_at: new Date().toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(["call-switches-rn"]);
    },
  });

  const denySwitchMutation = useMutation({
    mutationFn: (switchId) =>
      base44.entities.CallSwitch.update(switchId, { status: "Denied" }),
    onSuccess: () => {
      queryClient.invalidateQueries(["call-switches-rn"]);
    },
  });

  const handlePickup = (call) => {
    if (!canUserModify) return;
    setSelectedCall(call);
    setSwitchType("pickup");
    setSwitchDialogOpen(true);
  };

  const handleGiveaway = (call) => {
    if (!canUserModify) return;
    setSelectedCall(call);
    setSwitchType("giveaway");
    setSwitchDialogOpen(true);
  };

  const handleSubmitSwitch = () => {
    if (!selectedCall || !currentUser) return;

    const switchData = {
      role: "RN",
      call_date: selectedCall.call_date,
      call_type: selectedCall.call_type,
      switch_type: switchType === "pickup" ? "Pickup" : "Giveaway",
      from_staff: switchType === "pickup" ? selectedCall.staff_member : currentUser.full_name,
      from_email: switchType === "pickup" ? selectedCall.staff_email : currentUser.email,
      reason: reason.trim() || undefined,
    };

    if (switchType === "pickup") {
      switchData.to_staff = currentUser.full_name;
      switchData.to_email = currentUser.email;
    }

    createSwitchMutation.mutate(switchData);
  };

  const dateCallSchedules = schedules.filter(
    (call) =>
      call.call_date === format(selectedDate, "yyyy-MM-dd")
  );

  const pendingUserSwitches = switches.filter(
    (s) =>
      s.status === "Pending" &&
      (s.from_email === currentUser?.email || s.to_email === currentUser?.email)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">RN Call Schedule</h1>
              <p className="text-sm text-slate-600">11p-7a daily • 5p-11p weekends</p>
            </div>
          </div>
          {pendingUserSwitches.length > 0 && (
            <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div className="text-sm text-amber-800">
                You have {pendingUserSwitches.length} pending switch request{pendingUserSwitches.length !== 1 ? "s" : ""}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar & Holidays */}
          <div className="space-y-6">
            <CallCalendar
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              callSchedules={schedules}
              role="RN"
            />
            <HolidaySchedule
              callSchedules={schedules}
              role="RN"
            />
          </div>

          {/* Call Slots for Selected Date */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <h2 className="text-sm font-bold text-slate-900 mb-4">
                {format(selectedDate, "EEEE, MMMM d, yyyy")}
              </h2>

              {dateCallSchedules.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  No RN calls scheduled for this date
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {dateCallSchedules.map((call, idx) => (
                    <CallSlot
                      key={idx}
                      call={call}
                      onPickup={handlePickup}
                      onGiveaway={handleGiveaway}
                      isCurrentUser={call.staff_email === currentUser?.email}
                      canModify={canUserModify}
                      isPending={switches.some(
                        (s) =>
                          s.status === "Pending" &&
                          s.call_date === call.call_date &&
                          (s.from_email === currentUser?.email ||
                            s.to_email === currentUser?.email)
                      )}
                    />
                  ))}
                </div>
              )}
            </div>

            <CallBroadcast role="RN" />

            {/* Switch Ledger */}
            <SwitchLedger
              switches={switches}
              onApprove={(id) => approveSwitchMutation.mutate(id)}
              onDeny={(id) => denySwitchMutation.mutate(id)}
              userRole={currentUser?.role}
              canApprove={canUserModify}
            />
            <StaffCallPanel role="RN" />
          </div>
        </div>
      </div>

      {/* Switch Dialog */}
      <Dialog open={switchDialogOpen} onOpenChange={setSwitchDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {switchType === "pickup" ? "Pick Up Call" : "Give Away Call"}
            </DialogTitle>
          </DialogHeader>

          {selectedCall && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-3 space-y-1.5">
                <div className="text-xs text-slate-600">Call Details</div>
                <div className="text-sm font-semibold text-slate-900">
                  {format(new Date(selectedCall.call_date), "MMM d, yyyy")}
                </div>
                <div className="text-sm text-slate-700">
                  {selectedCall.start_time} — {selectedCall.end_time}
                </div>
                {switchType === "pickup" && (
                  <div className="text-xs text-slate-600 mt-2">
                    Currently: <span className="font-semibold">{selectedCall.staff_member}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600">Reason (optional)</label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Why are you requesting this switch?"
                  rows={3}
                  className="text-sm"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-xs text-blue-800">
                  {switchType === "pickup"
                    ? "This request will be pending approval from leadership"
                    : "This request will be pending approval from leadership"}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setSwitchDialogOpen(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitSwitch}
                  className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                >
                  Submit Request
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
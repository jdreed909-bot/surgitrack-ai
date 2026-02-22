import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BroadcastPanel from "../components/turnover/BroadcastPanel";
import HeadsUpPanel from "../components/turnover/HeadsUpPanel";
import WheelsOutPanel from "../components/turnover/WheelsOutPanel";

export default function Turnover() {
  const [selectedRoom, setSelectedRoom] = useState("OR 1");
  const [currentUser, setCurrentUser] = useState(null);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => null);
  }, []);

  const { data: cases = [] } = useQuery({
    queryKey: ["cases-today"],
    queryFn: () => base44.entities.SurgicalCase.list("-scheduled_date", 50),
  });

  const { data: staffAssignments = [] } = useQuery({
    queryKey: ["staff-assignments"],
    queryFn: () => base44.entities.StaffAssignment.list("-created_date", 100),
  });

  const broadcastMutation = useMutation({
    mutationFn: async ({ message, recipients }) => {
      // Create turnover record
      const turnover = await base44.entities.Turnover.create({
        or_room: selectedRoom,
        broadcast_sent: true,
        broadcast_message: message,
        assigned_staff: recipients.map(r => ({
          email: r.email,
          name: r.name,
          role: r.role,
        })),
      });
      return turnover;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["turnovers"] });
    },
  });

  const headsUpMutation = useMutation({
    mutationFn: async (duration) => {
      // Send vocera notification (simulated)
      const assignment = staffAssignments.find(a => a.or_room === selectedRoom);
      if (assignment) {
        return base44.entities.Turnover.create({
          or_room: selectedRoom,
          heads_up_sent_at: new Date().toISOString(),
          heads_up_duration: duration,
          assigned_staff: [
            assignment.rn_name && { name: assignment.rn_name, role: "RN" },
            assignment.scrub_tech_name && { name: assignment.scrub_tech_name, role: "Scrub Tech" },
            assignment.charge_rn_name && { name: assignment.charge_rn_name, role: "Charge RN" },
          ].filter(Boolean),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["turnovers"] });
    },
  });

  const wheelsOutMutation = useMutation({
    mutationFn: async ({ action, timestamp }) => {
      const caseData = cases.find(c => c.or_room === selectedRoom);
      const assignment = staffAssignments.find(a => a.or_room === selectedRoom);

      if (action === "cleaning_start") {
        return base44.entities.Turnover.create({
          or_room: selectedRoom,
          case_id: caseData?.id,
          status: "cleaning",
          wheels_out_time: timestamp.toISOString(),
          cleaning_start_time: timestamp.toISOString(),
          assigned_staff: [
            assignment?.rn_name && { name: assignment.rn_name, role: "RN", email: assignment.rn_vocera_id },
            assignment?.scrub_tech_name && { name: assignment.scrub_tech_name, role: "Scrub Tech", email: assignment.scrub_tech_vocera_id },
            caseData?.anesthesia_provider && { name: caseData.anesthesia_provider, role: "Anesthesia Provider" },
            caseData?.surgeon && { name: caseData.surgeon, role: "Surgeon" },
          ].filter(Boolean),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["turnovers"] });
    },
  });

  return (
    <div className="min-h-screen bg-[#F0F4F8] p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Turnover Management</h1>
          
          <Select value={selectedRoom} onValueChange={setSelectedRoom}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["OR 1", "OR 2", "OR 3", "OR 4", "OR 5", "OR 6", "OR 7"].map(room => (
                <SelectItem key={room} value={room}>{room}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="broadcast" className="space-y-6">
          <TabsList>
            <TabsTrigger value="broadcast">Broadcast</TabsTrigger>
            <TabsTrigger value="headsup">Heads Up</TabsTrigger>
            <TabsTrigger value="wheelsout">Wheels Out</TabsTrigger>
          </TabsList>

          <TabsContent value="broadcast">
            <BroadcastPanel
              turnover={{ or_room: selectedRoom }}
              onBroadcast={(data) => broadcastMutation.mutate(data)}
            />
          </TabsContent>

          <TabsContent value="headsup">
            <HeadsUpPanel
              turnover={{ or_room: selectedRoom }}
              onHeadsUp={(duration) => headsUpMutation.mutate(duration)}
            />
          </TabsContent>

          <TabsContent value="wheelsout">
            <WheelsOutPanel
              turnover={{ or_room: selectedRoom }}
              onWheelsOut={(data) => wheelsOutMutation.mutate(data)}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
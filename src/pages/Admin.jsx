import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Lock } from "lucide-react";
import StaffRow from "../components/admin/StaffRow";
import TemporaryPermissionsModal from "../components/admin/TemporaryPermissionsModal";
import { canModify } from "../lib/PageNotFound";

export default function Admin() {
  const [currentUser, setCurrentUser] = useState(null);
  const [permissionsModalOpen, setPermissionsModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => null);
  }, []);

  const canUserModify = currentUser && canModify(currentUser.role, "Admin");

  const { data: staff = [] } = useQuery({
    queryKey: ["staff"],
    queryFn: () => base44.entities.User.list("-created_date", 100),
  });

  const updateStaffMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.User.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["staff"] }),
  });

  const deleteStaffMutation = useMutation({
    mutationFn: (id) => base44.entities.User.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["staff"] }),
  });

  const grantPermissionMutation = useMutation({
    mutationFn: async ({ id, role, duration }) => {
      const durationMap = {
        "1-day": 1,
        "7-days": 7,
        "30-days": 30,
        "permanent": null,
      };
      const days = durationMap[duration];
      const expiresAt = days ? new Date(Date.now() + days * 24 * 60 * 60 * 1000) : null;

      const existingPerms = staff.find(s => s.id === id)?.temporary_permissions || [];
      const newPerm = {
        role,
        granted_at: new Date().toISOString(),
        duration,
        expires_at: expiresAt?.toISOString() || null,
      };

      return base44.entities.User.update(id, {
        temporary_permissions: [...existingPerms, newPerm],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      setPermissionsModalOpen(false);
    },
  });

  const openPermissionsModal = (staffMember) => {
    setSelectedStaff(staffMember);
    setPermissionsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Staff Management</h1>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900">Staff Roster</h2>
          </div>

          <div className="space-y-2">
            {staff.map(s => (
              <div key={s.id}>
                <StaffRow
                  staff={s}
                  onUpdate={(id, data) => updateStaffMutation.mutate({ id, data })}
                  onDelete={(id) => deleteStaffMutation.mutate(id)}
                  canModify={canUserModify}
                />
                {canUserModify && (
                  <Button
                    onClick={() => openPermissionsModal(s)}
                    variant="outline"
                    size="sm"
                    className="mt-1 w-full text-xs"
                  >
                    <Lock className="w-3 h-3 mr-1" /> Manage Permissions
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedStaff && (
        <TemporaryPermissionsModal
          open={permissionsModalOpen}
          onClose={() => setPermissionsModalOpen(false)}
          staff={selectedStaff}
          onGrant={(id, role, duration) => grantPermissionMutation.mutate({ id, role, duration })}
        />
      )}
    </div>
  );
}
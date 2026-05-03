/**
 * Role-based permissions configuration
 * Defines what each role can do in specific sections
 */

const ALL_SECTIONS_FULL = {
  SurgeonDirectory: ["view", "modify"],
  UsageDashboard: ["view", "modify"],
  SurgeonPreferenceCards: ["view", "modify"],
  Schedule: ["view", "modify"],
  CaseTracking: ["view", "modify"],
  ScheduleLookout: ["view", "modify"],
  RNCall: ["view", "modify"],
  STCall: ["view", "modify"],
  TextNotifications: ["view", "modify"],
  Inventory: ["view", "modify"],
  Alerts: ["view", "modify"],
  StaffRoster: ["view", "modify"],
  StaffingSchedule: ["view", "modify"],
  Vendors: ["view", "modify"],
  SpecialtyEquipment: ["view", "modify"],
  EducationalResources: ["view", "modify"],
  Turnover: ["view", "modify"],
  PolicyBot: ["view", "modify"],
  PreOpBoard: ["view", "modify"],
  TrackCore: ["view"],
  Admin: ["view", "modify"],
};

const PERMISSIONS = {
  // Full access including Admin
  admin: { ...ALL_SECTIONS_FULL },

  // ANM (Assistant Nurse Manager) — full access including Admin
  anm: { ...ALL_SECTIONS_FULL },

  // Charge Nurse — all features except Admin tab
  charge_nurse: {
    ...ALL_SECTIONS_FULL,
    Admin: [],
  },

  // Pre/PACU Nurse — only PreOpBoard, RNCall, Alerts, EducationalResources, TextNotifications
  prepacu_nurse: {
    PreOpBoard: ["view", "modify"],
    RNCall: ["view", "modify"],
    Alerts: ["view", "modify"],
    EducationalResources: ["view", "modify"],
    TextNotifications: ["view", "modify"],
  },

  // OR Nurse — all features including Admin
  or_nurse: { ...ALL_SECTIONS_FULL },

  // Surgical Technician — all features including Admin
  surgical_tech: { ...ALL_SECTIONS_FULL },

  // Legacy roles kept for backwards compatibility
  manager: { ...ALL_SECTIONS_FULL },
  user: {
    Schedule: ["view"],
    CaseTracking: ["view"],
    ScheduleLookout: ["view"],
    RNCall: ["view"],
    STCall: ["view"],
    TextNotifications: ["view"],
    Inventory: ["view"],
    Alerts: ["view"],
    StaffRoster: ["view"],
    StaffingSchedule: ["view"],
    Vendors: ["view"],
    SpecialtyEquipment: ["view"],
    EducationalResources: ["view"],
    Turnover: ["view"],
    PolicyBot: ["view"],
    PreOpBoard: ["view", "modify"],
    TrackCore: ["view"],
    UsageDashboard: ["view"],
    SurgeonDirectory: ["view"],
    SurgeonPreferenceCards: ["view"],
  },
};

/**
 * Check if a user with a specific role can perform an action in a section
 * @param {string} role - User role (admin, manager, charge_nurse, user)
 * @param {string} section - Page/section name
 * @param {string} action - Action to perform (view, modify)
 * @returns {boolean}
 */
export function hasPermission(role, section, action) {
  const rolePermissions = PERMISSIONS[role] || PERMISSIONS.user;
  const sectionPermissions = rolePermissions[section] || [];
  return sectionPermissions.includes(action);
}

/**
 * Check if user can modify a section
 * @param {string} role - User role
 * @param {string} section - Page/section name
 * @returns {boolean}
 */
export function canModify(role, section) {
  return hasPermission(role, section, "modify");
}

/**
 * Check if user can view a section
 * @param {string} role - User role
 * @param {string} section - Page/section name
 * @returns {boolean}
 */
export function canView(role, section) {
  return hasPermission(role, section, "view");
}

// Original PageNotFound component below
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export function PageNotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-slate-900 mb-2">404</h1>
        <p className="text-xl text-slate-600 mb-8">Page not found</p>
        <Link to={createPageUrl("Schedule")}>
          <Button className="bg-teal-600 hover:bg-teal-700 rounded-xl">
            Go Home
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default PageNotFound;
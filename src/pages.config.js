/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Alerts from './pages/Alerts';
import EducationalResources from './pages/EducationalResources';
import Inventory from './pages/Inventory';
import ScanHistory from './pages/ScanHistory';
import Schedule from './pages/Schedule';
import SpecialtyEquipment from './pages/SpecialtyEquipment';
import StaffRoster from './pages/StaffRoster';
import StaffingSchedule from './pages/StaffingSchedule';
import TextNotifications from './pages/TextNotifications';
import Vendors from './pages/Vendors';
import ScheduleLookout from './pages/ScheduleLookout';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Alerts": Alerts,
    "EducationalResources": EducationalResources,
    "Inventory": Inventory,
    "ScanHistory": ScanHistory,
    "Schedule": Schedule,
    "SpecialtyEquipment": SpecialtyEquipment,
    "StaffRoster": StaffRoster,
    "StaffingSchedule": StaffingSchedule,
    "TextNotifications": TextNotifications,
    "Vendors": Vendors,
    "ScheduleLookout": ScheduleLookout,
}

export const pagesConfig = {
    mainPage: "Inventory",
    Pages: PAGES,
    Layout: __Layout,
};
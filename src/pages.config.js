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
import Admin from './pages/Admin';
import Alerts from './pages/Alerts';
import CaseTracking from './pages/CaseTracking';
import EducationalResources from './pages/EducationalResources';
import Inventory from './pages/Inventory';
import PolicyBot from './pages/PolicyBot';
import PreOpBoard from './pages/PreOpBoard';
import RNCall from './pages/RNCall';
import STCall from './pages/STCall';
import ScanHistory from './pages/ScanHistory';
import Schedule from './pages/Schedule';
import ScheduleLookout from './pages/ScheduleLookout';
import SpecialtyEquipment from './pages/SpecialtyEquipment';
import StaffRoster from './pages/StaffRoster';
import StaffingSchedule from './pages/StaffingSchedule';
import TextNotifications from './pages/TextNotifications';
import TrackCore from './pages/TrackCore';
import Turnover from './pages/Turnover';
import Vendors from './pages/Vendors';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Admin": Admin,
    "Alerts": Alerts,
    "CaseTracking": CaseTracking,
    "EducationalResources": EducationalResources,
    "Inventory": Inventory,
    "PolicyBot": PolicyBot,
    "PreOpBoard": PreOpBoard,
    "RNCall": RNCall,
    "STCall": STCall,
    "ScanHistory": ScanHistory,
    "Schedule": Schedule,
    "ScheduleLookout": ScheduleLookout,
    "SpecialtyEquipment": SpecialtyEquipment,
    "StaffRoster": StaffRoster,
    "StaffingSchedule": StaffingSchedule,
    "TextNotifications": TextNotifications,
    "TrackCore": TrackCore,
    "Turnover": Turnover,
    "Vendors": Vendors,
}

export const pagesConfig = {
    mainPage: "Inventory",
    Pages: PAGES,
    Layout: __Layout,
};
import AdminDashboard from './pages/AdminDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import Home from './pages/Home';
import Kiosk from './pages/Kiosk';
import ManagerDashboard from './pages/ManagerDashboard';
import ScheduleCalendar from './pages/ScheduleCalendar';
import ProfileSetup from './pages/ProfileSetup';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminDashboard": AdminDashboard,
    "EmployeeDashboard": EmployeeDashboard,
    "Home": Home,
    "Kiosk": Kiosk,
    "ManagerDashboard": ManagerDashboard,
    "ScheduleCalendar": ScheduleCalendar,
    "ProfileSetup": ProfileSetup,
}

export const pagesConfig = {
    mainPage: "EmployeeDashboard",
    Pages: PAGES,
    Layout: __Layout,
};
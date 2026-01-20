import EmployeeDashboard from './pages/EmployeeDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Home from './pages/Home';
import Kiosk from './pages/Kiosk';
import __Layout from './Layout.jsx';


export const PAGES = {
    "EmployeeDashboard": EmployeeDashboard,
    "ManagerDashboard": ManagerDashboard,
    "AdminDashboard": AdminDashboard,
    "Home": Home,
    "Kiosk": Kiosk,
}

export const pagesConfig = {
    mainPage: "EmployeeDashboard",
    Pages: PAGES,
    Layout: __Layout,
};
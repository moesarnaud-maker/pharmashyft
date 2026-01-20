import EmployeeDashboard from './pages/EmployeeDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import AdminDashboard from './pages/AdminDashboard';


export const PAGES = {
    "EmployeeDashboard": EmployeeDashboard,
    "ManagerDashboard": ManagerDashboard,
    "AdminDashboard": AdminDashboard,
}

export const pagesConfig = {
    mainPage: "EmployeeDashboard",
    Pages: PAGES,
};
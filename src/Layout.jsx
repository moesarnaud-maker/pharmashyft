import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { formatUserName, getUserInitials } from '@/components/utils/helpers';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Clock, User, LogOut, Menu, Home, Settings, Users, ChevronDown, Calendar } from 'lucide-react';

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
      } catch (err) {
        // Not logged in
      }
    };
    loadUser();
  }, []);

  const isKiosk = currentPageName === 'Kiosk';
  const isAdmin = user?.role === 'admin';

  if (isKiosk) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {user && (
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <Link to={createPageUrl('Home')} className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-slate-800">PharmaShyft</span>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center gap-1">
                <Link to={createPageUrl('Home')}>
                  <Button variant="ghost" size="sm" className={currentPageName === 'Home' ? 'bg-slate-100' : ''}>
                    <Home className="w-4 h-4 mr-2" />
                    Home
                  </Button>
                </Link>
                <Link to={createPageUrl('EmployeeDashboard')}>
                  <Button variant="ghost" size="sm" className={currentPageName === 'EmployeeDashboard' ? 'bg-slate-100' : ''}>
                    <Clock className="w-4 h-4 mr-2" />
                    Time Clock
                  </Button>
                </Link>
                <Link to={createPageUrl('ScheduleCalendar')}>
                  <Button variant="ghost" size="sm" className={currentPageName === 'ScheduleCalendar' ? 'bg-slate-100' : ''}>
                    <Calendar className="w-4 h-4 mr-2" />
                    Calendar
                  </Button>
                </Link>
                {isAdmin && (
                  <>
                    <Link to={createPageUrl('ManagerDashboard')}>
                      <Button variant="ghost" size="sm" className={currentPageName === 'ManagerDashboard' ? 'bg-slate-100' : ''}>
                        <Users className="w-4 h-4 mr-2" />
                        Manager
                      </Button>
                    </Link>
                    <Link to={createPageUrl('AdminDashboard')}>
                      <Button variant="ghost" size="sm" className={currentPageName === 'AdminDashboard' ? 'bg-slate-100' : ''}>
                        <Settings className="w-4 h-4 mr-2" />
                        Admin
                      </Button>
                    </Link>
                  </>
                )}
              </div>

              {/* User Menu */}
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-medium">
                        {getUserInitials(user)}
                      </div>
                      <span className="hidden sm:inline">{user?.first_name || formatUserName(user).split(' ')[0]}</span>
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium text-slate-800">{formatUserName(user)}</p>
                      <p className="text-xs text-slate-500">{user?.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => base44.auth.logout()}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Mobile menu button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Mobile Navigation */}
            {mobileMenuOpen && (
              <div className="md:hidden py-4 border-t">
                <div className="flex flex-col gap-2">
                  <Link to={createPageUrl('Home')} onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      <Home className="w-4 h-4 mr-2" />
                      Home
                    </Button>
                  </Link>
                  <Link to={createPageUrl('EmployeeDashboard')} onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      <Clock className="w-4 h-4 mr-2" />
                      Time Clock
                    </Button>
                  </Link>
                  <Link to={createPageUrl('ScheduleCalendar')} onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      <Calendar className="w-4 h-4 mr-2" />
                      Calendar
                    </Button>
                  </Link>
                  {isAdmin && (
                    <>
                      <Link to={createPageUrl('ManagerDashboard')} onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start">
                          <Users className="w-4 h-4 mr-2" />
                          Manager
                        </Button>
                      </Link>
                      <Link to={createPageUrl('AdminDashboard')} onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start">
                          <Settings className="w-4 h-4 mr-2" />
                          Admin
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </nav>
      )}

      <main>
        {children}
      </main>
    </div>
  );
}
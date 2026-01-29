import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Users, Settings, FileText, Building, Download, Shield, BarChart2, Calendar, MapPin } from 'lucide-react';
import { formatUserName } from '@/components/utils/helpers';

import StatsCard from '@/components/common/StatsCard';
import UserManagement from '@/components/admin/UserManagement';
import TeamManagement from '@/components/admin/TeamManagement';
import SettingsPanel from '@/components/admin/SettingsPanel';
import AuditLogViewer from '@/components/admin/AuditLogViewer';
import ExportPanel from '@/components/reports/ExportPanel';
import ReportsPanel from '@/components/reports/ReportsPanel';
import ScheduleManagement from '@/components/schedule/ScheduleManagement';
import LocationManagement from '@/components/admin/LocationManagement';

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const u = await base44.auth.me();
      setUser(u);
    };
    loadUser();
  }, []);

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list(),
  });

  const { data: schedules = [] } = useQuery({
    queryKey: ['schedules'],
    queryFn: () => base44.entities.Schedule.list(),
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: () => base44.entities.Location.list(),
  });

  const { data: settings = [] } = useQuery({
    queryKey: ['settings'],
    queryFn: () => base44.entities.AppSettings.list(),
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: () => base44.entities.AuditLog.list('-created_date', 500),
  });

  const { data: timesheetLines = [] } = useQuery({
    queryKey: ['timesheetLines'],
    queryFn: () => base44.entities.TimesheetLine.list('-date', 1000),
  });

  const { data: timeEntries = [] } = useQuery({
    queryKey: ['timeEntries'],
    queryFn: () => base44.entities.TimeEntry.list('-date', 1000),
  });

  const inviteUserMutation = useMutation({
    mutationFn: async ({ email, role }) => {
      // Base44 SDK only supports 'user' and 'admin' for invitations.
      // For 'manager', invite as 'user' then update role afterwards.
      const inviteRole = role === 'manager' ? 'user' : role;
      await base44.users.inviteUser(email, inviteRole);

      // The user record is created asynchronously by the SDK.
      // Retry with increasing delays until we find it (up to 5 attempts).
      let newUser = null;
      for (let attempt = 0; attempt < 5; attempt++) {
        await new Promise(r => setTimeout(r, 1000 + attempt * 1000));
        const allUsers = await base44.entities.User.list();
        newUser = allUsers.find(u => u.email === email);
        if (newUser) break;
      }

      if (!newUser) {
        throw new Error('User was invited but could not be found. Please check the Pending Invitations tab in a few moments.');
      }

      // Mark as pending so it appears in the Pending Invitations tab
      await base44.entities.User.update(newUser.id, {
        status: 'pending_invitation',
        role: role,
        invited_at: new Date().toISOString(),
        profile_completed: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User invited successfully');
    },
    onError: (err) => {
      toast.error('Failed to invite user: ' + (err.message || 'Unknown error'));
    },
  });

  const resendInviteMutation = useMutation({
    mutationFn: async (user) => {
      await base44.users.resendInvite(user.email);
    },
    onSuccess: () => {
      toast.success('Invitation resent successfully');
    },
    onError: (err) => {
      toast.error('Failed to resend invitation');
    },
  });

  const cancelInviteMutation = useMutation({
    mutationFn: async (user) => {
      await base44.entities.User.delete(user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Invitation cancelled');
    },
    onError: (err) => {
      toast.error('Failed to cancel invitation');
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (user) => {
      const employee = employees.find(e => e.user_id === user.id);
      
      if (employee) {
        const timeEntries = await base44.entities.TimeEntry.filter({ employee_id: employee.id });
        for (const entry of timeEntries) {
          await base44.entities.TimeEntry.delete(entry.id);
        }
        
        const timesheets = await base44.entities.Timesheet.filter({ employee_id: employee.id });
        for (const timesheet of timesheets) {
          const lines = await base44.entities.TimesheetLine.filter({ timesheet_id: timesheet.id });
          for (const line of lines) {
            await base44.entities.TimesheetLine.delete(line.id);
          }
          await base44.entities.Timesheet.delete(timesheet.id);
        }
        
        const shifts = await base44.entities.ScheduledShift.filter({ employee_id: employee.id });
        for (const shift of shifts) {
          await base44.entities.ScheduledShift.delete(shift.id);
        }
        
        const assignments = await base44.entities.EmployeeScheduleAssignment.filter({ employee_id: employee.id });
        for (const assignment of assignments) {
          await base44.entities.EmployeeScheduleAssignment.delete(assignment.id);
        }
        
        const availability = await base44.entities.EmployeeAvailability.filter({ employee_id: employee.id });
        for (const avail of availability) {
          await base44.entities.EmployeeAvailability.delete(avail.id);
        }
        
        const absenceRequests = await base44.entities.AbsenceRequest.filter({ employee_id: employee.id });
        for (const request of absenceRequests) {
          await base44.entities.AbsenceRequest.delete(request.id);
        }
        
        const correctionRequests = await base44.entities.CorrectionRequest.filter({ employee_id: employee.id });
        for (const request of correctionRequests) {
          await base44.entities.CorrectionRequest.delete(request.id);
        }
        
        const employeeLocations = await base44.entities.EmployeeLocation.filter({ employee_id: employee.id });
        for (const location of employeeLocations) {
          await base44.entities.EmployeeLocation.delete(location.id);
        }
        
        await base44.entities.Employee.delete(employee.id);
      }
      
      await base44.entities.User.delete(user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
      queryClient.invalidateQueries({ queryKey: ['scheduledShifts'] });
      toast.success('User and employee deleted successfully');
    },
    onError: (err) => {
      console.error('Delete user error:', err);
      toast.error('Failed to delete user: ' + (err.message || 'Unknown error'));
    },
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: async (data) => {
      if (data.employee_id) {
        // UPDATING EXISTING EMPLOYEE
        
        // Check if employee number already exists for this location (excluding current employee)
        const duplicateEmployeeNumber = employees.find(e => 
          e.id !== data.employee_id && 
          e.main_location_id === data.main_location_id && 
          e.employee_number === data.employee_number &&
          e.status === 'active'
        );
        
        if (duplicateEmployeeNumber) {
          const location = locations.find(l => l.id === data.main_location_id);
          toast.error(`Employee number "${data.employee_number}" already exists at ${location?.name || 'this location'}`);
          throw new Error('Duplicate employee number');
        }
        
        await base44.entities.Employee.update(data.employee_id, {
          employee_number: data.employee_number,
          team_id: data.team_id,
          main_location_id: data.main_location_id,
          schedule_id: data.schedule_id,
          contract_hours_week: data.contract_hours_week,
          vacation_days_total: data.vacation_days_total,
          pin_code: data.pin_code,
        });
      } else {
        // CREATING NEW EMPLOYEE
        
        // Check if employee already exists for this user
        const existingEmployee = employees.find(e => e.user_id === data.user_id);
        if (existingEmployee) {
          toast.error('Employee record already exists for this user');
          throw new Error('Employee already exists');
        }
        
        // Check if employee number already exists for this location
        const duplicateEmployeeNumber = employees.find(e => 
          e.main_location_id === data.main_location_id && 
          e.employee_number === data.employee_number &&
          e.status === 'active'
        );
        
        if (duplicateEmployeeNumber) {
          const location = locations.find(l => l.id === data.main_location_id);
          toast.error(`Employee number "${data.employee_number}" already exists at ${location?.name || 'this location'}`);
          throw new Error('Duplicate employee number');
        }
        
        await base44.entities.Employee.create({
          user_id: data.user_id,
          employee_number: data.employee_number,
          team_id: data.team_id,
          main_location_id: data.main_location_id,
          schedule_id: data.schedule_id,
          contract_hours_week: data.contract_hours_week,
          vacation_days_total: data.vacation_days_total,
          pin_code: data.pin_code,
          status: 'active',
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee profile updated successfully');
    },
    onError: (error) => {
      if (error.message !== 'Employee already exists' && error.message !== 'Duplicate employee number') {
        toast.error('Failed to update employee profile');
      }
    },
  });

  const teamMutation = useMutation({
    mutationFn: async ({ action, id, data }) => {
      if (action === 'create') {
        await base44.entities.Team.create(data);
      } else if (action === 'update') {
        await base44.entities.Team.update(id, data);
      } else if (action === 'delete') {
        await base44.entities.Team.delete(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Team updated successfully');
    },
  });

  const settingsMutation = useMutation({
    mutationFn: async (settingsArray) => {
      for (const setting of settingsArray) {
        const existing = settings.find(s => s.setting_key === setting.setting_key);
        if (existing) {
          await base44.entities.AppSettings.update(existing.id, setting);
        } else {
          await base44.entities.AppSettings.create(setting);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });

  const handleExport = async (exportInfo) => {
    await base44.entities.AuditLog.create({
      actor_id: user?.id,
      actor_email: user?.email,
      actor_name: formatUserName(user),
      action: 'export',
      entity_type: 'Timesheet',
      entity_description: `Exported ${exportInfo.type} data with ${exportInfo.rowCount} rows`,
    });
  };

  const activeEmployees = employees.filter(e => e.status === 'active').length;
  const activeTeams = teams.filter(t => t.status === 'active').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Admin Dashboard</h1>
          <p className="text-slate-500 mt-1">System administration and configuration</p>
        </div>

        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <StatsCard
            title="Total Users"
            value={users.length}
            icon={Users}
            color="blue"
            delay={0}
          />
          <StatsCard
            title="Active Employees"
            value={activeEmployees}
            icon={Users}
            color="green"
            delay={1}
          />
          <StatsCard
            title="Teams"
            value={activeTeams}
            icon={Building}
            color="purple"
            delay={2}
          />
          <StatsCard
            title="Audit Events"
            value={auditLogs.length}
            icon={Shield}
            color="amber"
            delay={3}
          />
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="bg-white shadow-sm border flex-wrap">
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="teams" className="gap-2">
              <Building className="w-4 h-4" />
              Teams
            </TabsTrigger>
            <TabsTrigger value="schedules" className="gap-2">
              <Calendar className="w-4 h-4" />
              Schedules
            </TabsTrigger>
            <TabsTrigger value="locations" className="gap-2">
              <MapPin className="w-4 h-4" />
              Locations
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="export" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-2">
              <FileText className="w-4 h-4" />
              Audit Log
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <BarChart2 className="w-4 h-4" />
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UserManagement
              users={users}
              employees={employees}
              teams={teams}
              schedules={schedules}
              onInviteUser={(data) => inviteUserMutation.mutate(data)}
              onUpdateEmployee={(data) => updateEmployeeMutation.mutate(data)}
              onResendInvite={(user) => resendInviteMutation.mutate(user)}
              onCancelInvite={(user) => cancelInviteMutation.mutate(user)}
              onDeleteUser={(user) => deleteUserMutation.mutate(user)}
              isLoading={inviteUserMutation.isPending || updateEmployeeMutation.isPending || deleteUserMutation.isPending}
            />
          </TabsContent>

          <TabsContent value="teams">
            <TeamManagement
              teams={teams}
              users={users}
              onCreateTeam={(data) => teamMutation.mutate({ action: 'create', data })}
              onUpdateTeam={(id, data) => teamMutation.mutate({ action: 'update', id, data })}
              onDeleteTeam={(id) => teamMutation.mutate({ action: 'delete', id })}
              isLoading={teamMutation.isPending}
            />
          </TabsContent>

          <TabsContent value="schedules">
            <ScheduleManagement />
          </TabsContent>

          <TabsContent value="locations">
            <LocationManagement locations={locations} />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsPanel
              settings={settings}
              onSaveSettings={(data) => settingsMutation.mutate(data)}
              isLoading={settingsMutation.isPending}
            />
          </TabsContent>

          <TabsContent value="export">
            <ExportPanel
              employees={employees}
              teams={teams}
              timesheetLines={timesheetLines}
              onExport={handleExport}
            />
          </TabsContent>

          <TabsContent value="audit">
            <AuditLogViewer logs={auditLogs} />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsPanel
              employees={employees}
              teams={teams}
              users={users}
              timesheetLines={timesheetLines}
              timeEntries={timeEntries}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
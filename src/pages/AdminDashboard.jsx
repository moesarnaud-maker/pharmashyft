import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Users, Settings, FileText, Building, Download, Shield, BarChart2, Calendar, MapPin } from 'lucide-react';

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
      await base44.users.inviteUser(email, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User invited successfully');
    },
    onError: (err) => {
      console.error('Failed to invite user:', err);
      toast.error(err?.message || 'Failed to invite user');
    },
  });

  const resendInviteMutation = useMutation({
    mutationFn: async (user) => {
      // Resend invitation email
      await base44.users.resendInvite(user.email);
    },
    onSuccess: () => {
      toast.success('Invitation resent successfully');
    },
    onError: (err) => {
      console.error('Failed to resend invitation:', err);
      toast.error(err?.message || 'Failed to resend invitation');
    },
  });

  const cancelInviteMutation = useMutation({
    mutationFn: async (user) => {
      // Delete the pending user invitation
      await base44.entities.User.delete(user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Invitation cancelled');
    },
    onError: (err) => {
      console.error('Failed to cancel invitation:', err);
      toast.error(err?.message || 'Failed to cancel invitation');
    },
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: async (data) => {
      if (data.employee_id) {
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
        // Check if employee already exists for this user
        const existingEmployee = employees.find(e => e.user_id === data.user_id);
        if (existingEmployee) {
          toast.error('Employee record already exists for this user');
          throw new Error('Employee already exists');
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
      if (error.message !== 'Employee already exists') {
        console.error('Failed to update employee:', error);
        toast.error(error?.message || 'Failed to update employee profile');
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
    onError: (error) => {
      console.error('Team mutation failed:', error);
      toast.error(error?.message || 'Failed to update team');
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
      toast.success('Settings saved successfully');
    },
    onError: (error) => {
      console.error('Failed to save settings:', error);
      toast.error(error?.message || 'Failed to save settings');
    },
  });

  const handleExport = async (exportInfo) => {
    await base44.entities.AuditLog.create({
      actor_id: user?.id,
      actor_email: user?.email,
      actor_name: user?.full_name,
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
              isLoading={inviteUserMutation.isPending || updateEmployeeMutation.isPending}
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
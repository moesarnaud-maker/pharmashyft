import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfWeek, addWeeks, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Users, Clock, CheckCircle, AlertCircle, Calendar, ChevronRight } from 'lucide-react';
import { formatUserName, getUserInitials } from '@/components/utils/helpers';

import StatsCard from '@/components/common/StatsCard';
import ApprovalCard from '@/components/common/ApprovalCard';

export default function ManagerDashboard() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const u = await base44.auth.me();
      setUser(u);
    };
    loadUser();
  }, []);

  const { data: teams = [] } = useQuery({
    queryKey: ['teams', user?.id],
    queryFn: () => base44.entities.Team.filter({ manager_id: user?.id }),
    enabled: !!user?.id,
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const teamEmployees = employees.filter(e => 
    teams.some(t => t.id === e.team_id)
  );

  const { data: pendingTimesheets = [] } = useQuery({
    queryKey: ['pendingTimesheets'],
    queryFn: () => base44.entities.Timesheet.filter({ status: 'submitted' }),
  });

  const { data: pendingAbsences = [] } = useQuery({
    queryKey: ['pendingAbsences'],
    queryFn: () => base44.entities.AbsenceRequest.filter({ status: 'pending' }),
  });

  const { data: pendingCorrections = [] } = useQuery({
    queryKey: ['pendingCorrections'],
    queryFn: () => base44.entities.CorrectionRequest.filter({ status: 'pending' }),
  });

  const teamPendingTimesheets = pendingTimesheets.filter(ts =>
    teamEmployees.some(e => e.id === ts.employee_id)
  );

  const teamPendingAbsences = pendingAbsences.filter(abs =>
    teamEmployees.some(e => e.id === abs.employee_id)
  );

  const teamPendingCorrections = pendingCorrections.filter(corr =>
    teamEmployees.some(e => e.id === corr.employee_id)
  );

  const totalPending = teamPendingTimesheets.length + teamPendingAbsences.length + teamPendingCorrections.length;

  const getEmployeeName = (employeeId) => {
    const emp = employees.find(e => e.id === employeeId);
    const u = users.find(u => u.id === emp?.user_id);
    return formatUserName(u);
  };

  const approveTimesheetMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.Timesheet.update(id, {
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: user?.id,
      });
      await base44.entities.AuditLog.create({
        actor_id: user?.id,
        actor_email: user?.email,
        actor_name: formatUserName(user),
        action: 'approve',
        entity_type: 'Timesheet',
        entity_id: id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingTimesheets'] });
      toast.success('Timesheet approved');
    },
  });

  const rejectTimesheetMutation = useMutation({
    mutationFn: async ({ id, reason }) => {
      await base44.entities.Timesheet.update(id, {
        status: 'rejected',
        rejection_reason: reason,
      });
      await base44.entities.AuditLog.create({
        actor_id: user?.id,
        actor_email: user?.email,
        actor_name: formatUserName(user),
        action: 'reject',
        entity_type: 'Timesheet',
        entity_id: id,
        reason,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingTimesheets'] });
      toast.success('Timesheet rejected');
    },
  });

  const approveAbsenceMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.AbsenceRequest.update(id, {
        status: 'approved',
        approved_at: new Date().toISOString(),
        approver_id: user?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingAbsences'] });
      toast.success('Absence request approved');
    },
  });

  const rejectAbsenceMutation = useMutation({
    mutationFn: async ({ id, reason }) => {
      await base44.entities.AbsenceRequest.update(id, {
        status: 'rejected',
        rejection_reason: reason,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingAbsences'] });
      toast.success('Absence request rejected');
    },
  });

  const approveCorrectionMutation = useMutation({
    mutationFn: async (correction) => {
      await base44.entities.CorrectionRequest.update(correction.id, {
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id,
      });
      
      // Create or update the time entry
      if (correction.requested_start_time || correction.requested_end_time) {
        const emp = employees.find(e => e.id === correction.employee_id);
        await base44.entities.TimeEntry.create({
          employee_id: correction.employee_id,
          user_id: emp?.user_id,
          date: correction.requested_date,
          start_time: correction.requested_start_time ? 
            `${correction.requested_date}T${correction.requested_start_time}:00` : null,
          end_time: correction.requested_end_time ?
            `${correction.requested_date}T${correction.requested_end_time}:00` : null,
          entry_type: 'work',
          source: 'manual',
          notes: `Correction approved: ${correction.reason}`,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingCorrections'] });
      toast.success('Correction approved and time entry created');
    },
  });

  const rejectCorrectionMutation = useMutation({
    mutationFn: async ({ id, reason }) => {
      await base44.entities.CorrectionRequest.update(id, {
        status: 'rejected',
        rejection_reason: reason,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingCorrections'] });
      toast.success('Correction request rejected');
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Manager Dashboard</h1>
          <p className="text-slate-500 mt-1">Team overview and approvals</p>
        </div>

        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <StatsCard
            title="Team Members"
            value={teamEmployees.length}
            icon={Users}
            color="blue"
            delay={0}
          />
          <StatsCard
            title="Pending Approvals"
            value={totalPending}
            icon={Clock}
            color="amber"
            delay={1}
          />
          <StatsCard
            title="Teams Managed"
            value={teams.length}
            icon={Users}
            color="purple"
            delay={2}
          />
          <StatsCard
            title="This Week"
            value={`${teamPendingTimesheets.length} timesheets`}
            icon={Calendar}
            color="green"
            delay={3}
          />
        </div>

        <Tabs defaultValue="approvals" className="space-y-6">
          <TabsList className="bg-white shadow-sm border">
            <TabsTrigger value="approvals" className="gap-2">
              <CheckCircle className="w-4 h-4" />
              Approvals
              {totalPending > 0 && (
                <Badge className="ml-2 bg-amber-100 text-amber-700">{totalPending}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="team" className="gap-2">
              <Users className="w-4 h-4" />
              Team Overview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="approvals" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Timesheet Approvals
                  {teamPendingTimesheets.length > 0 && (
                    <Badge className="bg-blue-100 text-blue-700">{teamPendingTimesheets.length}</Badge>
                  )}
                </h3>
                <div className="space-y-4">
                  {teamPendingTimesheets.map(ts => (
                    <ApprovalCard
                      key={ts.id}
                      type="timesheet"
                      title={`Week of ${format(parseISO(ts.week_start), 'MMM d, yyyy')}`}
                      subtitle={`${ts.total_hours_worked?.toFixed(1) || 0}h worked, ${ts.total_overtime_hours?.toFixed(1) || 0}h overtime`}
                      employeeName={getEmployeeName(ts.employee_id)}
                      submittedAt={ts.submitted_at || ts.created_date}
                      onApprove={() => approveTimesheetMutation.mutate(ts.id)}
                      onReject={(reason) => rejectTimesheetMutation.mutate({ id: ts.id, reason })}
                      isLoading={approveTimesheetMutation.isPending || rejectTimesheetMutation.isPending}
                    />
                  ))}
                  {teamPendingTimesheets.length === 0 && (
                    <Card className="border-dashed">
                      <CardContent className="py-8 text-center text-slate-500">
                        No pending timesheet approvals
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Absence Requests
                    {teamPendingAbsences.length > 0 && (
                      <Badge className="bg-purple-100 text-purple-700">{teamPendingAbsences.length}</Badge>
                    )}
                  </h3>
                  <div className="space-y-4">
                    {teamPendingAbsences.map(abs => (
                      <ApprovalCard
                        key={abs.id}
                        type="absence"
                        title={`${abs.absence_type?.charAt(0).toUpperCase()}${abs.absence_type?.slice(1)} Leave`}
                        subtitle={`${format(parseISO(abs.start_date), 'MMM d')} - ${format(parseISO(abs.end_date), 'MMM d, yyyy')}`}
                        employeeName={getEmployeeName(abs.employee_id)}
                        submittedAt={abs.created_date}
                        details={abs.notes}
                        onApprove={() => approveAbsenceMutation.mutate(abs.id)}
                        onReject={(reason) => rejectAbsenceMutation.mutate({ id: abs.id, reason })}
                        isLoading={approveAbsenceMutation.isPending || rejectAbsenceMutation.isPending}
                      />
                    ))}
                    {teamPendingAbsences.length === 0 && (
                      <Card className="border-dashed">
                        <CardContent className="py-8 text-center text-slate-500">
                          No pending absence requests
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Time Corrections
                    {teamPendingCorrections.length > 0 && (
                      <Badge className="bg-amber-100 text-amber-700">{teamPendingCorrections.length}</Badge>
                    )}
                  </h3>
                  <div className="space-y-4">
                    {teamPendingCorrections.map(corr => (
                      <ApprovalCard
                        key={corr.id}
                        type="correction"
                        title={corr.request_type?.replace(/_/g, ' ')}
                        subtitle={format(parseISO(corr.requested_date), 'EEEE, MMM d, yyyy')}
                        employeeName={getEmployeeName(corr.employee_id)}
                        submittedAt={corr.created_date}
                        details={corr.reason}
                        onApprove={() => approveCorrectionMutation.mutate(corr)}
                        onReject={(reason) => rejectCorrectionMutation.mutate({ id: corr.id, reason })}
                        isLoading={approveCorrectionMutation.isPending || rejectCorrectionMutation.isPending}
                      />
                    ))}
                    {teamPendingCorrections.length === 0 && (
                      <Card className="border-dashed">
                        <CardContent className="py-8 text-center text-slate-500">
                          No pending correction requests
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="team">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {teamEmployees.map(emp => {
                    const u = users.find(u => u.id === emp.user_id);
                    return (
                      <div key={emp.id} className="py-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                            {getUserInitials(u)}
                          </div>
                          <div>
                            <div className="font-medium text-slate-800">{formatUserName(u)}</div>
                            <div className="text-sm text-slate-500">{emp.employee_number}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge className={emp.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}>
                            {emp.status}
                          </Badge>
                          <span className="text-sm text-slate-500">{emp.contract_hours_week}h/week</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
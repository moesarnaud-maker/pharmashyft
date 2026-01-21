import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfWeek, addWeeks, parseISO, isToday } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Clock, Calendar, FileText, Plus, AlertCircle, User } from 'lucide-react';

import ClockWidget from '@/components/clock/ClockWidget';
import TodaySummary from '@/components/clock/TodaySummary';
import WeeklyTimesheet from '@/components/timesheet/WeeklyTimesheet';
import AbsenceRequestForm from '@/components/absence/AbsenceRequestForm';
import CorrectionRequestForm from '@/components/correction/CorrectionRequestForm';
import MyProfileTab from '@/components/employee/MyProfileTab';

export default function EmployeeDashboard() {
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [showAbsenceForm, setShowAbsenceForm] = useState(false);
  const [showCorrectionForm, setShowCorrectionForm] = useState(false);
  const queryClient = useQueryClient();

  const weekStart = startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 });

  useEffect(() => {
    const loadUser = async () => {
      const u = await base44.auth.me();
      setUser(u);
    };
    loadUser();
  }, []);

  const { data: employees = [] } = useQuery({
    queryKey: ['employees', user?.id],
    queryFn: () => base44.entities.Employee.filter({ user_id: user?.id }),
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (employees.length > 0) setEmployee(employees[0]);
  }, [employees]);

  const { data: todayEntries = [] } = useQuery({
    queryKey: ['timeEntries', 'today', employee?.id],
    queryFn: () => base44.entities.TimeEntry.filter({ 
      employee_id: employee?.id, 
      date: format(new Date(), 'yyyy-MM-dd') 
    }),
    enabled: !!employee?.id,
    refetchInterval: 30000,
  });

  const { data: timesheets = [] } = useQuery({
    queryKey: ['timesheets', employee?.id, format(weekStart, 'yyyy-MM-dd')],
    queryFn: () => base44.entities.Timesheet.filter({ 
      employee_id: employee?.id, 
      week_start: format(weekStart, 'yyyy-MM-dd') 
    }),
    enabled: !!employee?.id,
  });

  const { data: timesheetLines = [] } = useQuery({
    queryKey: ['timesheetLines', timesheets[0]?.id],
    queryFn: () => base44.entities.TimesheetLine.filter({ timesheet_id: timesheets[0]?.id }),
    enabled: !!timesheets[0]?.id,
  });

  const { data: absenceRequests = [] } = useQuery({
    queryKey: ['absenceRequests', employee?.id],
    queryFn: () => base44.entities.AbsenceRequest.filter({ employee_id: employee?.id }, '-created_date', 10),
    enabled: !!employee?.id,
  });

  const { data: correctionRequests = [] } = useQuery({
    queryKey: ['correctionRequests', employee?.id],
    queryFn: () => base44.entities.CorrectionRequest.filter({ employee_id: employee?.id }, '-created_date', 10),
    enabled: !!employee?.id,
  });

  const currentEntry = todayEntries.find(e => e.entry_type === 'work' && !e.end_time);
  const currentBreak = todayEntries.find(e => e.entry_type === 'break' && !e.end_time);

  const clockInMutation = useMutation({
    mutationFn: async (location) => {
      const now = new Date().toISOString();
      await base44.entities.TimeEntry.create({
        employee_id: employee.id,
        user_id: user.id,
        start_time: now,
        entry_type: 'work',
        source: 'web',
        date: format(new Date(), 'yyyy-MM-dd'),
        location_lat: location?.lat,
        location_lng: location?.lng,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
      toast.success('Clocked in successfully');
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: async (location) => {
      const now = new Date().toISOString();
      const start = new Date(currentEntry.start_time);
      const durationMins = Math.round((new Date() - start) / 60000);
      
      await base44.entities.TimeEntry.update(currentEntry.id, {
        end_time: now,
        duration_minutes: durationMins,
        location_lat: location?.lat,
        location_lng: location?.lng,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
      toast.success('Clocked out successfully');
    },
  });

  const breakMutation = useMutation({
    mutationFn: async (action) => {
      const now = new Date().toISOString();
      if (action === 'start') {
        await base44.entities.TimeEntry.create({
          employee_id: employee.id,
          user_id: user.id,
          start_time: now,
          entry_type: 'break',
          source: 'web',
          date: format(new Date(), 'yyyy-MM-dd'),
        });
      } else {
        const durationMins = Math.round((new Date() - new Date(currentBreak.start_time)) / 60000);
        await base44.entities.TimeEntry.update(currentBreak.id, {
          end_time: now,
          duration_minutes: durationMins,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
      toast.success('Break updated');
    },
  });

  const submitTimesheetMutation = useMutation({
    mutationFn: async () => {
      if (!timesheets[0]) return;
      await base44.entities.Timesheet.update(timesheets[0].id, {
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
      toast.success('Timesheet submitted for approval');
    },
  });

  const absenceMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.AbsenceRequest.create({
        ...data,
        employee_id: employee.id,
        user_id: user.id,
        status: data.is_notification_only ? 'approved' : 'pending',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['absenceRequests'] });
      setShowAbsenceForm(false);
      toast.success('Absence request submitted');
    },
  });

  const correctionMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.CorrectionRequest.create({
        ...data,
        employee_id: employee.id,
        user_id: user.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['correctionRequests'] });
      setShowCorrectionForm(false);
      toast.success('Correction request submitted');
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.full_name?.split(' ')[0] || 'there'}
          </h1>
          <p className="text-slate-500 mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>

        <Tabs defaultValue="clock" className="space-y-6">
          <TabsList className="bg-white shadow-sm border">
            <TabsTrigger value="clock" className="gap-2">
              <Clock className="w-4 h-4" />
              Time Clock
            </TabsTrigger>
            <TabsTrigger value="timesheet" className="gap-2">
              <Calendar className="w-4 h-4" />
              Timesheet
            </TabsTrigger>
            <TabsTrigger value="requests" className="gap-2">
              <FileText className="w-4 h-4" />
              Requests
            </TabsTrigger>
            <TabsTrigger value="profile" className="gap-2">
              <User className="w-4 h-4" />
              My Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="clock" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <ClockWidget
                currentEntry={currentEntry}
                isOnBreak={!!currentBreak}
                onClockIn={(loc) => clockInMutation.mutate(loc)}
                onClockOut={(loc) => clockOutMutation.mutate(loc)}
                onStartBreak={() => breakMutation.mutate('start')}
                onEndBreak={() => breakMutation.mutate('end')}
                isLoading={clockInMutation.isPending || clockOutMutation.isPending || breakMutation.isPending}
              />
              <TodaySummary 
                entries={todayEntries} 
                expectedHours={employee?.contract_hours_week / 5 || 7.6} 
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowCorrectionForm(true)}>
                <AlertCircle className="w-4 h-4 mr-2" />
                Request Correction
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="timesheet">
            <WeeklyTimesheet
              timesheet={timesheets[0]}
              timesheetLines={timesheetLines}
              weekStart={weekStart}
              onWeekChange={(delta) => setWeekOffset(weekOffset + delta)}
              onSubmit={() => submitTimesheetMutation.mutate()}
              isLoading={submitTimesheetMutation.isPending}
            />
          </TabsContent>

          <TabsContent value="requests" className="space-y-6">
            <div className="flex justify-end">
              <Button onClick={() => setShowAbsenceForm(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Request Time Off
              </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="font-semibold text-slate-800 mb-4">Absence Requests</h3>
                <div className="space-y-3">
                  {absenceRequests.map(req => (
                    <div key={req.id} className="p-4 bg-white rounded-xl shadow-sm border">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-medium capitalize">{req.absence_type}</span>
                          <p className="text-sm text-slate-500 mt-1">
                            {format(parseISO(req.start_date), 'MMM d')} - {format(parseISO(req.end_date), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          req.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                          req.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {req.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  {absenceRequests.length === 0 && (
                    <p className="text-slate-500 text-center py-8">No absence requests</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-slate-800 mb-4">Correction Requests</h3>
                <div className="space-y-3">
                  {correctionRequests.map(req => (
                    <div key={req.id} className="p-4 bg-white rounded-xl shadow-sm border">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-medium capitalize">{req.request_type?.replace(/_/g, ' ')}</span>
                          <p className="text-sm text-slate-500 mt-1">
                            {format(parseISO(req.requested_date), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          req.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                          req.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {req.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  {correctionRequests.length === 0 && (
                    <p className="text-slate-500 text-center py-8">No correction requests</p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="profile">
            <MyProfileTab user={user} onUpdate={setUser} />
          </TabsContent>
        </Tabs>
      </div>

      <AbsenceRequestForm
        open={showAbsenceForm}
        onClose={() => setShowAbsenceForm(false)}
        onSubmit={(data) => absenceMutation.mutate(data)}
        isLoading={absenceMutation.isPending}
      />

      <CorrectionRequestForm
        open={showCorrectionForm}
        onClose={() => setShowCorrectionForm(false)}
        onSubmit={(data) => correctionMutation.mutate(data)}
        isLoading={correctionMutation.isPending}
      />
    </div>
  );
}
import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import MonthCalendarView from '@/components/schedule/MonthCalendarView';

export default function ScheduleCalendar() {
  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list(),
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: () => base44.entities.Location.list(),
  });

  const { data: scheduleAssignments = [] } = useQuery({
    queryKey: ['employeeScheduleAssignments'],
    queryFn: () => base44.entities.EmployeeScheduleAssignment.list(),
  });

  const { data: scheduleTemplates = [] } = useQuery({
    queryKey: ['scheduleTemplates'],
    queryFn: () => base44.entities.ScheduleTemplate.list(),
  });

  const { data: scheduleWeeks = [] } = useQuery({
    queryKey: ['scheduleWeeks'],
    queryFn: () => base44.entities.ScheduleWeek.list(),
  });

  const { data: scheduleDays = [] } = useQuery({
    queryKey: ['scheduleDays'],
    queryFn: () => base44.entities.ScheduleDay.list(),
  });

  const { data: absenceRequests = [] } = useQuery({
    queryKey: ['absenceRequests'],
    queryFn: () => base44.entities.AbsenceRequest.list(),
  });

  const { data: employeeLocations = [] } = useQuery({
    queryKey: ['employeeLocations'],
    queryFn: () => base44.entities.EmployeeLocation.list(),
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <MonthCalendarView
          employees={employees}
          users={users}
          teams={teams}
          locations={locations}
          scheduleAssignments={scheduleAssignments}
          scheduleTemplates={scheduleTemplates}
          scheduleWeeks={scheduleWeeks}
          scheduleDays={scheduleDays}
          absenceRequests={absenceRequests}
          employeeLocations={employeeLocations}
        />
      </div>
    </div>
  );
}
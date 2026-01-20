import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import MonthCalendarView from '@/components/schedule/MonthCalendarView';

export default function ScheduleCalendar() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const u = await base44.auth.me();
      setUser(u);
    };
    loadUser();
  }, []);
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

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <MonthCalendarView
          employees={employees}
          users={users}
          teams={teams}
          locations={locations}
          absenceRequests={absenceRequests}
          employeeLocations={employeeLocations}
          currentUser={user}
          isAdmin={user.role === 'admin'}
        />
      </div>
    </div>
  );
}
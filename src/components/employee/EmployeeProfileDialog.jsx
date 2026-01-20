import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Calendar, Clock, FileText, Briefcase } from 'lucide-react';
import EmployeeDetailsTab from './EmployeeDetailsTab';
import EmployeeScheduleTab from './EmployeeScheduleTab';
import EmployeeAvailabilityTab from './EmployeeAvailabilityTab';
import EmployeeTimeEntriesTab from './EmployeeTimeEntriesTab';
import EmployeeTimesheetsTab from './EmployeeTimesheetsTab';
import EmployeeAbsencesTab from './EmployeeAbsencesTab';

export default function EmployeeProfileDialog({ 
  employee, 
  user,
  open, 
  onClose,
  onUpdateEmployee,
  teams = [],
  schedules = []
}) {
  const [activeTab, setActiveTab] = useState('details');

  const { data: scheduleTemplates = [] } = useQuery({
    queryKey: ['scheduleTemplates'],
    queryFn: () => base44.entities.ScheduleTemplate.list(),
  });

  const { data: scheduleAssignments = [] } = useQuery({
    queryKey: ['employeeScheduleAssignments'],
    queryFn: () => base44.entities.EmployeeScheduleAssignment.list(),
    enabled: !!employee,
  });

  const { data: scheduleWeeks = [] } = useQuery({
    queryKey: ['scheduleWeeks'],
    queryFn: () => base44.entities.ScheduleWeek.list(),
  });

  const { data: scheduleDays = [] } = useQuery({
    queryKey: ['scheduleDays'],
    queryFn: () => base44.entities.ScheduleDay.list(),
  });

  const { data: timeEntries = [] } = useQuery({
    queryKey: ['timeEntries', employee?.id],
    queryFn: () => base44.entities.TimeEntry.filter({ employee_id: employee.id }),
    enabled: !!employee,
  });

  const { data: timesheets = [] } = useQuery({
    queryKey: ['timesheets', employee?.id],
    queryFn: () => base44.entities.Timesheet.filter({ employee_id: employee.id }),
    enabled: !!employee,
  });

  const { data: absenceRequests = [] } = useQuery({
    queryKey: ['absenceRequests', employee?.id],
    queryFn: () => base44.entities.AbsenceRequest.filter({ employee_id: employee.id }),
    enabled: !!employee,
  });

  if (!employee || !user) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
              {user.full_name?.charAt(0)}
            </div>
            <div>
              <div>{user.full_name}</div>
              <div className="text-sm font-normal text-slate-500">{user.email}</div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="w-full justify-start bg-slate-50 border-b">
            <TabsTrigger value="details" className="gap-2">
              <User className="w-4 h-4" />
              Details
            </TabsTrigger>
            <TabsTrigger value="schedule" className="gap-2">
              <Calendar className="w-4 h-4" />
              Schedule
            </TabsTrigger>
            <TabsTrigger value="availability" className="gap-2">
              <Clock className="w-4 h-4" />
              Availability
            </TabsTrigger>
            <TabsTrigger value="timeentries" className="gap-2">
              <Clock className="w-4 h-4" />
              Time Entries
            </TabsTrigger>
            <TabsTrigger value="timesheets" className="gap-2">
              <FileText className="w-4 h-4" />
              Timesheets
            </TabsTrigger>
            <TabsTrigger value="absences" className="gap-2">
              <Briefcase className="w-4 h-4" />
              Absences
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto p-6">
            <TabsContent value="details" className="mt-0">
              <EmployeeDetailsTab
                employee={employee}
                user={user}
                teams={teams}
                schedules={schedules}
                onUpdate={onUpdateEmployee}
              />
            </TabsContent>

            <TabsContent value="schedule" className="mt-0">
              <EmployeeScheduleTab
                employee={employee}
                assignments={scheduleAssignments.filter(a => a.employee_id === employee.id)}
                templates={scheduleTemplates}
                weeks={scheduleWeeks}
                days={scheduleDays}
              />
            </TabsContent>

            <TabsContent value="availability" className="mt-0">
              <EmployeeAvailabilityTab employee={employee} />
            </TabsContent>

            <TabsContent value="timeentries" className="mt-0">
              <EmployeeTimeEntriesTab entries={timeEntries} />
            </TabsContent>

            <TabsContent value="timesheets" className="mt-0">
              <EmployeeTimesheetsTab timesheets={timesheets} />
            </TabsContent>

            <TabsContent value="absences" className="mt-0">
              <EmployeeAbsencesTab absences={absenceRequests} />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
import React from 'react';
import EmployeeScheduleHistory from '@/components/schedule/EmployeeScheduleHistory';
import SchedulePreview from '@/components/schedule/SchedulePreview';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from 'lucide-react';

export default function EmployeeScheduleTab({ employee, assignments, templates, weeks, days }) {
  const currentAssignment = assignments.find(a => !a.effective_end_date);
  const currentTemplate = templates.find(t => t.id === currentAssignment?.template_id);
  const templateWeeks = weeks.filter(w => w.template_id === currentTemplate?.id);
  const templateDays = days.filter(d => 
    templateWeeks.some(w => w.id === d.schedule_week_id)
  );

  const effectiveStartDate = currentAssignment 
    ? new Date(currentAssignment.effective_start_date) 
    : new Date();

  return (
    <div className="space-y-6">
      <EmployeeScheduleHistory
        employeeId={employee.id}
        assignments={assignments}
        templates={templates}
      />

      {currentTemplate ? (
        <SchedulePreview
          template={currentTemplate}
          weeks={templateWeeks}
          scheduleDays={templateDays}
          startDate={effectiveStartDate}
          previewWeeks={12}
        />
      ) : (
        <Card className="border-0 shadow-md">
          <CardContent className="py-12 text-center">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">No Schedule Assigned</h3>
            <p className="text-slate-500">Assign a schedule template to preview the rotation</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
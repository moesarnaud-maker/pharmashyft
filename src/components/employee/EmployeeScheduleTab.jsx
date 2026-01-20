import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import EmployeeScheduleHistory from '@/components/schedule/EmployeeScheduleHistory';
import SchedulePreview from '@/components/schedule/SchedulePreview';
import CustomScheduleBuilder from '@/components/schedule/CustomScheduleBuilder';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function EmployeeScheduleTab({ employee, assignments, templates, weeks, days }) {
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);

  const { data: customSchedules = [] } = useQuery({
    queryKey: ['employeeCustomSchedules', employee.id],
    queryFn: () => base44.entities.EmployeeCustomSchedule.filter({ employee_id: employee.id }),
  });

  const { data: customWeeks = [] } = useQuery({
    queryKey: ['customScheduleWeeks'],
    queryFn: () => base44.entities.CustomScheduleWeek.list(),
  });

  const { data: customDays = [] } = useQuery({
    queryKey: ['customScheduleDays'],
    queryFn: () => base44.entities.CustomScheduleDay.list(),
  });
  const activeCustomSchedule = customSchedules.find(s => s.status === 'active' && !s.effective_end_date);
  const currentAssignment = assignments.find(a => !a.effective_end_date);
  
  // Determine which schedule is active (custom takes precedence)
  const hasCustomSchedule = !!activeCustomSchedule;
  const currentTemplate = !hasCustomSchedule && currentAssignment 
    ? templates.find(t => t.id === currentAssignment.template_id) 
    : null;
  
  const templateWeeks = currentTemplate ? weeks.filter(w => w.template_id === currentTemplate.id) : [];
  const templateDays = days.filter(d => 
    templateWeeks.some(w => w.id === d.schedule_week_id)
  );

  const customWeeksForSchedule = activeCustomSchedule 
    ? customWeeks.filter(w => w.custom_schedule_id === activeCustomSchedule.id) 
    : [];
  const customDaysForSchedule = customDays.filter(d =>
    customWeeksForSchedule.some(w => w.id === d.custom_schedule_week_id)
  );

  const effectiveStartDate = activeCustomSchedule
    ? new Date(activeCustomSchedule.effective_start_date)
    : currentAssignment 
      ? new Date(currentAssignment.effective_start_date) 
      : new Date();

  if (showCustomBuilder) {
    return (
      <CustomScheduleBuilder
        employeeId={employee.id}
        onClose={() => setShowCustomBuilder(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="template">
        <TabsList className="w-full">
          <TabsTrigger value="template" className="flex-1">Template Schedule</TabsTrigger>
          <TabsTrigger value="custom" className="flex-1">Custom Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="template" className="space-y-6 mt-6">
          <EmployeeScheduleHistory
            employeeId={employee.id}
            assignments={assignments}
            templates={templates}
          />

          {currentTemplate && !hasCustomSchedule ? (
            <SchedulePreview
              template={currentTemplate}
              weeks={templateWeeks}
              scheduleDays={templateDays}
              startDate={effectiveStartDate}
              previewWeeks={12}
            />
          ) : !hasCustomSchedule && (
            <Card className="border-0 shadow-md">
              <CardContent className="py-12 text-center">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-semibold text-slate-800 mb-2">No Template Assigned</h3>
                <p className="text-slate-500">Assign a schedule template or create a custom schedule</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="custom" className="space-y-6 mt-6">
          {activeCustomSchedule ? (
            <SchedulePreview
              template={activeCustomSchedule}
              weeks={customWeeksForSchedule}
              scheduleDays={customDaysForSchedule}
              startDate={effectiveStartDate}
              previewWeeks={12}
            />
          ) : (
            <Card className="border-0 shadow-md">
              <CardContent className="py-12 text-center">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-semibold text-slate-800 mb-2">No Custom Schedule</h3>
                <p className="text-slate-500 mb-4">Create a custom schedule specific to this employee</p>
                <Button onClick={() => setShowCustomBuilder(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Custom Schedule
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
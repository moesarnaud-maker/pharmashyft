import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Calendar, Users } from 'lucide-react';
import ScheduleTemplateBuilder from './ScheduleTemplateBuilder';
import SchedulePreview from './SchedulePreview';

export default function ScheduleManagement() {
  const queryClient = useQueryClient();
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [previewingTemplate, setPreviewingTemplate] = useState(null);

  const { data: templates = [] } = useQuery({
    queryKey: ['scheduleTemplates'],
    queryFn: () => base44.entities.ScheduleTemplate.list(),
  });

  const { data: allWeeks = [] } = useQuery({
    queryKey: ['scheduleWeeks'],
    queryFn: () => base44.entities.ScheduleWeek.list(),
  });

  const { data: allDays = [] } = useQuery({
    queryKey: ['scheduleDays'],
    queryFn: () => base44.entities.ScheduleDay.list(),
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['employeeScheduleAssignments'],
    queryFn: () => base44.entities.EmployeeScheduleAssignment.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: async (templateId) => {
      const weeks = allWeeks.filter(w => w.template_id === templateId);
      for (const week of weeks) {
        const days = allDays.filter(d => d.schedule_week_id === week.id);
        for (const day of days) {
          await base44.entities.ScheduleDay.delete(day.id);
        }
        await base44.entities.ScheduleWeek.delete(week.id);
      }
      await base44.entities.ScheduleTemplate.delete(templateId);
    },
    onSuccess: () => {
      toast.success('Template deleted');
      queryClient.invalidateQueries({ queryKey: ['scheduleTemplates'] });
      queryClient.invalidateQueries({ queryKey: ['scheduleWeeks'] });
      queryClient.invalidateQueries({ queryKey: ['scheduleDays'] });
    },
  });

  const getTemplateStats = (templateId) => {
    const activeAssignments = assignments.filter(
      a => a.template_id === templateId && !a.effective_end_date
    );
    return activeAssignments.length;
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setShowBuilder(true);
  };

  const handlePreview = (template) => {
    setPreviewingTemplate(template);
  };

  const handleClose = () => {
    setShowBuilder(false);
    setEditingTemplate(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Schedule Templates</h2>
          <p className="text-slate-500">Create and manage rotating work patterns</p>
        </div>
        <Button onClick={() => setShowBuilder(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Template
        </Button>
      </div>

      {!showBuilder && !previewingTemplate ? (
        <div className="grid gap-6">
          {templates.map(template => {
            const weeks = allWeeks.filter(w => w.template_id === template.id);
            const employeeCount = getTemplateStats(template.id);

            return (
              <Card key={template.id} className="border-0 shadow-lg">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-3">
                        {template.name}
                        {template.is_default && (
                          <Badge className="bg-blue-100 text-blue-700">Default</Badge>
                        )}
                        <Badge variant="outline" className={
                          template.status === 'active' ? 'border-emerald-300 text-emerald-700' : ''
                        }>
                          {template.status}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="mt-2 flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {template.rotation_length_weeks}-week rotation
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {employeeCount} {employeeCount === 1 ? 'employee' : 'employees'}
                        </span>
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handlePreview(template)}>
                        Preview
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(template)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteMutation.mutate(template.id)}
                        disabled={employeeCount > 0}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {template.description && (
                  <CardContent>
                    <p className="text-sm text-slate-600">{template.description}</p>
                  </CardContent>
                )}
              </Card>
            );
          })}

          {templates.length === 0 && (
            <Card className="border-0 shadow-lg">
              <CardContent className="py-12 text-center">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-semibold text-slate-800 mb-2">No Schedule Templates</h3>
                <p className="text-slate-500 mb-4">Create your first rotating schedule template</p>
                <Button onClick={() => setShowBuilder(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Template
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      ) : showBuilder ? (
        <ScheduleTemplateBuilder template={editingTemplate} onClose={handleClose} />
      ) : previewingTemplate ? (
        <div className="space-y-4">
          <Button variant="outline" onClick={() => setPreviewingTemplate(null)}>
            ← Back to Templates
          </Button>
          <SchedulePreview
            template={previewingTemplate}
            weeks={allWeeks.filter(w => w.template_id === previewingTemplate.id)}
            scheduleDays={allDays.filter(d => 
              allWeeks.some(w => w.id === d.schedule_week_id && w.template_id === previewingTemplate.id)
            )}
          />
        </div>
      ) : null}
    </div>
  );
}
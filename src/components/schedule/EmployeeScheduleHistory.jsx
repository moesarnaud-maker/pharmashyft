import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Calendar, Plus, History, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { regenerateShiftsForEmployee } from './ShiftGenerator';

export default function EmployeeScheduleHistory({ 
  employeeId, 
  assignments = [], 
  templates = [] 
}) {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    template_id: '',
    effective_start_date: format(new Date(), 'yyyy-MM-dd'),
    effective_end_date: '',
    notes: '',
  });

  const currentAssignment = assignments.find(a => !a.effective_end_date);

  const assignMutation = useMutation({
    mutationFn: async () => {
      // End current assignment if exists
      if (currentAssignment) {
        await base44.entities.EmployeeScheduleAssignment.update(currentAssignment.id, {
          effective_end_date: formData.effective_start_date,
        });
      }

      // Create new assignment
      const assignment = await base44.entities.EmployeeScheduleAssignment.create({
        employee_id: employeeId,
        ...formData,
      });

      // Generate shifts from template
      await regenerateShiftsForEmployee(employeeId);

      return assignment;
    },
    onSuccess: () => {
      toast.success('Schedule assigned and shifts generated');
      queryClient.invalidateQueries({ queryKey: ['employeeScheduleAssignments'] });
      queryClient.invalidateQueries({ queryKey: ['scheduledShifts'] });
      setShowDialog(false);
      setFormData({
        template_id: '',
        effective_start_date: format(new Date(), 'yyyy-MM-dd'),
        effective_end_date: '',
        notes: '',
      });
    },
  });

  const unassignMutation = useMutation({
    mutationFn: async (assignmentId) => {
      // End the assignment
      await base44.entities.EmployeeScheduleAssignment.update(assignmentId, {
        effective_end_date: format(new Date(), 'yyyy-MM-dd'),
      });

      // Delete future draft shifts from this assignment
      const shifts = await base44.entities.ScheduledShift.filter({
        template_assignment_id: assignmentId,
        status: 'draft'
      });

      for (const shift of shifts) {
        await base44.entities.ScheduledShift.delete(shift.id);
      }
    },
    onSuccess: () => {
      toast.success('Schedule unassigned');
      queryClient.invalidateQueries({ queryKey: ['employeeScheduleAssignments'] });
      queryClient.invalidateQueries({ queryKey: ['scheduledShifts'] });
    },
  });

  const getTemplateName = (templateId) => {
    return templates.find(t => t.id === templateId)?.name || 'Unknown';
  };

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Schedule Assignment
          </CardTitle>
          <Button size="sm" onClick={() => setShowDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Assign Schedule
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {currentAssignment ? (
          <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">Current Schedule</span>
              <Badge className="bg-emerald-100 text-emerald-700">Active</Badge>
            </div>
            <div className="text-lg font-semibold text-slate-800 mb-1">
              {getTemplateName(currentAssignment.template_id)}
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-600">
                Since {format(new Date(currentAssignment.effective_start_date), 'MMM d, yyyy')}
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => unassignMutation.mutate(currentAssignment.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Unassign
              </Button>
            </div>
            {currentAssignment.notes && (
              <div className="text-sm text-slate-600 mt-2 pt-2 border-t border-blue-200">
                {currentAssignment.notes}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6 text-slate-500">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-sm">No schedule assigned</p>
          </div>
        )}

        {assignments.filter(a => a.effective_end_date).length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
              <History className="w-4 h-4" />
              History
            </h4>
            <div className="space-y-2">
              {assignments
                .filter(a => a.effective_end_date)
                .sort((a, b) => new Date(b.effective_start_date) - new Date(a.effective_start_date))
                .map(assignment => (
                  <div key={assignment.id} className="p-3 bg-slate-50 rounded-lg border text-sm">
                    <div className="font-medium text-slate-800 mb-1">
                      {getTemplateName(assignment.template_id)}
                    </div>
                    <div className="text-xs text-slate-600">
                      {format(new Date(assignment.effective_start_date), 'MMM d, yyyy')} - {' '}
                      {format(new Date(assignment.effective_end_date), 'MMM d, yyyy')}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Schedule Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Schedule Template</Label>
              <Select
                value={formData.template_id}
                onValueChange={(val) => setFormData({ ...formData, template_id: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.filter(t => t.status === 'active').map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} ({template.rotation_length_weeks}-week)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Effective Start Date</Label>
              <Input
                type="date"
                value={formData.effective_start_date}
                onChange={(e) => setFormData({ ...formData, effective_start_date: e.target.value })}
              />
            </div>

            <div>
              <Label>Notes (optional)</Label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Reason for schedule change"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button
                onClick={() => assignMutation.mutate()}
                disabled={!formData.template_id || assignMutation.isPending}
              >
                Assign Schedule
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
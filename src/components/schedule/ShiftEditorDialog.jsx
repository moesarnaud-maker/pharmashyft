import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Trash2 } from 'lucide-react';

export default function ShiftEditorDialog({ 
  open, 
  onClose, 
  shift = null, 
  date,
  employees = [],
  locations = [],
  employeeLocations = [],
  currentUser,
  defaultLocationId = null
}) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    employee_id: shift?.employee_id || '',
    start_time: '09:00',
    end_time: '17:00',
    break_minutes: 30,
    expected_hours: 7.6,
    location_id: defaultLocationId || '',
    notes: '',
  });

  useEffect(() => {
    if (shift) {
      setFormData({
        employee_id: shift.employee_id,
        start_time: shift.start_time,
        end_time: shift.end_time,
        break_minutes: shift.break_minutes || 30,
        expected_hours: shift.expected_hours || 7.6,
        location_id: shift.location_id || '',
        notes: shift.notes || '',
      });
    }
  }, [shift]);

  // Filter employees eligible for selected location
  const eligibleEmployees = formData.location_id
    ? employees.filter(emp =>
        employeeLocations.some(el => el.employee_id === emp.id && el.location_id === formData.location_id)
      )
    : employees;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const shiftData = {
        ...formData,
        date,
        source: shift?.source === 'template' ? 'override' : 'manual',
        status: 'draft',
      };

      if (shift) {
        await base44.entities.ScheduledShift.update(shift.id, shiftData);
      } else {
        await base44.entities.ScheduledShift.create(shiftData);
      }

      // Audit log
      await base44.entities.AuditLog.create({
        actor_id: currentUser.id,
        actor_email: currentUser.email,
        actor_name: currentUser.full_name,
        action: shift ? 'update' : 'create',
        entity_type: 'ScheduledShift',
        entity_id: shift?.id || 'new',
        entity_description: `Shift for ${date}`,
        after_data: JSON.stringify(shiftData),
      });
    },
    onSuccess: () => {
      toast.success(shift ? 'Shift updated (draft)' : 'Shift created (draft)');
      queryClient.invalidateQueries({ queryKey: ['scheduledShifts'] });
      onClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.ScheduledShift.delete(shift.id);
      
      await base44.entities.AuditLog.create({
        actor_id: currentUser.id,
        actor_email: currentUser.email,
        actor_name: currentUser.full_name,
        action: 'delete',
        entity_type: 'ScheduledShift',
        entity_id: shift.id,
        entity_description: `Deleted shift for ${date}`,
        before_data: JSON.stringify(shift),
      });
    },
    onSuccess: () => {
      toast.success('Shift deleted');
      queryClient.invalidateQueries({ queryKey: ['scheduledShifts'] });
      onClose();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{shift ? 'Edit' : 'Add'} Shift - {date}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label>Location *</Label>
            <Select
              value={formData.location_id}
              onValueChange={(v) => setFormData({ ...formData, location_id: v })}
              disabled={!!shift}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {locations.filter(l => l.status === 'active').map(loc => (
                  <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Employee *</Label>
            <Select
              value={formData.employee_id}
              onValueChange={(v) => setFormData({ ...formData, employee_id: v })}
              disabled={!!shift || !formData.location_id}
            >
              <SelectTrigger>
                <SelectValue placeholder={formData.location_id ? "Select employee" : "Select location first"} />
              </SelectTrigger>
              <SelectContent>
                {eligibleEmployees.filter(e => e.status === 'active').map(emp => (
                  <SelectItem key={emp.id} value={emp.id}>{emp.employee_number}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.location_id && eligibleEmployees.length === 0 && (
              <p className="text-sm text-red-600 mt-1">No employees eligible for this location</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Time</Label>
              <Input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              />
            </div>
            <div>
              <Label>End Time</Label>
              <Input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Break (min)</Label>
              <Input
                type="number"
                value={formData.break_minutes}
                onChange={(e) => setFormData({ ...formData, break_minutes: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <Label>Expected Hours</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.expected_hours}
                onChange={(e) => setFormData({ ...formData, expected_hours: parseFloat(e.target.value) })}
              />
            </div>
          </div>



          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            {shift && (
              <Button variant="destructive" onClick={() => deleteMutation.mutate()}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button 
              onClick={() => saveMutation.mutate()} 
              disabled={!formData.employee_id || !formData.location_id}
            >
              Save as Draft
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
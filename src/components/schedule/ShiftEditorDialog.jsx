import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Trash2, AlertTriangle, CheckCircle } from 'lucide-react';

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

  const { data: availabilities = [] } = useQuery({
    queryKey: ['employeeAvailabilities'],
    queryFn: () => base44.entities.EmployeeAvailability.list(),
    enabled: open,
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

  useEffect(() => {
    console.log('ShiftEditorDialog opened with:', {
      defaultLocationId,
      formData_location_id: formData.location_id,
      employees: employees.length,
      employeeLocations: employeeLocations.length,
      eligibleEmployees: eligibleEmployees.length
    });
  }, [open]);

  useEffect(() => {
    if (formData.location_id) {
      console.log('Location selected:', formData.location_id);
      console.log('Employee-Location mappings for this location:', 
        employeeLocations.filter(el => String(el.location_id) === String(formData.location_id))
      );
      console.log('Eligible employees result:', eligibleEmployees);
    }
  }, [formData.location_id]);

  // Filter employees eligible for selected location (with type safety)
  const eligibleEmployees = formData.location_id
    ? employees.filter(emp =>
        employeeLocations.some(el => 
          String(el.employee_id) === String(emp.id) && 
          String(el.location_id) === String(formData.location_id)
        )
      )
    : employees;

  // Check availability conflicts
  const checkAvailability = () => {
    if (!formData.employee_id || !date) return null;

    const shiftDate = new Date(date);
    const weekday = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][shiftDate.getDay()];
    
    const empAvail = availabilities.find(a => 
      a.employee_id === formData.employee_id && a.weekday === weekday
    );

    if (!empAvail) return null;

    if (!empAvail.is_available) {
      return { type: 'unavailable', message: 'Employee marked as unavailable on this day' };
    }

    const shiftStart = formData.start_time;
    const shiftEnd = formData.end_time;
    const availStart = empAvail.available_start;
    const availEnd = empAvail.available_end;

    if (shiftStart < availStart || shiftEnd > availEnd) {
      return { 
        type: 'time_conflict', 
        message: `Outside availability window (${availStart} - ${availEnd})`
      };
    }

    const shiftHours = (new Date(`2000-01-01T${shiftEnd}`) - new Date(`2000-01-01T${shiftStart}`)) / (1000 * 60 * 60) - (formData.break_minutes / 60);
    if (empAvail.max_hours && shiftHours > empAvail.max_hours) {
      return {
        type: 'hours_exceeded',
        message: `Exceeds max hours (${empAvail.max_hours}h) for this day`
      };
    }

    if (empAvail.notes) {
      return {
        type: 'note',
        message: empAvail.notes
      };
    }

    return { type: 'available', message: 'Fits employee availability' };
  };

  const availabilityStatus = checkAvailability();

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

          {/* Availability Status */}
          {availabilityStatus && (
            <div className={`p-3 rounded-lg border ${
              availabilityStatus.type === 'available' ? 'bg-green-50 border-green-200' :
              availabilityStatus.type === 'note' ? 'bg-blue-50 border-blue-200' :
              'bg-amber-50 border-amber-200'
            }`}>
              <div className="flex items-start gap-2">
                {availabilityStatus.type === 'available' && (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                )}
                {(availabilityStatus.type === 'unavailable' || availabilityStatus.type === 'time_conflict' || availabilityStatus.type === 'hours_exceeded') && (
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                )}
                {availabilityStatus.type === 'note' && (
                  <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="font-medium text-sm">
                    {availabilityStatus.type === 'available' && 'Available'}
                    {availabilityStatus.type === 'unavailable' && 'Unavailable'}
                    {availabilityStatus.type === 'time_conflict' && 'Time Conflict'}
                    {availabilityStatus.type === 'hours_exceeded' && 'Hours Exceeded'}
                    {availabilityStatus.type === 'note' && 'Availability Note'}
                  </div>
                  <div className="text-sm text-slate-600 mt-0.5">
                    {availabilityStatus.message}
                  </div>
                </div>
              </div>
            </div>
          )}
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
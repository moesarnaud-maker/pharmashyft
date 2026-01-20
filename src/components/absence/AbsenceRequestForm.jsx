import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, differenceInBusinessDays, addDays } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';

export default function AbsenceRequestForm({ open, onClose, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    absence_type: '',
    start_date: null,
    end_date: null,
    notes: ''
  });

  const handleSubmit = () => {
    if (!formData.absence_type || !formData.start_date || !formData.end_date) return;
    
    const days = differenceInBusinessDays(formData.end_date, formData.start_date) + 1;
    const hours = days * 7.6; // Default Belgian workday

    onSubmit({
      ...formData,
      start_date: format(formData.start_date, 'yyyy-MM-dd'),
      end_date: format(formData.end_date, 'yyyy-MM-dd'),
      total_days: days,
      total_hours: hours,
      is_notification_only: formData.absence_type === 'sick'
    });

    setFormData({ absence_type: '', start_date: null, end_date: null, notes: '' });
  };

  const calculatedDays = formData.start_date && formData.end_date
    ? differenceInBusinessDays(formData.end_date, formData.start_date) + 1
    : 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request Time Off</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Absence Type</Label>
            <Select
              value={formData.absence_type}
              onValueChange={(v) => setFormData({ ...formData, absence_type: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vacation">🏖️ Vacation</SelectItem>
                <SelectItem value="sick">🤒 Sick Leave</SelectItem>
                <SelectItem value="unpaid">📋 Unpaid Leave</SelectItem>
                <SelectItem value="training">📚 Training</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.start_date ? format(formData.start_date, 'PPP') : 'Pick date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.start_date}
                    onSelect={(d) => setFormData({ ...formData, start_date: d })}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.end_date ? format(formData.end_date, 'PPP') : 'Pick date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.end_date}
                    onSelect={(d) => setFormData({ ...formData, end_date: d })}
                    disabled={(date) => formData.start_date && date < formData.start_date}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {calculatedDays > 0 && (
            <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
              {calculatedDays} working day{calculatedDays > 1 ? 's' : ''} ({(calculatedDays * 7.6).toFixed(1)} hours)
            </div>
          )}

          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              placeholder="Additional details..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          {formData.absence_type === 'sick' && (
            <div className="p-3 bg-amber-50 rounded-lg text-sm text-amber-700">
              ℹ️ Sick leave is notification-only and will be auto-approved.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || !formData.absence_type || !formData.start_date || !formData.end_date}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Submit Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
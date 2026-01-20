import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from 'date-fns';
import { CalendarIcon, Loader2, AlertCircle } from 'lucide-react';

export default function CorrectionRequestForm({ open, onClose, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    request_type: '',
    requested_date: null,
    requested_start_time: '',
    requested_end_time: '',
    reason: ''
  });

  const handleSubmit = () => {
    if (!formData.request_type || !formData.requested_date || !formData.reason) return;
    
    onSubmit({
      ...formData,
      requested_date: format(formData.requested_date, 'yyyy-MM-dd'),
    });

    setFormData({
      request_type: '',
      requested_date: null,
      requested_start_time: '',
      requested_end_time: '',
      reason: ''
    });
  };

  const requestTypes = [
    { value: 'forgot_clock_in', label: 'Forgot to Clock In' },
    { value: 'forgot_clock_out', label: 'Forgot to Clock Out' },
    { value: 'forgot_break', label: 'Forgot to Log Break' },
    { value: 'incorrect_time', label: 'Incorrect Time Entry' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request Time Correction</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-3 bg-amber-50 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <p className="text-sm text-amber-700">
              Use this form if you forgot to clock in/out or need to correct a time entry. 
              Your request will be reviewed by your manager.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Request Type</Label>
            <Select
              value={formData.request_type}
              onValueChange={(v) => setFormData({ ...formData, request_type: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type..." />
              </SelectTrigger>
              <SelectContent>
                {requestTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.requested_date ? format(formData.requested_date, 'PPP') : 'Pick date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.requested_date}
                  onSelect={(d) => setFormData({ ...formData, requested_date: d })}
                  disabled={(date) => date > new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Input
                type="time"
                value={formData.requested_start_time}
                onChange={(e) => setFormData({ ...formData, requested_start_time: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>End Time</Label>
              <Input
                type="time"
                value={formData.requested_end_time}
                onChange={(e) => setFormData({ ...formData, requested_end_time: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Reason <span className="text-red-500">*</span></Label>
            <Textarea
              placeholder="Please explain why you need this correction..."
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || !formData.request_type || !formData.requested_date || !formData.reason}
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
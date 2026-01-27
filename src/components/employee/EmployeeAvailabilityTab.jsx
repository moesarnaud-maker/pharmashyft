import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Save, Calendar, Clock, Copy, ClipboardPaste } from 'lucide-react';

const WEEKDAYS = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' }
];

export default function EmployeeAvailabilityTab({ employee }) {
  const queryClient = useQueryClient();
  const [copiedDay, setCopiedDay] = useState(null);

  const { data: availabilities = [] } = useQuery({
    queryKey: ['employeeAvailability', employee?.id],
    queryFn: () => base44.entities.EmployeeAvailability.filter({ employee_id: employee?.id }),
    enabled: !!employee?.id,
  });

  const [availabilityData, setAvailabilityData] = useState({});

  useEffect(() => {
    if (availabilities.length > 0) {
      const mapped = {};
      availabilities.forEach(a => {
        mapped[a.weekday] = {
          is_available: a.is_available,
          available_start: a.available_start || '09:00',
          available_end: a.available_end || '17:00',
          max_hours: a.max_hours || 8,
          notes: a.notes || ''
        };
      });
      setAvailabilityData(mapped);
    } else {
      // Initialize with defaults
      const defaults = {};
      WEEKDAYS.forEach(day => {
        defaults[day.value] = {
          is_available: day.value !== 'saturday' && day.value !== 'sunday',
          available_start: '09:00',
          available_end: '17:00',
          max_hours: 8,
          notes: ''
        };
      });
      setAvailabilityData(defaults);
    }
  }, [availabilities]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!employee?.id) {
        throw new Error('Employee not found');
      }

      // Delete existing availabilities
      for (const avail of availabilities) {
        await base44.entities.EmployeeAvailability.delete(avail.id);
      }

      // Create new ones
      const today = new Date().toISOString().split('T')[0];
      for (const [weekday, data] of Object.entries(availabilityData)) {
        await base44.entities.EmployeeAvailability.create({
          employee_id: employee.id,
          weekday,
          is_available: data.is_available,
          available_start: data.available_start,
          available_end: data.available_end,
          max_hours: data.max_hours,
          notes: data.notes,
          effective_date: today
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employeeAvailability'] });
      toast.success('Availability saved successfully');
    },
    onError: () => {
      toast.error('Failed to save availability');
    },
  });

  const updateDay = (weekday, field, value) => {
    setAvailabilityData(prev => ({
      ...prev,
      [weekday]: {
        ...prev[weekday],
        [field]: value
      }
    }));
  };

  const handleCopy = (weekday) => {
    const dayData = availabilityData[weekday];
    setCopiedDay({
      weekday,
      data: { ...dayData }
    });
    toast.success(`Copied ${WEEKDAYS.find(d => d.value === weekday)?.label} availability`);
  };

  const handlePaste = (weekday) => {
    if (!copiedDay) {
      toast.error('No availability data copied');
      return;
    }
    
    setAvailabilityData(prev => ({
      ...prev,
      [weekday]: { ...copiedDay.data }
    }));
    
    const sourceDayLabel = WEEKDAYS.find(d => d.value === copiedDay.weekday)?.label;
    const targetDayLabel = WEEKDAYS.find(d => d.value === weekday)?.label;
    toast.success(`Pasted ${sourceDayLabel} availability to ${targetDayLabel}`);
  };

  const handleSave = () => {
    saveMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Weekly Availability
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {WEEKDAYS.map(day => {
            const data = availabilityData[day.value] || {};
            return (
              <Card key={day.value} className="p-4 bg-slate-50">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">{day.label}</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(day.value)}
                        className="h-8"
                      >
                        <Copy className="w-3.5 h-3.5 mr-1" />
                        Copy
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handlePaste(day.value)}
                        disabled={!copiedDay}
                        className="h-8"
                      >
                        <ClipboardPaste className="w-3.5 h-3.5 mr-1" />
                        Paste
                      </Button>
                      <Switch
                        checked={data.is_available}
                        onCheckedChange={(checked) => updateDay(day.value, 'is_available', checked)}
                      />
                      <span className="text-sm text-slate-600">
                        {data.is_available ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                  </div>

                  {data.is_available && (
                    <div className="grid grid-cols-3 gap-3 mt-2">
                      <div>
                        <Label className="text-xs text-slate-600">Start Time</Label>
                        <Input
                          type="time"
                          value={data.available_start}
                          onChange={(e) => updateDay(day.value, 'available_start', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-slate-600">End Time</Label>
                        <Input
                          type="time"
                          value={data.available_end}
                          onChange={(e) => updateDay(day.value, 'available_end', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-slate-600">Max Hours</Label>
                        <Input
                          type="number"
                          step="0.5"
                          value={data.max_hours}
                          onChange={(e) => updateDay(day.value, 'max_hours', parseFloat(e.target.value))}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  )}

                  {data.is_available && (
                    <div>
                      <Label className="text-xs text-slate-600">Notes / Restrictions</Label>
                      <Textarea
                        placeholder="e.g., Prefer morning shifts, Cannot work past 3pm on Wednesdays..."
                        value={data.notes}
                        onChange={(e) => updateDay(day.value, 'notes', e.target.value)}
                        className="mt-1 h-16"
                      />
                    </div>
                  )}
                </div>
              </Card>
            );
          })}

          <Button onClick={handleSave} className="w-full" disabled={saveMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            Save Availability
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
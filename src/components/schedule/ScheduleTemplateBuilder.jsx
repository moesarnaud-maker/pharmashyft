import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Calendar, Clock, Plus, Trash2, Save, MapPin } from 'lucide-react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';

const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const WEEK_LABELS = ['Week A', 'Week B', 'Week C', 'Week D', 'Week E', 'Week F'];

const DayEditor = ({ day, onUpdate, locations, useMainLocation }) => {
  const [useCustomLocation, setUseCustomLocation] = useState(!!day.location_id);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium capitalize">{day.weekday}</h4>
        <div className="flex items-center gap-2">
          <Switch
            checked={day.is_working_day}
            onCheckedChange={(checked) => onUpdate({ ...day, is_working_day: checked })}
          />
          <span className="text-xs text-slate-500">{day.is_working_day ? 'Working' : 'Off'}</span>
        </div>
      </div>

      {day.is_working_day && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Start Time</Label>
              <Input
                type="time"
                value={day.start_time || '09:00'}
                onChange={(e) => onUpdate({ ...day, start_time: e.target.value })}
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs">End Time</Label>
              <Input
                type="time"
                value={day.end_time || '17:30'}
                onChange={(e) => onUpdate({ ...day, end_time: e.target.value })}
                className="h-8"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Break (min)</Label>
              <Input
                type="number"
                value={day.break_minutes || 30}
                onChange={(e) => onUpdate({ ...day, break_minutes: parseFloat(e.target.value) })}
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs">Hours</Label>
              <Input
                type="number"
                step="0.1"
                value={day.expected_hours || 7.6}
                onChange={(e) => onUpdate({ ...day, expected_hours: parseFloat(e.target.value) })}
                className="h-8"
              />
            </div>
          </div>

          {/* Location Override Section */}
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <Label className="text-xs">Location</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={useCustomLocation}
                  onCheckedChange={(checked) => {
                    setUseCustomLocation(checked);
                    if (!checked) {
                      onUpdate({ ...day, location_id: null });
                    }
                  }}
                />
                <span className="text-xs text-slate-500">
                  {useCustomLocation ? 'Custom' : 'Default'}
                </span>
              </div>
            </div>

            {useCustomLocation ? (
              <Select
                value={day.location_id || ''}
                onValueChange={(v) => onUpdate({ ...day, location_id: v })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map(loc => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-xs text-slate-500 italic">
                Will use employee's main location
              </p>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

export default function ScheduleTemplateBuilder({ template, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    rotation_length_weeks: 1,
    status: 'active',
    is_default: false,
  });

  const [weeks, setWeeks] = useState([]);

  // Fetch all locations for the location dropdown
  const { data: locations = [], isLoading: isLoadingLocations, isError: isLocationsError, error: locationsError } = useQuery({
    queryKey: ['locations'],
    queryFn: () => base44.entities.Location.filter({}),
    retry: 2,
    onError: (err) => {
      console.error('Failed to load locations:', err);
      toast.error('Failed to load locations');
    }
  });

  useEffect(() => {
    if (template) {
      setFormData(template);
      // Load weeks and days for editing
      loadTemplateData();
    } else {
      // Initialize with default week
      initializeWeeks(1);
    }
  }, [template]);

  const loadTemplateData = async () => {
    const loadedWeeks = await base44.entities.ScheduleWeek.filter({ template_id: template.id });
    const weeksWithDays = await Promise.all(
      loadedWeeks.map(async (week) => {
        const days = await base44.entities.ScheduleDay.filter({ schedule_week_id: week.id });
        return { ...week, days };
      })
    );
    setWeeks(weeksWithDays);
  };

  const initializeWeeks = (numWeeks) => {
    const newWeeks = [];
    for (let i = 1; i <= numWeeks; i++) {
      const days = WEEKDAYS.map(weekday => ({
        weekday,
        start_time: '09:00',
        end_time: '17:30',
        break_minutes: 30,
        expected_hours: weekday === 'saturday' || weekday === 'sunday' ? 0 : 7.6,
        is_working_day: weekday !== 'saturday' && weekday !== 'sunday',
        location_id: null, // null means use employee's main location
      }));
      newWeeks.push({
        week_index: i,
        week_label: WEEK_LABELS[i - 1],
        days,
      });
    }
    setWeeks(newWeeks);
  };

  const handleRotationChange = (newLength) => {
    setFormData({ ...formData, rotation_length_weeks: newLength });
    if (newLength > weeks.length) {
      initializeWeeks(newLength);
    } else {
      setWeeks(weeks.slice(0, newLength));
    }
  };

  const updateDay = useCallback((weekIndex, dayIndex, updatedDay) => {
    setWeeks(prevWeeks => {
      const newWeeks = [...prevWeeks];
      newWeeks[weekIndex].days[dayIndex] = updatedDay;
      return newWeeks;
    });
  }, []);

  const saveMutation = useMutation({
    mutationFn: async () => {
      let templateId;
      
      if (template) {
        await base44.entities.ScheduleTemplate.update(template.id, formData);
        templateId = template.id;
        
        // Delete old weeks and days
        const oldWeeks = await base44.entities.ScheduleWeek.filter({ template_id: template.id });
        for (const week of oldWeeks) {
          const oldDays = await base44.entities.ScheduleDay.filter({ schedule_week_id: week.id });
          for (const day of oldDays) {
            await base44.entities.ScheduleDay.delete(day.id);
          }
          await base44.entities.ScheduleWeek.delete(week.id);
        }
      } else {
        const created = await base44.entities.ScheduleTemplate.create(formData);
        templateId = created.id;
      }

      // Create weeks and days
      for (const week of weeks) {
        const createdWeek = await base44.entities.ScheduleWeek.create({
          template_id: templateId,
          week_index: week.week_index,
          week_label: week.week_label,
        });

        const daysToCreate = week.days.map(day => ({
          schedule_week_id: createdWeek.id,
          ...day,
        }));

        await base44.entities.ScheduleDay.bulkCreate(daysToCreate);
      }
    },
    onSuccess: () => {
      toast.success('Schedule template saved');
      queryClient.invalidateQueries({ queryKey: ['scheduleTemplates'] });
      onClose();
    },
    onError: (error) => {
      console.error('Failed to save schedule template:', error);
      toast.error(error?.message || 'Failed to save template. Please try again.');
    },
  });

  if (isLoadingLocations) {
    return <LoadingSpinner message="Loading locations..." />;
  }

  if (isLocationsError) {
    return (
      <ErrorDisplay 
        error={locationsError} 
        message="Failed to load locations"
        onRetry={() => queryClient.invalidateQueries(['locations'])}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>{template ? 'Edit' : 'Create'} Schedule Template</CardTitle>
          <CardDescription>Define rotating work patterns for employees</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            <div>
              <Label>Template Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Standard 2-Week Rotation"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this schedule"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Rotation Length</Label>
                <Select
                  value={String(formData.rotation_length_weeks)}
                  onValueChange={(val) => handleRotationChange(parseInt(val))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map(num => (
                      <SelectItem key={num} value={String(num)}>
                        {num} {num === 1 ? 'Week' : 'Weeks'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 pt-6">
                <Switch
                  checked={formData.is_default}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                />
                <Label>Set as default</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Schedule Pattern</CardTitle>
          <CardDescription>Configure working hours for each week in the rotation</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="0">
            <TabsList className="mb-4">
              {weeks.map((week, idx) => (
                <TabsTrigger key={idx} value={String(idx)}>
                  {week.week_label}
                </TabsTrigger>
              ))}
            </TabsList>

            {weeks.map((week, weekIdx) => (
              <TabsContent key={weekIdx} value={String(weekIdx)}>
                <div className="space-y-3">
                  {week.days.map((day, dayIdx) => (
                    <DayEditor
                      key={dayIdx}
                      day={day}
                      locations={locations}
                      onUpdate={(updated) => updateDay(weekIdx, dayIdx, updated)}
                    />
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          <Save className="w-4 h-4 mr-2" />
          {saveMutation.isPending ? 'Saving...' : 'Save Template'}
        </Button>
      </div>
    </div>
  );
}
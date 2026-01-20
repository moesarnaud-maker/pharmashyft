import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Save, Calendar } from 'lucide-react';

const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const WEEK_LABELS = ['Week A', 'Week B', 'Week C', 'Week D', 'Week E', 'Week F'];

const DayEditor = ({ day, onUpdate }) => {
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
              <Label className="text-xs">Start</Label>
              <Input
                type="time"
                value={day.start_time || '09:00'}
                onChange={(e) => onUpdate({ ...day, start_time: e.target.value })}
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs">End</Label>
              <Input
                type="time"
                value={day.end_time || '17:00'}
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
                onChange={(e) => onUpdate({ ...day, break_minutes: parseInt(e.target.value) })}
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
        </div>
      )}
    </Card>
  );
};

export default function CustomScheduleBuilder({ employeeId, onClose, existingSchedule = null }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: 'Custom Schedule',
    rotation_length_weeks: 1,
    effective_start_date: new Date().toISOString().split('T')[0],
  });
  const [weeks, setWeeks] = useState([]);

  useEffect(() => {
    initializeWeeks(1);
  }, []);

  const initializeWeeks = (numWeeks) => {
    const newWeeks = [];
    for (let i = 1; i <= numWeeks; i++) {
      const days = WEEKDAYS.map(weekday => ({
        weekday,
        start_time: '09:00',
        end_time: '17:00',
        break_minutes: 30,
        expected_hours: weekday === 'saturday' || weekday === 'sunday' ? 0 : 7.6,
        is_working_day: weekday !== 'saturday' && weekday !== 'sunday',
      }));
      newWeeks.push({ week_index: i, week_label: WEEK_LABELS[i - 1], days });
    }
    setWeeks(newWeeks);
  };

  const handleRotationChange = (newLength) => {
    setFormData({ ...formData, rotation_length_weeks: newLength });
    initializeWeeks(newLength);
  };

  const updateDay = (weekIndex, dayIndex, updatedDay) => {
    const newWeeks = [...weeks];
    newWeeks[weekIndex].days[dayIndex] = updatedDay;
    setWeeks(newWeeks);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const schedule = await base44.entities.EmployeeCustomSchedule.create({
        employee_id: employeeId,
        ...formData,
        status: 'active',
      });

      for (const week of weeks) {
        const createdWeek = await base44.entities.CustomScheduleWeek.create({
          custom_schedule_id: schedule.id,
          week_index: week.week_index,
          week_label: week.week_label,
        });

        const daysToCreate = week.days.map(day => ({
          custom_schedule_week_id: createdWeek.id,
          ...day,
        }));

        await base44.entities.CustomScheduleDay.bulkCreate(daysToCreate);
      }

      return schedule;
    },
    onSuccess: () => {
      toast.success('Custom schedule created');
      queryClient.invalidateQueries({ queryKey: ['employeeCustomSchedules'] });
      queryClient.invalidateQueries({ queryKey: ['customScheduleWeeks'] });
      queryClient.invalidateQueries({ queryKey: ['customScheduleDays'] });
      onClose();
    },
  });

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Create Custom Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Schedule Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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

            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={formData.effective_start_date}
                onChange={(e) => setFormData({ ...formData, effective_start_date: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
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
          {saveMutation.isPending ? 'Saving...' : 'Save Schedule'}
        </Button>
      </div>
    </div>
  );
}
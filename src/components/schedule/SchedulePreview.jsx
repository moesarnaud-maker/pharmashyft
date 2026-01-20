import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, addWeeks, startOfWeek, addDays, differenceInWeeks } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function SchedulePreview({ 
  template, 
  weeks = [], 
  scheduleDays = [], 
  startDate = new Date(),
  previewWeeks = 6 
}) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [calendarData, setCalendarData] = useState([]);

  useEffect(() => {
    generateCalendar();
  }, [template, weeks, scheduleDays, startDate, weekOffset]);

  const generateCalendar = () => {
    if (!template || weeks.length === 0) return;

    const rotationLength = template.rotation_length_weeks;
    const data = [];

    for (let w = 0; w < previewWeeks; w++) {
      const weekStartDate = startOfWeek(addWeeks(startDate, weekOffset + w), { weekStartsOn: 1 });
      
      // Calculate which week in rotation
      const weeksSinceStart = differenceInWeeks(weekStartDate, startOfWeek(startDate, { weekStartsOn: 1 }));
      const rotationWeekIndex = (weeksSinceStart % rotationLength) + 1;
      
      const scheduleWeek = weeks.find(sw => sw.week_index === rotationWeekIndex);
      
      const days = [];
      for (let d = 0; d < 7; d++) {
        const date = addDays(weekStartDate, d);
        const weekday = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'][d];
        
        const scheduleDay = scheduleDays.find(
          sd => sd.schedule_week_id === scheduleWeek?.id && sd.weekday === weekday
        );

        days.push({
          date,
          weekday,
          scheduleDay: scheduleDay || { is_working_day: false },
        });
      }

      data.push({
        weekStartDate,
        rotationWeekIndex,
        weekLabel: scheduleWeek?.week_label || `Week ${rotationWeekIndex}`,
        days,
      });
    }

    setCalendarData(data);
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Schedule Preview
            </CardTitle>
            <p className="text-sm text-slate-500 mt-1">
              {template?.name} • {template?.rotation_length_weeks}-week rotation
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setWeekOffset(o => o - previewWeeks)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setWeekOffset(0)} disabled={weekOffset === 0}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={() => setWeekOffset(o => o + previewWeeks)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {calendarData.map((week, idx) => (
            <div key={idx} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-slate-800">{week.weekLabel}</h4>
                <span className="text-sm text-slate-500">
                  {format(week.weekStartDate, 'MMM d')} - {format(addDays(week.weekStartDate, 6), 'MMM d, yyyy')}
                </span>
              </div>
              
              <div className="grid grid-cols-7 gap-2">
                {week.days.map((day, dayIdx) => {
                  const isToday = format(day.date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                  const isWorking = day.scheduleDay.is_working_day;
                  
                  return (
                    <div
                      key={dayIdx}
                      className={`p-2 rounded-lg border text-center transition-all ${
                        isToday 
                          ? 'border-blue-500 bg-blue-50' 
                          : isWorking 
                            ? 'border-slate-200 bg-white hover:bg-slate-50' 
                            : 'border-slate-100 bg-slate-50'
                      }`}
                    >
                      <div className="text-xs font-medium text-slate-600 capitalize mb-1">
                        {day.weekday.slice(0, 3)}
                      </div>
                      <div className={`text-sm font-semibold ${isToday ? 'text-blue-600' : 'text-slate-800'}`}>
                        {format(day.date, 'd')}
                      </div>
                      {isWorking ? (
                        <div className="text-xs text-slate-500 mt-1">
                          <div>{day.scheduleDay.start_time || '09:00'}</div>
                          <div>{day.scheduleDay.end_time || '17:30'}</div>
                          <div className="font-medium text-emerald-600 mt-0.5">
                            {day.scheduleDay.expected_hours || 7.6}h
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400 mt-1">Off</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
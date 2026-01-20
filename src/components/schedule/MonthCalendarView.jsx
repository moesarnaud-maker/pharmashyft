import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar, MapPin, Users } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, startOfWeek, endOfWeek, isSameMonth, differenceInWeeks, addWeeks, startOfWeek as getWeekStart, addDays } from 'date-fns';

export default function MonthCalendarView({
  employees = [],
  users = [],
  teams = [],
  locations = [],
  scheduleAssignments = [],
  scheduleTemplates = [],
  scheduleWeeks = [],
  scheduleDays = [],
  absenceRequests = [],
  employeeLocations = []
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedDay, setSelectedDay] = useState(null);
  const [dayDetails, setDayDetails] = useState([]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getEmployeeName = (empId) => {
    const emp = employees.find(e => e.id === empId);
    const user = users.find(u => u.id === emp?.user_id);
    return user?.full_name || 'Unknown';
  };

  const getLocationName = (locId) => locations.find(l => l.id === locId)?.name || '';

  const getScheduleForDate = (employee, date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Check absences first
    const absence = absenceRequests.find(a => 
      a.employee_id === employee.id &&
      a.status === 'approved' &&
      dateStr >= a.start_date &&
      dateStr <= a.end_date
    );
    
    if (absence) {
      return { type: 'absence', absence_type: absence.absence_type };
    }

    // Get current assignment
    const assignment = scheduleAssignments.find(a => 
      a.employee_id === employee.id &&
      dateStr >= a.effective_start_date &&
      (!a.effective_end_date || dateStr <= a.effective_end_date)
    );

    if (!assignment) return null;

    const template = scheduleTemplates.find(t => t.id === assignment.template_id);
    if (!template) return null;

    // Calculate rotation week
    const assignmentStart = getWeekStart(new Date(assignment.effective_start_date), { weekStartsOn: 1 });
    const targetWeek = getWeekStart(date, { weekStartsOn: 1 });
    const weeksSinceStart = differenceInWeeks(targetWeek, assignmentStart);
    const rotationWeekIndex = (weeksSinceStart % template.rotation_length_weeks) + 1;

    const scheduleWeek = scheduleWeeks.find(w => 
      w.template_id === template.id && w.week_index === rotationWeekIndex
    );

    if (!scheduleWeek) return null;

    const weekday = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'][date.getDay() === 0 ? 6 : date.getDay() - 1];
    const scheduleDay = scheduleDays.find(d => 
      d.schedule_week_id === scheduleWeek.id && d.weekday === weekday
    );

    if (!scheduleDay || !scheduleDay.is_working_day) return null;

    return {
      type: 'scheduled',
      start_time: scheduleDay.start_time,
      end_time: scheduleDay.end_time,
      expected_hours: scheduleDay.expected_hours,
      location_id: scheduleDay.location_id,
    };
  };

  const getDaySchedules = (date) => {
    let filtered = employees.filter(e => e.status === 'active');

    if (selectedTeam !== 'all') {
      filtered = filtered.filter(e => e.team_id === selectedTeam);
    }

    if (selectedLocation !== 'all') {
      // Filter by employees eligible for this location
      const eligibleEmpIds = employeeLocations
        .filter(el => el.location_id === selectedLocation)
        .map(el => el.employee_id);
      filtered = filtered.filter(e => eligibleEmpIds.includes(e.id));
    }

    return filtered.map(emp => {
      const schedule = getScheduleForDate(emp, date);
      return schedule ? { employee: emp, schedule } : null;
    }).filter(Boolean);
  };

  const handleDayClick = (date) => {
    setSelectedDay(date);
    setDayDetails(getDaySchedules(date));
  };

  const absenceColors = {
    vacation: 'bg-blue-100 text-blue-700',
    sick: 'bg-red-100 text-red-700',
    unpaid: 'bg-slate-100 text-slate-700',
    training: 'bg-purple-100 text-purple-700',
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Schedule Calendar
            </CardTitle>
            <div className="flex items-center gap-3">
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  {teams.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.filter(l => l.status === 'active').map(l => (
                    <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="font-semibold text-slate-800 min-w-32 text-center">
                {format(currentMonth, 'MMMM yyyy')}
              </span>
              <Button variant="outline" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="text-center font-semibold text-slate-600 text-sm py-2">
                {day}
              </div>
            ))}

            {calendarDays.map(date => {
              const schedules = getDaySchedules(date);
              const isCurrentMonth = isSameMonth(date, currentMonth);
              const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

              return (
                <div
                  key={date.toString()}
                  onClick={() => handleDayClick(date)}
                  className={`min-h-32 p-2 border rounded-lg cursor-pointer transition-all ${
                    isToday ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'
                  } ${!isCurrentMonth ? 'opacity-40' : ''}`}
                >
                  <div className={`text-sm font-medium mb-2 ${isToday ? 'text-blue-600' : 'text-slate-700'}`}>
                    {format(date, 'd')}
                  </div>
                  <div className="space-y-1">
                    {schedules.slice(0, 3).map((item, idx) => {
                      const name = getEmployeeName(item.employee.id);
                      const location = getLocationName(item.schedule.location_id);
                      
                      if (item.schedule.type === 'absence') {
                        return (
                          <div key={idx} className={`text-xs p-1 rounded ${absenceColors[item.schedule.absence_type]}`}>
                            {name.split(' ')[0]} - {item.schedule.absence_type}
                          </div>
                        );
                      }

                      return (
                        <div key={idx} className="text-xs p-1 bg-emerald-50 border border-emerald-200 rounded">
                          <div className="font-medium text-emerald-900">{name.split(' ')[0]}</div>
                          <div className="text-emerald-700">
                            {item.schedule.start_time}–{item.schedule.end_time}
                          </div>
                          {location && <div className="text-emerald-600 flex items-center gap-0.5">
                            <MapPin className="w-2.5 h-2.5" /> {location}
                          </div>}
                        </div>
                      );
                    })}
                    {schedules.length > 3 && (
                      <div className="text-xs text-slate-500 font-medium">
                        +{schedules.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedDay} onOpenChange={() => setSelectedDay(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Schedule for {selectedDay && format(selectedDay, 'EEEE, MMMM d, yyyy')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {dayDetails.map((item, idx) => {
              const name = getEmployeeName(item.employee.id);
              const location = getLocationName(item.schedule.location_id);
              const team = teams.find(t => t.id === item.employee.team_id);

              return (
                <div key={idx} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-semibold text-slate-800">{name}</div>
                      <div className="text-sm text-slate-500">{team?.name}</div>
                    </div>
                    {item.schedule.type === 'absence' ? (
                      <Badge className={absenceColors[item.schedule.absence_type]}>
                        {item.schedule.absence_type}
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-100 text-emerald-700">Scheduled</Badge>
                    )}
                  </div>
                  
                  {item.schedule.type === 'scheduled' && (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-slate-500">Time:</span>{' '}
                        <span className="font-medium">{item.schedule.start_time} – {item.schedule.end_time}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Expected:</span>{' '}
                        <span className="font-medium">{item.schedule.expected_hours}h</span>
                      </div>
                      {location && (
                        <div className="col-span-2 flex items-center gap-1 text-slate-600">
                          <MapPin className="w-4 h-4" />
                          {location}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {dayDetails.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                No scheduled employees for this day
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, Calendar, Send, Plus, MapPin } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, startOfWeek, endOfWeek, isSameMonth } from 'date-fns';
import ShiftEditorDialog from './ShiftEditorDialog';
import PublishScheduleDialog from './PublishScheduleDialog';
import LocationSelector from './LocationSelector';
import { formatUserName } from '@/components/utils/helpers';

export default function MonthCalendarView({
  employees = [],
  users = [],
  teams = [],
  locations = [],
  absenceRequests = [],
  employeeLocations = [],
  currentUser,
  isAdmin = false
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState(locations.find(l => l.status === 'active')?.id || '');
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedShift, setSelectedShift] = useState(null);
  const [showDraftShifts, setShowDraftShifts] = useState(isAdmin);
  const [showShiftEditor, setShowShiftEditor] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [editDate, setEditDate] = useState(null);

  const { data: scheduledShifts = [] } = useQuery({
    queryKey: ['scheduledShifts'],
    queryFn: () => base44.entities.ScheduledShift.list(),
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getEmployeeName = (empId) => {
    const emp = employees.find(e => e.id === empId);
    const user = users.find(u => u.id === emp?.user_id);
    return formatUserName(user);
  };

  const getLocationName = (locId) => locations.find(l => l.id === locId)?.name || '';

  const getShiftsForDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    let shifts = scheduledShifts.filter(s => s.date === dateStr);
    
    // ALWAYS filter by selected location (required)
    if (selectedLocation) {
      shifts = shifts.filter(s => s.location_id === selectedLocation);
    }
    
    // Filter by status (employees only see published, admin can toggle)
    if (!isAdmin || !showDraftShifts) {
      shifts = shifts.filter(s => s.status === 'published');
    }

    // Filter by team
    if (selectedTeam !== 'all') {
      shifts = shifts.filter(s => {
        const emp = employees.find(e => e.id === s.employee_id);
        return emp?.team_id === selectedTeam;
      });
    }

    // Check for absences that override shifts
    const shiftsWithAbsences = shifts.map(shift => {
      const absence = absenceRequests.find(a => 
        a.employee_id === shift.employee_id &&
        a.status === 'approved' &&
        dateStr >= a.start_date &&
        dateStr <= a.end_date
      );
      
      return absence ? { ...shift, absence } : shift;
    });

    return shiftsWithAbsences;
  };

  const handleDayClick = (date, shift = null) => {
    setSelectedDay(date);
    if (isAdmin && shift) {
      setSelectedShift(shift);
      setShowShiftEditor(true);
    }
  };

  const handleAddShift = (date) => {
    setEditDate(format(date, 'yyyy-MM-dd'));
    setSelectedShift(null);
    setShowShiftEditor(true);
  };

  // Filter drafts by selected location
  const draftShifts = isAdmin 
    ? scheduledShifts.filter(s => s.status === 'draft' && s.location_id === selectedLocation) 
    : [];

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
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Schedule Calendar
              </CardTitle>
              <LocationSelector
                locations={locations}
                selectedLocation={selectedLocation}
                onLocationChange={setSelectedLocation}
              />
            </div>
            
            <div className="flex items-center gap-3 flex-wrap">
              {isAdmin && (
                <>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={showDraftShifts}
                      onCheckedChange={setShowDraftShifts}
                    />
                    <Label className="text-sm">Show Drafts</Label>
                  </div>
                  
                  {draftShifts.length > 0 && (
                    <Button onClick={() => setShowPublishDialog(true)} size="sm">
                      <Send className="w-4 h-4 mr-2" />
                      Publish {draftShifts.length} Drafts
                    </Button>
                  )}
                </>
              )}

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
              const shifts = getShiftsForDate(date);
              const isCurrentMonth = isSameMonth(date, currentMonth);
              const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

              return (
                <div
                  key={date.toString()}
                  className={`min-h-32 p-2 border rounded-lg transition-all relative ${
                    isToday ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'
                  } ${!isCurrentMonth ? 'opacity-40' : ''}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-slate-700'}`}>
                      {format(date, 'd')}
                    </div>
                    {isAdmin && isCurrentMonth && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-5 w-5"
                        onClick={() => handleAddShift(date)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                  <div className="space-y-1">
                    {shifts.slice(0, 3).map((shift, idx) => {
                      const name = getEmployeeName(shift.employee_id);
                      const location = getLocationName(shift.location_id);
                      
                      if (shift.absence) {
                        return (
                          <div key={idx} className={`text-xs p-1 rounded ${absenceColors[shift.absence.absence_type]}`}>
                            {name} - {shift.absence.absence_type}
                          </div>
                        );
                      }

                      return (
                        <div 
                          key={idx} 
                          onClick={() => isAdmin && handleDayClick(date, shift)}
                          className={`text-xs p-1 rounded cursor-pointer ${
                            shift.status === 'draft' 
                              ? 'bg-amber-50 border border-amber-300' 
                              : 'bg-emerald-50 border border-emerald-200'
                          }`}
                        >
                          <div className={`font-medium ${shift.status === 'draft' ? 'text-amber-900' : 'text-emerald-900'}`}>
                            {name}
                          </div>
                          <div className={shift.status === 'draft' ? 'text-amber-700' : 'text-emerald-700'}>
                            {shift.start_time}–{shift.end_time}
                          </div>
                          {location && <div className={`flex items-center gap-0.5 ${shift.status === 'draft' ? 'text-amber-600' : 'text-emerald-600'}`}>
                            <MapPin className="w-2.5 h-2.5" /> {location}
                          </div>}
                        </div>
                      );
                    })}
                    {shifts.length > 3 && (
                      <div className="text-xs text-slate-500 font-medium">
                        +{shifts.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {isAdmin && (
        <>
          <ShiftEditorDialog
            open={showShiftEditor}
            onClose={() => {
              setShowShiftEditor(false);
              setSelectedShift(null);
              setEditDate(null);
            }}
            shift={selectedShift}
            date={editDate || (selectedShift?.date)}
            employees={employees}
            users={users}
            locations={locations}
            employeeLocations={employeeLocations}
            currentUser={currentUser}
            defaultLocationId={selectedLocation}
          />

          <PublishScheduleDialog
            open={showPublishDialog}
            onClose={() => setShowPublishDialog(false)}
            draftShifts={draftShifts}
            currentUser={currentUser}
          />
        </>
      )}
    </div>
  );
}
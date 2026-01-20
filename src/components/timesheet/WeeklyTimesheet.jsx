import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Send, CheckCircle, Lock, Clock, XCircle } from 'lucide-react';

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-slate-100 text-slate-700', icon: Clock },
  submitted: { label: 'Submitted', color: 'bg-blue-100 text-blue-700', icon: Send },
  approved: { label: 'Approved', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  locked: { label: 'Locked', color: 'bg-purple-100 text-purple-700', icon: Lock },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle },
};

export default function WeeklyTimesheet({ 
  timesheet, 
  timesheetLines = [], 
  weekStart, 
  onWeekChange, 
  onSubmit,
  canSubmit = true,
  isLoading = false
}) {
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = new Date();

  const getLineForDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return timesheetLines.find(l => l.date === dateStr) || {
      hours_worked: 0,
      break_hours: 0,
      overtime_hours: 0,
      absence_type: 'none',
      absence_hours: 0
    };
  };

  const totals = timesheetLines.reduce((acc, line) => ({
    worked: acc.worked + (line.hours_worked || 0),
    breaks: acc.breaks + (line.break_hours || 0),
    overtime: acc.overtime + (line.overtime_hours || 0),
    absence: acc.absence + (line.absence_hours || 0)
  }), { worked: 0, breaks: 0, overtime: 0, absence: 0 });

  const StatusIcon = timesheet ? statusConfig[timesheet.status]?.icon : Clock;

  const formatHours = (hours) => {
    if (!hours) return '-';
    return `${hours.toFixed(1)}h`;
  };

  const absenceColors = {
    vacation: 'bg-blue-50 text-blue-600',
    sick: 'bg-red-50 text-red-600',
    unpaid: 'bg-slate-50 text-slate-600',
    training: 'bg-purple-50 text-purple-600'
  };

  return (
    <Card className="border-0 shadow-lg overflow-hidden">
      <CardHeader className="border-b bg-slate-50/50 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onWeekChange(-1)}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-lg font-semibold">
              {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onWeekChange(1)}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-3">
            {timesheet && (
              <Badge className={statusConfig[timesheet.status]?.color}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {statusConfig[timesheet.status]?.label}
              </Badge>
            )}
            {canSubmit && timesheet?.status === 'draft' && (
              <Button 
                onClick={onSubmit} 
                disabled={isLoading}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-4 h-4 mr-2" />
                Submit for Approval
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-slate-50/30">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Day</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Worked</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Breaks</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Overtime</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Absence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {weekDays.map((day) => {
                const line = getLineForDate(day);
                const isToday = isSameDay(day, today);
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                
                return (
                  <tr 
                    key={day.toISOString()} 
                    className={`${isToday ? 'bg-blue-50/50' : ''} ${isWeekend ? 'bg-slate-50/50' : ''}`}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium ${isToday ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                          {format(day, 'd')}
                        </div>
                        <div>
                          <div className="font-medium text-slate-800">{format(day, 'EEEE')}</div>
                          <div className="text-xs text-slate-500">{format(day, 'MMM d')}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="font-medium text-slate-800">{formatHours(line.hours_worked)}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="text-slate-600">{formatHours(line.break_hours)}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {line.overtime_hours > 0 ? (
                        <Badge className="bg-amber-100 text-amber-700">{formatHours(line.overtime_hours)}</Badge>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {line.absence_type && line.absence_type !== 'none' ? (
                        <Badge className={absenceColors[line.absence_type] || 'bg-slate-100'}>
                          {line.absence_type} ({formatHours(line.absence_hours)})
                        </Badge>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 border-t-2 border-slate-200">
                <td className="px-4 py-4 font-semibold text-slate-800">Weekly Total</td>
                <td className="px-4 py-4 text-center font-semibold text-slate-800">{formatHours(totals.worked)}</td>
                <td className="px-4 py-4 text-center font-medium text-slate-600">{formatHours(totals.breaks)}</td>
                <td className="px-4 py-4 text-center">
                  <Badge className="bg-amber-100 text-amber-700 font-semibold">{formatHours(totals.overtime)}</Badge>
                </td>
                <td className="px-4 py-4 text-center font-medium text-slate-600">{formatHours(totals.absence)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
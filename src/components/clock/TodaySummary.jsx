import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Coffee, TrendingUp, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function TodaySummary({ entries = [], expectedHours = 7.6 }) {
  const workEntries = entries.filter(e => e.entry_type === 'work');
  const breakEntries = entries.filter(e => e.entry_type === 'break');

  const calculateDuration = (entriesList) => {
    return entriesList.reduce((total, entry) => {
      if (entry.end_time) {
        const start = new Date(entry.start_time);
        const end = new Date(entry.end_time);
        return total + (end - start) / 3600000;
      } else if (entry.start_time) {
        const start = new Date(entry.start_time);
        return total + (new Date() - start) / 3600000;
      }
      return total;
    }, 0);
  };

  const workedHours = calculateDuration(workEntries);
  const breakHours = calculateDuration(breakEntries);
  const netWorked = workedHours - breakHours;
  const overtime = Math.max(0, netWorked - expectedHours);
  const progress = Math.min(100, (netWorked / expectedHours) * 100);

  const formatHours = (hours) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const stats = [
    { 
      label: 'Hours Worked', 
      value: formatHours(netWorked), 
      icon: Clock, 
      color: 'text-blue-500',
      bgColor: 'bg-blue-50'
    },
    { 
      label: 'Break Time', 
      value: formatHours(breakHours), 
      icon: Coffee, 
      color: 'text-amber-500',
      bgColor: 'bg-amber-50'
    },
    { 
      label: 'Overtime', 
      value: formatHours(overtime), 
      icon: TrendingUp, 
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50'
    },
    { 
      label: 'Expected', 
      value: formatHours(expectedHours), 
      icon: Calendar, 
      color: 'text-slate-500',
      bgColor: 'bg-slate-50'
    },
  ];

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-slate-800 flex items-center justify-between">
          Today's Summary
          <span className="text-sm font-normal text-slate-500">
            {format(new Date(), 'EEEE, MMM d')}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-600">Progress</span>
            <span className="text-slate-800 font-medium">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className={`${stat.bgColor} rounded-xl p-4`}>
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                <span className="text-xs text-slate-600">{stat.label}</span>
              </div>
              <div className="text-xl font-semibold text-slate-800">{stat.value}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { Download, CalendarIcon, FileSpreadsheet, Loader2 } from 'lucide-react';

export default function ExportPanel({ 
  employees = [], 
  teams = [],
  timesheetLines = [],
  onExport,
  isLoading 
}) {
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [filterTeam, setFilterTeam] = useState('all');
  const [exportType, setExportType] = useState('payroll');

  const generateCSV = () => {
    const filteredLines = timesheetLines.filter(line => {
      const lineDate = new Date(line.date);
      const inDateRange = lineDate >= dateRange.from && lineDate <= dateRange.to;
      const emp = employees.find(e => e.id === line.employee_id);
      const inTeam = filterTeam === 'all' || emp?.team_id === filterTeam;
      return inDateRange && inTeam;
    });

    const rows = filteredLines.map(line => {
      const emp = employees.find(e => e.id === line.employee_id);
      return {
        employee_number: emp?.employee_number || '',
        employee_name: emp?.user_id || '',
        date: line.date,
        regular_hours: line.hours_worked || 0,
        overtime_hours: line.overtime_hours || 0,
        break_hours: line.break_hours || 0,
        absence_type: line.absence_type || '',
        absence_hours: line.absence_hours || 0,
        notes: line.notes || ''
      };
    });

    const headers = Object.keys(rows[0] || {}).join(',');
    const csvContent = [
      headers,
      ...rows.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timesheet-export-${format(dateRange.from, 'yyyy-MM-dd')}-to-${format(dateRange.to, 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    if (onExport) onExport({ type: exportType, dateRange, rowCount: rows.length });
  };

  const presetRanges = [
    { label: 'This Month', from: startOfMonth(new Date()), to: endOfMonth(new Date()) },
    { label: 'Last Month', from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) },
    { label: 'Last 3 Months', from: startOfMonth(subMonths(new Date(), 2)), to: endOfMonth(new Date()) },
  ];

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5" />
          Export Data
        </CardTitle>
        <CardDescription>Export timesheet data for payroll processing</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Export Type</Label>
            <Select value={exportType} onValueChange={setExportType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="payroll">Payroll Export (CSV)</SelectItem>
                <SelectItem value="detailed">Detailed Timesheet</SelectItem>
                <SelectItem value="summary">Summary Report</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Team Filter</Label>
            <Select value={filterTeam} onValueChange={setFilterTeam}>
              <SelectTrigger>
                <SelectValue placeholder="All Teams" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {teams.map(team => (
                  <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3">
          <Label>Date Range</Label>
          <div className="flex flex-wrap gap-2">
            {presetRanges.map(preset => (
              <Button
                key={preset.label}
                variant="outline"
                size="sm"
                onClick={() => setDateRange({ from: preset.from, to: preset.to })}
                className={dateRange.from?.getTime() === preset.from.getTime() ? 'border-blue-500 bg-blue-50' : ''}
              >
                {preset.label}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? format(dateRange.from, 'PPP') : 'Start date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateRange.from}
                  onSelect={(d) => setDateRange({ ...dateRange, from: d })}
                />
              </PopoverContent>
            </Popover>
            <span className="text-slate-500">to</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.to ? format(dateRange.to, 'PPP') : 'End date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateRange.to}
                  onSelect={(d) => setDateRange({ ...dateRange, to: d })}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-lg">
          <h4 className="font-medium text-slate-800 mb-2">Export Preview</h4>
          <p className="text-sm text-slate-600">
            Exporting {exportType} data from {format(dateRange.from, 'MMM d, yyyy')} to {format(dateRange.to, 'MMM d, yyyy')}
            {filterTeam !== 'all' && ` for ${teams.find(t => t.id === filterTeam)?.name}`}
          </p>
        </div>

        <Button 
          onClick={generateCSV} 
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
          Download Export
        </Button>
      </CardContent>
    </Card>
  );
}
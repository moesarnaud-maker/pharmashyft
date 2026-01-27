import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { format, startOfWeek, addDays, subWeeks, parseISO } from 'date-fns';
import { Clock, TrendingUp, AlertTriangle, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatUserName } from '@/components/utils/helpers';

export default function ReportsPanel({ 
  employees = [], 
  teams = [],
  users = [],
  timesheetLines = [],
  timeEntries = []
}) {
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [weekOffset, setWeekOffset] = useState(0);

  const weekStart = startOfWeek(subWeeks(new Date(), -weekOffset), { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 6);

  const filteredEmployees = selectedTeam === 'all' 
    ? employees 
    : employees.filter(e => e.team_id === selectedTeam);

  const getEmployeeName = (empId) => {
    const emp = employees.find(e => e.id === empId);
    const u = users.find(u => u.id === emp?.user_id);
    return formatUserName(u);
  };

  const getTeamName = (teamId) => teams.find(t => t.id === teamId)?.name || 'No Team';

  // Weekly hours by employee
  const weeklyHoursData = filteredEmployees.map(emp => {
    const empLines = timesheetLines.filter(l => {
      const lineDate = parseISO(l.date);
      return l.employee_id === emp.id && lineDate >= weekStart && lineDate <= weekEnd;
    });

    const totalHours = empLines.reduce((sum, l) => sum + (l.hours_worked || 0), 0);
    const overtime = empLines.reduce((sum, l) => sum + (l.overtime_hours || 0), 0);

    return {
      name: getEmployeeName(emp.id),
      hours: parseFloat(totalHours.toFixed(1)),
      overtime: parseFloat(overtime.toFixed(1)),
      expected: emp.contract_hours_week || 38,
    };
  });

  // Overtime by team
  const overtimeByTeam = teams.map(team => {
    const teamEmps = employees.filter(e => e.team_id === team.id);
    const teamOvertime = teamEmps.reduce((total, emp) => {
      const empLines = timesheetLines.filter(l => {
        const lineDate = parseISO(l.date);
        return l.employee_id === emp.id && lineDate >= weekStart && lineDate <= weekEnd;
      });
      return total + empLines.reduce((sum, l) => sum + (l.overtime_hours || 0), 0);
    }, 0);

    return {
      name: team.name,
      overtime: parseFloat(teamOvertime.toFixed(1)),
    };
  });

  // Missing punches - entries with no end_time
  const missingPunches = timeEntries.filter(e => {
    const entryDate = parseISO(e.date);
    const isInRange = entryDate >= weekStart && entryDate <= weekEnd;
    const isMissing = !e.end_time && new Date(e.start_time) < new Date(Date.now() - 12 * 60 * 60 * 1000);
    const isFilteredEmployee = filteredEmployees.some(emp => emp.id === e.employee_id);
    return isInRange && isMissing && isFilteredEmployee;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Reports</h2>
          <p className="text-slate-500">Analyze time tracking data</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Teams" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              {teams.map(team => (
                <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 bg-white rounded-lg border p-1">
            <Button variant="ghost" size="icon" onClick={() => setWeekOffset(o => o - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm px-2">
              {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d')}
            </span>
            <Button variant="ghost" size="icon" onClick={() => setWeekOffset(o => o + 1)} disabled={weekOffset >= 0}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="hours" className="space-y-6">
        <TabsList className="bg-white border">
          <TabsTrigger value="hours">
            <Clock className="w-4 h-4 mr-2" />
            Weekly Hours
          </TabsTrigger>
          <TabsTrigger value="overtime">
            <TrendingUp className="w-4 h-4 mr-2" />
            Overtime
          </TabsTrigger>
          <TabsTrigger value="missing">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Missing Punches
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hours">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Weekly Hours by Employee</CardTitle>
              <CardDescription>Hours worked vs expected hours</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyHoursData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="hours" fill="#3b82f6" name="Hours Worked" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="overtime" fill="#f59e0b" name="Overtime" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead className="text-right">Hours Worked</TableHead>
                    <TableHead className="text-right">Expected</TableHead>
                    <TableHead className="text-right">Overtime</TableHead>
                    <TableHead className="text-right">Variance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {weeklyHoursData.map((row, i) => {
                    const variance = row.hours - row.expected;
                    return (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{row.name}</TableCell>
                        <TableCell className="text-right">{row.hours}h</TableCell>
                        <TableCell className="text-right text-slate-500">{row.expected}h</TableCell>
                        <TableCell className="text-right">
                          {row.overtime > 0 && (
                            <Badge className="bg-amber-100 text-amber-700">{row.overtime}h</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={variance >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                            {variance >= 0 ? '+' : ''}{variance.toFixed(1)}h
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overtime">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Overtime by Team</CardTitle>
              <CardDescription>Total overtime hours per team</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={overtimeByTeam} layout="vertical" margin={{ top: 20, right: 30, left: 80, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="overtime" fill="#f59e0b" name="Overtime Hours" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="missing">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Missing Punches Report
              </CardTitle>
              <CardDescription>Time entries without clock-out (older than 12 hours)</CardDescription>
            </CardHeader>
            <CardContent>
              {missingPunches.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Clock In Time</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {missingPunches.map(entry => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">{getEmployeeName(entry.employee_id)}</TableCell>
                        <TableCell>{format(parseISO(entry.date), 'MMM d, yyyy')}</TableCell>
                        <TableCell>{format(new Date(entry.start_time), 'HH:mm')}</TableCell>
                        <TableCell className="capitalize">{entry.entry_type}</TableCell>
                        <TableCell>
                          <Badge className="bg-red-100 text-red-700">Missing Clock Out</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p>No missing punches found for this period</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
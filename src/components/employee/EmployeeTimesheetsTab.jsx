import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { FileText } from 'lucide-react';

export default function EmployeeTimesheetsTab({ timesheets = [] }) {
  const sortedTimesheets = [...timesheets].sort((a, b) => 
    new Date(b.week_start) - new Date(a.week_start)
  );

  const statusColors = {
    draft: 'bg-slate-100 text-slate-700',
    submitted: 'bg-blue-100 text-blue-700',
    approved: 'bg-emerald-100 text-emerald-700',
    locked: 'bg-purple-100 text-purple-700',
    rejected: 'bg-red-100 text-red-700',
  };

  return (
    <Card className="border-0 shadow-md">
      <CardContent className="p-6">
        {timesheets.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Week</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Hours Worked</TableHead>
                <TableHead className="text-right">Overtime</TableHead>
                <TableHead className="text-right">Expected</TableHead>
                <TableHead>Submitted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTimesheets.map(ts => (
                <TableRow key={ts.id}>
                  <TableCell>
                    {format(new Date(ts.week_start), 'MMM d')} - {format(new Date(ts.week_end), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[ts.status]}>
                      {ts.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{ts.total_hours_worked?.toFixed(1) || 0}h</TableCell>
                  <TableCell className="text-right">{ts.total_overtime_hours?.toFixed(1) || 0}h</TableCell>
                  <TableCell className="text-right">{ts.expected_hours || 38}h</TableCell>
                  <TableCell>
                    {ts.submitted_at ? format(new Date(ts.submitted_at), 'MMM d, yyyy') : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p>No timesheets found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
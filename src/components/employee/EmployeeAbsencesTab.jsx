import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { Briefcase } from 'lucide-react';

export default function EmployeeAbsencesTab({ absences = [] }) {
  const sortedAbsences = [...absences].sort((a, b) => 
    new Date(b.start_date) - new Date(a.start_date)
  );

  const statusColors = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
    cancelled: 'bg-slate-100 text-slate-700',
  };

  const typeLabels = {
    vacation: 'Vacation',
    sick: 'Sick Leave',
    unpaid: 'Unpaid Leave',
    training: 'Training',
  };

  return (
    <Card className="border-0 shadow-md">
      <CardContent className="p-6">
        {absences.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead className="text-right">Days</TableHead>
                <TableHead className="text-right">Hours</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAbsences.map(absence => (
                <TableRow key={absence.id}>
                  <TableCell>
                    <Badge variant="outline">{typeLabels[absence.absence_type] || absence.absence_type}</Badge>
                  </TableCell>
                  <TableCell>{format(new Date(absence.start_date), 'MMM d, yyyy')}</TableCell>
                  <TableCell>{format(new Date(absence.end_date), 'MMM d, yyyy')}</TableCell>
                  <TableCell className="text-right">{absence.total_days || 0}</TableCell>
                  <TableCell className="text-right">{absence.total_hours?.toFixed(1) || 0}h</TableCell>
                  <TableCell>
                    <Badge className={statusColors[absence.status]}>
                      {absence.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <Briefcase className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p>No absence requests found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
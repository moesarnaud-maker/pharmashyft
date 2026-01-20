import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { Clock } from 'lucide-react';

export default function EmployeeTimeEntriesTab({ entries = [] }) {
  const sortedEntries = [...entries].sort((a, b) => 
    new Date(b.start_time) - new Date(a.start_time)
  );

  return (
    <Card className="border-0 shadow-md">
      <CardContent className="p-6">
        {entries.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>End Time</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedEntries.slice(0, 50).map(entry => (
                <TableRow key={entry.id}>
                  <TableCell>{format(new Date(entry.date), 'MMM d, yyyy')}</TableCell>
                  <TableCell>
                    <Badge variant={entry.entry_type === 'work' ? 'default' : 'outline'}>
                      {entry.entry_type}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(new Date(entry.start_time), 'HH:mm')}</TableCell>
                  <TableCell>
                    {entry.end_time ? format(new Date(entry.end_time), 'HH:mm') : '-'}
                  </TableCell>
                  <TableCell>
                    {entry.duration_minutes ? `${Math.round(entry.duration_minutes)} min` : '-'}
                  </TableCell>
                  <TableCell className="capitalize">{entry.source}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <Clock className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p>No time entries found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
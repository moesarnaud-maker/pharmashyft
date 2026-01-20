import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from 'date-fns';
import { Search, Filter, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

const actionColors = {
  create: 'bg-emerald-100 text-emerald-700',
  update: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
  approve: 'bg-purple-100 text-purple-700',
  reject: 'bg-orange-100 text-orange-700',
  lock: 'bg-slate-100 text-slate-700',
  submit: 'bg-cyan-100 text-cyan-700',
  export: 'bg-amber-100 text-amber-700',
};

export default function AuditLogViewer({ logs = [], isLoading }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterEntity, setFilterEntity] = useState('all');
  const [selectedLog, setSelectedLog] = useState(null);
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.actor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actor_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity_description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = filterAction === 'all' || log.action === filterAction;
    const matchesEntity = filterEntity === 'all' || log.entity_type === filterEntity;
    return matchesSearch && matchesAction && matchesEntity;
  });

  const paginatedLogs = filteredLogs.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(filteredLogs.length / pageSize);

  const parseJson = (str) => {
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b">
          <CardTitle className="text-xl font-semibold">Audit Log</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by user or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger className="w-[150px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="approve">Approve</SelectItem>
                <SelectItem value="reject">Reject</SelectItem>
                <SelectItem value="lock">Lock</SelectItem>
                <SelectItem value="submit">Submit</SelectItem>
                <SelectItem value="export">Export</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterEntity} onValueChange={setFilterEntity}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Entity Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                <SelectItem value="TimeEntry">Time Entry</SelectItem>
                <SelectItem value="Timesheet">Timesheet</SelectItem>
                <SelectItem value="AbsenceRequest">Absence Request</SelectItem>
                <SelectItem value="CorrectionRequest">Correction Request</SelectItem>
                <SelectItem value="Employee">Employee</SelectItem>
                <SelectItem value="Team">Team</SelectItem>
                <SelectItem value="Settings">Settings</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLogs.map(log => (
                  <TableRow key={log.id} className="hover:bg-slate-50">
                    <TableCell className="text-sm text-slate-600">
                      {format(new Date(log.created_date), 'MMM d, HH:mm:ss')}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-slate-800">{log.actor_name || 'Unknown'}</div>
                        <div className="text-xs text-slate-500">{log.actor_email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={actionColors[log.action] || 'bg-slate-100'}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {log.entity_type}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600 max-w-[200px] truncate">
                      {log.entity_description || log.reason || '-'}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => setSelectedLog(log)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-slate-500">
              Showing {page * pageSize + 1}-{Math.min((page + 1) * pageSize, filteredLogs.length)} of {filteredLogs.length} entries
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Timestamp</p>
                  <p className="font-medium">{format(new Date(selectedLog.created_date), 'PPpp')}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">User</p>
                  <p className="font-medium">{selectedLog.actor_name}</p>
                  <p className="text-sm text-slate-500">{selectedLog.actor_email}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Action</p>
                  <Badge className={actionColors[selectedLog.action]}>{selectedLog.action}</Badge>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Entity</p>
                  <p className="font-medium">{selectedLog.entity_type}</p>
                </div>
              </div>
              
              {selectedLog.reason && (
                <div>
                  <p className="text-sm text-slate-500">Reason</p>
                  <p className="font-medium">{selectedLog.reason}</p>
                </div>
              )}

              {selectedLog.before_data && (
                <div>
                  <p className="text-sm text-slate-500 mb-2">Before</p>
                  <pre className="bg-slate-100 p-4 rounded-lg text-sm overflow-auto max-h-40">
                    {JSON.stringify(parseJson(selectedLog.before_data), null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.after_data && (
                <div>
                  <p className="text-sm text-slate-500 mb-2">After</p>
                  <pre className="bg-slate-100 p-4 rounded-lg text-sm overflow-auto max-h-40">
                    {JSON.stringify(parseJson(selectedLog.after_data), null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
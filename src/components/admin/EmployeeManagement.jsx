import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Search, MoreHorizontal, Users, Trash2, AlertTriangle, Edit } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import EmployeeProfileDialog from '@/components/employee/EmployeeProfileDialog';
import { formatUserName, getUserInitials } from '@/components/utils/helpers';

export default function EmployeeManagement({ 
  employees = [],
  users = [],
  teams = [],
  schedules = [],
  onUpdateEmployee,
  currentUser
}) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const getUserForEmployee = (emp) => users.find(u => u.id === emp.user_id);
  const getTeamName = (teamId) => teams.find(t => t.id === teamId)?.name || '-';

  const filteredEmployees = employees.filter(emp => {
    const user = getUserForEmployee(emp);
    const searchLower = searchTerm.toLowerCase();
    const displayName = user ? formatUserName(user).toLowerCase() : '';
    return (
      displayName.includes(searchLower) ||
      user?.email?.toLowerCase().includes(searchLower) ||
      emp.employee_number?.toLowerCase().includes(searchLower)
    );
  });

  const handleEditEmployee = (emp) => {
    const user = getUserForEmployee(emp);
    setSelectedEmployee(emp);
    setSelectedUser(user);
  };

  const handleCloseProfile = () => {
    setSelectedEmployee(null);
    setSelectedUser(null);
  };

  const handleDeleteClick = (emp) => {
    setEmployeeToDelete(emp);
    setShowDeleteDialog(true);
  };

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!employeeToDelete) return;

      // Audit log before deletion
      await base44.entities.AuditLog.create({
        actor_id: currentUser.id,
        actor_email: currentUser.email,
        actor_name: formatUserName(currentUser),
        action: 'delete',
        entity_type: 'Employee',
        entity_id: employeeToDelete.id,
        entity_description: `Deleted employee ${employeeToDelete.employee_number}`,
        before_data: JSON.stringify(employeeToDelete),
      });

      // Delete employee record
      await base44.entities.Employee.delete(employeeToDelete.id);
    },
    onSuccess: () => {
      toast.success('Employee deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employeeLocations'] });
      setShowDeleteDialog(false);
      setEmployeeToDelete(null);
    },
    onError: (error) => {
      toast.error('Failed to delete employee: ' + error.message);
    },
  });

  const statusColors = {
    active: 'bg-emerald-100 text-emerald-700',
    inactive: 'bg-slate-100 text-slate-700',
    suspended: 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <Users className="w-5 h-5" />
                Employee Management
              </CardTitle>
              <p className="text-sm text-slate-500 mt-1">
                Manage employee records, contracts, and assignments
              </p>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              {employees.length} Total
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Employee #</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Contract Hours</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map(emp => {
                const user = getUserForEmployee(emp);
                const displayName = user ? formatUserName(user) : 'No name';
                const initials = user ? getUserInitials(user) : '?';
                return (
                  <TableRow key={emp.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                          {initials}
                        </div>
                        <div>
                          <div className="font-medium text-slate-800">
                            {displayName}
                          </div>
                          <div className="text-sm text-slate-500">{user?.email || 'No email'}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {emp.employee_number || '-'}
                    </TableCell>
                    <TableCell>{getTeamName(emp.team_id)}</TableCell>
                    <TableCell>
                      {emp.contract_hours_week ? `${emp.contract_hours_week}h/week` : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[emp.status] || statusColors.active}>
                        {emp.status || 'active'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditEmployee(emp)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteClick(emp)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Employee
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {filteredEmployees.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p>No employees found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Employee Profile Dialog */}
      <EmployeeProfileDialog
        employee={selectedEmployee}
        user={selectedUser}
        open={!!selectedEmployee}
        onClose={handleCloseProfile}
        onUpdateEmployee={onUpdateEmployee}
        teams={teams}
        schedules={schedules}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Delete Employee
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this employee record?
            </DialogDescription>
          </DialogHeader>
          
          {employeeToDelete && (
            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                  {getUserForEmployee(employeeToDelete) ? getUserInitials(getUserForEmployee(employeeToDelete)) : '?'}
                </div>
                <div>
                  <div className="font-medium">
                    {getUserForEmployee(employeeToDelete) ? formatUserName(getUserForEmployee(employeeToDelete)) : 'Unknown'}
                  </div>
                  <div className="text-sm text-slate-500">
                    {employeeToDelete.employee_number || 'No employee number'}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-900">
              <strong>Warning:</strong> This will delete the employee record but NOT the user account. 
              The user will still be able to log in but won't have employee access.
            </p>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDeleteDialog(false);
                setEmployeeToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Employee'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserPlus, Search, MoreHorizontal, Mail, Shield, Users } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from 'date-fns';

export default function UserManagement({ 
  users = [], 
  employees = [],
  teams = [],
  schedules = [],
  onInviteUser, 
  onUpdateEmployee,
  isLoading 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'user' });
  const [employeeForm, setEmployeeForm] = useState({});
  const [showEmployeeDialog, setShowEmployeeDialog] = useState(false);

  const getEmployeeForUser = (userId) => employees.find(e => e.user_id === userId);
  const getTeamName = (teamId) => teams.find(t => t.id === teamId)?.name || '-';

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInvite = () => {
    onInviteUser(inviteForm);
    setShowInviteDialog(false);
    setInviteForm({ email: '', role: 'user' });
  };

  const handleEditEmployee = (user) => {
    const emp = getEmployeeForUser(user.id);
    setEmployeeForm({
      user_id: user.id,
      user_name: user.full_name,
      employee_id: emp?.id,
      employee_number: emp?.employee_number || '',
      team_id: emp?.team_id || '',
      schedule_id: emp?.schedule_id || '',
      contract_hours_week: emp?.contract_hours_week || 38,
      vacation_days_total: emp?.vacation_days_total || 20
    });
    setShowEmployeeDialog(true);
  };

  const handleSaveEmployee = () => {
    onUpdateEmployee(employeeForm);
    setShowEmployeeDialog(false);
  };

  const roleColors = {
    admin: 'bg-purple-100 text-purple-700',
    user: 'bg-blue-100 text-blue-700'
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold">User Management</CardTitle>
            <Button onClick={() => setShowInviteDialog(true)} className="bg-blue-600 hover:bg-blue-700">
              <UserPlus className="w-4 h-4 mr-2" />
              Invite User
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Employee #</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Contract Hours</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map(user => {
                const emp = getEmployeeForUser(user.id);
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                          {user.full_name?.charAt(0) || user.email?.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-slate-800">{user.full_name || 'No name'}</div>
                          <div className="text-sm text-slate-500">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={roleColors[user.role] || roleColors.user}>
                        <Shield className="w-3 h-3 mr-1" />
                        {user.role || 'user'}
                      </Badge>
                    </TableCell>
                    <TableCell>{emp?.employee_number || '-'}</TableCell>
                    <TableCell>{getTeamName(emp?.team_id)}</TableCell>
                    <TableCell>{emp?.contract_hours_week ? `${emp.contract_hours_week}h/week` : '-'}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditEmployee(user)}>
                            Edit Employee Details
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input
                type="email"
                placeholder="email@company.com"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={inviteForm.role}
                onValueChange={(v) => setInviteForm({ ...inviteForm, role: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Employee</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>Cancel</Button>
            <Button onClick={handleInvite} disabled={!inviteForm.email} className="bg-blue-600 hover:bg-blue-700">
              <Mail className="w-4 h-4 mr-2" />
              Send Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Employee Details Dialog */}
      <Dialog open={showEmployeeDialog} onOpenChange={setShowEmployeeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Employee: {employeeForm.user_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Employee Number</Label>
              <Input
                placeholder="EMP001"
                value={employeeForm.employee_number}
                onChange={(e) => setEmployeeForm({ ...employeeForm, employee_number: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Team</Label>
              <Select
                value={employeeForm.team_id}
                onValueChange={(v) => setEmployeeForm({ ...employeeForm, team_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select team..." />
                </SelectTrigger>
                <SelectContent>
                  {teams.map(team => (
                    <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Schedule</Label>
              <Select
                value={employeeForm.schedule_id}
                onValueChange={(v) => setEmployeeForm({ ...employeeForm, schedule_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select schedule..." />
                </SelectTrigger>
                <SelectContent>
                  {schedules.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contract Hours/Week</Label>
                <Input
                  type="number"
                  value={employeeForm.contract_hours_week}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, contract_hours_week: parseFloat(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Vacation Days/Year</Label>
                <Input
                  type="number"
                  value={employeeForm.vacation_days_total}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, vacation_days_total: parseFloat(e.target.value) })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmployeeDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveEmployee} className="bg-blue-600 hover:bg-blue-700">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
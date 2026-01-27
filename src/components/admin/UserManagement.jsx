import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, Search, MoreHorizontal, Mail, Shield, Users, Clock, Send, X, Trash2, AlertTriangle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import EmployeeProfileDialog from '@/components/employee/EmployeeProfileDialog';
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function UserManagement({ 
  users = [], 
  employees = [],
  teams = [],
  schedules = [],
  onInviteUser, 
  onUpdateEmployee,
  onResendInvite,
  onCancelInvite,
  onDeleteUser,
  isLoading 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'user' });
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const getEmployeeForUser = (userId) => employees.find(e => e.user_id === userId);
  const getTeamName = (teamId) => teams.find(t => t.id === teamId)?.name || '-';

  // Separate active users and pending invitations
  const activeUsers = users.filter(u => u.status === 'active' || !u.status);
  const pendingInvitations = users.filter(u => u.status === 'pending_invitation');

  const filteredActiveUsers = activeUsers.filter(u => 
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPendingInvitations = pendingInvitations.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInvite = () => {
    onInviteUser(inviteForm);
    setShowInviteDialog(false);
    setInviteForm({ email: '', role: 'user' });
  };

  const handleEditEmployee = (user) => {
    const emp = getEmployeeForUser(user.id);
    setSelectedUser(user);
    setSelectedEmployee(emp);
  };

  const handleCloseProfile = () => {
    setSelectedUser(null);
    setSelectedEmployee(null);
  };

  const handleResendInvite = (user) => {
    if (onResendInvite) {
      onResendInvite(user);
    }
  };

  const handleCancelInvite = (user) => {
    if (onCancelInvite) {
      onCancelInvite(user);
    }
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (onDeleteUser && userToDelete) {
      onDeleteUser(userToDelete);
    }
    setShowDeleteDialog(false);
    setUserToDelete(null);
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

          <Tabs defaultValue="active">
            <TabsList className="mb-4">
              <TabsTrigger value="active" className="gap-2">
                <Users className="w-4 h-4" />
                Active Users ({activeUsers.length})
              </TabsTrigger>
              <TabsTrigger value="pending" className="gap-2">
                <Clock className="w-4 h-4" />
                Pending Invitations ({pendingInvitations.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active">
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
                  {filteredActiveUsers.map(user => {
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
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeleteClick(user)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="pending">
              {filteredPendingInvitations.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">No Pending Invitations</h3>
                  <p className="text-slate-500">
                    {pendingInvitations.length === 0 
                      ? "All invited users have completed registration"
                      : `${pendingInvitations.length} pending invitation(s) filtered out by search`
                    }
                  </p>
                  {/* Debug info - remove in production */}
                  {import.meta.env.DEV && (
                    <div className="mt-4 text-xs text-slate-400">
                      <p>Total users: {users.length}</p>
                      <p>Active users: {activeUsers.length}</p>
                      <p>Pending invitations: {pendingInvitations.length}</p>
                      <p>Users with status: {users.filter(u => u.status).length}</p>
                    </div>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Invited On</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPendingInvitations.map(user => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-medium">
                              <Mail className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="font-medium text-slate-800">{user.email}</div>
                              <div className="text-xs text-slate-500">Awaiting registration</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={roleColors[user.role] || roleColors.user}>
                            <Shield className="w-3 h-3 mr-1" />
                            {user.role || 'user'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-slate-600">
                            {user.invited_at ? new Date(user.invited_at).toLocaleDateString() : '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-amber-100 text-amber-700">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
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
                              <DropdownMenuItem onClick={() => handleResendInvite(user)}>
                                <Send className="w-4 h-4 mr-2" />
                                Resend Invitation
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleCancelInvite(user)}
                                className="text-red-600"
                              >
                                <X className="w-4 h-4 mr-2" />
                                Cancel Invitation
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Delete User & Employee
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the user account and associated employee record.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {userToDelete && (
              <>
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Warning:</strong> You are about to delete:
                    <ul className="mt-2 ml-4 list-disc">
                      <li><strong>User:</strong> {userToDelete.full_name || userToDelete.email}</li>
                      <li><strong>Email:</strong> {userToDelete.email}</li>
                      {getEmployeeForUser(userToDelete.id) && (
                        <li><strong>Employee #:</strong> {getEmployeeForUser(userToDelete.id)?.employee_number}</li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
                <div className="bg-slate-50 p-3 rounded-lg border">
                  <p className="text-sm text-slate-700 font-medium mb-2">What will be deleted:</p>
                  <ul className="text-sm text-slate-600 space-y-1 ml-4 list-disc">
                    <li>User account and login access</li>
                    <li>Employee profile and records</li>
                    <li>All time entries and timesheets</li>
                    <li>Schedule assignments</li>
                    <li>Availability settings</li>
                    <li>Absence and correction requests</li>
                  </ul>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EmployeeProfileDialog
        employee={selectedEmployee}
        user={selectedUser}
        open={!!selectedUser}
        onClose={handleCloseProfile}
        onUpdateEmployee={onUpdateEmployee}
        teams={teams}
        schedules={schedules}
      />
    </div>
  );
}
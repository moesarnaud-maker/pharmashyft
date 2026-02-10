import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { UserPlus, Users, Clock, LogOut, Send, X } from 'lucide-react';

// Create query client
const queryClient = new QueryClient();

function AdminDashboardContent() {
  const { user, logout } = useAuth();
  const qc = useQueryClient();
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'employee' });

  // Fetch users
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    refetchInterval: 5000,
  });

  // Separate pending and active users
  const pendingUsers = users.filter(u => u.status === 'pending_invitation');
  const activeUsers = users.filter(u => u.status === 'active');

  // Invite mutation
  const inviteMutation = useMutation({
    mutationFn: async ({ email, role }) => {
      // Check if email already exists
      const existing = users.find(u => u.email === email);
      if (existing) {
        throw new Error('A user with this email already exists');
      }

      // Create user record immediately
      const newUser = await base44.entities.User.create({
        email: email,
        role: role,
        status: 'pending_invitation',
        invited_by: user?.id,
        invited_at: new Date().toISOString(),
        invitation_token: crypto.randomUUID(),
        profile_completed: false,
      });

      // Send invitation email via SDK
      const sdkRole = role === 'manager' ? 'user' : role;
      await base44.users.inviteUser(email, sdkRole);

      return newUser;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('Invitation sent successfully!');
      setShowInviteDialog(false);
      setInviteForm({ email: '', role: 'employee' });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to send invitation');
    },
  });

  // Resend invitation
  const resendMutation = useMutation({
    mutationFn: async (pendingUser) => {
      await base44.users.resendInvite(pendingUser.email);
      await base44.entities.User.update(pendingUser.id, {
        invited_at: new Date().toISOString(),
        invitation_token: crypto.randomUUID(),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('Invitation resent!');
    },
    onError: () => {
      toast.error('Failed to resend invitation');
    },
  });

  // Cancel invitation
  const cancelMutation = useMutation({
    mutationFn: async (pendingUser) => {
      await base44.entities.User.delete(pendingUser.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('Invitation cancelled');
    },
    onError: () => {
      toast.error('Failed to cancel invitation');
    },
  });

  function handleInvite() {
    if (!inviteForm.email) {
      toast.error('Please enter an email address');
      return;
    }
    inviteMutation.mutate(inviteForm);
  }

  function formatDate(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  }

  const roleColors = {
    admin: 'bg-purple-100 text-purple-800',
    manager: 'bg-blue-100 text-blue-800',
    employee: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user?.first_name} {user?.last_name}
            </span>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>User Management</CardTitle>
            <Button onClick={() => setShowInviteDialog(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Invite User
            </Button>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pending">
              <TabsList>
                <TabsTrigger value="pending" className="gap-2">
                  <Clock className="w-4 h-4" />
                  Pending Invitations ({pendingUsers.length})
                </TabsTrigger>
                <TabsTrigger value="active" className="gap-2">
                  <Users className="w-4 h-4" />
                  Active Users ({activeUsers.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="mt-4">
                {pendingUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No pending invitations
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Invited At</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-24">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingUsers.map(u => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">{u.email}</TableCell>
                          <TableCell>
                            <Badge className={roleColors[u.role] || roleColors.employee}>
                              {u.role}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(u.invited_at)}</TableCell>
                          <TableCell>
                            <Badge variant="warning" className="bg-yellow-100 text-yellow-800">
                              Pending
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => resendMutation.mutate(u)}
                                disabled={resendMutation.isPending}
                              >
                                <Send className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => cancelMutation.mutate(u)}
                                disabled={cancelMutation.isPending}
                                className="text-red-600 hover:text-red-700"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="active" className="mt-4">
                {activeUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No active users
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>First Name</TableHead>
                        <TableHead>Last Name</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeUsers.map(u => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">{u.email}</TableCell>
                          <TableCell>
                            <Badge className={roleColors[u.role] || roleColors.employee}>
                              {u.role}
                            </Badge>
                          </TableCell>
                          <TableCell>{u.first_name || '-'}</TableCell>
                          <TableCell>{u.last_name || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="success" className="bg-green-100 text-green-800">
                              Active
                            </Badge>
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
      </main>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email Address</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="user@company.com"
                value={inviteForm.email}
                onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <Select
                value={inviteForm.role}
                onValueChange={(value) => setInviteForm(prev => ({ ...prev, role: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleInvite} disabled={inviteMutation.isPending}>
              {inviteMutation.isPending ? 'Sending...' : 'Send Invitation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminDashboardContent />
    </QueryClientProvider>
  );
}

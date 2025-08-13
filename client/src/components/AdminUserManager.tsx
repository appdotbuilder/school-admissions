import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Users, 
  Plus, 
  Shield,
  User,
  Mail,
  Calendar,
  AlertCircle,
  CheckCircle,
  UserPlus
} from 'lucide-react';

import { trpc } from '@/utils/trpc';
import type { User as UserType } from '../../../server/src/schema';

export default function AdminUserManager() {
  const [adminUsers, setAdminUsers] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // New user form state
  const [newUserData, setNewUserData] = useState({
    email: '',
    full_name: '',
    role: 'ADMISSION_COMMITTEE' as 'ADMIN' | 'ADMISSION_COMMITTEE'
  });

  // Load admin users
  const loadAdminUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const users = await trpc.getAdminUsers.query();
      setAdminUsers(users);
    } catch (error: any) {
      setError(error.message || 'Failed to load admin users');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdminUsers();
  }, [loadAdminUsers]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError(null);

    try {
      const createdUser = await trpc.createAdminUser.mutate(newUserData);
      
      // Add new user to the list
      setAdminUsers(prev => [createdUser, ...prev]);
      
      // Reset form and close dialog
      setNewUserData({
        email: '',
        full_name: '',
        role: 'ADMISSION_COMMITTEE'
      });
      setShowCreateDialog(false);
      setSuccess(`Admin user ${createdUser.full_name} created successfully!`);
      setTimeout(() => setSuccess(null), 5000);
      
    } catch (error: any) {
      setError(error.message || 'Failed to create admin user');
    } finally {
      setIsCreating(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Badge className="bg-red-100 text-red-800">Admin</Badge>;
      case 'ADMISSION_COMMITTEE':
        return <Badge className="bg-blue-100 text-blue-800">Admission Committee</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Shield className="h-4 w-4 text-red-600" />;
      case 'ADMISSION_COMMITTEE':
        return <User className="h-4 w-4 text-blue-600" />;
      default:
        return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-purple-600" />
                <span>Admin User Management</span>
              </CardTitle>
              <CardDescription>
                Manage administrative users and admission committee members
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Admin User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Users Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center space-x-3">
                <Shield className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold text-purple-600">
                    {adminUsers.filter(user => user.role === 'ADMIN').length}
                  </p>
                  <p className="text-sm text-purple-700">Administrators</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center space-x-3">
                <User className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-blue-600">
                    {adminUsers.filter(user => user.role === 'ADMISSION_COMMITTEE').length}
                  </p>
                  <p className="text-sm text-blue-700">Committee Members</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center space-x-3">
                <Users className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {adminUsers.length}
                  </p>
                  <p className="text-sm text-green-700">Total Admin Users</p>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Users Table */}
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading admin users...</p>
            </div>
          ) : adminUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No admin users found</p>
              <p className="text-sm text-gray-400">
                Add your first admin user to get started
              </p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminUsers.map((user: UserType) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="bg-gray-100 p-2 rounded-full">
                            {getRoleIcon(user.role)}
                          </div>
                          <div>
                            <p className="font-medium">{user.full_name}</p>
                            <p className="text-xs text-gray-500">ID: {user.id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getRoleBadge(user.role)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">
                            {user.created_at.toLocaleDateString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800">
                          Active
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      {showCreateDialog && (
        <Dialog open={true} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <UserPlus className="h-5 w-5" />
                <span>Create Admin User</span>
              </DialogTitle>
              <DialogDescription>
                Add a new administrator or admission committee member
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  type="text"
                  placeholder="Enter full name"
                  value={newUserData.full_name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewUserData(prev => ({ ...prev, full_name: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={newUserData.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewUserData(prev => ({ ...prev, email: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select 
                  value={newUserData.role} 
                  onValueChange={(value) =>
                    setNewUserData(prev => ({ ...prev, role: value as 'ADMIN' | 'ADMISSION_COMMITTEE' }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMISSION_COMMITTEE">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>Admission Committee</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="ADMIN">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4" />
                        <span>Administrator</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  {newUserData.role === 'ADMIN' 
                    ? 'Full administrative access including user management'
                    : 'Can manage applications and view reports'
                  }
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => setShowCreateDialog(false)}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create User'}
                </Button>
              </div>
            </form>

            {/* Information about user creation */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>Note:</strong> A temporary password will be generated and sent to the user's email address. 
                They will be prompted to change it on first login.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Role Permissions Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Role Permissions</CardTitle>
          <CardDescription>
            Understanding the different administrative roles and their permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-red-600" />
                <h4 className="font-semibold text-red-900">Administrator</h4>
              </div>
              <ul className="text-sm text-gray-600 space-y-1 ml-7">
                <li>• Full system access and configuration</li>
                <li>• User management and role assignment</li>
                <li>• Application status management</li>
                <li>• Document viewing and management</li>
                <li>• Report generation and export</li>
                <li>• System notifications and broadcasts</li>
              </ul>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-blue-600" />
                <h4 className="font-semibold text-blue-900">Admission Committee</h4>
              </div>
              <ul className="text-sm text-gray-600 space-y-1 ml-7">
                <li>• View and manage applications</li>
                <li>• Update application statuses</li>
                <li>• View and download documents</li>
                <li>• Generate admission reports</li>
                <li>• View applicant information</li>
                <li>• Add notes to applications</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
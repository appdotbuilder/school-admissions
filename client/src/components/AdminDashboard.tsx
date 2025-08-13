import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  UsersIcon, 
  CrownIcon, 
  ClipboardIcon, 
  RefreshCwIcon,
  AlertCircleIcon,
  CalendarIcon,
  MailIcon
} from 'lucide-react';
import { trpc } from '@/utils/trpc';
// Type-only imports
import type { PublicUser } from '../../../server/src/schema';

interface AdminDashboardProps {
  currentUser: PublicUser;
}

export function AdminDashboard({ currentUser }: AdminDashboardProps) {
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await trpc.getAllUsers.query();
      setUsers(result);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const adminCount = users.filter((user: PublicUser) => user.role === 'admin').length;
  const pendaftarCount = users.filter((user: PublicUser) => user.role === 'pendaftar').length;

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Administrator Dashboard</h2>
            <p className="text-gray-600">
              Welcome to the admin panel, <span className="font-semibold">{currentUser.username}</span>! 
              Manage users and monitor system activity.
            </p>
          </div>
          <div className="text-right">
            <Badge variant="destructive" className="mb-2">
              <CrownIcon className="h-3 w-3 mr-1" />
              Administrator
            </Badge>
            <p className="text-xs text-gray-500">
              Member since {formatDate(currentUser.created_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">
              Registered in the system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administrators</CardTitle>
            <CrownIcon className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminCount}</div>
            <p className="text-xs text-muted-foreground">
              Users with admin privileges
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendaftar</CardTitle>
            <ClipboardIcon className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendaftarCount}</div>
            <p className="text-xs text-muted-foreground">
              Regular user accounts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* User Management Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <UsersIcon className="h-5 w-5" />
                <span>User Management</span>
              </CardTitle>
              <CardDescription>
                View and manage all registered users in the system
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadUsers}
              disabled={isLoading}
              className="flex items-center space-x-2"
            >
              <RefreshCwIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          </div>
          {lastUpdated && (
            <p className="text-xs text-gray-500 flex items-center mt-2">
              <CalendarIcon className="h-3 w-3 mr-1" />
              Last updated: {formatDate(lastUpdated)}
            </p>
          )}
        </CardHeader>
        <CardContent>
          {/* Demo Alert */}
          <Alert className="border-amber-200 bg-amber-50 mb-6">
            <AlertCircleIcon className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>Demo Mode:</strong> The getAllUsers handler returns an empty array. 
              In a real implementation, this would display all registered users.
            </AlertDescription>
          </Alert>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-600">Loading users...</span>
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <UsersIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Users Found</h3>
              <p className="text-gray-500 mb-4">
                No users have been registered yet, or the backend is returning empty data.
              </p>
              <Button variant="outline" onClick={loadUsers}>
                Try Again
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user: PublicUser) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{user.username}</h4>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <MailIcon className="h-3 w-3" />
                        <span>{user.email}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
                      {user.role === 'admin' ? (
                        <>
                          <CrownIcon className="h-3 w-3 mr-1" />
                          Admin
                        </>
                      ) : (
                        <>
                          <ClipboardIcon className="h-3 w-3 mr-1" />
                          Pendaftar
                        </>
                      )}
                    </Badge>
                    <div className="text-right text-xs text-gray-500">
                      <div>Joined {formatDate(user.created_at)}</div>
                      {user.updated_at.getTime() !== user.created_at.getTime() && (
                        <div>Updated {formatDate(user.updated_at)}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
          <CardDescription>Current system status and configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">User Account Summary</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Total Registered Users:</span>
                  <span className="font-medium">{users.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Administrator Accounts:</span>
                  <span className="font-medium">{adminCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pendaftar Accounts:</span>
                  <span className="font-medium">{pendaftarCount}</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Your Account</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Account ID:</span>
                  <span className="font-medium">#{currentUser.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Email:</span>
                  <span className="font-medium">{currentUser.email}</span>
                </div>
                <div className="flex justify-between">
                  <span>Role:</span>
                  <Badge variant="destructive" className="ml-2">Administrator</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
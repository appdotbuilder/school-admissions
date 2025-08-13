import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  UserIcon, 
  ClipboardIcon, 
  MailIcon,
  CalendarIcon,
  EditIcon,
  SaveIcon,
  XIcon,
  AlertCircleIcon,
  CheckCircleIcon
} from 'lucide-react';
import { trpc } from '@/utils/trpc';
// Type-only imports
import type { PublicUser, UpdateUserProfileInput } from '../../../server/src/schema';

interface UserDashboardProps {
  currentUser: PublicUser;
}

export function UserDashboard({ currentUser }: UserDashboardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    username: currentUser.username,
    email: currentUser.email
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!editForm.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (editForm.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (editForm.username.length > 50) {
      newErrors.username = 'Username must be less than 50 characters';
    }
    
    if (!editForm.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const updateData: UpdateUserProfileInput = {
        id: currentUser.id,
        username: editForm.username !== currentUser.username ? editForm.username : undefined,
        email: editForm.email !== currentUser.email ? editForm.email : undefined
      };

      await trpc.updateUserProfile.mutate(updateData);
      setIsEditing(false);
      // In a real app, we'd update the currentUser state in the parent component
      alert('Profile updated successfully! (Demo: Changes not persisted)');
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditForm({
      username: currentUser.username,
      email: currentUser.email
    });
    setErrors({});
    setIsEditing(false);
  };

  const handleInputChange = (field: keyof typeof editForm) => 
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setEditForm(prev => ({ ...prev, [field]: e.target.value }));
      // Clear error when user starts typing
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: '' }));
      }
    };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome, {currentUser.username}! 👋</h2>
            <p className="text-gray-600">
              Your personal dashboard for managing your account and accessing your services.
            </p>
          </div>
          <div className="text-right">
            <Badge variant="secondary" className="mb-2">
              <ClipboardIcon className="h-3 w-3 mr-1" />
              Pendaftar
            </Badge>
            <p className="text-xs text-gray-500">
              Member since {formatDate(currentUser.created_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Account Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Account Status</CardTitle>
            <CheckCircleIcon className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Active</div>
            <p className="text-xs text-muted-foreground">
              Your account is in good standing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Account Type</CardTitle>
            <ClipboardIcon className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Pendaftar</div>
            <p className="text-xs text-muted-foreground">
              Standard user account
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Member Since</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentUser.created_at.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </div>
            <p className="text-xs text-muted-foreground">
              Account registration date
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Profile Management */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <UserIcon className="h-5 w-5" />
                <span>Profile Information</span>
              </CardTitle>
              <CardDescription>
                Manage your account details and personal information
              </CardDescription>
            </div>
            {!isEditing && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2"
              >
                <EditIcon className="h-4 w-4" />
                <span>Edit Profile</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Demo Alert */}
          <Alert className="border-amber-200 bg-amber-50 mb-6">
            <AlertCircleIcon className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>Demo Mode:</strong> Profile updates will show success message but changes won't persist 
              as the updateUserProfile handler is currently a stub.
            </AlertDescription>
          </Alert>

          {isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-username">Username</Label>
                  <Input
                    id="edit-username"
                    value={editForm.username}
                    onChange={handleInputChange('username')}
                    placeholder="Enter your username"
                    className={errors.username ? 'border-red-500' : ''}
                    disabled={isLoading}
                  />
                  {errors.username && (
                    <p className="text-red-500 text-sm">{errors.username}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email Address</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editForm.email}
                    onChange={handleInputChange('email')}
                    placeholder="Enter your email"
                    className={errors.email ? 'border-red-500' : ''}
                    disabled={isLoading}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm">{errors.email}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-4">
                <Button 
                  onClick={handleSaveProfile}
                  disabled={isLoading}
                  className="flex items-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <SaveIcon className="h-4 w-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleCancelEdit}
                  disabled={isLoading}
                  className="flex items-center space-x-2"
                >
                  <XIcon className="h-4 w-4" />
                  <span>Cancel</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Basic Information</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <UserIcon className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">Username</p>
                        <p className="font-medium">{currentUser.username}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <MailIcon className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">Email Address</p>
                        <p className="font-medium">{currentUser.email}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Account Details</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Account ID</p>
                      <p className="font-medium">#{currentUser.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Account Type</p>
                      <Badge variant="secondary" className="mt-1">
                        <ClipboardIcon className="h-3 w-3 mr-1" />
                        Pendaftar
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Registration Date</p>
                      <p className="font-medium">{formatDate(currentUser.created_at)}</p>
                    </div>
                    {currentUser.updated_at.getTime() !== currentUser.created_at.getTime() && (
                      <div>
                        <p className="text-sm text-gray-600">Last Updated</p>
                        <p className="font-medium">{formatDate(currentUser.updated_at)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts for your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <EditIcon className="h-6 w-6 text-blue-500" />
              <span className="font-medium">Update Profile</span>
              <span className="text-xs text-gray-500 text-center">Modify your account information</span>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2" disabled>
              <MailIcon className="h-6 w-6 text-gray-400" />
              <span className="font-medium">Change Email</span>
              <span className="text-xs text-gray-500 text-center">Update your email address</span>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2" disabled>
              <UserIcon className="h-6 w-6 text-gray-400" />
              <span className="font-medium">Account Settings</span>
              <span className="text-xs text-gray-500 text-center">Manage account preferences</span>
            </Button>
          </div>
          
          <Alert className="mt-6">
            <AlertCircleIcon className="h-4 w-4" />
            <AlertDescription>
              Additional features and settings are available based on your account type. 
              Contact support for more information about upgrading your account.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
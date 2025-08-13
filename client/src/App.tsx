import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { UserIcon, LogOutIcon, UsersIcon, UserPlusIcon } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { LoginForm } from '@/components/LoginForm';
import { RegisterForm } from '@/components/RegisterForm';
import { AdminDashboard } from '@/components/AdminDashboard';
import { UserDashboard } from '@/components/UserDashboard';
// Type-only imports
import type { AuthResponse, PublicUser } from '../../server/src/schema';

function App() {
  const [currentUser, setCurrentUser] = useState<PublicUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Check server health on mount
  const checkHealth = useCallback(async () => {
    try {
      const health = await trpc.healthcheck.query();
      console.log('Server status:', health);
    } catch (error) {
      console.error('Server connection failed:', error);
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  const handleLogin = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const response: AuthResponse = await trpc.loginUser.mutate({ username, password });
      if (response.success && response.user) {
        setCurrentUser(response.user);
      } else {
        alert(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (username: string, email: string, password: string, role: 'pendaftar' | 'admin') => {
    setIsLoading(true);
    try {
      const response: AuthResponse = await trpc.registerUser.mutate({ username, email, password, role });
      if (response.success && response.user) {
        setCurrentUser(response.user);
      } else {
        alert(response.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('login');
  };

  // If user is logged in, show dashboard based on role
  if (currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <UserIcon className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">User Management System</h1>
                <p className="text-sm text-gray-500">Welcome back, {currentUser.username}!</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant={currentUser.role === 'admin' ? 'destructive' : 'secondary'} className="text-sm">
                {currentUser.role === 'admin' ? '👑 Admin' : '📝 Pendaftar'}
              </Badge>
              <Button variant="outline" size="sm" onClick={handleLogout} className="flex items-center space-x-2">
                <LogOutIcon className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          {currentUser.role === 'admin' ? (
            <AdminDashboard currentUser={currentUser} />
          ) : (
            <UserDashboard currentUser={currentUser} />
          )}
        </main>
      </div>
    );
  }

  // Login/Register screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-white p-3 rounded-full shadow-lg">
              <UserIcon className="h-12 w-12 text-blue-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
          <p className="text-gray-600">Secure authentication system for pendaftar and admin users</p>
        </div>

        {/* Auth Form */}
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl">
              {activeTab === 'login' ? 'Welcome Back' : 'Create Account'}
            </CardTitle>
            <CardDescription>
              {activeTab === 'login' 
                ? 'Sign in to access your dashboard' 
                : 'Register for a new account'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'login' | 'register')}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" className="flex items-center space-x-2">
                  <UserIcon className="h-4 w-4" />
                  <span>Login</span>
                </TabsTrigger>
                <TabsTrigger value="register" className="flex items-center space-x-2">
                  <UserPlusIcon className="h-4 w-4" />
                  <span>Register</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <LoginForm onLogin={handleLogin} isLoading={isLoading} />
              </TabsContent>

              <TabsContent value="register">
                <RegisterForm onRegister={handleRegister} isLoading={isLoading} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Built with ❤️ using React, tRPC & Tailwind CSS
          </p>
          <div className="flex justify-center items-center mt-4 space-x-4 text-xs text-gray-400">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Server Connected</span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center space-x-1">
              <UsersIcon className="h-3 w-3" />
              <span>Role-Based Access</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
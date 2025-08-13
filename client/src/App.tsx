import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  GraduationCap, 
  Users, 
  FileText, 
  Settings, 
  Bell,
  School
} from 'lucide-react';

// Import components
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import ApplicantDashboard from './components/ApplicantDashboard';
import AdminDashboard from './components/AdminDashboard';
import { NotificationCenter } from './components/NotificationCenter';

// Import types
import type { User } from '../../server/src/schema';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  // Show landing page if not logged in
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center items-center mb-6">
              <div className="bg-blue-600 p-4 rounded-full mr-4">
                <School className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900">
                School Admissions Portal
              </h1>
            </div>
            <p className="text-xl text-gray-600 mb-8">
              Welcome to our online admissions system for Junior and Senior High School
            </p>
            
            {/* Features showcase */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <Card className="text-center">
                <CardHeader>
                  <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <CardTitle className="text-lg">Easy Application</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Complete your application online with our simple step-by-step process
                  </p>
                </CardContent>
              </Card>
              
              <Card className="text-center">
                <CardHeader>
                  <Bell className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <CardTitle className="text-lg">Real-time Updates</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Get instant notifications about your application status changes
                  </p>
                </CardContent>
              </Card>
              
              <Card className="text-center">
                <CardHeader>
                  <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <CardTitle className="text-lg">Secure Portal</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Your documents and information are safely stored and protected
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Login/Register Section */}
          <div className="max-w-md mx-auto">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'login' | 'register')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <Card>
                  <CardHeader>
                    <CardTitle>Welcome Back</CardTitle>
                    <CardDescription>
                      Sign in to continue with your application
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <LoginForm onLogin={handleLogin} />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="register">
                <Card>
                  <CardHeader>
                    <CardTitle>Create Account</CardTitle>
                    <CardDescription>
                      Register as a new applicant to start your admission process
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RegisterForm onRegister={handleLogin} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Footer */}
          <div className="text-center mt-16 text-gray-500">
            <p>© 2024 School Admissions Portal. All rights reserved.</p>
          </div>
        </div>
      </div>
    );
  }

  // Show appropriate dashboard based on user role
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-600 p-2 rounded-lg">
              <School className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Admissions Portal
              </h1>
              <p className="text-sm text-gray-500">
                Welcome, {currentUser.full_name}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Role badge */}
            <Badge variant={currentUser.role === 'APPLICANT' ? 'default' : 'secondary'}>
              {currentUser.role.replace('_', ' ')}
            </Badge>
            
            {/* Notifications */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNotifications(true)}
            >
              <Bell className="h-4 w-4" />
            </Button>
            
            {/* Logout */}
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {currentUser.role === 'APPLICANT' ? (
          <ApplicantDashboard user={currentUser} />
        ) : (
          <AdminDashboard user={currentUser} />
        )}
      </main>

      {/* Notification Center */}
      {showNotifications && (
        <NotificationCenter
          userId={currentUser.id}
          onClose={() => setShowNotifications(false)}
        />
      )}
    </div>
  );
}

export default App;
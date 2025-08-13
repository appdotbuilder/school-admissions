import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  FileText, 
  TrendingUp,
  Download,
  Settings,
  Search,
  Filter,
  BarChart3,
  UserCheck,
  Clock
} from 'lucide-react';

import AdminStats from './AdminStats';
import ApplicationsManager from './ApplicationsManager';
import DocumentViewer from './DocumentViewer';
import ReportsManager from './ReportsManager';
import AdminUserManager from './AdminUserManager';

import { trpc } from '@/utils/trpc';
import type { User as UserType } from '../../../server/src/schema';

interface AdminDashboardProps {
  user: UserType;
}

export default function AdminDashboard({ user }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load dashboard stats
  const loadDashboardStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const stats = await trpc.getAdminDashboardStats.query();
      setDashboardStats(stats);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardStats();
  }, [loadDashboardStats]);

  const isAdmin = user.role === 'ADMIN';
  const isAdmissionCommittee = user.role === 'ADMISSION_COMMITTEE';

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-purple-100 p-3 rounded-full">
                <Settings className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-2xl text-purple-900">
                  {isAdmin ? 'Admin Dashboard' : 'Admissions Dashboard'}
                </CardTitle>
                <CardDescription className="text-purple-700">
                  Manage applications and oversee the admission process
                </CardDescription>
              </div>
            </div>
            
            <Badge 
              variant="outline" 
              className="bg-white/50 border-purple-300 text-purple-800"
            >
              {user.role.replace('_', ' ')}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Stats */}
      {dashboardStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <span className="text-3xl font-bold text-blue-600">
                  {dashboardStats.totalApplications}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Pending Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                <span className="text-3xl font-bold text-yellow-600">
                  {(dashboardStats.applicationsByStatus?.INITIAL_REGISTRATION || 0) + 
                   (dashboardStats.applicationsByStatus?.DOCUMENT_UPLOAD || 0) + 
                   (dashboardStats.applicationsByStatus?.SELECTION || 0)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Approved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <UserCheck className="h-5 w-5 text-green-600" />
                <span className="text-3xl font-bold text-green-600">
                  {(dashboardStats.applicationsByStatus?.ANNOUNCEMENT || 0) + 
                   (dashboardStats.applicationsByStatus?.RE_REGISTRATION || 0)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Applicants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-purple-600" />
                <span className="text-3xl font-bold text-purple-600">
                  {dashboardStats.totalApplications}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="applications" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Applications</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center space-x-2">
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Documents</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Reports</span>
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <AdminStats dashboardStats={dashboardStats} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="applications" className="mt-6">
          <ApplicationsManager user={user} />
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <DocumentViewer />
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          <ReportsManager />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="users" className="mt-6">
            <AdminUserManager />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
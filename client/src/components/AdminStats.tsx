import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Users, 
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  GraduationCap,
  Calendar
} from 'lucide-react';

interface AdminStatsProps {
  dashboardStats: any;
  isLoading: boolean;
}

export default function AdminStats({ dashboardStats, isLoading }: AdminStatsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">Loading statistics...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!dashboardStats) {
    return (
      <div className="grid gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500">
              Unable to load statistics at this time.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const calculatePercentage = (value: number, total: number) => {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  };

  const statusBreakdown = [
    {
      status: 'Initial Registration',
      count: dashboardStats.applicationsByStatus?.INITIAL_REGISTRATION || 0,
      color: 'bg-yellow-500',
      icon: Clock
    },
    {
      status: 'Document Upload',
      count: dashboardStats.applicationsByStatus?.DOCUMENT_UPLOAD || 0,
      color: 'bg-blue-500',
      icon: FileText
    },
    {
      status: 'Selection',
      count: dashboardStats.applicationsByStatus?.SELECTION || 0,
      color: 'bg-purple-500',
      icon: AlertTriangle
    },
    {
      status: 'Announcement',
      count: dashboardStats.applicationsByStatus?.ANNOUNCEMENT || 0,
      color: 'bg-green-500',
      icon: CheckCircle
    },
    {
      status: 'Re-registration',
      count: dashboardStats.applicationsByStatus?.RE_REGISTRATION || 0,
      color: 'bg-emerald-500',
      icon: GraduationCap
    }
  ];

  return (
    <div className="space-y-6">
      {/* Application Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <span>Application Status Overview</span>
          </CardTitle>
          <CardDescription>
            Current distribution of applications by status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Breakdown */}
            <div className="space-y-4">
              {statusBreakdown.map((item) => {
                const Icon = item.icon;
                const percentage = calculatePercentage(item.count, dashboardStats.totalApplications);
                
                return (
                  <div key={item.status} className="flex items-center space-x-4">
                    <div className={`p-2 rounded-lg ${item.color.replace('bg-', 'bg-').replace('-500', '-100')}`}>
                      <Icon className={`h-4 w-4 ${item.color.replace('bg-', 'text-')}`} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{item.status}</span>
                        <span className="text-sm text-gray-500">
                          {item.count} ({percentage}%)
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary Stats */}
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Quick Summary</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Applications</span>
                    <Badge variant="outline">{dashboardStats.totalApplications}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Active Applicants</span>
                    <Badge variant="outline">{dashboardStats.totalApplicants}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Completion Rate</span>
                    <Badge className="bg-green-100 text-green-800">
                      {calculatePercentage(
                        (dashboardStats.statusBreakdown?.ANNOUNCEMENT || 0) + 
                        (dashboardStats.statusBreakdown?.RE_REGISTRATION || 0),
                        dashboardStats.totalApplications
                      )}%
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* School Level Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <GraduationCap className="h-5 w-5 text-purple-600" />
              <span>School Level Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Junior High School</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">
                    {dashboardStats.applicationsBySchoolLevel?.JUNIOR_HIGH || 0}
                  </span>
                  <Badge className="bg-blue-100 text-blue-800">
                    {calculatePercentage(
                      dashboardStats.applicationsBySchoolLevel?.JUNIOR_HIGH || 0,
                      dashboardStats.totalApplications
                    )}%
                  </Badge>
                </div>
              </div>
              
              <Progress 
                value={calculatePercentage(
                  dashboardStats.applicationsBySchoolLevel?.JUNIOR_HIGH || 0,
                  dashboardStats.totalApplications
                )} 
                className="h-2"
              />

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Senior High School</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">
                    {dashboardStats.applicationsBySchoolLevel?.SENIOR_HIGH || 0}
                  </span>
                  <Badge className="bg-purple-100 text-purple-800">
                    {calculatePercentage(
                      dashboardStats.applicationsBySchoolLevel?.SENIOR_HIGH || 0,
                      dashboardStats.totalApplications
                    )}%
                  </Badge>
                </div>
              </div>
              
              <Progress 
                value={calculatePercentage(
                  dashboardStats.applicationsBySchoolLevel?.SENIOR_HIGH || 0,
                  dashboardStats.totalApplications
                )} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <span>Recent Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardStats.recentApplications?.slice(0, 5).map((application: any, index: number) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      New application: {application.application_number}
                    </p>
                    <p className="text-xs text-gray-500">
                      {application.created_at.toLocaleString()}
                    </p>
                  </div>
                </div>
              )) || (
                <p className="text-sm text-gray-500 text-center py-4">
                  No recent activity to display
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <span>Performance Metrics</span>
          </CardTitle>
          <CardDescription>
            Key performance indicators for the admission process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-green-900">Applications Completed</h3>
              <p className="text-2xl font-bold text-green-600 mt-2">
                {(dashboardStats.applicationsByStatus?.ANNOUNCEMENT || 0) + 
                 (dashboardStats.applicationsByStatus?.RE_REGISTRATION || 0)}
              </p>
              <p className="text-sm text-green-700">
                {calculatePercentage(
                  (dashboardStats.applicationsByStatus?.ANNOUNCEMENT || 0) + 
                  (dashboardStats.applicationsByStatus?.RE_REGISTRATION || 0),
                  dashboardStats.totalApplications
                )}% of total
              </p>
            </div>

            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="font-semibold text-yellow-900">In Progress</h3>
              <p className="text-2xl font-bold text-yellow-600 mt-2">
                {(dashboardStats.applicationsByStatus?.INITIAL_REGISTRATION || 0) + 
                 (dashboardStats.applicationsByStatus?.DOCUMENT_UPLOAD || 0) + 
                 (dashboardStats.applicationsByStatus?.SELECTION || 0)}
              </p>
              <p className="text-sm text-yellow-700">
                {calculatePercentage(
                  (dashboardStats.applicationsByStatus?.INITIAL_REGISTRATION || 0) + 
                  (dashboardStats.applicationsByStatus?.DOCUMENT_UPLOAD || 0) + 
                  (dashboardStats.applicationsByStatus?.SELECTION || 0),
                  dashboardStats.totalApplications
                )}% of total
              </p>
            </div>

            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-blue-900">Average per Applicant</h3>
              <p className="text-2xl font-bold text-blue-600 mt-2">
                1.0
              </p>
              <p className="text-sm text-blue-700">applications each</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
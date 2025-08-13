import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  User, 
  FileText, 
  Upload, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  GraduationCap,
  BookOpen
} from 'lucide-react';

import ProfileForm from './ProfileForm';
import ApplicationForm from './ApplicationForm';
import DocumentUpload from './DocumentUpload';
import ApplicationStatus from './ApplicationStatus';
import AcademicRecordsForm from './AcademicRecordsForm';

import { trpc } from '@/utils/trpc';
import type { 
  User as UserType, 
  ApplicantProfile, 
  Application 
} from '../../../server/src/schema';

interface ApplicantDashboardProps {
  user: UserType;
}

export default function ApplicantDashboard({ user }: ApplicantDashboardProps) {
  const [profile, setProfile] = useState<ApplicantProfile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [currentApplication, setCurrentApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Load applicant profile
  const loadProfile = useCallback(async () => {
    try {
      const profileData = await trpc.getApplicantProfile.query({ userId: user.id });
      setProfile(profileData);
    } catch (error) {
      // Profile doesn't exist yet
      setProfile(null);
    }
  }, [user.id]);

  // Load applications
  const loadApplications = useCallback(async () => {
    if (!profile) return;
    
    try {
      const applicationsData = await trpc.getApplicationsByApplicant.query({ 
        applicantId: profile.id 
      });
      setApplications(applicationsData);
      
      // Set current application (most recent)
      if (applicationsData.length > 0) {
        setCurrentApplication(applicationsData[0]);
      }
    } catch (error) {
      console.error('Failed to load applications:', error);
    }
  }, [profile]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  // Calculate progress based on application status
  const getProgressPercentage = (status: string) => {
    switch (status) {
      case 'INITIAL_REGISTRATION': return 20;
      case 'DOCUMENT_UPLOAD': return 40;
      case 'SELECTION': return 60;
      case 'ANNOUNCEMENT': return 80;
      case 'RE_REGISTRATION': return 100;
      default: return 0;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'INITIAL_REGISTRATION': return 'bg-yellow-500';
      case 'DOCUMENT_UPLOAD': return 'bg-blue-500';
      case 'SELECTION': return 'bg-purple-500';
      case 'ANNOUNCEMENT': return 'bg-green-500';
      case 'RE_REGISTRATION': return 'bg-emerald-500';
      default: return 'bg-gray-500';
    }
  };

  const handleProfileComplete = (newProfile: ApplicantProfile) => {
    setProfile(newProfile);
    setActiveTab('application');
  };

  const handleApplicationComplete = (newApplication: Application) => {
    setCurrentApplication(newApplication);
    setApplications(prev => [newApplication, ...prev]);
    setActiveTab('documents');
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <GraduationCap className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-2xl text-blue-900">
                Welcome to Your Application Portal
              </CardTitle>
              <CardDescription className="text-blue-700">
                Complete your school admission application step by step
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Progress Overview */}
      {currentApplication && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Application Progress</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Application #{currentApplication.application_number}
                </span>
                <Badge className={getStatusColor(currentApplication.status)}>
                  {currentApplication.status.replace('_', ' ')}
                </Badge>
              </div>
              <Progress 
                value={getProgressPercentage(currentApplication.status)} 
                className="h-2"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Started</span>
                <span>{getProgressPercentage(currentApplication.status)}% Complete</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="application" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Application</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center space-x-2">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Documents</span>
          </TabsTrigger>
          <TabsTrigger value="status" className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Status</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <User className="h-5 w-5 text-blue-600" />
                  <span>Profile</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {profile ? 'Profile Complete' : 'Profile Incomplete'}
                  </span>
                  {profile ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <FileText className="h-5 w-5 text-purple-600" />
                  <span>Applications</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {applications.length} Application{applications.length !== 1 ? 's' : ''}
                  </span>
                  <span className="text-2xl font-bold text-purple-600">
                    {applications.length}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <span>Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {currentApplication?.status.replace('_', ' ') || 'Not Started'}
                  </span>
                  {currentApplication && (
                    <Badge className={getStatusColor(currentApplication.status)}>
                      Active
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Next Steps */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
              <CardDescription>
                Complete these steps to progress your application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {!profile && (
                  <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <User className="h-5 w-5 text-yellow-600" />
                      <span className="font-medium text-yellow-800">
                        Complete your profile
                      </span>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => setActiveTab('profile')}
                      className="bg-yellow-600 hover:bg-yellow-700"
                    >
                      Start
                    </Button>
                  </div>
                )}
                
                {profile && !currentApplication && (
                  <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-blue-800">
                        Submit your application
                      </span>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => setActiveTab('application')}
                    >
                      Start
                    </Button>
                  </div>
                )}
                
                {currentApplication && currentApplication.status === 'INITIAL_REGISTRATION' && (
                  <div className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Upload className="h-5 w-5 text-purple-600" />
                      <span className="font-medium text-purple-800">
                        Upload required documents
                      </span>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => setActiveTab('documents')}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      Upload
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="mt-6">
          <ProfileForm
            userId={user.id}
            existingProfile={profile}
            onComplete={handleProfileComplete}
          />
        </TabsContent>

        <TabsContent value="application" className="mt-6">
          {!profile ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  <span>Profile Required</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  You need to complete your profile before creating an application.
                </p>
                <Button onClick={() => setActiveTab('profile')}>
                  Complete Profile First
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <ApplicationForm
                applicantId={profile.id}
                onComplete={handleApplicationComplete}
              />
              
              {currentApplication && (
                <AcademicRecordsForm applicationId={currentApplication.id} />
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          {!currentApplication ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  <span>Application Required</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  You need to create an application before uploading documents.
                </p>
                <Button onClick={() => setActiveTab('application')}>
                  Create Application First
                </Button>
              </CardContent>
            </Card>
          ) : (
            <DocumentUpload applicationId={currentApplication.id} />
          )}
        </TabsContent>

        <TabsContent value="status" className="mt-6">
          {!currentApplication ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  <span>No Application Found</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  You don't have any applications to track yet.
                </p>
                <Button onClick={() => setActiveTab('application')}>
                  Create Application
                </Button>
              </CardContent>
            </Card>
          ) : (
            <ApplicationStatus 
              applicationId={currentApplication.id} 
              currentStatus={currentApplication.status}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
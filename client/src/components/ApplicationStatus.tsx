import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  FileText,
  Upload,
  Search,
  Megaphone,
  UserCheck,
  Calendar,
  User,
  MessageSquare
} from 'lucide-react';

import { trpc } from '@/utils/trpc';
import type { ApplicationStatusHistory } from '../../../server/src/schema';

interface ApplicationStatusProps {
  applicationId: number;
  currentStatus: string;
}

const STATUS_STEPS = [
  {
    status: 'INITIAL_REGISTRATION',
    label: 'Initial Registration',
    icon: FileText,
    description: 'Application submitted and under initial review'
  },
  {
    status: 'DOCUMENT_UPLOAD',
    label: 'Document Upload',
    icon: Upload,
    description: 'Required documents uploaded and being verified'
  },
  {
    status: 'SELECTION',
    label: 'Selection Process',
    icon: Search,
    description: 'Application under evaluation by admissions committee'
  },
  {
    status: 'ANNOUNCEMENT',
    label: 'Announcement',
    icon: Megaphone,
    description: 'Results announced - check admission status'
  },
  {
    status: 'RE_REGISTRATION',
    label: 'Re-registration',
    icon: UserCheck,
    description: 'Final enrollment and registration process'
  }
];

export default function ApplicationStatus({ applicationId, currentStatus }: ApplicationStatusProps) {
  const [statusHistory, setStatusHistory] = useState<ApplicationStatusHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load status history
  const loadStatusHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const history = await trpc.getApplicationStatusHistory.query({ applicationId });
      setStatusHistory(history);
    } catch (error: any) {
      setError(error.message || 'Failed to load status history');
    } finally {
      setIsLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    loadStatusHistory();
  }, [loadStatusHistory]);

  const getCurrentStepIndex = () => {
    return STATUS_STEPS.findIndex(step => step.status === currentStatus);
  };

  const isStepCompleted = (stepIndex: number) => {
    return stepIndex < getCurrentStepIndex();
  };

  const isStepActive = (stepIndex: number) => {
    return stepIndex === getCurrentStepIndex();
  };

  const getStepIcon = (step: any, stepIndex: number) => {
    const Icon = step.icon;
    
    if (isStepCompleted(stepIndex)) {
      return <CheckCircle className="h-6 w-6 text-green-600" />;
    }
    
    if (isStepActive(stepIndex)) {
      return <Icon className="h-6 w-6 text-blue-600" />;
    }
    
    return <Icon className="h-6 w-6 text-gray-400" />;
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'INITIAL_REGISTRATION':
        return {
          type: 'info',
          message: 'Your application has been received and is under initial review. Please ensure all required documents are uploaded.'
        };
      case 'DOCUMENT_UPLOAD':
        return {
          type: 'warning',
          message: 'We are currently verifying your uploaded documents. This process may take 3-5 business days.'
        };
      case 'SELECTION':
        return {
          type: 'info',
          message: 'Your application is being evaluated by our admissions committee. Results will be announced soon.'
        };
      case 'ANNOUNCEMENT':
        return {
          type: 'success',
          message: 'Results have been announced! Please check your admission status and follow next steps if accepted.'
        };
      case 'RE_REGISTRATION':
        return {
          type: 'success',
          message: 'Congratulations! Complete your final enrollment and registration to secure your spot.'
        };
      default:
        return {
          type: 'info',
          message: 'Your application is being processed.'
        };
    }
  };

  const statusMessage = getStatusMessage(currentStatus);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Loading status information...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Current Status Alert */}
      <Alert className={`border-${statusMessage.type === 'success' ? 'green' : statusMessage.type === 'warning' ? 'yellow' : 'blue'}-200 bg-${statusMessage.type === 'success' ? 'green' : statusMessage.type === 'warning' ? 'yellow' : 'blue'}-50`}>
        <AlertCircle className={`h-4 w-4 text-${statusMessage.type === 'success' ? 'green' : statusMessage.type === 'warning' ? 'yellow' : 'blue'}-600`} />
        <AlertDescription className={`text-${statusMessage.type === 'success' ? 'green' : statusMessage.type === 'warning' ? 'yellow' : 'blue'}-800`}>
          {statusMessage.message}
        </AlertDescription>
      </Alert>

      {/* Status Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <span>Application Progress</span>
          </CardTitle>
          <CardDescription>
            Track your application through each stage of the admission process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {STATUS_STEPS.map((step, index) => (
              <div key={step.status} className="relative pb-8 last:pb-0">
                {/* Connection Line */}
                {index < STATUS_STEPS.length - 1 && (
                  <div className={`absolute left-3 top-8 w-0.5 h-8 ${
                    isStepCompleted(index) ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                )}
                
                {/* Step Content */}
                <div className="relative flex items-start space-x-4">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full border-2 flex items-center justify-center ${
                    isStepCompleted(index) 
                      ? 'bg-green-50 border-green-500' 
                      : isStepActive(index)
                      ? 'bg-blue-50 border-blue-500'
                      : 'bg-gray-50 border-gray-300'
                  }`}>
                    {getStepIcon(step, index)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className={`font-semibold ${
                        isStepActive(index) ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        {step.label}
                      </h3>
                      
                      {isStepCompleted(index) && (
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          Completed
                        </Badge>
                      )}
                      
                      {isStepActive(index) && (
                        <Badge className="bg-blue-100 text-blue-800 text-xs">
                          Current
                        </Badge>
                      )}
                    </div>
                    
                    <p className={`text-sm ${
                      isStepActive(index) ? 'text-blue-700' : 'text-gray-600'
                    }`}>
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Status History */}
      {statusHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-purple-600" />
              <span>Status History</span>
            </CardTitle>
            <CardDescription>
              Detailed history of all status changes and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statusHistory.map((history: ApplicationStatusHistory, index: number) => (
                <div key={history.id} className="border-l-4 border-blue-200 pl-4 pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant="outline">
                          {history.new_status.replace('_', ' ')}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {history.created_at.toLocaleDateString()} at {history.created_at.toLocaleTimeString()}
                        </span>
                      </div>
                      
                      {history.previous_status && (
                        <p className="text-sm text-gray-600 mb-1">
                          Changed from: <span className="font-medium">{history.previous_status.replace('_', ' ')}</span>
                        </p>
                      )}
                      
                      {history.notes && (
                        <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                          <strong>Note:</strong> {history.notes}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center text-xs text-gray-500">
                      <User className="h-3 w-3 mr-1" />
                      Admin Update
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle>What's Next?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {currentStatus === 'INITIAL_REGISTRATION' && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Action Required:</strong> Make sure all required documents are uploaded and your academic records are complete.
                </p>
              </div>
            )}
            
            {currentStatus === 'DOCUMENT_UPLOAD' && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>In Progress:</strong> Your documents are being verified. You will be notified once the review is complete.
                </p>
              </div>
            )}
            
            {currentStatus === 'SELECTION' && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-sm text-purple-800">
                  <strong>Under Review:</strong> Your application is being evaluated. Results will be announced according to the admission schedule.
                </p>
              </div>
            )}
            
            {currentStatus === 'ANNOUNCEMENT' && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Results Available:</strong> Check your admission status and prepare for the next steps if accepted.
                </p>
              </div>
            )}
            
            {currentStatus === 'RE_REGISTRATION' && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <p className="text-sm text-emerald-800">
                  <strong>Final Step:</strong> Complete your enrollment registration to finalize your admission.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
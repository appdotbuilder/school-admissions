import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { 
  FileText, 
  Send,
  AlertCircle,
  CheckCircle,
  GraduationCap
} from 'lucide-react';

import { trpc } from '@/utils/trpc';
import type { 
  Application, 
  CreateApplicationInput 
} from '../../../server/src/schema';

interface ApplicationFormProps {
  applicantId: number;
  onComplete: (application: Application) => void;
}

export default function ApplicationForm({ applicantId, onComplete }: ApplicationFormProps) {
  const [formData, setFormData] = useState<CreateApplicationInput>({
    school_level: 'JUNIOR_HIGH'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const application = await trpc.createApplication.mutate({
        applicantId,
        application: formData
      });

      setSuccess(true);
      onComplete(application);
    } catch (error: any) {
      setError(error.message || 'Failed to create application. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-blue-600" />
          <span>Create New Application</span>
        </CardTitle>
        <CardDescription>
          Start your admission application by selecting your preferred school level
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Application created successfully! You can now proceed to upload documents and add academic records.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="school_level">School Level</Label>
              <Select
                value={formData.school_level}
                onValueChange={(value) =>
                  setFormData((prev: CreateApplicationInput) => ({
                    ...prev,
                    school_level: value as 'JUNIOR_HIGH' | 'SENIOR_HIGH'
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select school level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="JUNIOR_HIGH">
                    <div className="flex items-center space-x-2">
                      <GraduationCap className="h-4 w-4" />
                      <span>Junior High School</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="SENIOR_HIGH">
                    <div className="flex items-center space-x-2">
                      <GraduationCap className="h-4 w-4" />
                      <span>Senior High School</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500">
                {formData.school_level === 'JUNIOR_HIGH' 
                  ? 'Apply for Grade 7-9 admission'
                  : 'Apply for Grade 10-12 admission'
                }
              </p>
            </div>

            {/* Information about next steps */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">What happens next?</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Your application will be assigned a unique application number</li>
                <li>• You'll need to upload required documents (birth certificate, report cards, etc.)</li>
                <li>• Add your academic records from previous school</li>
                <li>• Submit your complete application for review</li>
                <li>• Track your application status through the selection process</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button type="submit" disabled={isLoading || success} className="min-w-32">
              {isLoading ? (
                'Creating...'
              ) : success ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Created
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Create Application
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  Users,
  Save,
  AlertCircle
} from 'lucide-react';

import { trpc } from '@/utils/trpc';
import type { 
  ApplicantProfile, 
  CreateApplicantProfileInput 
} from '../../../server/src/schema';

interface ProfileFormProps {
  userId: number;
  existingProfile?: ApplicantProfile | null;
  onComplete: (profile: ApplicantProfile) => void;
}

export default function ProfileForm({ userId, existingProfile, onComplete }: ProfileFormProps) {
  const [formData, setFormData] = useState<CreateApplicantProfileInput>({
    date_of_birth: existingProfile?.date_of_birth || new Date(),
    address: existingProfile?.address || '',
    phone_number: existingProfile?.phone_number || '',
    parent_full_name: existingProfile?.parent_full_name || '',
    parent_phone_number: existingProfile?.parent_phone_number || '',
    parent_email: existingProfile?.parent_email || '',
    school_level: existingProfile?.school_level || 'JUNIOR_HIGH'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      let profile: ApplicantProfile;
      
      if (existingProfile) {
        // Update existing profile
        profile = await trpc.updateApplicantProfile.mutate({
          userId,
          profile: formData
        });
      } else {
        // Create new profile
        profile = await trpc.createApplicantProfile.mutate({
          userId,
          profile: formData
        });
      }

      setSuccess(true);
      onComplete(profile);
    } catch (error: any) {
      setError(error.message || 'Failed to save profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <User className="h-5 w-5 text-blue-600" />
          <span>{existingProfile ? 'Update Profile' : 'Create Profile'}</span>
        </CardTitle>
        <CardDescription>
          Please provide your personal information and parent/guardian details
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
            <Save className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Profile saved successfully!
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Personal Information</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth instanceof Date 
                    ? formData.date_of_birth.toISOString().split('T')[0]
                    : formData.date_of_birth
                  }
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateApplicantProfileInput) => ({ 
                      ...prev, 
                      date_of_birth: new Date(e.target.value)
                    }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input
                  id="phone_number"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={formData.phone_number}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateApplicantProfileInput) => ({ 
                      ...prev, 
                      phone_number: e.target.value 
                    }))
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                placeholder="Enter your full address"
                value={formData.address}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData((prev: CreateApplicantProfileInput) => ({ 
                    ...prev, 
                    address: e.target.value 
                  }))
                }
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="school_level">School Level</Label>
              <Select
                value={formData.school_level}
                onValueChange={(value) =>
                  setFormData((prev: CreateApplicantProfileInput) => ({
                    ...prev,
                    school_level: value as 'JUNIOR_HIGH' | 'SENIOR_HIGH'
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select school level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="JUNIOR_HIGH">Junior High School</SelectItem>
                  <SelectItem value="SENIOR_HIGH">Senior High School</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Parent/Guardian Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Parent/Guardian Information</span>
            </h3>

            <div className="space-y-2">
              <Label htmlFor="parent_full_name">Parent/Guardian Full Name</Label>
              <Input
                id="parent_full_name"
                type="text"
                placeholder="Enter parent/guardian full name"
                value={formData.parent_full_name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateApplicantProfileInput) => ({ 
                    ...prev, 
                    parent_full_name: e.target.value 
                  }))
                }
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="parent_phone_number">Parent/Guardian Phone</Label>
                <Input
                  id="parent_phone_number"
                  type="tel"
                  placeholder="Enter parent/guardian phone"
                  value={formData.parent_phone_number}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateApplicantProfileInput) => ({ 
                      ...prev, 
                      parent_phone_number: e.target.value 
                    }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="parent_email">Parent/Guardian Email</Label>
                <Input
                  id="parent_email"
                  type="email"
                  placeholder="Enter parent/guardian email"
                  value={formData.parent_email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateApplicantProfileInput) => ({ 
                      ...prev, 
                      parent_email: e.target.value 
                    }))
                  }
                  required
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button type="submit" disabled={isLoading} className="min-w-32">
              {isLoading ? (
                'Saving...'
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {existingProfile ? 'Update Profile' : 'Save Profile'}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
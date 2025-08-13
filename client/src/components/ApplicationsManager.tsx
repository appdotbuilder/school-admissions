import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  Filter, 
  Eye, 
  Edit,
  FileText,
  User,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Phone,
  Mail
} from 'lucide-react';

import { trpc } from '@/utils/trpc';
import type { 
  User as UserType,
  ApplicationStatus
} from '../../../server/src/schema';

interface ApplicationsManagerProps {
  user: UserType;
}

interface ApplicationWithApplicant {
  id: number;
  application_number: string;
  status: ApplicationStatus;
  submitted_at: Date | null;
  created_at: Date;
  updated_at: Date;
  applicant: {
    id: number;
    user_id: number;
    date_of_birth: Date;
    address: string;
    phone_number: string;
    school_level: string;
    user: {
      full_name: string;
      email: string;
    };
    parent_full_name: string;
    parent_phone_number: string;
    parent_email: string;
  };
}

const STATUS_OPTIONS = [
  { value: 'INITIAL_REGISTRATION', label: 'Initial Registration', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'DOCUMENT_UPLOAD', label: 'Document Upload', color: 'bg-blue-100 text-blue-800' },
  { value: 'SELECTION', label: 'Selection', color: 'bg-purple-100 text-purple-800' },
  { value: 'ANNOUNCEMENT', label: 'Announcement', color: 'bg-green-100 text-green-800' },
  { value: 'RE_REGISTRATION', label: 'Re-registration', color: 'bg-emerald-100 text-emerald-800' }
];

export default function ApplicationsManager({ user }: ApplicationsManagerProps) {
  const [applications, setApplications] = useState<ApplicationWithApplicant[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<ApplicationWithApplicant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [schoolLevelFilter, setSchoolLevelFilter] = useState<string>('all');
  const [selectedApplication, setSelectedApplication] = useState<ApplicationWithApplicant | null>(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<ApplicationStatus>('INITIAL_REGISTRATION');
  const [statusNotes, setStatusNotes] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load applications
  const loadApplications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await trpc.getApplicationsWithApplicantInfo.query({});
      setApplications(response.applications);
      setFilteredApplications(response.applications);
    } catch (error: any) {
      setError(error.message || 'Failed to load applications');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  // Filter applications based on search and filters
  useEffect(() => {
    let filtered = applications;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((app: ApplicationWithApplicant) =>
        app.applicant.user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.applicant.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.application_number.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((app: ApplicationWithApplicant) => app.status === statusFilter);
    }

    // School level filter
    if (schoolLevelFilter !== 'all') {
      filtered = filtered.filter((app: ApplicationWithApplicant) => app.applicant.school_level === schoolLevelFilter);
    }

    setFilteredApplications(filtered);
  }, [applications, searchTerm, statusFilter, schoolLevelFilter]);

  const handleUpdateStatus = async () => {
    if (!selectedApplication) return;

    setIsUpdatingStatus(true);
    try {
      await trpc.updateApplicationStatus.mutate({
        statusUpdate: {
          application_id: selectedApplication.id,
          new_status: newStatus,
          notes: statusNotes || undefined
        },
        changedByUserId: user.id
      });

      // Update local state
      setApplications(prev =>
        prev.map((app: ApplicationWithApplicant) =>
          app.id === selectedApplication.id
            ? { ...app, status: newStatus }
            : app
        )
      );

      setShowStatusDialog(false);
      setSelectedApplication(null);
      setStatusNotes('');
    } catch (error: any) {
      setError(error.message || 'Failed to update application status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusBadge = (status: ApplicationStatus) => {
    const statusOption = STATUS_OPTIONS.find(option => option.value === status);
    return (
      <Badge className={statusOption?.color || 'bg-gray-100 text-gray-800'}>
        {statusOption?.label || status.replace('_', ' ')}
      </Badge>
    );
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <span>Applications Management</span>
          </CardTitle>
          <CardDescription>
            View, filter, and manage all student applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, or application number..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {STATUS_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={schoolLevelFilter} onValueChange={setSchoolLevelFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="JUNIOR_HIGH">Junior High</SelectItem>
                <SelectItem value="SENIOR_HIGH">Senior High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results Summary */}
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Showing {filteredApplications.length} of {applications.length} applications
            </p>
          </div>

          {/* Applications Table */}
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading applications...</p>
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No applications found</p>
              <p className="text-sm text-gray-400">
                {searchTerm || statusFilter !== 'all' || schoolLevelFilter !== 'all'
                  ? 'Try adjusting your search criteria'
                  : 'Applications will appear here when submitted'
                }
              </p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Application #</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>School Level</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.map((application: ApplicationWithApplicant) => (
                    <TableRow key={application.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{application.applicant.user.full_name}</p>
                          <p className="text-xs text-gray-500">{application.applicant.user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {application.application_number}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(application.status)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {application.applicant.school_level === 'JUNIOR_HIGH' ? 'Junior High' : 'Senior High'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{formatDate(application.submitted_at)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedApplication(application)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedApplication(application);
                              setNewStatus(application.status);
                              setShowStatusDialog(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Application Detail Dialog */}
      {selectedApplication && !showStatusDialog && (
        <Dialog open={true} onOpenChange={() => setSelectedApplication(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Application Details</DialogTitle>
              <DialogDescription>
                Application #{selectedApplication.application_number}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-6">
              {/* Student Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <User className="h-5 w-5" />
                    <span>Student Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Full Name</Label>
                    <p className="text-sm font-semibold">{selectedApplication.applicant.user.full_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Email</Label>
                    <p className="text-sm">{selectedApplication.applicant.user.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Date of Birth</Label>
                    <p className="text-sm">{formatDate(selectedApplication.applicant.date_of_birth)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Phone Number</Label>
                    <p className="text-sm">{selectedApplication.applicant.phone_number}</p>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-gray-600">Address</Label>
                    <p className="text-sm">{selectedApplication.applicant.address}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">School Level</Label>
                    <Badge className="ml-2">
                      {selectedApplication.applicant.school_level === 'JUNIOR_HIGH' ? 'Junior High School' : 'Senior High School'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Parent/Guardian Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Parent/Guardian Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Full Name</Label>
                    <p className="text-sm font-semibold">{selectedApplication.applicant.parent_full_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Email</Label>
                    <p className="text-sm">{selectedApplication.applicant.parent_email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Phone Number</Label>
                    <p className="text-sm">{selectedApplication.applicant.parent_phone_number}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Application Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Application Status</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Current Status</Label>
                    <div className="mt-1">
                      {getStatusBadge(selectedApplication.status)}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Submitted At</Label>
                    <p className="text-sm">{formatDate(selectedApplication.submitted_at)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Created At</Label>
                    <p className="text-sm">{formatDate(selectedApplication.created_at)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Last Updated</Label>
                    <p className="text-sm">{formatDate(selectedApplication.updated_at)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => setSelectedApplication(null)}
              >
                Close
              </Button>
              <Button 
                onClick={() => {
                  setNewStatus(selectedApplication.status);
                  setShowStatusDialog(true);
                }}
              >
                Update Status
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Status Update Dialog */}
      {showStatusDialog && selectedApplication && (
        <Dialog open={true} onOpenChange={() => setShowStatusDialog(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Application Status</DialogTitle>
              <DialogDescription>
                Update the status for {selectedApplication.applicant.user.full_name}'s application
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new_status">New Status</Label>
                <Select value={newStatus} onValueChange={(value) => setNewStatus(value as ApplicationStatus)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about this status change..."
                  value={statusNotes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setStatusNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowStatusDialog(false)}
                disabled={isUpdatingStatus}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateStatus}
                disabled={isUpdatingStatus}
              >
                {isUpdatingStatus ? 'Updating...' : 'Update Status'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
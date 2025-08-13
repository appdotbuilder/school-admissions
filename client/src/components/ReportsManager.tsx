import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  FileText, 
  Filter,
  Calendar,
  Users,
  BarChart3,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

import { trpc } from '@/utils/trpc';

const REPORT_TYPES = [
  {
    id: 'all_applications',
    title: 'All Applications Report',
    description: 'Complete list of all applications with applicant details',
    icon: FileText
  },
  {
    id: 'status_summary',
    title: 'Status Summary Report',
    description: 'Applications grouped by current status',
    icon: BarChart3
  },
  {
    id: 'school_level_report',
    title: 'School Level Report',
    description: 'Applications breakdown by Junior/Senior High School',
    icon: Users
  },
  {
    id: 'timeline_report',
    title: 'Timeline Report',
    description: 'Applications organized by submission date',
    icon: Calendar
  }
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'INITIAL_REGISTRATION', label: 'Initial Registration' },
  { value: 'DOCUMENT_UPLOAD', label: 'Document Upload' },
  { value: 'SELECTION', label: 'Selection' },
  { value: 'ANNOUNCEMENT', label: 'Announcement' },
  { value: 'RE_REGISTRATION', label: 'Re-registration' }
];

const SCHOOL_LEVEL_OPTIONS = [
  { value: 'all', label: 'All Levels' },
  { value: 'JUNIOR_HIGH', label: 'Junior High School' },
  { value: 'SENIOR_HIGH', label: 'Senior High School' }
];

export default function ReportsManager() {
  const [selectedReportType, setSelectedReportType] = useState('all_applications');
  const [statusFilter, setStatusFilter] = useState('all');
  const [schoolLevelFilter, setSchoolLevelFilter] = useState('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      const filters = {
        status: statusFilter !== 'all' ? statusFilter as any : undefined,
        school_level: schoolLevelFilter !== 'all' ? schoolLevelFilter as any : undefined
      };

      // Call the export endpoint
      const reportData = await trpc.exportApplicationsReport.query(filters);
      
      // In a real implementation, this would trigger a file download
      // For now, we'll show a success message
      setSuccess(`${selectedReportType.replace('_', ' ')} generated successfully! In production, this would download a file with the generated report data.`);
      
      console.log('Report data:', reportData);
      
    } catch (error: any) {
      setError(error.message || 'Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedReport = REPORT_TYPES.find(report => report.id === selectedReportType);

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Download className="h-5 w-5 text-green-600" />
            <span>Reports & Export</span>
          </CardTitle>
          <CardDescription>
            Generate and download various reports for admissions data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Report Type Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Select Report Type</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {REPORT_TYPES.map((reportType) => {
                const Icon = reportType.icon;
                const isSelected = selectedReportType === reportType.id;
                
                return (
                  <Card 
                    key={reportType.id}
                    className={`cursor-pointer border-2 transition-colors ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedReportType(reportType.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${
                          isSelected 
                            ? 'bg-blue-100' 
                            : 'bg-gray-100'
                        }`}>
                          <Icon className={`h-5 w-5 ${
                            isSelected 
                              ? 'text-blue-600' 
                              : 'text-gray-600'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <h4 className={`font-semibold ${
                            isSelected ? 'text-blue-900' : 'text-gray-900'
                          }`}>
                            {reportType.title}
                          </h4>
                          <p className={`text-sm ${
                            isSelected ? 'text-blue-700' : 'text-gray-600'
                          }`}>
                            {reportType.description}
                          </p>
                        </div>
                        {isSelected && (
                          <Badge className="bg-blue-100 text-blue-800">
                            Selected
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Report Filters</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Filter by Status
                </label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status filter" />
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
                <label className="text-sm font-medium text-gray-700">
                  Filter by School Level
                </label>
                <Select value={schoolLevelFilter} onValueChange={setSchoolLevelFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select school level filter" />
                  </SelectTrigger>
                  <SelectContent>
                    {SCHOOL_LEVEL_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Report Preview */}
          {selectedReport && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Report Preview</h3>
              <Card className="bg-gray-50">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <selectedReport.icon className="h-6 w-6 text-blue-600 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900">{selectedReport.title}</h4>
                      <p className="text-sm text-gray-600 mb-3">{selectedReport.description}</p>
                      
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm">
                          <span className="font-medium">Status Filter:</span>
                          <Badge variant="outline">
                            {STATUS_OPTIONS.find(opt => opt.value === statusFilter)?.label || 'All Statuses'}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <span className="font-medium">School Level Filter:</span>
                          <Badge variant="outline">
                            {SCHOOL_LEVEL_OPTIONS.find(opt => opt.value === schoolLevelFilter)?.label || 'All Levels'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Generate Report Button */}
          <div className="flex justify-center">
            <Button 
              onClick={handleGenerateReport}
              disabled={isGenerating}
              size="lg"
              className="min-w-48"
            >
              {isGenerating ? (
                'Generating Report...'
              ) : (
                <>
                  <Download className="h-5 w-5 mr-2" />
                  Generate & Download Report
                </>
              )}
            </Button>
          </div>

          {/* Report Information */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">📊 Report Information</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Reports are generated in real-time with current data</li>
              <li>• All reports include applicant personal information and application details</li>
              <li>• Export format: CSV for easy import into spreadsheet applications</li>
              <li>• Reports respect user privacy and are for authorized personnel only</li>
              <li>• Generated reports include timestamp and filter information</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Available Report Types</p>
                <p className="text-2xl font-bold text-blue-600">{REPORT_TYPES.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <Filter className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Filters</p>
                <p className="text-2xl font-bold text-green-600">
                  {(statusFilter !== 'all' ? 1 : 0) + (schoolLevelFilter !== 'all' ? 1 : 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Download className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Export Format</p>
                <p className="text-lg font-bold text-purple-600">CSV</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
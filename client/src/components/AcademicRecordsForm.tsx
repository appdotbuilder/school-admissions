import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Plus,
  Trash2,
  Save,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

import { trpc } from '@/utils/trpc';
import type { 
  AcademicRecord, 
  CreateAcademicRecordInput 
} from '../../../server/src/schema';

interface AcademicRecordsFormProps {
  applicationId: number;
}

export default function AcademicRecordsForm({ applicationId }: AcademicRecordsFormProps) {
  const [records, setRecords] = useState<AcademicRecord[]>([]);
  const [newRecord, setNewRecord] = useState<CreateAcademicRecordInput>({
    application_id: applicationId,
    subject: '',
    grade: '',
    semester: '',
    academic_year: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load existing records
  const loadRecords = useCallback(async () => {
    try {
      const recordsData = await trpc.getAcademicRecordsByApplication.query({ 
        applicationId 
      });
      setRecords(recordsData);
    } catch (error) {
      console.error('Failed to load academic records:', error);
    }
  }, [applicationId]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecord.subject || !newRecord.grade || !newRecord.semester || !newRecord.academic_year) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const createdRecord = await trpc.createAcademicRecord.mutate(newRecord);
      setRecords(prev => [...prev, createdRecord]);
      setNewRecord({
        application_id: applicationId,
        subject: '',
        grade: '',
        semester: '',
        academic_year: ''
      });
      setSuccess('Academic record added successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      setError(error.message || 'Failed to add academic record');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRecord = async (recordId: number) => {
    try {
      await trpc.deleteAcademicRecord.mutate({ recordId });
      setRecords(prev => prev.filter(record => record.id !== recordId));
      setSuccess('Academic record deleted successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      setError(error.message || 'Failed to delete academic record');
    }
  };

  const getGradeColor = (grade: string) => {
    const gradeNum = parseFloat(grade);
    if (gradeNum >= 90) return 'bg-green-100 text-green-800';
    if (gradeNum >= 80) return 'bg-blue-100 text-blue-800';
    if (gradeNum >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BookOpen className="h-5 w-5 text-purple-600" />
          <span>Academic Records</span>
        </CardTitle>
        <CardDescription>
          Add your grades and academic performance from your previous school
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
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Existing Records */}
        {records.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Your Academic Records</h3>
            <div className="space-y-3">
              {records.map((record: AcademicRecord) => (
                <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="font-medium">{record.subject}</p>
                      <p className="text-xs text-gray-500">Subject</p>
                    </div>
                    <div>
                      <Badge className={getGradeColor(record.grade)}>
                        {record.grade}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">Grade</p>
                    </div>
                    <div>
                      <p className="text-sm">{record.semester}</p>
                      <p className="text-xs text-gray-500">Semester</p>
                    </div>
                    <div>
                      <p className="text-sm">{record.academic_year}</p>
                      <p className="text-xs text-gray-500">Academic Year</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteRecord(record.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add New Record Form */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Add Academic Record</span>
          </h3>

          <form onSubmit={handleAddRecord} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  type="text"
                  placeholder="e.g., Mathematics, English, Science"
                  value={newRecord.subject}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewRecord((prev: CreateAcademicRecordInput) => ({ 
                      ...prev, 
                      subject: e.target.value 
                    }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="grade">Grade</Label>
                <Input
                  id="grade"
                  type="text"
                  placeholder="e.g., A, B+, 85, 3.5"
                  value={newRecord.grade}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewRecord((prev: CreateAcademicRecordInput) => ({ 
                      ...prev, 
                      grade: e.target.value 
                    }))
                  }
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="semester">Semester</Label>
                <Input
                  id="semester"
                  type="text"
                  placeholder="e.g., 1st Semester, Fall 2023"
                  value={newRecord.semester}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewRecord((prev: CreateAcademicRecordInput) => ({ 
                      ...prev, 
                      semester: e.target.value 
                    }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="academic_year">Academic Year</Label>
                <Input
                  id="academic_year"
                  type="text"
                  placeholder="e.g., 2023-2024"
                  value={newRecord.academic_year}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewRecord((prev: CreateAcademicRecordInput) => ({ 
                      ...prev, 
                      academic_year: e.target.value 
                    }))
                  }
                  required
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  'Adding...'
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Record
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Information Note */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">📚 Tips for Academic Records</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Include all major subjects from your previous school</li>
            <li>• Use the same grading system as your school (A-F, 1-100, etc.)</li>
            <li>• Add records for the most recent 2-3 semesters</li>
            <li>• Double-check your grades for accuracy</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
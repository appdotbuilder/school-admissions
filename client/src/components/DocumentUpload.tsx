import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  File, 
  Trash2,
  Download,
  CheckCircle,
  AlertCircle,
  FileImage,
  FileText,
  Camera,
  CreditCard
} from 'lucide-react';

import { trpc } from '@/utils/trpc';
import type { 
  Document, 
  DocumentType
} from '../../../server/src/schema';

interface DocumentUploadProps {
  applicationId: number;
}

const DOCUMENT_TYPES = [
  { 
    type: 'BIRTH_CERTIFICATE' as DocumentType, 
    label: 'Birth Certificate', 
    icon: FileText,
    description: 'Official birth certificate from government registry'
  },
  { 
    type: 'REPORT_CARD' as DocumentType, 
    label: 'Report Card', 
    icon: File,
    description: 'Most recent report card or transcript'
  },
  { 
    type: 'PHOTO' as DocumentType, 
    label: 'Student Photo', 
    icon: Camera,
    description: '2x2 passport-style photo'
  },
  { 
    type: 'PARENT_ID' as DocumentType, 
    label: 'Parent/Guardian ID', 
    icon: CreditCard,
    description: 'Valid government-issued ID of parent/guardian'
  },
  { 
    type: 'OTHER' as DocumentType, 
    label: 'Other Documents', 
    icon: FileImage,
    description: 'Any additional supporting documents'
  }
];

export default function DocumentUpload({ applicationId }: DocumentUploadProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<{[key: string]: number}>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load existing documents
  const loadDocuments = useCallback(async () => {
    try {
      const documentsData = await trpc.getDocumentsByApplication.query({ 
        applicationId 
      });
      setDocuments(documentsData);
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  }, [applicationId]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Simulate file upload (since we don't have actual file handling)
  const handleFileUpload = async (file: File, documentType: DocumentType) => {
    const fileKey = `${documentType}_${Date.now()}`;
    
    // Simulate upload progress
    setUploadingFiles(prev => ({ ...prev, [fileKey]: 0 }));
    
    // Simulate progressive upload
    const progressInterval = setInterval(() => {
      setUploadingFiles(prev => {
        const currentProgress = prev[fileKey] || 0;
        if (currentProgress >= 100) {
          clearInterval(progressInterval);
          return prev;
        }
        return { ...prev, [fileKey]: currentProgress + 10 };
      });
    }, 200);

    try {
      // Wait for simulated upload completion
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create document record
      const newDocument = await trpc.uploadDocument.mutate({
        application_id: applicationId,
        document_type: documentType,
        original_filename: file.name,
        stored_filename: `${applicationId}_${documentType}_${Date.now()}_${file.name}`,
        file_size: file.size,
        mime_type: file.type
      });

      setDocuments(prev => [...prev, newDocument]);
      setSuccess(`${file.name} uploaded successfully!`);
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (error: any) {
      setError(error.message || 'Failed to upload document');
    } finally {
      setUploadingFiles(prev => {
        const newState = { ...prev };
        delete newState[fileKey];
        return newState;
      });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, documentType: DocumentType) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        setError('Only JPG, PNG, and PDF files are allowed');
        return;
      }

      handleFileUpload(file, documentType);
    }
  };

  const handleDeleteDocument = async (documentId: number) => {
    try {
      await trpc.deleteDocument.mutate({ documentId });
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      setSuccess('Document deleted successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      setError(error.message || 'Failed to delete document');
    }
  };

  const getDocumentsByType = (type: DocumentType) => {
    return documents.filter((doc: Document) => doc.document_type === type);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

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
            <Upload className="h-5 w-5 text-purple-600" />
            <span>Required Documents</span>
          </CardTitle>
          <CardDescription>
            Upload all required documents to complete your application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            {DOCUMENT_TYPES.map((docType) => {
              const Icon = docType.icon;
              const existingDocs = getDocumentsByType(docType.type);
              const isUploading = Object.keys(uploadingFiles).some(key => key.includes(docType.type));
              const uploadProgress = Object.entries(uploadingFiles).find(([key]) => key.includes(docType.type))?.[1];

              return (
                <div key={docType.type} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start space-x-3">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <Icon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{docType.label}</h3>
                        <p className="text-sm text-gray-600">{docType.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {existingDocs.length > 0 && (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Uploaded
                        </Badge>
                      )}
                      
                      <div className="relative">
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf"
                          onChange={(e) => handleFileSelect(e, docType.type)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          disabled={isUploading}
                        />
                        <Button variant="outline" size="sm" disabled={isUploading}>
                          <Upload className="h-4 w-4 mr-2" />
                          {existingDocs.length > 0 ? 'Replace' : 'Upload'}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Upload Progress */}
                  {isUploading && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600">Uploading...</span>
                        <span className="text-sm text-gray-600">{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                  )}

                  {/* Existing Documents */}
                  {existingDocs.length > 0 && (
                    <div className="space-y-2">
                      {existingDocs.map((doc: Document) => (
                        <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center space-x-2">
                            <File className="h-4 w-4 text-gray-500" />
                            <div>
                              <p className="text-sm font-medium">{doc.original_filename}</p>
                              <p className="text-xs text-gray-500">
                                {formatFileSize(doc.file_size)} • Uploaded {doc.uploaded_at.toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {/* Download functionality would go here */}}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteDocument(doc.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Upload Guidelines */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">📄 Upload Guidelines</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• File formats: JPG, PNG, PDF only</li>
              <li>• Maximum file size: 5MB per document</li>
              <li>• Ensure documents are clear and readable</li>
              <li>• All required documents must be uploaded before submission</li>
              <li>• You can replace documents by uploading a new file</li>
            </ul>
          </div>

          {/* Submission Status */}
          <div className="mt-6 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold">Document Submission Status</h4>
                <p className="text-sm text-gray-600">
                  {documents.length} of {DOCUMENT_TYPES.length} document types uploaded
                </p>
              </div>
              
              <div className="text-right">
                {documents.length >= DOCUMENT_TYPES.length ? (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Complete
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    {DOCUMENT_TYPES.length - documents.length} Missing
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
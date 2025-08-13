import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  Download, 
  Eye,
  FileText,
  Image,
  File,
  AlertCircle,
  Calendar,
  User
} from 'lucide-react';

import { trpc } from '@/utils/trpc';
import type { Document } from '../../../server/src/schema';

const DOCUMENT_TYPE_INFO = {
  BIRTH_CERTIFICATE: { label: 'Birth Certificate', icon: FileText, color: 'bg-blue-100 text-blue-800' },
  REPORT_CARD: { label: 'Report Card', icon: File, color: 'bg-green-100 text-green-800' },
  PHOTO: { label: 'Student Photo', icon: Image, color: 'bg-purple-100 text-purple-800' },
  PARENT_ID: { label: 'Parent/Guardian ID', icon: FileText, color: 'bg-yellow-100 text-yellow-800' },
  OTHER: { label: 'Other Documents', icon: File, color: 'bg-gray-100 text-gray-800' }
};

interface DocumentWithApplication extends Document {
  application: {
    id: number;
    application_number: string;
    applicant: {
      user: {
        full_name: string;
      };
    };
  };
}

export default function DocumentViewer() {
  const [documents, setDocuments] = useState<DocumentWithApplication[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<DocumentWithApplication[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [documentTypeFilter, setDocumentTypeFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  // Stub: Load documents with application info
  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Note: This is a stub implementation since we don't have a tRPC endpoint
      // that returns documents with application info. In a real implementation,
      // you would create a new endpoint or modify existing ones.
      
      // For now, we'll simulate some document data
      const mockDocuments: DocumentWithApplication[] = [
        {
          id: 1,
          application_id: 1,
          document_type: 'BIRTH_CERTIFICATE',
          original_filename: 'birth_certificate.pdf',
          stored_filename: '1_BIRTH_CERTIFICATE_20240101_birth_certificate.pdf',
          file_size: 245760,
          mime_type: 'application/pdf',
          uploaded_at: new Date('2024-01-01T10:00:00Z'),
          application: {
            id: 1,
            application_number: 'APP-2024-001',
            applicant: {
              user: {
                full_name: 'John Smith'
              }
            }
          }
        },
        {
          id: 2,
          application_id: 1,
          document_type: 'REPORT_CARD',
          original_filename: 'report_card_2023.pdf',
          stored_filename: '1_REPORT_CARD_20240102_report_card_2023.pdf',
          file_size: 512000,
          mime_type: 'application/pdf',
          uploaded_at: new Date('2024-01-02T14:30:00Z'),
          application: {
            id: 1,
            application_number: 'APP-2024-001',
            applicant: {
              user: {
                full_name: 'John Smith'
              }
            }
          }
        }
      ];

      setDocuments(mockDocuments);
      setFilteredDocuments(mockDocuments);
    } catch (error: any) {
      setError('Failed to load documents. This is a stub implementation.');
      console.log('Stub: DocumentViewer would load documents with application info');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Filter documents based on search and filters
  useEffect(() => {
    let filtered = documents;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((doc: DocumentWithApplication) =>
        doc.application.applicant.user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.application.application_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.original_filename.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Document type filter
    if (documentTypeFilter !== 'all') {
      filtered = filtered.filter((doc: DocumentWithApplication) => doc.document_type === documentTypeFilter);
    }

    setFilteredDocuments(filtered);
  }, [documents, searchTerm, documentTypeFilter]);

  const handleDownloadDocument = async (documentId: number) => {
    try {
      // Stub: In real implementation, this would download the actual file
      console.log('Stub: Downloading document', documentId);
      alert('Document download feature is a stub implementation. In production, this would download the actual file.');
    } catch (error: any) {
      setError(error.message || 'Failed to download document');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getDocumentTypeInfo = (type: string) => {
    return DOCUMENT_TYPE_INFO[type as keyof typeof DOCUMENT_TYPE_INFO] || DOCUMENT_TYPE_INFO.OTHER;
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
            <Eye className="h-5 w-5 text-purple-600" />
            <span>Document Viewer</span>
          </CardTitle>
          <CardDescription>
            View and manage all uploaded documents from applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Note about stub implementation */}
          <Alert className="mb-6 border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Note:</strong> This is a stub implementation showing mock data. 
              In production, this would display real documents from the database and allow actual file downloads.
            </AlertDescription>
          </Alert>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by applicant name, application number, or filename..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={documentTypeFilter} onValueChange={setDocumentTypeFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Document Types</SelectItem>
                {Object.entries(DOCUMENT_TYPE_INFO).map(([type, info]) => (
                  <SelectItem key={type} value={type}>
                    {info.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Results Summary */}
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Showing {filteredDocuments.length} of {documents.length} documents
            </p>
          </div>

          {/* Documents Table */}
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading documents...</p>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No documents found</p>
              <p className="text-sm text-gray-400">
                {searchTerm || documentTypeFilter !== 'all'
                  ? 'Try adjusting your search criteria'
                  : 'Documents will appear here when uploaded'
                }
              </p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Application #</TableHead>
                    <TableHead>File Size</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((document: DocumentWithApplication) => {
                    const typeInfo = getDocumentTypeInfo(document.document_type);
                    const Icon = typeInfo.icon;

                    return (
                      <TableRow key={document.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <div className={`p-2 rounded-lg ${typeInfo.color.replace('text-', 'text-').replace('bg-', 'bg-').replace('-800', '-100').replace('-100', '-100')}`}>
                                <Icon className={`h-4 w-4 ${typeInfo.color.replace('bg-', 'text-').replace('-100', '-600')}`} />
                              </div>
                            </div>
                            <div>
                              <p className="font-medium text-sm">{document.original_filename}</p>
                              <p className="text-xs text-gray-500">{document.mime_type}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={typeInfo.color}>
                            {typeInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{document.application.applicant.user.full_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {document.application.application_number}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {formatFileSize(document.file_size)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">
                              {document.uploaded_at.toLocaleDateString()}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadDocument(document.id)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {Object.entries(DOCUMENT_TYPE_INFO).map(([type, info]) => {
          const Icon = info.icon;
          const count = documents.filter((doc: DocumentWithApplication) => doc.document_type === type).length;
          
          return (
            <Card key={type}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${info.color.replace('text-', 'text-').replace('bg-', 'bg-').replace('-800', '-100').replace('-100', '-100')}`}>
                    <Icon className={`h-4 w-4 ${info.color.replace('bg-', 'text-').replace('-100', '-600')}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-xs text-gray-600">{info.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
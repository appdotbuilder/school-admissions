import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, applicantProfilesTable, applicationsTable, documentsTable } from '../db/schema';
import { type UploadDocumentInput, type DocumentType } from '../schema';
import {
  uploadDocument,
  getDocumentsByApplication,
  getDocumentById,
  deleteDocument,
  getDocumentsByType,
  downloadDocument
} from '../handlers/documents';
import { eq } from 'drizzle-orm';

// Test data
const testUser = {
  email: 'test@example.com',
  password_hash: 'hashed_password',
  full_name: 'Test User',
  role: 'APPLICANT' as const
};

const testApplicantProfile = {
  date_of_birth: new Date('1990-01-01'),
  address: '123 Test Street',
  phone_number: '123-456-7890',
  parent_full_name: 'Parent Name',
  parent_phone_number: '098-765-4321',
  parent_email: 'parent@example.com',
  school_level: 'JUNIOR_HIGH' as const
};

const testUploadInput: UploadDocumentInput = {
  application_id: 1,
  document_type: 'BIRTH_CERTIFICATE',
  original_filename: 'birth_certificate.pdf',
  stored_filename: 'doc_12345_birth_certificate.pdf',
  file_size: 1024000,
  mime_type: 'application/pdf'
};

describe('Document Handlers', () => {
  let userId: number;
  let applicantId: number;
  let applicationId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    userId = userResult[0].id;

    // Create applicant profile
    const profileResult = await db.insert(applicantProfilesTable)
      .values({
        ...testApplicantProfile,
        user_id: userId
      })
      .returning()
      .execute();
    applicantId = profileResult[0].id;

    // Create application
    const applicationResult = await db.insert(applicationsTable)
      .values({
        applicant_id: applicantId,
        application_number: 'APP-2024-001'
      })
      .returning()
      .execute();
    applicationId = applicationResult[0].id;

    // Update test input with correct application_id
    testUploadInput.application_id = applicationId;
  });

  afterEach(resetDB);

  describe('uploadDocument', () => {
    it('should upload a document successfully', async () => {
      const result = await uploadDocument(testUploadInput);

      expect(result.application_id).toBe(applicationId);
      expect(result.document_type).toBe('BIRTH_CERTIFICATE');
      expect(result.original_filename).toBe('birth_certificate.pdf');
      expect(result.stored_filename).toBe('doc_12345_birth_certificate.pdf');
      expect(result.file_size).toBe(1024000);
      expect(result.mime_type).toBe('application/pdf');
      expect(result.id).toBeDefined();
      expect(result.uploaded_at).toBeInstanceOf(Date);
    });

    it('should save document to database', async () => {
      const result = await uploadDocument(testUploadInput);

      const documents = await db.select()
        .from(documentsTable)
        .where(eq(documentsTable.id, result.id))
        .execute();

      expect(documents).toHaveLength(1);
      expect(documents[0].application_id).toBe(applicationId);
      expect(documents[0].document_type).toBe('BIRTH_CERTIFICATE');
      expect(documents[0].original_filename).toBe('birth_certificate.pdf');
    });

    it('should throw error for non-existent application', async () => {
      const invalidInput = {
        ...testUploadInput,
        application_id: 99999
      };

      await expect(uploadDocument(invalidInput)).rejects.toThrow(/application.*not found/i);
    });

    it('should handle different document types', async () => {
      const documentTypes: DocumentType[] = ['BIRTH_CERTIFICATE', 'REPORT_CARD', 'PHOTO', 'PARENT_ID', 'OTHER'];
      
      for (const docType of documentTypes) {
        const input = {
          ...testUploadInput,
          document_type: docType,
          original_filename: `${docType.toLowerCase()}.pdf`
        };
        
        const result = await uploadDocument(input);
        expect(result.document_type).toBe(docType);
        expect(result.original_filename).toBe(`${docType.toLowerCase()}.pdf`);
      }
    });
  });

  describe('getDocumentsByApplication', () => {
    it('should return documents for an application', async () => {
      // Upload multiple documents
      const doc1 = await uploadDocument(testUploadInput);
      const doc2 = await uploadDocument({
        ...testUploadInput,
        document_type: 'REPORT_CARD',
        original_filename: 'report_card.pdf',
        stored_filename: 'doc_12346_report_card.pdf'
      });

      const documents = await getDocumentsByApplication(applicationId);

      expect(documents).toHaveLength(2);
      expect(documents.find(d => d.id === doc1.id)).toBeDefined();
      expect(documents.find(d => d.id === doc2.id)).toBeDefined();
    });

    it('should return empty array for application with no documents', async () => {
      const documents = await getDocumentsByApplication(applicationId);
      expect(documents).toHaveLength(0);
    });

    it('should throw error for non-existent application', async () => {
      await expect(getDocumentsByApplication(99999)).rejects.toThrow(/application.*not found/i);
    });
  });

  describe('getDocumentById', () => {
    it('should return document by ID', async () => {
      const uploaded = await uploadDocument(testUploadInput);
      const document = await getDocumentById(uploaded.id);

      expect(document).not.toBeNull();
      expect(document!.id).toBe(uploaded.id);
      expect(document!.document_type).toBe('BIRTH_CERTIFICATE');
      expect(document!.original_filename).toBe('birth_certificate.pdf');
    });

    it('should return null for non-existent document', async () => {
      const document = await getDocumentById(99999);
      expect(document).toBeNull();
    });
  });

  describe('deleteDocument', () => {
    it('should delete document successfully', async () => {
      const uploaded = await uploadDocument(testUploadInput);
      const result = await deleteDocument(uploaded.id);

      expect(result).toBe(true);

      // Verify document is deleted
      const document = await getDocumentById(uploaded.id);
      expect(document).toBeNull();
    });

    it('should throw error for non-existent document', async () => {
      await expect(deleteDocument(99999)).rejects.toThrow(/document.*not found/i);
    });

    it('should remove document from database', async () => {
      const uploaded = await uploadDocument(testUploadInput);
      await deleteDocument(uploaded.id);

      const documents = await db.select()
        .from(documentsTable)
        .where(eq(documentsTable.id, uploaded.id))
        .execute();

      expect(documents).toHaveLength(0);
    });
  });

  describe('getDocumentsByType', () => {
    it('should return documents by type for an application', async () => {
      // Upload documents of different types
      await uploadDocument(testUploadInput); // BIRTH_CERTIFICATE
      await uploadDocument({
        ...testUploadInput,
        document_type: 'REPORT_CARD',
        original_filename: 'report_card.pdf'
      });
      await uploadDocument({
        ...testUploadInput,
        document_type: 'BIRTH_CERTIFICATE',
        original_filename: 'birth_certificate_copy.pdf'
      });

      const birthCertificates = await getDocumentsByType(applicationId, 'BIRTH_CERTIFICATE');
      const reportCards = await getDocumentsByType(applicationId, 'REPORT_CARD');
      const photos = await getDocumentsByType(applicationId, 'PHOTO');

      expect(birthCertificates).toHaveLength(2);
      expect(reportCards).toHaveLength(1);
      expect(photos).toHaveLength(0);

      birthCertificates.forEach(doc => {
        expect(doc.document_type).toBe('BIRTH_CERTIFICATE');
      });
    });

    it('should throw error for non-existent application', async () => {
      await expect(getDocumentsByType(99999, 'BIRTH_CERTIFICATE')).rejects.toThrow(/application.*not found/i);
    });

    it('should return empty array for type with no documents', async () => {
      await uploadDocument(testUploadInput); // BIRTH_CERTIFICATE
      
      const photos = await getDocumentsByType(applicationId, 'PHOTO');
      expect(photos).toHaveLength(0);
    });
  });

  describe('downloadDocument', () => {
    it('should return document and file data', async () => {
      const uploaded = await uploadDocument(testUploadInput);
      const result = await downloadDocument(uploaded.id);

      expect(result).not.toBeNull();
      expect(result!.document.id).toBe(uploaded.id);
      expect(result!.document.original_filename).toBe('birth_certificate.pdf');
      expect(result!.fileData).toBeInstanceOf(Buffer);
      expect(result!.fileData.toString()).toContain('birth_certificate.pdf');
    });

    it('should return null for non-existent document', async () => {
      const result = await downloadDocument(99999);
      expect(result).toBeNull();
    });

    it('should include correct file data', async () => {
      const uploaded = await uploadDocument({
        ...testUploadInput,
        original_filename: 'test_report.pdf'
      });
      
      const result = await downloadDocument(uploaded.id);
      
      expect(result).not.toBeNull();
      expect(result!.fileData.toString()).toContain('test_report.pdf');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle multiple document operations for same application', async () => {
      // Upload multiple documents
      const doc1 = await uploadDocument(testUploadInput);
      const doc2 = await uploadDocument({
        ...testUploadInput,
        document_type: 'REPORT_CARD',
        original_filename: 'report_card.pdf'
      });

      // Verify documents exist
      let documents = await getDocumentsByApplication(applicationId);
      expect(documents).toHaveLength(2);

      // Delete one document
      await deleteDocument(doc1.id);

      // Verify only one remains
      documents = await getDocumentsByApplication(applicationId);
      expect(documents).toHaveLength(1);
      expect(documents[0].id).toBe(doc2.id);
    });

    it('should maintain referential integrity with applications', async () => {
      const uploaded = await uploadDocument(testUploadInput);
      
      // Document should reference correct application
      const document = await getDocumentById(uploaded.id);
      expect(document!.application_id).toBe(applicationId);
      
      // Should be found when querying by application
      const appDocuments = await getDocumentsByApplication(applicationId);
      expect(appDocuments.find(d => d.id === uploaded.id)).toBeDefined();
    });
  });
});
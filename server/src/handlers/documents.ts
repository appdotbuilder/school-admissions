import { db } from '../db';
import { documentsTable, applicationsTable } from '../db/schema';
import { type UploadDocumentInput, type Document, type DocumentType } from '../schema';
import { eq, and } from 'drizzle-orm';

export const uploadDocument = async (input: UploadDocumentInput): Promise<Document> => {
  try {
    // Verify the application exists
    const application = await db.select()
      .from(applicationsTable)
      .where(eq(applicationsTable.id, input.application_id))
      .execute();

    if (application.length === 0) {
      throw new Error(`Application with ID ${input.application_id} not found`);
    }

    // Insert document record
    const result = await db.insert(documentsTable)
      .values({
        application_id: input.application_id,
        document_type: input.document_type,
        original_filename: input.original_filename,
        stored_filename: input.stored_filename,
        file_size: input.file_size,
        mime_type: input.mime_type
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Document upload failed:', error);
    throw error;
  }
};

export const getDocumentsByApplication = async (applicationId: number): Promise<Document[]> => {
  try {
    // Verify the application exists
    const application = await db.select()
      .from(applicationsTable)
      .where(eq(applicationsTable.id, applicationId))
      .execute();

    if (application.length === 0) {
      throw new Error(`Application with ID ${applicationId} not found`);
    }

    const documents = await db.select()
      .from(documentsTable)
      .where(eq(documentsTable.application_id, applicationId))
      .execute();

    return documents;
  } catch (error) {
    console.error('Failed to fetch documents by application:', error);
    throw error;
  }
};

export const getDocumentById = async (documentId: number): Promise<Document | null> => {
  try {
    const documents = await db.select()
      .from(documentsTable)
      .where(eq(documentsTable.id, documentId))
      .execute();

    return documents.length > 0 ? documents[0] : null;
  } catch (error) {
    console.error('Failed to fetch document by ID:', error);
    throw error;
  }
};

export const deleteDocument = async (documentId: number): Promise<boolean> => {
  try {
    // Check if document exists
    const document = await db.select()
      .from(documentsTable)
      .where(eq(documentsTable.id, documentId))
      .execute();

    if (document.length === 0) {
      throw new Error(`Document with ID ${documentId} not found`);
    }

    // Delete the document
    const result = await db.delete(documentsTable)
      .where(eq(documentsTable.id, documentId))
      .execute();

    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Document deletion failed:', error);
    throw error;
  }
};

export const getDocumentsByType = async (applicationId: number, documentType: DocumentType): Promise<Document[]> => {
  try {
    // Verify the application exists
    const application = await db.select()
      .from(applicationsTable)
      .where(eq(applicationsTable.id, applicationId))
      .execute();

    if (application.length === 0) {
      throw new Error(`Application with ID ${applicationId} not found`);
    }

    const documents = await db.select()
      .from(documentsTable)
      .where(and(
        eq(documentsTable.application_id, applicationId),
        eq(documentsTable.document_type, documentType)
      ))
      .execute();

    return documents;
  } catch (error) {
    console.error('Failed to fetch documents by type:', error);
    throw error;
  }
};

export const downloadDocument = async (documentId: number): Promise<{ document: Document; fileData: Buffer } | null> => {
  try {
    const document = await getDocumentById(documentId);
    
    if (!document) {
      return null;
    }

    // In a real implementation, you would read the file from the filesystem
    // using the stored_filename. For testing purposes, we'll return a mock buffer.
    // Example: const fileData = await fs.readFile(document.stored_filename);
    const fileData = Buffer.from(`Mock file content for ${document.original_filename}`);

    return {
      document,
      fileData
    };
  } catch (error) {
    console.error('Document download failed:', error);
    throw error;
  }
};
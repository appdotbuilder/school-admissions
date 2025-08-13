import { db } from '../db';
import { academicRecordsTable, applicationsTable } from '../db/schema';
import { type CreateAcademicRecordInput, type AcademicRecord } from '../schema';
import { eq } from 'drizzle-orm';

export const createAcademicRecord = async (input: CreateAcademicRecordInput): Promise<AcademicRecord> => {
  try {
    // Verify the application exists
    const application = await db.select()
      .from(applicationsTable)
      .where(eq(applicationsTable.id, input.application_id))
      .execute();

    if (application.length === 0) {
      throw new Error(`Application with ID ${input.application_id} not found`);
    }

    // Insert academic record
    const result = await db.insert(academicRecordsTable)
      .values({
        application_id: input.application_id,
        subject: input.subject,
        grade: input.grade,
        semester: input.semester,
        academic_year: input.academic_year
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Academic record creation failed:', error);
    throw error;
  }
};

export const getAcademicRecordsByApplication = async (applicationId: number): Promise<AcademicRecord[]> => {
  try {
    const records = await db.select()
      .from(academicRecordsTable)
      .where(eq(academicRecordsTable.application_id, applicationId))
      .execute();

    return records;
  } catch (error) {
    console.error('Failed to fetch academic records:', error);
    throw error;
  }
};

export const updateAcademicRecord = async (recordId: number, input: Partial<CreateAcademicRecordInput>): Promise<AcademicRecord> => {
  try {
    // Verify the record exists
    const existingRecord = await db.select()
      .from(academicRecordsTable)
      .where(eq(academicRecordsTable.id, recordId))
      .execute();

    if (existingRecord.length === 0) {
      throw new Error(`Academic record with ID ${recordId} not found`);
    }

    // If application_id is being updated, verify the new application exists
    if (input.application_id !== undefined) {
      const application = await db.select()
        .from(applicationsTable)
        .where(eq(applicationsTable.id, input.application_id))
        .execute();

      if (application.length === 0) {
        throw new Error(`Application with ID ${input.application_id} not found`);
      }
    }

    // Update the record
    const result = await db.update(academicRecordsTable)
      .set(input)
      .where(eq(academicRecordsTable.id, recordId))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Academic record update failed:', error);
    throw error;
  }
};

export const deleteAcademicRecord = async (recordId: number): Promise<boolean> => {
  try {
    // Verify the record exists
    const existingRecord = await db.select()
      .from(academicRecordsTable)
      .where(eq(academicRecordsTable.id, recordId))
      .execute();

    if (existingRecord.length === 0) {
      throw new Error(`Academic record with ID ${recordId} not found`);
    }

    // Delete the record
    await db.delete(academicRecordsTable)
      .where(eq(academicRecordsTable.id, recordId))
      .execute();

    return true;
  } catch (error) {
    console.error('Academic record deletion failed:', error);
    throw error;
  }
};

export const bulkCreateAcademicRecords = async (records: CreateAcademicRecordInput[]): Promise<AcademicRecord[]> => {
  try {
    if (records.length === 0) {
      return [];
    }

    // Verify all applications exist
    const applicationIds = [...new Set(records.map(r => r.application_id))];
    for (const appId of applicationIds) {
      const application = await db.select()
        .from(applicationsTable)
        .where(eq(applicationsTable.id, appId))
        .execute();

      if (application.length === 0) {
        throw new Error(`Application with ID ${appId} not found`);
      }
    }

    // Insert all records
    const result = await db.insert(academicRecordsTable)
      .values(records.map(record => ({
        application_id: record.application_id,
        subject: record.subject,
        grade: record.grade,
        semester: record.semester,
        academic_year: record.academic_year
      })))
      .returning()
      .execute();

    return result;
  } catch (error) {
    console.error('Bulk academic record creation failed:', error);
    throw error;
  }
};
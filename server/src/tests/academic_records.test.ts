import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, applicantProfilesTable, applicationsTable, academicRecordsTable } from '../db/schema';
import { type CreateAcademicRecordInput } from '../schema';
import {
  createAcademicRecord,
  getAcademicRecordsByApplication,
  updateAcademicRecord,
  deleteAcademicRecord,
  bulkCreateAcademicRecords
} from '../handlers/academic_records';
import { eq } from 'drizzle-orm';

// Test data
const testUser = {
  email: 'test@example.com',
  password_hash: 'hashedpassword123',
  full_name: 'Test User',
  role: 'APPLICANT' as const
};

const testProfile = {
  date_of_birth: new Date('2005-01-15'),
  address: '123 Test Street',
  phone_number: '+1234567890',
  parent_full_name: 'Parent Name',
  parent_phone_number: '+0987654321',
  parent_email: 'parent@example.com',
  school_level: 'JUNIOR_HIGH' as const
};

const testAcademicRecord: CreateAcademicRecordInput = {
  application_id: 1, // Will be set dynamically in tests
  subject: 'Mathematics',
  grade: 'A',
  semester: 'First Semester',
  academic_year: '2023-2024'
};

describe('Academic Records Handlers', () => {
  let userId: number;
  let profileId: number;
  let applicationId: number;

  beforeEach(async () => {
    await createDB();

    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    userId = userResult[0].id;

    // Create test applicant profile
    const profileResult = await db.insert(applicantProfilesTable)
      .values({
        ...testProfile,
        user_id: userId
      })
      .returning()
      .execute();
    profileId = profileResult[0].id;

    // Create test application
    const applicationResult = await db.insert(applicationsTable)
      .values({
        applicant_id: profileId,
        application_number: 'APP-2024-001'
      })
      .returning()
      .execute();
    applicationId = applicationResult[0].id;
  });

  afterEach(resetDB);

  describe('createAcademicRecord', () => {
    it('should create an academic record', async () => {
      const input = { ...testAcademicRecord, application_id: applicationId };
      const result = await createAcademicRecord(input);

      expect(result.id).toBeDefined();
      expect(result.application_id).toEqual(applicationId);
      expect(result.subject).toEqual('Mathematics');
      expect(result.grade).toEqual('A');
      expect(result.semester).toEqual('First Semester');
      expect(result.academic_year).toEqual('2023-2024');
      expect(result.created_at).toBeInstanceOf(Date);
    });

    it('should save academic record to database', async () => {
      const input = { ...testAcademicRecord, application_id: applicationId };
      const result = await createAcademicRecord(input);

      const records = await db.select()
        .from(academicRecordsTable)
        .where(eq(academicRecordsTable.id, result.id))
        .execute();

      expect(records).toHaveLength(1);
      expect(records[0].subject).toEqual('Mathematics');
      expect(records[0].grade).toEqual('A');
      expect(records[0].semester).toEqual('First Semester');
      expect(records[0].academic_year).toEqual('2023-2024');
    });

    it('should throw error when application does not exist', async () => {
      const input = { ...testAcademicRecord, application_id: 99999 };

      await expect(createAcademicRecord(input)).rejects.toThrow(/Application with ID 99999 not found/i);
    });
  });

  describe('getAcademicRecordsByApplication', () => {
    it('should return empty array when no records exist', async () => {
      const result = await getAcademicRecordsByApplication(applicationId);
      expect(result).toEqual([]);
    });

    it('should return academic records for an application', async () => {
      // Create test records
      const record1 = { ...testAcademicRecord, application_id: applicationId, subject: 'Mathematics' };
      const record2 = { ...testAcademicRecord, application_id: applicationId, subject: 'English', grade: 'B+' };

      await createAcademicRecord(record1);
      await createAcademicRecord(record2);

      const result = await getAcademicRecordsByApplication(applicationId);

      expect(result).toHaveLength(2);
      expect(result.some(r => r.subject === 'Mathematics' && r.grade === 'A')).toBe(true);
      expect(result.some(r => r.subject === 'English' && r.grade === 'B+')).toBe(true);
      result.forEach(record => {
        expect(record.application_id).toEqual(applicationId);
        expect(record.created_at).toBeInstanceOf(Date);
      });
    });

    it('should only return records for the specified application', async () => {
      // Create another application
      const otherApplicationResult = await db.insert(applicationsTable)
        .values({
          applicant_id: profileId,
          application_number: 'APP-2024-002'
        })
        .returning()
        .execute();
      const otherApplicationId = otherApplicationResult[0].id;

      // Create records for both applications
      await createAcademicRecord({ ...testAcademicRecord, application_id: applicationId });
      await createAcademicRecord({ ...testAcademicRecord, application_id: otherApplicationId, subject: 'Physics' });

      const result = await getAcademicRecordsByApplication(applicationId);

      expect(result).toHaveLength(1);
      expect(result[0].subject).toEqual('Mathematics');
      expect(result[0].application_id).toEqual(applicationId);
    });
  });

  describe('updateAcademicRecord', () => {
    it('should update an academic record', async () => {
      const input = { ...testAcademicRecord, application_id: applicationId };
      const created = await createAcademicRecord(input);

      const updateInput = {
        subject: 'Advanced Mathematics',
        grade: 'A+',
        semester: 'Second Semester'
      };

      const result = await updateAcademicRecord(created.id, updateInput);

      expect(result.id).toEqual(created.id);
      expect(result.subject).toEqual('Advanced Mathematics');
      expect(result.grade).toEqual('A+');
      expect(result.semester).toEqual('Second Semester');
      expect(result.academic_year).toEqual('2023-2024'); // Unchanged
    });

    it('should update record in database', async () => {
      const input = { ...testAcademicRecord, application_id: applicationId };
      const created = await createAcademicRecord(input);

      await updateAcademicRecord(created.id, { grade: 'A+' });

      const records = await db.select()
        .from(academicRecordsTable)
        .where(eq(academicRecordsTable.id, created.id))
        .execute();

      expect(records[0].grade).toEqual('A+');
    });

    it('should throw error when record does not exist', async () => {
      await expect(updateAcademicRecord(99999, { grade: 'A+' }))
        .rejects.toThrow(/Academic record with ID 99999 not found/i);
    });

    it('should throw error when updating to non-existent application', async () => {
      const input = { ...testAcademicRecord, application_id: applicationId };
      const created = await createAcademicRecord(input);

      await expect(updateAcademicRecord(created.id, { application_id: 99999 }))
        .rejects.toThrow(/Application with ID 99999 not found/i);
    });
  });

  describe('deleteAcademicRecord', () => {
    it('should delete an academic record', async () => {
      const input = { ...testAcademicRecord, application_id: applicationId };
      const created = await createAcademicRecord(input);

      const result = await deleteAcademicRecord(created.id);
      expect(result).toBe(true);

      // Verify record is deleted
      const records = await db.select()
        .from(academicRecordsTable)
        .where(eq(academicRecordsTable.id, created.id))
        .execute();

      expect(records).toHaveLength(0);
    });

    it('should throw error when record does not exist', async () => {
      await expect(deleteAcademicRecord(99999))
        .rejects.toThrow(/Academic record with ID 99999 not found/i);
    });
  });

  describe('bulkCreateAcademicRecords', () => {
    it('should create multiple academic records', async () => {
      const records: CreateAcademicRecordInput[] = [
        { ...testAcademicRecord, application_id: applicationId, subject: 'Mathematics', grade: 'A' },
        { ...testAcademicRecord, application_id: applicationId, subject: 'English', grade: 'B+' },
        { ...testAcademicRecord, application_id: applicationId, subject: 'Science', grade: 'A-' }
      ];

      const result = await bulkCreateAcademicRecords(records);

      expect(result).toHaveLength(3);
      result.forEach((record, index) => {
        expect(record.id).toBeDefined();
        expect(record.application_id).toEqual(applicationId);
        expect(record.subject).toEqual(records[index].subject);
        expect(record.grade).toEqual(records[index].grade);
        expect(record.created_at).toBeInstanceOf(Date);
      });
    });

    it('should save all records to database', async () => {
      const records: CreateAcademicRecordInput[] = [
        { ...testAcademicRecord, application_id: applicationId, subject: 'Mathematics' },
        { ...testAcademicRecord, application_id: applicationId, subject: 'English' }
      ];

      const result = await bulkCreateAcademicRecords(records);

      const dbRecords = await db.select()
        .from(academicRecordsTable)
        .where(eq(academicRecordsTable.application_id, applicationId))
        .execute();

      expect(dbRecords).toHaveLength(2);
      expect(dbRecords.some(r => r.subject === 'Mathematics')).toBe(true);
      expect(dbRecords.some(r => r.subject === 'English')).toBe(true);
    });

    it('should handle empty array', async () => {
      const result = await bulkCreateAcademicRecords([]);
      expect(result).toEqual([]);
    });

    it('should handle records for multiple applications', async () => {
      // Create second application
      const secondApplicationResult = await db.insert(applicationsTable)
        .values({
          applicant_id: profileId,
          application_number: 'APP-2024-002'
        })
        .returning()
        .execute();
      const secondApplicationId = secondApplicationResult[0].id;

      const records: CreateAcademicRecordInput[] = [
        { ...testAcademicRecord, application_id: applicationId, subject: 'Mathematics' },
        { ...testAcademicRecord, application_id: secondApplicationId, subject: 'Physics' }
      ];

      const result = await bulkCreateAcademicRecords(records);

      expect(result).toHaveLength(2);
      expect(result[0].application_id).toEqual(applicationId);
      expect(result[1].application_id).toEqual(secondApplicationId);
    });

    it('should throw error when any application does not exist', async () => {
      const records: CreateAcademicRecordInput[] = [
        { ...testAcademicRecord, application_id: applicationId, subject: 'Mathematics' },
        { ...testAcademicRecord, application_id: 99999, subject: 'Physics' }
      ];

      await expect(bulkCreateAcademicRecords(records))
        .rejects.toThrow(/Application with ID 99999 not found/i);
    });
  });
});
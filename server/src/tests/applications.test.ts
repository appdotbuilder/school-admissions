import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, applicantProfilesTable, applicationsTable } from '../db/schema';
import { type CreateApplicationInput, type GetApplicationsQuery } from '../schema';
import { 
  createApplication, 
  getApplicationsByApplicant, 
  getApplicationById, 
  getAllApplications, 
  submitApplication 
} from '../handlers/applications';
import { eq } from 'drizzle-orm';

describe('Applications Handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testApplicantId: number;

  beforeEach(async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        role: 'APPLICANT',
        full_name: 'Test User'
      })
      .returning()
      .execute();

    testUserId = userResult[0].id;

    // Create test applicant profile
    const applicantResult = await db.insert(applicantProfilesTable)
      .values({
        user_id: testUserId,
        date_of_birth: new Date('2000-01-01'),
        address: '123 Test Street',
        phone_number: '1234567890',
        parent_full_name: 'Test Parent',
        parent_phone_number: '0987654321',
        parent_email: 'parent@example.com',
        school_level: 'JUNIOR_HIGH'
      })
      .returning()
      .execute();

    testApplicantId = applicantResult[0].id;
  });

  describe('createApplication', () => {
    const testInput: CreateApplicationInput = {
      school_level: 'JUNIOR_HIGH'
    };

    it('should create an application successfully', async () => {
      const result = await createApplication(testApplicantId, testInput);

      expect(result.applicant_id).toBe(testApplicantId);
      expect(result.application_number).toMatch(/^APP-\d+-\d+$/);
      expect(result.status).toBe('INITIAL_REGISTRATION');
      expect(result.submitted_at).toBeNull();
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should save application to database', async () => {
      const result = await createApplication(testApplicantId, testInput);

      const applications = await db.select()
        .from(applicationsTable)
        .where(eq(applicationsTable.id, result.id))
        .execute();

      expect(applications).toHaveLength(1);
      expect(applications[0].applicant_id).toBe(testApplicantId);
      expect(applications[0].status).toBe('INITIAL_REGISTRATION');
      expect(applications[0].application_number).toBe(result.application_number);
    });

    it('should generate unique application numbers', async () => {
      const result1 = await createApplication(testApplicantId, testInput);
      const result2 = await createApplication(testApplicantId, testInput);

      expect(result1.application_number).not.toBe(result2.application_number);
    });

    it('should throw error for non-existent applicant', async () => {
      await expect(createApplication(99999, testInput)).rejects.toThrow(/Applicant not found/i);
    });
  });

  describe('getApplicationsByApplicant', () => {
    it('should return applications for specific applicant', async () => {
      // Create test applications
      const app1 = await createApplication(testApplicantId, { school_level: 'JUNIOR_HIGH' });
      const app2 = await createApplication(testApplicantId, { school_level: 'SENIOR_HIGH' });

      const results = await getApplicationsByApplicant(testApplicantId);

      expect(results).toHaveLength(2);
      expect(results.map(app => app.id)).toContain(app1.id);
      expect(results.map(app => app.id)).toContain(app2.id);
      expect(results[0].applicant_id).toBe(testApplicantId);
    });

    it('should return empty array for applicant with no applications', async () => {
      const results = await getApplicationsByApplicant(testApplicantId);
      expect(results).toHaveLength(0);
    });

    it('should return applications in descending order by creation date', async () => {
      const app1 = await createApplication(testApplicantId, { school_level: 'JUNIOR_HIGH' });
      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      const app2 = await createApplication(testApplicantId, { school_level: 'SENIOR_HIGH' });

      const results = await getApplicationsByApplicant(testApplicantId);

      expect(results).toHaveLength(2);
      expect(results[0].id).toBe(app2.id); // More recent first
      expect(results[1].id).toBe(app1.id);
    });
  });

  describe('getApplicationById', () => {
    it('should return application by ID', async () => {
      const created = await createApplication(testApplicantId, { school_level: 'JUNIOR_HIGH' });

      const result = await getApplicationById({ id: created.id });

      expect(result).not.toBeNull();
      expect(result!.id).toBe(created.id);
      expect(result!.applicant_id).toBe(testApplicantId);
      expect(result!.status).toBe('INITIAL_REGISTRATION');
    });

    it('should return null for non-existent application', async () => {
      const result = await getApplicationById({ id: 99999 });
      expect(result).toBeNull();
    });
  });

  describe('getAllApplications', () => {
    beforeEach(async () => {
      // Create additional test data
      const user2Result = await db.insert(usersTable)
        .values({
          email: 'test2@example.com',
          password_hash: 'hashed_password2',
          role: 'APPLICANT',
          full_name: 'Test User 2'
        })
        .returning()
        .execute();

      const applicant2Result = await db.insert(applicantProfilesTable)
        .values({
          user_id: user2Result[0].id,
          date_of_birth: new Date('2001-01-01'),
          address: '456 Test Avenue',
          phone_number: '2345678901',
          parent_full_name: 'Test Parent 2',
          parent_phone_number: '1098765432',
          parent_email: 'parent2@example.com',
          school_level: 'SENIOR_HIGH'
        })
        .returning()
        .execute();

      // Create test applications
      await createApplication(testApplicantId, { school_level: 'JUNIOR_HIGH' });
      await createApplication(applicant2Result[0].id, { school_level: 'SENIOR_HIGH' });
    });

    it('should return all applications with total count', async () => {
      const result = await getAllApplications();

      expect(result.applications).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.applications[0]).toHaveProperty('id');
      expect(result.applications[0]).toHaveProperty('status');
    });

    it('should filter by status', async () => {
      // Submit one application to change its status
      const app = await createApplication(testApplicantId, { school_level: 'JUNIOR_HIGH' });
      await submitApplication(app.id);

      const query: GetApplicationsQuery = {
        status: 'DOCUMENT_UPLOAD'
      };

      const result = await getAllApplications(query);

      expect(result.applications).toHaveLength(1);
      expect(result.applications[0].status).toBe('DOCUMENT_UPLOAD');
      expect(result.total).toBe(1);
    });

    it('should filter by school level', async () => {
      const query: GetApplicationsQuery = {
        school_level: 'JUNIOR_HIGH'
      };

      const result = await getAllApplications(query);

      expect(result.applications).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should handle pagination', async () => {
      const query: GetApplicationsQuery = {
        page: 1,
        limit: 1
      };

      const result = await getAllApplications(query);

      expect(result.applications).toHaveLength(1);
      expect(result.total).toBe(2);
    });

    it('should combine filters correctly', async () => {
      const query: GetApplicationsQuery = {
        status: 'INITIAL_REGISTRATION',
        school_level: 'JUNIOR_HIGH'
      };

      const result = await getAllApplications(query);

      expect(result.applications).toHaveLength(1);
      expect(result.applications[0].status).toBe('INITIAL_REGISTRATION');
      expect(result.total).toBe(1);
    });

    it('should return empty results for no matches', async () => {
      const query: GetApplicationsQuery = {
        status: 'ANNOUNCEMENT'
      };

      const result = await getAllApplications(query);

      expect(result.applications).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('submitApplication', () => {
    it('should update application status and submission timestamp', async () => {
      const created = await createApplication(testApplicantId, { school_level: 'JUNIOR_HIGH' });
      expect(created.status).toBe('INITIAL_REGISTRATION');
      expect(created.submitted_at).toBeNull();

      const result = await submitApplication(created.id);

      expect(result.id).toBe(created.id);
      expect(result.status).toBe('DOCUMENT_UPLOAD');
      expect(result.submitted_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should save status update to database', async () => {
      const created = await createApplication(testApplicantId, { school_level: 'JUNIOR_HIGH' });
      
      await submitApplication(created.id);

      const applications = await db.select()
        .from(applicationsTable)
        .where(eq(applicationsTable.id, created.id))
        .execute();

      expect(applications[0].status).toBe('DOCUMENT_UPLOAD');
      expect(applications[0].submitted_at).toBeInstanceOf(Date);
    });

    it('should throw error for non-existent application', async () => {
      await expect(submitApplication(99999)).rejects.toThrow(/Application not found/i);
    });
  });
});
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, applicantProfilesTable, applicationsTable, applicationStatusHistoryTable } from '../db/schema';
import { type UpdateApplicationStatusInput } from '../schema';
import { updateApplicationStatus, getApplicationStatusHistory, bulkUpdateApplicationStatus } from '../handlers/application_status';
import { eq, inArray } from 'drizzle-orm';

describe('Application Status Handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test data
  const createTestData = async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        role: 'APPLICANT',
        full_name: 'Test User'
      })
      .returning()
      .execute();

    // Create admin user
    const adminUsers = await db.insert(usersTable)
      .values({
        email: 'admin@example.com',
        password_hash: 'hashedpassword',
        role: 'ADMIN',
        full_name: 'Admin User'
      })
      .returning()
      .execute();

    // Create applicant profile
    const profiles = await db.insert(applicantProfilesTable)
      .values({
        user_id: users[0].id,
        date_of_birth: new Date('2000-01-01'),
        address: '123 Test Street',
        phone_number: '1234567890',
        parent_full_name: 'Parent Name',
        parent_phone_number: '0987654321',
        parent_email: 'parent@example.com',
        school_level: 'JUNIOR_HIGH'
      })
      .returning()
      .execute();

    // Create applications
    const applications = await db.insert(applicationsTable)
      .values([
        {
          applicant_id: profiles[0].id,
          application_number: 'APP-001',
          status: 'INITIAL_REGISTRATION'
        },
        {
          applicant_id: profiles[0].id,
          application_number: 'APP-002', 
          status: 'DOCUMENT_UPLOAD'
        }
      ])
      .returning()
      .execute();

    return {
      user: users[0],
      admin: adminUsers[0],
      profile: profiles[0],
      applications
    };
  };

  describe('updateApplicationStatus', () => {
    it('should update application status successfully', async () => {
      const testData = await createTestData();
      const application = testData.applications[0];

      const input: UpdateApplicationStatusInput = {
        application_id: application.id,
        new_status: 'DOCUMENT_UPLOAD',
        notes: 'Status updated by admin'
      };

      const result = await updateApplicationStatus(input, testData.admin.id);

      // Verify the updated application
      expect(result.id).toEqual(application.id);
      expect(result.status).toEqual('DOCUMENT_UPLOAD');
      expect(result.updated_at).toBeInstanceOf(Date);

      // Verify the application was updated in the database
      const updatedApp = await db
        .select()
        .from(applicationsTable)
        .where(eq(applicationsTable.id, application.id))
        .execute();

      expect(updatedApp[0].status).toEqual('DOCUMENT_UPLOAD');
    });

    it('should create status history record', async () => {
      const testData = await createTestData();
      const application = testData.applications[0];

      const input: UpdateApplicationStatusInput = {
        application_id: application.id,
        new_status: 'SELECTION',
        notes: 'Moving to selection phase'
      };

      await updateApplicationStatus(input, testData.admin.id);

      // Verify history record was created
      const history = await db
        .select()
        .from(applicationStatusHistoryTable)
        .where(eq(applicationStatusHistoryTable.application_id, application.id))
        .execute();

      expect(history).toHaveLength(1);
      expect(history[0].application_id).toEqual(application.id);
      expect(history[0].previous_status).toEqual('INITIAL_REGISTRATION');
      expect(history[0].new_status).toEqual('SELECTION');
      expect(history[0].changed_by_user_id).toEqual(testData.admin.id);
      expect(history[0].notes).toEqual('Moving to selection phase');
      expect(history[0].created_at).toBeInstanceOf(Date);
    });

    it('should handle status update without notes', async () => {
      const testData = await createTestData();
      const application = testData.applications[0];

      const input: UpdateApplicationStatusInput = {
        application_id: application.id,
        new_status: 'ANNOUNCEMENT'
      };

      const result = await updateApplicationStatus(input, testData.admin.id);

      expect(result.status).toEqual('ANNOUNCEMENT');

      // Verify history record has null notes
      const history = await db
        .select()
        .from(applicationStatusHistoryTable)
        .where(eq(applicationStatusHistoryTable.application_id, application.id))
        .execute();

      expect(history[0].notes).toBeNull();
    });

    it('should throw error for non-existent application', async () => {
      const testData = await createTestData();

      const input: UpdateApplicationStatusInput = {
        application_id: 99999,
        new_status: 'SELECTION'
      };

      await expect(updateApplicationStatus(input, testData.admin.id))
        .rejects.toThrow(/Application with ID 99999 not found/);
    });
  });

  describe('getApplicationStatusHistory', () => {
    it('should fetch application status history', async () => {
      const testData = await createTestData();
      const application = testData.applications[0];

      // Create some status history
      await db.insert(applicationStatusHistoryTable)
        .values([
          {
            application_id: application.id,
            previous_status: null,
            new_status: 'INITIAL_REGISTRATION',
            changed_by_user_id: testData.user.id,
            notes: 'Application created'
          },
          {
            application_id: application.id,
            previous_status: 'INITIAL_REGISTRATION',
            new_status: 'DOCUMENT_UPLOAD',
            changed_by_user_id: testData.admin.id,
            notes: 'Documents uploaded'
          }
        ])
        .execute();

      const history = await getApplicationStatusHistory(application.id);

      expect(history).toHaveLength(2);
      expect(history[0].previous_status).toBeNull();
      expect(history[0].new_status).toEqual('INITIAL_REGISTRATION');
      expect(history[1].previous_status).toEqual('INITIAL_REGISTRATION');
      expect(history[1].new_status).toEqual('DOCUMENT_UPLOAD');
    });

    it('should return empty array for application with no history', async () => {
      const testData = await createTestData();
      const application = testData.applications[0];

      const history = await getApplicationStatusHistory(application.id);

      expect(history).toHaveLength(0);
    });

    it('should return history in chronological order', async () => {
      const testData = await createTestData();
      const application = testData.applications[0];

      // Create history records with different timestamps
      const now = new Date();
      const earlier = new Date(now.getTime() - 60000); // 1 minute earlier

      await db.insert(applicationStatusHistoryTable)
        .values([
          {
            application_id: application.id,
            previous_status: 'INITIAL_REGISTRATION',
            new_status: 'DOCUMENT_UPLOAD',
            changed_by_user_id: testData.admin.id,
            notes: 'Later change',
            created_at: now
          },
          {
            application_id: application.id,
            previous_status: null,
            new_status: 'INITIAL_REGISTRATION',
            changed_by_user_id: testData.user.id,
            notes: 'Earlier change',
            created_at: earlier
          }
        ])
        .execute();

      const history = await getApplicationStatusHistory(application.id);

      expect(history).toHaveLength(2);
      // Should be ordered by created_at (earlier first)
      expect(history[0].notes).toEqual('Earlier change');
      expect(history[1].notes).toEqual('Later change');
    });
  });

  describe('bulkUpdateApplicationStatus', () => {
    it('should update multiple applications successfully', async () => {
      const testData = await createTestData();
      const applicationIds = testData.applications.map(app => app.id);

      const result = await bulkUpdateApplicationStatus(
        applicationIds,
        'SELECTION',
        testData.admin.id,
        'Bulk update to selection phase'
      );

      expect(result).toHaveLength(2);
      expect(result.every(app => app.status === 'SELECTION')).toBe(true);

      // Verify all applications were updated in database
      const updatedApps = await db
        .select()
        .from(applicationsTable)
        .where(inArray(applicationsTable.id, applicationIds))
        .execute();

      expect(updatedApps.every(app => app.status === 'SELECTION')).toBe(true);
    });

    it('should create history records for all applications', async () => {
      const testData = await createTestData();
      const applicationIds = testData.applications.map(app => app.id);

      await bulkUpdateApplicationStatus(
        applicationIds,
        'ANNOUNCEMENT',
        testData.admin.id,
        'Bulk announcement'
      );

      // Verify history records were created
      const history = await db
        .select()
        .from(applicationStatusHistoryTable)
        .where(inArray(applicationStatusHistoryTable.application_id, applicationIds))
        .execute();

      expect(history).toHaveLength(2);
      expect(history.every(h => h.new_status === 'ANNOUNCEMENT')).toBe(true);
      expect(history.every(h => h.changed_by_user_id === testData.admin.id)).toBe(true);
      expect(history.every(h => h.notes === 'Bulk announcement')).toBe(true);

      // Verify previous statuses are tracked correctly
      const app1History = history.find(h => h.application_id === testData.applications[0].id);
      const app2History = history.find(h => h.application_id === testData.applications[1].id);

      expect(app1History?.previous_status).toEqual('INITIAL_REGISTRATION');
      expect(app2History?.previous_status).toEqual('DOCUMENT_UPLOAD');
    });

    it('should handle bulk update without notes', async () => {
      const testData = await createTestData();
      const applicationIds = testData.applications.map(app => app.id);

      const result = await bulkUpdateApplicationStatus(
        applicationIds,
        'RE_REGISTRATION',
        testData.admin.id
      );

      expect(result.every(app => app.status === 'RE_REGISTRATION')).toBe(true);

      // Verify history records have null notes
      const history = await db
        .select()
        .from(applicationStatusHistoryTable)
        .where(inArray(applicationStatusHistoryTable.application_id, applicationIds))
        .execute();

      expect(history.every(h => h.notes === null)).toBe(true);
    });

    it('should throw error when some applications are not found', async () => {
      const testData = await createTestData();
      const applicationIds = [testData.applications[0].id, 99999];

      await expect(bulkUpdateApplicationStatus(
        applicationIds,
        'SELECTION',
        testData.admin.id
      )).rejects.toThrow(/Some applications were not found/);
    });

    it('should handle empty application IDs array', async () => {
      const testData = await createTestData();

      const result = await bulkUpdateApplicationStatus(
        [],
        'SELECTION',
        testData.admin.id
      );

      expect(result).toHaveLength(0);
    });
  });
});
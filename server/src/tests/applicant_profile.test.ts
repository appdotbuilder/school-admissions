import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, applicantProfilesTable } from '../db/schema';
import { type CreateApplicantProfileInput } from '../schema';
import { createApplicantProfile, getApplicantProfile, updateApplicantProfile } from '../handlers/applicant_profile';
import { eq } from 'drizzle-orm';

// Test user data
const testUser = {
  email: 'test@example.com',
  password_hash: 'hashed_password',
  role: 'APPLICANT' as const,
  full_name: 'Test User'
};

// Test applicant profile input
const testProfileInput: CreateApplicantProfileInput = {
  date_of_birth: new Date('2005-06-15'),
  address: '123 Test Street, Test City, Test State',
  phone_number: '+1234567890',
  parent_full_name: 'John Doe',
  parent_phone_number: '+1234567891',
  parent_email: 'parent@example.com',
  school_level: 'JUNIOR_HIGH'
};

describe('Applicant Profile Handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;

  beforeEach(async () => {
    // Create a test user for each test
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    testUserId = userResult[0].id;
  });

  describe('createApplicantProfile', () => {
    it('should create an applicant profile', async () => {
      const result = await createApplicantProfile(testUserId, testProfileInput);

      // Verify basic profile data
      expect(result.user_id).toEqual(testUserId);
      expect(result.date_of_birth).toEqual(testProfileInput.date_of_birth);
      expect(result.address).toEqual(testProfileInput.address);
      expect(result.phone_number).toEqual(testProfileInput.phone_number);
      expect(result.parent_full_name).toEqual(testProfileInput.parent_full_name);
      expect(result.parent_phone_number).toEqual(testProfileInput.parent_phone_number);
      expect(result.parent_email).toEqual(testProfileInput.parent_email);
      expect(result.school_level).toEqual(testProfileInput.school_level);
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should save applicant profile to database', async () => {
      const result = await createApplicantProfile(testUserId, testProfileInput);

      const profiles = await db.select()
        .from(applicantProfilesTable)
        .where(eq(applicantProfilesTable.id, result.id))
        .execute();

      expect(profiles).toHaveLength(1);
      expect(profiles[0].user_id).toEqual(testUserId);
      expect(profiles[0].address).toEqual(testProfileInput.address);
      expect(profiles[0].school_level).toEqual(testProfileInput.school_level);
      expect(profiles[0].created_at).toBeInstanceOf(Date);
    });

    it('should handle senior high school level', async () => {
      const seniorHighInput = {
        ...testProfileInput,
        school_level: 'SENIOR_HIGH' as const
      };

      const result = await createApplicantProfile(testUserId, seniorHighInput);

      expect(result.school_level).toEqual('SENIOR_HIGH');
    });

    it('should reject profile creation for non-existent user', async () => {
      const nonExistentUserId = 99999;

      await expect(
        createApplicantProfile(nonExistentUserId, testProfileInput)
      ).rejects.toThrow(/violates foreign key constraint/i);
    });
  });

  describe('getApplicantProfile', () => {
    it('should return applicant profile for existing user', async () => {
      // First create a profile
      await createApplicantProfile(testUserId, testProfileInput);

      const result = await getApplicantProfile(testUserId);

      expect(result).not.toBeNull();
      expect(result!.user_id).toEqual(testUserId);
      expect(result!.address).toEqual(testProfileInput.address);
      expect(result!.parent_full_name).toEqual(testProfileInput.parent_full_name);
      expect(result!.school_level).toEqual(testProfileInput.school_level);
    });

    it('should return null for non-existent profile', async () => {
      const result = await getApplicantProfile(testUserId);

      expect(result).toBeNull();
    });

    it('should return null for non-existent user', async () => {
      const nonExistentUserId = 99999;
      const result = await getApplicantProfile(nonExistentUserId);

      expect(result).toBeNull();
    });

    it('should handle date fields correctly', async () => {
      // Create profile with specific date
      const specificDate = new Date('2006-03-20');
      const profileWithDate = {
        ...testProfileInput,
        date_of_birth: specificDate
      };

      await createApplicantProfile(testUserId, profileWithDate);
      const result = await getApplicantProfile(testUserId);

      expect(result!.date_of_birth).toBeInstanceOf(Date);
      expect(result!.date_of_birth.getTime()).toEqual(specificDate.getTime());
    });
  });

  describe('updateApplicantProfile', () => {
    beforeEach(async () => {
      // Create initial profile for update tests
      await createApplicantProfile(testUserId, testProfileInput);
    });

    it('should update single field', async () => {
      const newAddress = '456 Updated Street, New City';
      
      const result = await updateApplicantProfile(testUserId, {
        address: newAddress
      });

      expect(result.address).toEqual(newAddress);
      expect(result.phone_number).toEqual(testProfileInput.phone_number); // Should remain unchanged
      expect(result.parent_full_name).toEqual(testProfileInput.parent_full_name); // Should remain unchanged
    });

    it('should update multiple fields', async () => {
      const updates = {
        address: '789 Multi Update Ave',
        phone_number: '+9876543210',
        parent_email: 'new_parent@example.com',
        school_level: 'SENIOR_HIGH' as const
      };

      const result = await updateApplicantProfile(testUserId, updates);

      expect(result.address).toEqual(updates.address);
      expect(result.phone_number).toEqual(updates.phone_number);
      expect(result.parent_email).toEqual(updates.parent_email);
      expect(result.school_level).toEqual(updates.school_level);
      expect(result.parent_full_name).toEqual(testProfileInput.parent_full_name); // Should remain unchanged
    });

    it('should update date of birth', async () => {
      const newDateOfBirth = new Date('2004-12-25');

      const result = await updateApplicantProfile(testUserId, {
        date_of_birth: newDateOfBirth
      });

      expect(result.date_of_birth.getTime()).toEqual(newDateOfBirth.getTime());
    });

    it('should update parent information', async () => {
      const parentUpdates = {
        parent_full_name: 'Jane Smith',
        parent_phone_number: '+5555555555',
        parent_email: 'jane.smith@example.com'
      };

      const result = await updateApplicantProfile(testUserId, parentUpdates);

      expect(result.parent_full_name).toEqual(parentUpdates.parent_full_name);
      expect(result.parent_phone_number).toEqual(parentUpdates.parent_phone_number);
      expect(result.parent_email).toEqual(parentUpdates.parent_email);
    });

    it('should update updated_at timestamp', async () => {
      const originalProfile = await getApplicantProfile(testUserId);
      
      // Wait a moment to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      const result = await updateApplicantProfile(testUserId, {
        address: 'New timestamp address'
      });

      expect(result.updated_at.getTime()).toBeGreaterThan(originalProfile!.updated_at.getTime());
    });

    it('should persist updates to database', async () => {
      const updates = {
        address: 'Persistent Update Street',
        school_level: 'SENIOR_HIGH' as const
      };

      await updateApplicantProfile(testUserId, updates);

      // Fetch directly from database to verify persistence
      const dbProfiles = await db.select()
        .from(applicantProfilesTable)
        .where(eq(applicantProfilesTable.user_id, testUserId))
        .execute();

      expect(dbProfiles).toHaveLength(1);
      expect(dbProfiles[0].address).toEqual(updates.address);
      expect(dbProfiles[0].school_level).toEqual(updates.school_level);
    });

    it('should handle empty update object', async () => {
      const originalProfile = await getApplicantProfile(testUserId);
      
      const result = await updateApplicantProfile(testUserId, {});

      // All original data should remain the same except updated_at
      expect(result.address).toEqual(originalProfile!.address);
      expect(result.phone_number).toEqual(originalProfile!.phone_number);
      expect(result.parent_full_name).toEqual(originalProfile!.parent_full_name);
      expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(originalProfile!.updated_at.getTime());
    });

    it('should reject update for non-existent profile', async () => {
      // Create a user without profile
      const newUserResult = await db.insert(usersTable)
        .values({
          email: 'noProfile@example.com',
          password_hash: 'hash',
          role: 'APPLICANT',
          full_name: 'No Profile User'
        })
        .returning()
        .execute();

      await expect(
        updateApplicantProfile(newUserResult[0].id, { address: 'Should fail' })
      ).rejects.toThrow(/not found for update/i);
    });
  });
});
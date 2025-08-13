import { db } from '../db';
import { applicantProfilesTable } from '../db/schema';
import { type CreateApplicantProfileInput, type ApplicantProfile } from '../schema';
import { eq } from 'drizzle-orm';

export const createApplicantProfile = async (userId: number, input: CreateApplicantProfileInput): Promise<ApplicantProfile> => {
  try {
    const result = await db.insert(applicantProfilesTable)
      .values({
        user_id: userId,
        date_of_birth: input.date_of_birth,
        address: input.address,
        phone_number: input.phone_number,
        parent_full_name: input.parent_full_name,
        parent_phone_number: input.parent_phone_number,
        parent_email: input.parent_email,
        school_level: input.school_level
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Applicant profile creation failed:', error);
    throw error;
  }
};

export const getApplicantProfile = async (userId: number): Promise<ApplicantProfile | null> => {
  try {
    const profiles = await db.select()
      .from(applicantProfilesTable)
      .where(eq(applicantProfilesTable.user_id, userId))
      .execute();

    return profiles.length > 0 ? profiles[0] : null;
  } catch (error) {
    console.error('Applicant profile fetch failed:', error);
    throw error;
  }
};

export const updateApplicantProfile = async (userId: number, input: Partial<CreateApplicantProfileInput>): Promise<ApplicantProfile> => {
  try {
    // Create update object with only defined fields
    const updateData: Partial<typeof applicantProfilesTable.$inferInsert> = {
      updated_at: new Date()
    };

    if (input.date_of_birth !== undefined) {
      updateData.date_of_birth = input.date_of_birth;
    }
    if (input.address !== undefined) {
      updateData.address = input.address;
    }
    if (input.phone_number !== undefined) {
      updateData.phone_number = input.phone_number;
    }
    if (input.parent_full_name !== undefined) {
      updateData.parent_full_name = input.parent_full_name;
    }
    if (input.parent_phone_number !== undefined) {
      updateData.parent_phone_number = input.parent_phone_number;
    }
    if (input.parent_email !== undefined) {
      updateData.parent_email = input.parent_email;
    }
    if (input.school_level !== undefined) {
      updateData.school_level = input.school_level;
    }

    const result = await db.update(applicantProfilesTable)
      .set(updateData)
      .where(eq(applicantProfilesTable.user_id, userId))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error('Applicant profile not found for update');
    }

    return result[0];
  } catch (error) {
    console.error('Applicant profile update failed:', error);
    throw error;
  }
};
import { db } from '../db';
import { applicationsTable, applicantProfilesTable, usersTable } from '../db/schema';
import { type CreateApplicationInput, type Application, type GetApplicationsQuery, type GetApplicationByIdInput } from '../schema';
import { eq, and, desc, count, SQL } from 'drizzle-orm';

export const createApplication = async (applicantId: number, input: CreateApplicationInput): Promise<Application> => {
  try {
    // Verify applicant exists
    const applicant = await db.select()
      .from(applicantProfilesTable)
      .where(eq(applicantProfilesTable.id, applicantId))
      .execute();

    if (!applicant.length) {
      throw new Error('Applicant not found');
    }

    // Generate unique application number
    const timestamp = Date.now();
    const applicationNumber = `APP-${applicantId}-${timestamp}`;

    // Insert application
    const result = await db.insert(applicationsTable)
      .values({
        applicant_id: applicantId,
        application_number: applicationNumber,
        status: 'INITIAL_REGISTRATION',
        submitted_at: null
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Application creation failed:', error);
    throw error;
  }
};

export const getApplicationsByApplicant = async (applicantId: number): Promise<Application[]> => {
  try {
    const applications = await db.select()
      .from(applicationsTable)
      .where(eq(applicationsTable.applicant_id, applicantId))
      .orderBy(desc(applicationsTable.created_at))
      .execute();

    return applications;
  } catch (error) {
    console.error('Failed to fetch applications by applicant:', error);
    throw error;
  }
};

export const getApplicationById = async (input: GetApplicationByIdInput): Promise<Application | null> => {
  try {
    const applications = await db.select()
      .from(applicationsTable)
      .where(eq(applicationsTable.id, input.id))
      .execute();

    return applications.length > 0 ? applications[0] : null;
  } catch (error) {
    console.error('Failed to fetch application by ID:', error);
    throw error;
  }
};

export const getAllApplications = async (query: GetApplicationsQuery = {}): Promise<{ applications: Application[]; total: number }> => {
  try {
    // Set defaults for pagination
    const page = query.page || 1;
    const limit = query.limit || 10;
    const offset = (page - 1) * limit;

    // Build conditions array
    const conditions: SQL<unknown>[] = [];

    if (query.status) {
      conditions.push(eq(applicationsTable.status, query.status));
    }

    // Handle two different query paths based on school_level filter
    let applications: Application[];
    let total: number;

    if (query.school_level) {
      // Query with join for school level filtering
      conditions.push(eq(applicantProfilesTable.school_level, query.school_level));

      const joinedQuery = db.select({
        id: applicationsTable.id,
        applicant_id: applicationsTable.applicant_id,
        application_number: applicationsTable.application_number,
        status: applicationsTable.status,
        submitted_at: applicationsTable.submitted_at,
        created_at: applicationsTable.created_at,
        updated_at: applicationsTable.updated_at
      })
      .from(applicationsTable)
      .innerJoin(
        applicantProfilesTable,
        eq(applicationsTable.applicant_id, applicantProfilesTable.id)
      );

      const finalQuery = conditions.length > 0
        ? joinedQuery.where(and(...conditions))
        : joinedQuery;

      const results = await finalQuery
        .orderBy(desc(applicationsTable.created_at))
        .limit(limit)
        .offset(offset)
        .execute();

      applications = results;

      // Get count with same join and conditions
      const countQuery = db.select({ count: count() })
        .from(applicationsTable)
        .innerJoin(
          applicantProfilesTable,
          eq(applicationsTable.applicant_id, applicantProfilesTable.id)
        );

      const finalCountQuery = conditions.length > 0
        ? countQuery.where(and(...conditions))
        : countQuery;

      const totalResult = await finalCountQuery.execute();
      total = totalResult[0].count;
    } else {
      // Simple query without join
      const simpleQuery = db.select()
        .from(applicationsTable);

      const finalQuery = conditions.length > 0
        ? simpleQuery.where(and(...conditions))
        : simpleQuery;

      const results = await finalQuery
        .orderBy(desc(applicationsTable.created_at))
        .limit(limit)
        .offset(offset)
        .execute();

      applications = results;

      // Get count without join
      const countQuery = db.select({ count: count() })
        .from(applicationsTable);

      const finalCountQuery = conditions.length > 0
        ? countQuery.where(and(...conditions))
        : countQuery;

      const totalResult = await finalCountQuery.execute();
      total = totalResult[0].count;
    }

    return { applications, total };
  } catch (error) {
    console.error('Failed to fetch all applications:', error);
    throw error;
  }
};

export const submitApplication = async (applicationId: number): Promise<Application> => {
  try {
    // Verify application exists
    const existingApplication = await db.select()
      .from(applicationsTable)
      .where(eq(applicationsTable.id, applicationId))
      .execute();

    if (!existingApplication.length) {
      throw new Error('Application not found');
    }

    // Update application status and submission timestamp
    const result = await db.update(applicationsTable)
      .set({
        status: 'DOCUMENT_UPLOAD',
        submitted_at: new Date(),
        updated_at: new Date()
      })
      .where(eq(applicationsTable.id, applicationId))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Application submission failed:', error);
    throw error;
  }
};
import { db } from '../db';
import { applicationsTable, applicationStatusHistoryTable } from '../db/schema';
import { type UpdateApplicationStatusInput, type Application, type ApplicationStatusHistory, type ApplicationStatus, applicationStatusSchema } from '../schema';
import { eq, inArray } from 'drizzle-orm';

export const updateApplicationStatus = async (input: UpdateApplicationStatusInput, changedByUserId: number): Promise<Application> => {
  try {
    // Get the current application to track the previous status
    const currentApplication = await db
      .select()
      .from(applicationsTable)
      .where(eq(applicationsTable.id, input.application_id))
      .execute();

    if (currentApplication.length === 0) {
      throw new Error(`Application with ID ${input.application_id} not found`);
    }

    const previousStatus = currentApplication[0].status;

    // Update the application status
    const updatedApplications = await db
      .update(applicationsTable)
      .set({ 
        status: input.new_status,
        updated_at: new Date()
      })
      .where(eq(applicationsTable.id, input.application_id))
      .returning()
      .execute();

    // Create status history record
    await db
      .insert(applicationStatusHistoryTable)
      .values({
        application_id: input.application_id,
        previous_status: previousStatus,
        new_status: input.new_status,
        changed_by_user_id: changedByUserId,
        notes: input.notes || null
      })
      .execute();

    return updatedApplications[0];
  } catch (error) {
    console.error('Application status update failed:', error);
    throw error;
  }
};

export const getApplicationStatusHistory = async (applicationId: number): Promise<ApplicationStatusHistory[]> => {
  try {
    const history = await db
      .select()
      .from(applicationStatusHistoryTable)
      .where(eq(applicationStatusHistoryTable.application_id, applicationId))
      .orderBy(applicationStatusHistoryTable.created_at)
      .execute();

    return history;
  } catch (error) {
    console.error('Failed to fetch application status history:', error);
    throw error;
  }
};

export const bulkUpdateApplicationStatus = async (
  applicationIds: number[], 
  newStatus: ApplicationStatus | string, 
  changedByUserId: number, 
  notes?: string
): Promise<Application[]> => {
  try {
    // Handle empty array case
    if (applicationIds.length === 0) {
      return [];
    }

    // Validate and cast status to proper type
    const validatedStatus = applicationStatusSchema.parse(newStatus);

    // Get current applications to track previous statuses
    const currentApplications = await db
      .select()
      .from(applicationsTable)
      .where(inArray(applicationsTable.id, applicationIds))
      .execute();

    if (currentApplications.length !== applicationIds.length) {
      throw new Error(`Some applications were not found. Expected ${applicationIds.length}, found ${currentApplications.length}`);
    }

    // Update all applications
    const updatedApplications = await db
      .update(applicationsTable)
      .set({ 
        status: validatedStatus,
        updated_at: new Date()
      })
      .where(inArray(applicationsTable.id, applicationIds))
      .returning()
      .execute();

    // Create status history records for each application
    const historyRecords = currentApplications.map(app => ({
      application_id: app.id,
      previous_status: app.status,
      new_status: validatedStatus,
      changed_by_user_id: changedByUserId,
      notes: notes || null
    }));

    await db
      .insert(applicationStatusHistoryTable)
      .values(historyRecords)
      .execute();

    return updatedApplications;
  } catch (error) {
    console.error('Bulk application status update failed:', error);
    throw error;
  }
};
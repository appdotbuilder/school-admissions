import { db } from '../db';
import { usersTable, applicantProfilesTable, applicationsTable } from '../db/schema';
import { type Application, type ApplicantProfile, type User, type GetApplicationsQuery } from '../schema';
import { eq, count, sql, desc, or, and, gte, lte } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

export const getAdminDashboardStats = async (): Promise<{
    totalApplications: number;
    applicationsByStatus: Record<string, number>;
    applicationsBySchoolLevel: Record<string, number>;
    recentApplications: Application[];
}> => {
    try {
        // Get total applications count
        const totalResult = await db.select({ count: count() })
            .from(applicationsTable)
            .execute();
        
        const totalApplications = totalResult[0].count;

        // Get applications count by status
        const statusCountsResult = await db.select({
            status: applicationsTable.status,
            count: count()
        })
        .from(applicationsTable)
        .groupBy(applicationsTable.status)
        .execute();

        const applicationsByStatus: Record<string, number> = {};
        statusCountsResult.forEach(row => {
            applicationsByStatus[row.status] = row.count;
        });

        // Get applications count by school level (via applicant profile)
        const schoolLevelCountsResult = await db.select({
            school_level: applicantProfilesTable.school_level,
            count: count()
        })
        .from(applicationsTable)
        .innerJoin(applicantProfilesTable, eq(applicationsTable.applicant_id, applicantProfilesTable.id))
        .groupBy(applicantProfilesTable.school_level)
        .execute();

        const applicationsBySchoolLevel: Record<string, number> = {};
        schoolLevelCountsResult.forEach(row => {
            applicationsBySchoolLevel[row.school_level] = row.count;
        });

        // Get recent applications (last 10)
        const recentApplicationsResult = await db.select()
            .from(applicationsTable)
            .orderBy(desc(applicationsTable.created_at))
            .limit(10)
            .execute();

        const recentApplications: Application[] = recentApplicationsResult;

        return {
            totalApplications,
            applicationsByStatus,
            applicationsBySchoolLevel,
            recentApplications
        };
    } catch (error) {
        console.error('Admin dashboard stats fetch failed:', error);
        throw error;
    }
};

export const getApplicationsWithApplicantInfo = async (query: GetApplicationsQuery = {}): Promise<{
    applications: (Application & { applicant: ApplicantProfile & { user: User } })[];
    total: number;
}> => {
    try {
        const { status, school_level, page = 1, limit = 20 } = query;
        const offset = (page - 1) * limit;

        // Build base query with joins
        let baseQuery = db.select()
            .from(applicationsTable)
            .innerJoin(applicantProfilesTable, eq(applicationsTable.applicant_id, applicantProfilesTable.id))
            .innerJoin(usersTable, eq(applicantProfilesTable.user_id, usersTable.id));

        // Build conditions array
        const conditions: SQL<unknown>[] = [];

        if (status) {
            conditions.push(eq(applicationsTable.status, status));
        }

        if (school_level) {
            conditions.push(eq(applicantProfilesTable.school_level, school_level));
        }

        // Apply where clause if we have conditions
        let query_with_filters = conditions.length > 0
            ? baseQuery.where(and(...conditions))
            : baseQuery;

        // Apply ordering and pagination
        const applicationsResult = await query_with_filters
            .orderBy(desc(applicationsTable.created_at))
            .limit(limit)
            .offset(offset)
            .execute();

        // Get total count for pagination
        let countQuery = db.select({ count: count() })
            .from(applicationsTable)
            .innerJoin(applicantProfilesTable, eq(applicationsTable.applicant_id, applicantProfilesTable.id));

        const totalResult = conditions.length > 0
            ? await countQuery.where(and(...conditions)).execute()
            : await countQuery.execute();
        const total = totalResult[0].count;

        // Transform the joined results
        const applications = applicationsResult.map(result => ({
            id: result.applications.id,
            applicant_id: result.applications.applicant_id,
            application_number: result.applications.application_number,
            status: result.applications.status,
            submitted_at: result.applications.submitted_at,
            created_at: result.applications.created_at,
            updated_at: result.applications.updated_at,
            applicant: {
                id: result.applicant_profiles.id,
                user_id: result.applicant_profiles.user_id,
                date_of_birth: result.applicant_profiles.date_of_birth,
                address: result.applicant_profiles.address,
                phone_number: result.applicant_profiles.phone_number,
                parent_full_name: result.applicant_profiles.parent_full_name,
                parent_phone_number: result.applicant_profiles.parent_phone_number,
                parent_email: result.applicant_profiles.parent_email,
                school_level: result.applicant_profiles.school_level,
                created_at: result.applicant_profiles.created_at,
                updated_at: result.applicant_profiles.updated_at,
                user: {
                    id: result.users.id,
                    email: result.users.email,
                    password_hash: result.users.password_hash,
                    role: result.users.role,
                    full_name: result.users.full_name,
                    created_at: result.users.created_at,
                    updated_at: result.users.updated_at
                }
            }
        }));

        return {
            applications,
            total
        };
    } catch (error) {
        console.error('Applications with applicant info fetch failed:', error);
        throw error;
    }
};

export const exportApplicationsReport = async (query: GetApplicationsQuery = {}): Promise<{
    filename: string;
    data: Buffer;
    mimeType: string;
}> => {
    try {
        // Fetch all applications matching the query without pagination
        const { applications } = await getApplicationsWithApplicantInfo({
            ...query,
            page: 1,
            limit: 1000 // Large limit to get all records
        });

        // Generate CSV content
        const headers = [
            'Application Number',
            'Student Name', 
            'Email',
            'Status',
            'School Level',
            'Date of Birth',
            'Address',
            'Phone Number',
            'Parent Name',
            'Parent Phone',
            'Parent Email',
            'Submitted Date',
            'Created Date'
        ];

        const csvRows = [headers.join(',')];

        applications.forEach(app => {
            const row = [
                `"${app.application_number}"`,
                `"${app.applicant.user.full_name}"`,
                `"${app.applicant.user.email}"`,
                `"${app.status}"`,
                `"${app.applicant.school_level}"`,
                `"${app.applicant.date_of_birth.toISOString().split('T')[0]}"`,
                `"${app.applicant.address}"`,
                `"${app.applicant.phone_number}"`,
                `"${app.applicant.parent_full_name}"`,
                `"${app.applicant.parent_phone_number}"`,
                `"${app.applicant.parent_email}"`,
                `"${app.submitted_at ? app.submitted_at.toISOString().split('T')[0] : 'Not Submitted'}"`,
                `"${app.created_at.toISOString().split('T')[0]}"`
            ];
            csvRows.push(row.join(','));
        });

        const csvContent = csvRows.join('\n');
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `applications_report_${timestamp}.csv`;

        return {
            filename,
            data: Buffer.from(csvContent, 'utf-8'),
            mimeType: 'text/csv'
        };
    } catch (error) {
        console.error('Applications report export failed:', error);
        throw error;
    }
};

export const getAdminUsers = async (): Promise<User[]> => {
    try {
        const adminUsers = await db.select()
            .from(usersTable)
            .where(or(eq(usersTable.role, 'ADMIN'), eq(usersTable.role, 'ADMISSION_COMMITTEE')))
            .orderBy(desc(usersTable.created_at))
            .execute();

        return adminUsers;
    } catch (error) {
        console.error('Admin users fetch failed:', error);
        throw error;
    }
};

export const createAdminUser = async (userData: { 
    email: string; 
    full_name: string; 
    role: 'ADMIN' | 'ADMISSION_COMMITTEE';
    password?: string;
}): Promise<User> => {
    try {
        // Generate a default password if none provided
        const defaultPassword = userData.password || `temp_${Math.random().toString(36).slice(2, 10)}`;
        
        // Simple password hashing (in production, use bcrypt or similar)
        const password_hash = `hash_${defaultPassword}`;

        const result = await db.insert(usersTable)
            .values({
                email: userData.email,
                password_hash,
                role: userData.role,
                full_name: userData.full_name
            })
            .returning()
            .execute();

        return result[0];
    } catch (error) {
        console.error('Admin user creation failed:', error);
        throw error;
    }
};
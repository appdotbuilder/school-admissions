import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, applicantProfilesTable, applicationsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { 
    getAdminDashboardStats, 
    getApplicationsWithApplicantInfo, 
    exportApplicationsReport,
    getAdminUsers,
    createAdminUser
} from '../handlers/admin';
import type { GetApplicationsQuery } from '../schema';

// Test data
const testUser = {
    email: 'student@example.com',
    password_hash: 'hashed_password',
    role: 'APPLICANT' as const,
    full_name: 'John Doe'
};

const testApplicantProfile = {
    user_id: 0, // Will be set after user creation
    date_of_birth: new Date('2005-06-15'),
    address: '123 Main St, City, State',
    phone_number: '+1234567890',
    parent_full_name: 'John Doe Sr.',
    parent_phone_number: '+1234567891',
    parent_email: 'parent@example.com',
    school_level: 'JUNIOR_HIGH' as const
};

const testApplication = {
    applicant_id: 0, // Will be set after profile creation
    application_number: 'APP-2024-001',
    status: 'INITIAL_REGISTRATION' as const
};

const testAdminUser = {
    email: 'admin@school.edu',
    password_hash: 'admin_hash',
    role: 'ADMIN' as const,
    full_name: 'School Administrator'
};

describe('Admin Handlers', () => {
    beforeEach(createDB);
    afterEach(resetDB);

    describe('getAdminDashboardStats', () => {
        it('should return dashboard statistics with empty data', async () => {
            const stats = await getAdminDashboardStats();

            expect(stats.totalApplications).toEqual(0);
            expect(stats.applicationsByStatus).toEqual({});
            expect(stats.applicationsBySchoolLevel).toEqual({});
            expect(stats.recentApplications).toHaveLength(0);
        });

        it('should return dashboard statistics with application data', async () => {
            // Create test user and profile
            const userResult = await db.insert(usersTable)
                .values(testUser)
                .returning()
                .execute();
            
            const profileResult = await db.insert(applicantProfilesTable)
                .values({ ...testApplicantProfile, user_id: userResult[0].id })
                .returning()
                .execute();

            // Create multiple applications with different statuses
            await db.insert(applicationsTable).values([
                { ...testApplication, applicant_id: profileResult[0].id, status: 'INITIAL_REGISTRATION' },
                { ...testApplication, applicant_id: profileResult[0].id, status: 'DOCUMENT_UPLOAD', application_number: 'APP-2024-002' },
                { ...testApplication, applicant_id: profileResult[0].id, status: 'SELECTION', application_number: 'APP-2024-003' }
            ]).execute();

            const stats = await getAdminDashboardStats();

            expect(stats.totalApplications).toEqual(3);
            expect(stats.applicationsByStatus['INITIAL_REGISTRATION']).toEqual(1);
            expect(stats.applicationsByStatus['DOCUMENT_UPLOAD']).toEqual(1);
            expect(stats.applicationsByStatus['SELECTION']).toEqual(1);
            expect(stats.applicationsBySchoolLevel['JUNIOR_HIGH']).toEqual(3);
            expect(stats.recentApplications).toHaveLength(3);
        });

        it('should handle multiple school levels correctly', async () => {
            // Create users and profiles for different school levels
            const user1 = await db.insert(usersTable)
                .values(testUser)
                .returning()
                .execute();
            
            const user2 = await db.insert(usersTable)
                .values({ ...testUser, email: 'student2@example.com' })
                .returning()
                .execute();

            const profile1 = await db.insert(applicantProfilesTable)
                .values({ ...testApplicantProfile, user_id: user1[0].id, school_level: 'JUNIOR_HIGH' })
                .returning()
                .execute();

            const profile2 = await db.insert(applicantProfilesTable)
                .values({ ...testApplicantProfile, user_id: user2[0].id, school_level: 'SENIOR_HIGH' })
                .returning()
                .execute();

            // Create applications
            await db.insert(applicationsTable).values([
                { ...testApplication, applicant_id: profile1[0].id },
                { ...testApplication, applicant_id: profile2[0].id, application_number: 'APP-2024-002' }
            ]).execute();

            const stats = await getAdminDashboardStats();

            expect(stats.totalApplications).toEqual(2);
            expect(stats.applicationsBySchoolLevel['JUNIOR_HIGH']).toEqual(1);
            expect(stats.applicationsBySchoolLevel['SENIOR_HIGH']).toEqual(1);
        });
    });

    describe('getApplicationsWithApplicantInfo', () => {
        let userId: number;
        let profileId: number;
        let applicationId: number;

        beforeEach(async () => {
            // Create test data for each test
            const userResult = await db.insert(usersTable)
                .values(testUser)
                .returning()
                .execute();
            userId = userResult[0].id;

            const profileResult = await db.insert(applicantProfilesTable)
                .values({ ...testApplicantProfile, user_id: userId })
                .returning()
                .execute();
            profileId = profileResult[0].id;

            const applicationResult = await db.insert(applicationsTable)
                .values({ ...testApplication, applicant_id: profileId })
                .returning()
                .execute();
            applicationId = applicationResult[0].id;
        });

        it('should fetch applications with applicant info', async () => {
            const result = await getApplicationsWithApplicantInfo();

            expect(result.total).toEqual(1);
            expect(result.applications).toHaveLength(1);

            const application = result.applications[0];
            expect(application.id).toEqual(applicationId);
            expect(application.application_number).toEqual('APP-2024-001');
            expect(application.status).toEqual('INITIAL_REGISTRATION');
            
            // Check applicant info
            expect(application.applicant.id).toEqual(profileId);
            expect(application.applicant.address).toEqual('123 Main St, City, State');
            expect(application.applicant.school_level).toEqual('JUNIOR_HIGH');
            
            // Check user info
            expect(application.applicant.user.id).toEqual(userId);
            expect(application.applicant.user.email).toEqual('student@example.com');
            expect(application.applicant.user.full_name).toEqual('John Doe');
            expect(application.applicant.user.role).toEqual('APPLICANT');
        });

        it('should filter applications by status', async () => {
            const query: GetApplicationsQuery = { status: 'DOCUMENT_UPLOAD' };
            const result = await getApplicationsWithApplicantInfo(query);

            expect(result.total).toEqual(0);
            expect(result.applications).toHaveLength(0);

            // Test with matching status
            const matchingQuery: GetApplicationsQuery = { status: 'INITIAL_REGISTRATION' };
            const matchingResult = await getApplicationsWithApplicantInfo(matchingQuery);

            expect(matchingResult.total).toEqual(1);
            expect(matchingResult.applications[0].status).toEqual('INITIAL_REGISTRATION');
        });

        it('should filter applications by school level', async () => {
            const query: GetApplicationsQuery = { school_level: 'SENIOR_HIGH' };
            const result = await getApplicationsWithApplicantInfo(query);

            expect(result.total).toEqual(0);
            expect(result.applications).toHaveLength(0);

            // Test with matching school level
            const matchingQuery: GetApplicationsQuery = { school_level: 'JUNIOR_HIGH' };
            const matchingResult = await getApplicationsWithApplicantInfo(matchingQuery);

            expect(matchingResult.total).toEqual(1);
            expect(matchingResult.applications[0].applicant.school_level).toEqual('JUNIOR_HIGH');
        });

        it('should handle pagination correctly', async () => {
            // Create additional test data
            const user2 = await db.insert(usersTable)
                .values({ ...testUser, email: 'student2@example.com' })
                .returning()
                .execute();
            
            const profile2 = await db.insert(applicantProfilesTable)
                .values({ ...testApplicantProfile, user_id: user2[0].id })
                .returning()
                .execute();

            await db.insert(applicationsTable)
                .values({ ...testApplication, applicant_id: profile2[0].id, application_number: 'APP-2024-002' })
                .execute();

            // Test pagination
            const page1 = await getApplicationsWithApplicantInfo({ page: 1, limit: 1 });
            expect(page1.total).toEqual(2);
            expect(page1.applications).toHaveLength(1);

            const page2 = await getApplicationsWithApplicantInfo({ page: 2, limit: 1 });
            expect(page2.total).toEqual(2);
            expect(page2.applications).toHaveLength(1);
            
            // Ensure different records on different pages
            expect(page1.applications[0].id).not.toEqual(page2.applications[0].id);
        });

        it('should combine multiple filters correctly', async () => {
            const query: GetApplicationsQuery = { 
                status: 'INITIAL_REGISTRATION',
                school_level: 'JUNIOR_HIGH'
            };
            const result = await getApplicationsWithApplicantInfo(query);

            expect(result.total).toEqual(1);
            expect(result.applications[0].status).toEqual('INITIAL_REGISTRATION');
            expect(result.applications[0].applicant.school_level).toEqual('JUNIOR_HIGH');
        });
    });

    describe('exportApplicationsReport', () => {
        beforeEach(async () => {
            // Create test data
            const userResult = await db.insert(usersTable)
                .values(testUser)
                .returning()
                .execute();

            const profileResult = await db.insert(applicantProfilesTable)
                .values({ ...testApplicantProfile, user_id: userResult[0].id })
                .returning()
                .execute();

            await db.insert(applicationsTable)
                .values({ ...testApplication, applicant_id: profileResult[0].id })
                .execute();
        });

        it('should generate CSV export', async () => {
            const report = await exportApplicationsReport();

            expect(report.mimeType).toEqual('text/csv');
            expect(report.filename).toMatch(/applications_report_\d{4}-\d{2}-\d{2}\.csv/);
            expect(report.data).toBeInstanceOf(Buffer);

            const csvContent = report.data.toString('utf-8');
            expect(csvContent).toContain('Application Number');
            expect(csvContent).toContain('Student Name');
            expect(csvContent).toContain('APP-2024-001');
            expect(csvContent).toContain('John Doe');
            expect(csvContent).toContain('INITIAL_REGISTRATION');
            expect(csvContent).toContain('JUNIOR_HIGH');
        });

        it('should filter export data based on query', async () => {
            const report = await exportApplicationsReport({ status: 'DOCUMENT_UPLOAD' });

            const csvContent = report.data.toString('utf-8');
            // Should only contain headers since no applications match the filter
            const lines = csvContent.split('\n').filter(line => line.trim() !== '');
            expect(lines).toHaveLength(1); // Only header row
            expect(lines[0]).toContain('Application Number');
        });
    });

    describe('getAdminUsers', () => {
        it('should return empty list when no admin users exist', async () => {
            const adminUsers = await getAdminUsers();
            expect(adminUsers).toHaveLength(0);
        });

        it('should fetch admin and admission committee users only', async () => {
            // Create users with different roles
            await db.insert(usersTable).values([
                testUser, // APPLICANT - should not be returned
                testAdminUser, // ADMIN - should be returned
                { ...testUser, email: 'committee@school.edu', role: 'ADMISSION_COMMITTEE', full_name: 'Committee Member' }
            ]).execute();

            const adminUsers = await getAdminUsers();

            expect(adminUsers).toHaveLength(2);
            
            const roles = adminUsers.map(user => user.role);
            expect(roles).toContain('ADMIN');
            expect(roles).toContain('ADMISSION_COMMITTEE');
            expect(roles).not.toContain('APPLICANT');

            // Check specific admin user
            const admin = adminUsers.find(user => user.role === 'ADMIN');
            expect(admin?.email).toEqual('admin@school.edu');
            expect(admin?.full_name).toEqual('School Administrator');
        });

        it('should return users ordered by creation date', async () => {
            // Create admin users
            await db.insert(usersTable)
                .values(testAdminUser)
                .execute();

            // Wait a bit to ensure different timestamps
            await new Promise(resolve => setTimeout(resolve, 10));
            
            await db.insert(usersTable)
                .values({ ...testAdminUser, email: 'admin2@school.edu', full_name: 'Second Admin' })
                .execute();

            const adminUsers = await getAdminUsers();

            expect(adminUsers).toHaveLength(2);
            // Should be ordered by created_at desc (newest first)
            expect(adminUsers[0].email).toEqual('admin2@school.edu');
            expect(adminUsers[1].email).toEqual('admin@school.edu');
        });
    });

    describe('createAdminUser', () => {
        it('should create admin user successfully', async () => {
            const userData = {
                email: 'newadmin@school.edu',
                full_name: 'New Administrator',
                role: 'ADMIN' as const
            };

            const createdUser = await createAdminUser(userData);

            expect(createdUser.email).toEqual(userData.email);
            expect(createdUser.full_name).toEqual(userData.full_name);
            expect(createdUser.role).toEqual(userData.role);
            expect(createdUser.password_hash).toContain('hash_');
            expect(createdUser.id).toBeDefined();
            expect(createdUser.created_at).toBeInstanceOf(Date);

            // Verify user was saved to database
            const savedUsers = await db.select()
                .from(usersTable)
                .where(eq(usersTable.email, userData.email))
                .execute();

            expect(savedUsers).toHaveLength(1);
            expect(savedUsers[0].email).toEqual(userData.email);
        });

        it('should create admission committee user successfully', async () => {
            const userData = {
                email: 'committee@school.edu',
                full_name: 'Committee Member',
                role: 'ADMISSION_COMMITTEE' as const
            };

            const createdUser = await createAdminUser(userData);

            expect(createdUser.role).toEqual('ADMISSION_COMMITTEE');
            expect(createdUser.email).toEqual(userData.email);
            expect(createdUser.full_name).toEqual(userData.full_name);
        });

        it('should use provided password when specified', async () => {
            const userData = {
                email: 'admin@school.edu',
                full_name: 'Administrator',
                role: 'ADMIN' as const,
                password: 'custom_password'
            };

            const createdUser = await createAdminUser(userData);

            expect(createdUser.password_hash).toEqual('hash_custom_password');
        });

        it('should reject duplicate email addresses', async () => {
            // Create first user
            await createAdminUser({
                email: 'admin@school.edu',
                full_name: 'First Admin',
                role: 'ADMIN'
            });

            // Try to create second user with same email
            await expect(
                createAdminUser({
                    email: 'admin@school.edu',
                    full_name: 'Second Admin', 
                    role: 'ADMIN'
                })
            ).rejects.toThrow();
        });
    });
});
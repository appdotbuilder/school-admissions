import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import all schemas
import { z } from 'zod';
import {
  createUserInputSchema,
  loginInputSchema,
  createApplicantProfileInputSchema,
  createApplicationInputSchema,
  createAcademicRecordInputSchema,
  uploadDocumentInputSchema,
  updateApplicationStatusInputSchema,
  createNotificationInputSchema,
  getApplicationsQuerySchema,
  getApplicationByIdInputSchema,
  documentTypeSchema
} from './schema';

// Import all handlers
import { createUser, authenticateUser, getCurrentUser } from './handlers/auth';
import { createApplicantProfile, getApplicantProfile, updateApplicantProfile } from './handlers/applicant_profile';
import { createApplication, getApplicationsByApplicant, getApplicationById, getAllApplications, submitApplication } from './handlers/applications';
import { updateApplicationStatus, getApplicationStatusHistory, bulkUpdateApplicationStatus } from './handlers/application_status';
import { createAcademicRecord, getAcademicRecordsByApplication, updateAcademicRecord, deleteAcademicRecord, bulkCreateAcademicRecords } from './handlers/academic_records';
import { uploadDocument, getDocumentsByApplication, getDocumentById, deleteDocument, getDocumentsByType, downloadDocument } from './handlers/documents';
import { createNotification, getNotificationsByUser, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, getUnreadNotificationCount, broadcastNotification } from './handlers/notifications';
import { getAdminDashboardStats, getApplicationsWithApplicantInfo, exportApplicationsReport, getAdminUsers, createAdminUser } from './handlers/admin';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Authentication routes
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),

  authenticateUser: publicProcedure
    .input(loginInputSchema)
    .mutation(({ input }) => authenticateUser(input)),

  getCurrentUser: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getCurrentUser(input.userId)),

  // Applicant profile routes
  createApplicantProfile: publicProcedure
    .input(z.object({
      userId: z.number(),
      profile: createApplicantProfileInputSchema
    }))
    .mutation(({ input }) => createApplicantProfile(input.userId, input.profile)),

  getApplicantProfile: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getApplicantProfile(input.userId)),

  updateApplicantProfile: publicProcedure
    .input(z.object({
      userId: z.number(),
      profile: createApplicantProfileInputSchema.partial()
    }))
    .mutation(({ input }) => updateApplicantProfile(input.userId, input.profile)),

  // Application routes
  createApplication: publicProcedure
    .input(z.object({
      applicantId: z.number(),
      application: createApplicationInputSchema
    }))
    .mutation(({ input }) => createApplication(input.applicantId, input.application)),

  getApplicationsByApplicant: publicProcedure
    .input(z.object({ applicantId: z.number() }))
    .query(({ input }) => getApplicationsByApplicant(input.applicantId)),

  getApplicationById: publicProcedure
    .input(getApplicationByIdInputSchema)
    .query(({ input }) => getApplicationById(input)),

  getAllApplications: publicProcedure
    .input(getApplicationsQuerySchema)
    .query(({ input }) => getAllApplications(input)),

  submitApplication: publicProcedure
    .input(z.object({ applicationId: z.number() }))
    .mutation(({ input }) => submitApplication(input.applicationId)),

  // Application status routes
  updateApplicationStatus: publicProcedure
    .input(z.object({
      statusUpdate: updateApplicationStatusInputSchema,
      changedByUserId: z.number()
    }))
    .mutation(({ input }) => updateApplicationStatus(input.statusUpdate, input.changedByUserId)),

  getApplicationStatusHistory: publicProcedure
    .input(z.object({ applicationId: z.number() }))
    .query(({ input }) => getApplicationStatusHistory(input.applicationId)),

  bulkUpdateApplicationStatus: publicProcedure
    .input(z.object({
      applicationIds: z.array(z.number()),
      newStatus: z.string(),
      changedByUserId: z.number(),
      notes: z.string().optional()
    }))
    .mutation(({ input }) => bulkUpdateApplicationStatus(input.applicationIds, input.newStatus, input.changedByUserId, input.notes)),

  // Academic records routes
  createAcademicRecord: publicProcedure
    .input(createAcademicRecordInputSchema)
    .mutation(({ input }) => createAcademicRecord(input)),

  getAcademicRecordsByApplication: publicProcedure
    .input(z.object({ applicationId: z.number() }))
    .query(({ input }) => getAcademicRecordsByApplication(input.applicationId)),

  updateAcademicRecord: publicProcedure
    .input(z.object({
      recordId: z.number(),
      record: createAcademicRecordInputSchema.partial()
    }))
    .mutation(({ input }) => updateAcademicRecord(input.recordId, input.record)),

  deleteAcademicRecord: publicProcedure
    .input(z.object({ recordId: z.number() }))
    .mutation(({ input }) => deleteAcademicRecord(input.recordId)),

  bulkCreateAcademicRecords: publicProcedure
    .input(z.object({ records: z.array(createAcademicRecordInputSchema) }))
    .mutation(({ input }) => bulkCreateAcademicRecords(input.records)),

  // Document routes
  uploadDocument: publicProcedure
    .input(uploadDocumentInputSchema)
    .mutation(({ input }) => uploadDocument(input)),

  getDocumentsByApplication: publicProcedure
    .input(z.object({ applicationId: z.number() }))
    .query(({ input }) => getDocumentsByApplication(input.applicationId)),

  getDocumentById: publicProcedure
    .input(z.object({ documentId: z.number() }))
    .query(({ input }) => getDocumentById(input.documentId)),

  deleteDocument: publicProcedure
    .input(z.object({ documentId: z.number() }))
    .mutation(({ input }) => deleteDocument(input.documentId)),

  getDocumentsByType: publicProcedure
    .input(z.object({ 
      applicationId: z.number(),
      documentType: documentTypeSchema
    }))
    .query(({ input }) => getDocumentsByType(input.applicationId, input.documentType)),

  downloadDocument: publicProcedure
    .input(z.object({ documentId: z.number() }))
    .query(({ input }) => downloadDocument(input.documentId)),

  // Notification routes
  createNotification: publicProcedure
    .input(createNotificationInputSchema)
    .mutation(({ input }) => createNotification(input)),

  getNotificationsByUser: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getNotificationsByUser(input.userId)),

  markNotificationAsRead: publicProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(({ input }) => markNotificationAsRead(input.notificationId)),

  markAllNotificationsAsRead: publicProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(({ input }) => markAllNotificationsAsRead(input.userId)),

  deleteNotification: publicProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(({ input }) => deleteNotification(input.notificationId)),

  getUnreadNotificationCount: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getUnreadNotificationCount(input.userId)),

  broadcastNotification: publicProcedure
    .input(z.object({
      title: z.string(),
      message: z.string(),
      userIds: z.array(z.number()).optional()
    }))
    .mutation(({ input }) => broadcastNotification(input.title, input.message, input.userIds)),

  // Admin routes
  getAdminDashboardStats: publicProcedure
    .query(() => getAdminDashboardStats()),

  getApplicationsWithApplicantInfo: publicProcedure
    .input(getApplicationsQuerySchema)
    .query(({ input }) => getApplicationsWithApplicantInfo(input)),

  exportApplicationsReport: publicProcedure
    .input(getApplicationsQuerySchema)
    .query(({ input }) => exportApplicationsReport(input)),

  getAdminUsers: publicProcedure
    .query(() => getAdminUsers()),

  createAdminUser: publicProcedure
    .input(z.object({
      email: z.string().email(),
      full_name: z.string(),
      role: z.enum(['ADMIN', 'ADMISSION_COMMITTEE'])
    }))
    .mutation(({ input }) => createAdminUser(input))
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
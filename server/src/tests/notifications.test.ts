import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, notificationsTable } from '../db/schema';
import { type CreateNotificationInput } from '../schema';
import {
  createNotification,
  getNotificationsByUser,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadNotificationCount,
  broadcastNotification
} from '../handlers/notifications';
import { eq, and } from 'drizzle-orm';

describe('Notifications Handlers', () => {
  let testUserId: number;
  let secondUserId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create test users
    const users = await db.insert(usersTable)
      .values([
        {
          email: 'test@example.com',
          password_hash: 'hashed_password',
          full_name: 'Test User',
          role: 'APPLICANT'
        },
        {
          email: 'user2@example.com',
          password_hash: 'hashed_password2',
          full_name: 'Second User',
          role: 'APPLICANT'
        }
      ])
      .returning()
      .execute();

    testUserId = users[0].id;
    secondUserId = users[1].id;
  });

  afterEach(resetDB);

  describe('createNotification', () => {
    const testInput: CreateNotificationInput = {
      user_id: 0, // Will be set in tests
      title: 'Test Notification',
      message: 'This is a test notification message'
    };

    it('should create a notification successfully', async () => {
      const input = { ...testInput, user_id: testUserId };
      const result = await createNotification(input);

      expect(result.id).toBeDefined();
      expect(result.user_id).toEqual(testUserId);
      expect(result.title).toEqual('Test Notification');
      expect(result.message).toEqual('This is a test notification message');
      expect(result.is_read).toBe(false);
      expect(result.created_at).toBeInstanceOf(Date);
    });

    it('should save notification to database', async () => {
      const input = { ...testInput, user_id: testUserId };
      const result = await createNotification(input);

      const notifications = await db.select()
        .from(notificationsTable)
        .where(eq(notificationsTable.id, result.id))
        .execute();

      expect(notifications).toHaveLength(1);
      expect(notifications[0].title).toEqual('Test Notification');
      expect(notifications[0].user_id).toEqual(testUserId);
      expect(notifications[0].is_read).toBe(false);
    });

    it('should throw error for non-existent user', async () => {
      const input = { ...testInput, user_id: 99999 };
      
      expect(createNotification(input)).rejects.toThrow(/user not found/i);
    });
  });

  describe('getNotificationsByUser', () => {
    beforeEach(async () => {
      // Create multiple test notifications
      await db.insert(notificationsTable)
        .values([
          {
            user_id: testUserId,
            title: 'First Notification',
            message: 'First message',
            is_read: false
          },
          {
            user_id: testUserId,
            title: 'Second Notification',
            message: 'Second message',
            is_read: true
          },
          {
            user_id: secondUserId,
            title: 'Other User Notification',
            message: 'Other user message',
            is_read: false
          }
        ])
        .execute();
    });

    it('should fetch notifications for specific user', async () => {
      const notifications = await getNotificationsByUser(testUserId);

      expect(notifications).toHaveLength(2);
      expect(notifications.every(n => n.user_id === testUserId)).toBe(true);
      
      // Should not include other user's notifications
      expect(notifications.some(n => n.title === 'Other User Notification')).toBe(false);
    });

    it('should order notifications by read status and creation date', async () => {
      const notifications = await getNotificationsByUser(testUserId);

      expect(notifications).toHaveLength(2);
      // Unread notifications should come first
      expect(notifications[0].is_read).toBe(false);
      expect(notifications[0].title).toEqual('First Notification');
    });

    it('should return empty array for user with no notifications', async () => {
      // Create a new user with no notifications
      const newUser = await db.insert(usersTable)
        .values({
          email: 'empty@example.com',
          password_hash: 'hashed_password',
          full_name: 'Empty User',
          role: 'APPLICANT'
        })
        .returning()
        .execute();

      const notifications = await getNotificationsByUser(newUser[0].id);
      expect(notifications).toHaveLength(0);
    });

    it('should throw error for non-existent user', async () => {
      expect(getNotificationsByUser(99999)).rejects.toThrow(/user not found/i);
    });
  });

  describe('markNotificationAsRead', () => {
    let notificationId: number;

    beforeEach(async () => {
      const notification = await db.insert(notificationsTable)
        .values({
          user_id: testUserId,
          title: 'Unread Notification',
          message: 'Test message',
          is_read: false
        })
        .returning()
        .execute();

      notificationId = notification[0].id;
    });

    it('should mark notification as read', async () => {
      const result = await markNotificationAsRead(notificationId);

      expect(result.id).toEqual(notificationId);
      expect(result.is_read).toBe(true);
      expect(result.title).toEqual('Unread Notification');
    });

    it('should update notification in database', async () => {
      await markNotificationAsRead(notificationId);

      const notification = await db.select()
        .from(notificationsTable)
        .where(eq(notificationsTable.id, notificationId))
        .execute();

      expect(notification[0].is_read).toBe(true);
    });

    it('should throw error for non-existent notification', async () => {
      expect(markNotificationAsRead(99999)).rejects.toThrow(/notification not found/i);
    });
  });

  describe('markAllNotificationsAsRead', () => {
    beforeEach(async () => {
      // Create multiple unread notifications for test user
      await db.insert(notificationsTable)
        .values([
          {
            user_id: testUserId,
            title: 'Notification 1',
            message: 'Message 1',
            is_read: false
          },
          {
            user_id: testUserId,
            title: 'Notification 2',
            message: 'Message 2',
            is_read: false
          },
          {
            user_id: testUserId,
            title: 'Already Read',
            message: 'Already read message',
            is_read: true
          },
          {
            user_id: secondUserId,
            title: 'Other User',
            message: 'Other user message',
            is_read: false
          }
        ])
        .execute();
    });

    it('should mark all user notifications as read', async () => {
      const count = await markAllNotificationsAsRead(testUserId);

      expect(count).toEqual(2); // Only the 2 unread notifications

      // Verify all user's notifications are now read
      const notifications = await db.select()
        .from(notificationsTable)
        .where(eq(notificationsTable.user_id, testUserId))
        .execute();

      expect(notifications.every(n => n.is_read === true)).toBe(true);
    });

    it('should not affect other users notifications', async () => {
      await markAllNotificationsAsRead(testUserId);

      // Check other user's notification is still unread
      const otherUserNotifications = await db.select()
        .from(notificationsTable)
        .where(eq(notificationsTable.user_id, secondUserId))
        .execute();

      expect(otherUserNotifications[0].is_read).toBe(false);
    });

    it('should return zero for user with no unread notifications', async () => {
      // First mark all as read
      await markAllNotificationsAsRead(testUserId);

      // Then try again
      const count = await markAllNotificationsAsRead(testUserId);
      expect(count).toEqual(0);
    });

    it('should throw error for non-existent user', async () => {
      expect(markAllNotificationsAsRead(99999)).rejects.toThrow(/user not found/i);
    });
  });

  describe('deleteNotification', () => {
    let notificationId: number;

    beforeEach(async () => {
      const notification = await db.insert(notificationsTable)
        .values({
          user_id: testUserId,
          title: 'To Delete',
          message: 'This will be deleted',
          is_read: false
        })
        .returning()
        .execute();

      notificationId = notification[0].id;
    });

    it('should delete notification successfully', async () => {
      const result = await deleteNotification(notificationId);

      expect(result).toBe(true);

      // Verify notification is deleted
      const notifications = await db.select()
        .from(notificationsTable)
        .where(eq(notificationsTable.id, notificationId))
        .execute();

      expect(notifications).toHaveLength(0);
    });

    it('should return false for non-existent notification', async () => {
      const result = await deleteNotification(99999);
      expect(result).toBe(false);
    });
  });

  describe('getUnreadNotificationCount', () => {
    beforeEach(async () => {
      await db.insert(notificationsTable)
        .values([
          {
            user_id: testUserId,
            title: 'Unread 1',
            message: 'Message 1',
            is_read: false
          },
          {
            user_id: testUserId,
            title: 'Unread 2',
            message: 'Message 2',
            is_read: false
          },
          {
            user_id: testUserId,
            title: 'Read',
            message: 'Read message',
            is_read: true
          },
          {
            user_id: secondUserId,
            title: 'Other User Unread',
            message: 'Other message',
            is_read: false
          }
        ])
        .execute();
    });

    it('should return correct unread count for user', async () => {
      const count = await getUnreadNotificationCount(testUserId);
      expect(count).toEqual(2);
    });

    it('should return zero for user with no unread notifications', async () => {
      // Mark all as read first
      await markAllNotificationsAsRead(testUserId);

      const count = await getUnreadNotificationCount(testUserId);
      expect(count).toEqual(0);
    });

    it('should return zero for user with no notifications', async () => {
      const newUser = await db.insert(usersTable)
        .values({
          email: 'nonotifs@example.com',
          password_hash: 'hashed_password',
          full_name: 'No Notifs User',
          role: 'APPLICANT'
        })
        .returning()
        .execute();

      const count = await getUnreadNotificationCount(newUser[0].id);
      expect(count).toEqual(0);
    });

    it('should throw error for non-existent user', async () => {
      expect(getUnreadNotificationCount(99999)).rejects.toThrow(/user not found/i);
    });
  });

  describe('broadcastNotification', () => {
    it('should broadcast to all users when no userIds provided', async () => {
      const notifications = await broadcastNotification(
        'Broadcast Title',
        'Broadcast message to all users'
      );

      expect(notifications).toHaveLength(2); // We have 2 test users
      expect(notifications.every(n => n.title === 'Broadcast Title')).toBe(true);
      expect(notifications.every(n => n.message === 'Broadcast message to all users')).toBe(true);
      expect(notifications.every(n => n.is_read === false)).toBe(true);

      // Verify different user IDs
      const userIds = notifications.map(n => n.user_id);
      expect(userIds).toContain(testUserId);
      expect(userIds).toContain(secondUserId);
    });

    it('should broadcast to specific users when userIds provided', async () => {
      const notifications = await broadcastNotification(
        'Specific Broadcast',
        'Message to specific users',
        [testUserId]
      );

      expect(notifications).toHaveLength(1);
      expect(notifications[0].user_id).toEqual(testUserId);
      expect(notifications[0].title).toEqual('Specific Broadcast');
    });

    it('should save broadcast notifications to database', async () => {
      await broadcastNotification('DB Test', 'Database test message');

      const allNotifications = await db.select()
        .from(notificationsTable)
        .execute();

      const broadcastNotifications = allNotifications.filter(n => n.title === 'DB Test');
      expect(broadcastNotifications).toHaveLength(2);
    });

    it('should return empty array when no users exist for broadcast to all', async () => {
      // Delete all users
      await db.delete(usersTable).execute();

      const notifications = await broadcastNotification('Empty Broadcast', 'No users');
      expect(notifications).toHaveLength(0);
    });

    it('should throw error for non-existent user IDs', async () => {
      expect(broadcastNotification(
        'Invalid Users',
        'Test message',
        [99999]
      )).rejects.toThrow(/one or more users not found/i);
    });

    it('should handle mixed valid and invalid user IDs', async () => {
      expect(broadcastNotification(
        'Mixed Users',
        'Test message',
        [testUserId, 99999]
      )).rejects.toThrow(/one or more users not found/i);
    });
  });
});
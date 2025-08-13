import { db } from '../db';
import { notificationsTable, usersTable } from '../db/schema';
import { type CreateNotificationInput, type Notification } from '../schema';
import { eq, desc, and, count, SQL } from 'drizzle-orm';

export const createNotification = async (input: CreateNotificationInput): Promise<Notification> => {
  try {
    // Verify user exists
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (user.length === 0) {
      throw new Error('User not found');
    }

    // Insert notification record
    const result = await db.insert(notificationsTable)
      .values({
        user_id: input.user_id,
        title: input.title,
        message: input.message
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Notification creation failed:', error);
    throw error;
  }
};

export const getNotificationsByUser = async (userId: number): Promise<Notification[]> => {
  try {
    // Verify user exists
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    if (user.length === 0) {
      throw new Error('User not found');
    }

    // Fetch notifications ordered by unread first, then by creation date desc
    const notifications = await db.select()
      .from(notificationsTable)
      .where(eq(notificationsTable.user_id, userId))
      .orderBy(notificationsTable.is_read, desc(notificationsTable.created_at))
      .execute();

    return notifications;
  } catch (error) {
    console.error('Failed to fetch notifications for user:', error);
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId: number): Promise<Notification> => {
  try {
    // Update notification and return updated record
    const result = await db.update(notificationsTable)
      .set({ is_read: true })
      .where(eq(notificationsTable.id, notificationId))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error('Notification not found');
    }

    return result[0];
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    throw error;
  }
};

export const markAllNotificationsAsRead = async (userId: number): Promise<number> => {
  try {
    // Verify user exists
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    if (user.length === 0) {
      throw new Error('User not found');
    }

    // Update all unread notifications for the user
    const result = await db.update(notificationsTable)
      .set({ is_read: true })
      .where(
        and(
          eq(notificationsTable.user_id, userId),
          eq(notificationsTable.is_read, false)
        )
      )
      .returning()
      .execute();

    return result.length;
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error);
    throw error;
  }
};

export const deleteNotification = async (notificationId: number): Promise<boolean> => {
  try {
    const result = await db.delete(notificationsTable)
      .where(eq(notificationsTable.id, notificationId))
      .returning()
      .execute();

    return result.length > 0;
  } catch (error) {
    console.error('Failed to delete notification:', error);
    throw error;
  }
};

export const getUnreadNotificationCount = async (userId: number): Promise<number> => {
  try {
    // Verify user exists
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    if (user.length === 0) {
      throw new Error('User not found');
    }

    // Count unread notifications
    const result = await db.select({ count: count() })
      .from(notificationsTable)
      .where(
        and(
          eq(notificationsTable.user_id, userId),
          eq(notificationsTable.is_read, false)
        )
      )
      .execute();

    return result[0].count;
  } catch (error) {
    console.error('Failed to get unread notification count:', error);
    throw error;
  }
};

export const broadcastNotification = async (title: string, message: string, userIds?: number[]): Promise<Notification[]> => {
  try {
    let targetUserIds = userIds;

    // If no specific users provided, get all user IDs
    if (!targetUserIds) {
      const allUsers = await db.select({ id: usersTable.id })
        .from(usersTable)
        .execute();
      targetUserIds = allUsers.map(user => user.id);
    } else {
      // Verify all provided user IDs exist
      const conditions: SQL<unknown>[] = [];
      for (const userId of targetUserIds) {
        conditions.push(eq(usersTable.id, userId));
      }

      const existingUsers = await db.select({ id: usersTable.id })
        .from(usersTable)
        .where(conditions.length === 1 ? conditions[0] : and(...conditions))
        .execute();

      if (existingUsers.length !== targetUserIds.length) {
        throw new Error('One or more users not found');
      }
    }

    if (targetUserIds.length === 0) {
      return [];
    }

    // Create notifications for all target users
    const notificationValues = targetUserIds.map(userId => ({
      user_id: userId,
      title,
      message
    }));

    const result = await db.insert(notificationsTable)
      .values(notificationValues)
      .returning()
      .execute();

    return result;
  } catch (error) {
    console.error('Failed to broadcast notification:', error);
    throw error;
  }
};
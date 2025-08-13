import { db } from '../db';
import { usersTable } from '../db/schema';
import { type PublicUser } from '../schema';

export const getAllUsers = async (): Promise<PublicUser[]> => {
  try {
    // Fetch all users from database
    const users = await db.select({
      id: usersTable.id,
      username: usersTable.username,
      email: usersTable.email,
      role: usersTable.role,
      created_at: usersTable.created_at,
      updated_at: usersTable.updated_at
    })
    .from(usersTable)
    .execute();

    // Return users without password hashes
    return users.map(user => ({
      ...user,
      created_at: new Date(user.created_at),
      updated_at: new Date(user.updated_at)
    }));
  } catch (error) {
    console.error('Get all users failed:', error);
    throw error;
  }
};
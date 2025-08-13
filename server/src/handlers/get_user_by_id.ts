import { db } from '../db';
import { usersTable } from '../db/schema';
import { type GetUserByIdInput, type PublicUser } from '../schema';
import { eq } from 'drizzle-orm';

export async function getUserById(input: GetUserByIdInput): Promise<PublicUser | null> {
  try {
    // Query user by ID
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.id))
      .execute();

    // Return null if user not found
    if (users.length === 0) {
      return null;
    }

    const user = users[0];
    
    // Return public user data (excluding password_hash)
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at
    };
  } catch (error) {
    console.error('Get user by ID failed:', error);
    throw error;
  }
}
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type UpdateUserProfileInput, type PublicUser } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateUserProfile(input: UpdateUserProfileInput): Promise<PublicUser | null> {
  try {
    // First, check if user exists
    const existingUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.id))
      .execute();

    if (existingUser.length === 0) {
      return null;
    }

    // Build update object with only provided fields
    const updateData: Partial<typeof usersTable.$inferInsert> = {
      updated_at: new Date()
    };

    if (input.username !== undefined) {
      updateData.username = input.username;
    }

    if (input.email !== undefined) {
      updateData.email = input.email;
    }

    // Update the user record
    const result = await db.update(usersTable)
      .set(updateData)
      .where(eq(usersTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      return null;
    }

    // Return public user data (excluding password hash)
    const updatedUser = result[0];
    return {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
      created_at: updatedUser.created_at,
      updated_at: updatedUser.updated_at
    };
  } catch (error) {
    console.error('User profile update failed:', error);
    throw error;
  }
}
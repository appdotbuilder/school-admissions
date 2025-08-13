import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginUserInput, type AuthResponse } from '../schema';
import { eq } from 'drizzle-orm';

export async function loginUser(input: LoginUserInput): Promise<AuthResponse> {
  try {
    // Find user by username
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.username, input.username))
      .execute();

    if (users.length === 0) {
      return {
        success: false,
        user: null,
        message: 'Invalid username or password'
      };
    }

    const user = users[0];

    // Verify password using Bun's built-in password hashing
    const passwordValid = await Bun.password.verify(input.password, user.password_hash);

    if (!passwordValid) {
      return {
        success: false,
        user: null,
        message: 'Invalid username or password'
      };
    }

    // Return success response with user data (excluding password hash)
    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
        updated_at: user.updated_at
      },
      message: 'Login successful'
    };
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}
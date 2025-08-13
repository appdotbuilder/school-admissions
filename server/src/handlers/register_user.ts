import { db } from '../db';
import { usersTable } from '../db/schema';
import { type RegisterUserInput, type AuthResponse } from '../schema';
import { eq, or } from 'drizzle-orm';

export const registerUser = async (input: RegisterUserInput): Promise<AuthResponse> => {
  try {
    // Check if username or email already exists
    const existingUsers = await db.select()
      .from(usersTable)
      .where(
        or(
          eq(usersTable.username, input.username),
          eq(usersTable.email, input.email)
        )
      )
      .execute();

    if (existingUsers.length > 0) {
      const existingUser = existingUsers[0];
      const conflictField = existingUser.username === input.username ? 'username' : 'email';
      return {
        success: false,
        user: null,
        message: `User with this ${conflictField} already exists`
      };
    }

    // Hash the password using Bun's built-in password hashing
    const passwordHash = await Bun.password.hash(input.password, {
      algorithm: "bcrypt",
      cost: 12 // Secure cost factor
    });

    // Create new user record
    const result = await db.insert(usersTable)
      .values({
        username: input.username,
        email: input.email,
        password_hash: passwordHash,
        role: input.role // Will use default 'pendaftar' if not provided
      })
      .returning()
      .execute();

    const newUser = result[0];

    // Return success response without password hash
    return {
      success: true,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        created_at: newUser.created_at,
        updated_at: newUser.updated_at
      },
      message: 'User registered successfully'
    };

  } catch (error) {
    console.error('User registration failed:', error);
    return {
      success: false,
      user: null,
      message: 'Registration failed due to server error'
    };
  }
};
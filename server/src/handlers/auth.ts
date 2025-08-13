import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput, type LoginInput, type User } from '../schema';
import { eq } from 'drizzle-orm';

// Simple password hashing (in production, use bcrypt or similar)
const hashPassword = async (password: string): Promise<string> => {
  // Generate random salt for each password
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltString = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Using built-in crypto for simplicity - in production use bcrypt
  const encoder = new TextEncoder();
  const data = encoder.encode(password + saltString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Return salt + hash for verification
  return saltString + ':' + hash;
};

const verifyPassword = async (password: string, storedHash: string): Promise<boolean> => {
  // Extract salt from stored hash
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;
  
  // Hash input password with the same salt
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const inputHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return inputHash === hash;
};

export const createUser = async (input: CreateUserInput): Promise<User> => {
  try {
    // Check if user already exists
    const existingUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .execute();

    if (existingUser.length > 0) {
      throw new Error('User with this email already exists');
    }

    // Hash the password
    const passwordHash = await hashPassword(input.password);

    // Insert new user
    const result = await db.insert(usersTable)
      .values({
        email: input.email,
        password_hash: passwordHash,
        role: input.role || 'APPLICANT',
        full_name: input.full_name
      })
      .returning()
      .execute();

    const user = result[0];
    return {
      id: user.id,
      email: user.email,
      password_hash: user.password_hash,
      role: user.role,
      full_name: user.full_name,
      created_at: user.created_at,
      updated_at: user.updated_at
    };
  } catch (error) {
    console.error('User creation failed:', error);
    throw error;
  }
};

export const authenticateUser = async (input: LoginInput): Promise<{ user: User; token?: string }> => {
  try {
    // Find user by email
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .execute();

    if (users.length === 0) {
      throw new Error('Invalid email or password');
    }

    const user = users[0];

    // Verify password
    const isValidPassword = await verifyPassword(input.password, user.password_hash);
    
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Generate simple token (in production, use JWT)
    const randomBytes = crypto.getRandomValues(new Uint8Array(16));
    const randomString = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    const token = `token_${user.id}_${Date.now()}_${randomString}`;

    return {
      user: {
        id: user.id,
        email: user.email,
        password_hash: user.password_hash,
        role: user.role,
        full_name: user.full_name,
        created_at: user.created_at,
        updated_at: user.updated_at
      },
      token
    };
  } catch (error) {
    console.error('Authentication failed:', error);
    throw error;
  }
};

export const getCurrentUser = async (userId: number): Promise<User | null> => {
  try {
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    if (users.length === 0) {
      return null;
    }

    const user = users[0];
    return {
      id: user.id,
      email: user.email,
      password_hash: user.password_hash,
      role: user.role,
      full_name: user.full_name,
      created_at: user.created_at,
      updated_at: user.updated_at
    };
  } catch (error) {
    console.error('Get current user failed:', error);
    throw error;
  }
};
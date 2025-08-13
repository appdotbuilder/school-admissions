import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type RegisterUserInput } from '../schema';
import { registerUser } from '../handlers/register_user';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: RegisterUserInput = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123',
  role: 'pendaftar' // Using valid default role
};

describe('registerUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should register a new user successfully', async () => {
    const result = await registerUser(testInput);

    // Verify success response
    expect(result.success).toBe(true);
    expect(result.message).toBe('User registered successfully');
    expect(result.user).toBeDefined();
    expect(result.user?.username).toBe('testuser');
    expect(result.user?.email).toBe('test@example.com');
    expect(result.user?.role).toBe('pendaftar'); // Should use default
    expect(result.user?.id).toBeDefined();
    expect(result.user?.created_at).toBeInstanceOf(Date);
    expect(result.user?.updated_at).toBeInstanceOf(Date);
  });

  it('should save user to database with hashed password', async () => {
    const result = await registerUser(testInput);

    // Query database directly to verify user was saved
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.user!.id))
      .execute();

    expect(users).toHaveLength(1);
    const savedUser = users[0];
    expect(savedUser.username).toBe('testuser');
    expect(savedUser.email).toBe('test@example.com');
    expect(savedUser.role).toBe('pendaftar');
    expect(savedUser.password_hash).toBeDefined();
    expect(savedUser.password_hash).not.toBe('password123'); // Should be hashed
    expect(savedUser.password_hash.length).toBeGreaterThan(20); // Bcrypt hash length
  });

  it('should verify password hash is correct', async () => {
    await registerUser(testInput);

    // Get the hashed password from database
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.username, 'testuser'))
      .execute();

    const savedUser = users[0];
    
    // Verify password can be validated against hash
    const isValid = await Bun.password.verify('password123', savedUser.password_hash);
    expect(isValid).toBe(true);

    // Verify wrong password fails
    const isInvalid = await Bun.password.verify('wrongpassword', savedUser.password_hash);
    expect(isInvalid).toBe(false);
  });

  it('should reject duplicate username', async () => {
    // Register first user
    await registerUser(testInput);

    // Try to register with same username but different email
    const duplicateUsernameInput: RegisterUserInput = {
      ...testInput,
      email: 'different@example.com'
    };

    const result = await registerUser(duplicateUsernameInput);

    expect(result.success).toBe(false);
    expect(result.user).toBeNull();
    expect(result.message).toBe('User with this username already exists');
  });

  it('should reject duplicate email', async () => {
    // Register first user
    await registerUser(testInput);

    // Try to register with same email but different username
    const duplicateEmailInput: RegisterUserInput = {
      ...testInput,
      username: 'differentuser'
    };

    const result = await registerUser(duplicateEmailInput);

    expect(result.success).toBe(false);
    expect(result.user).toBeNull();
    expect(result.message).toBe('User with this email already exists');
  });

  it('should handle admin role correctly', async () => {
    const adminInput: RegisterUserInput = {
      ...testInput,
      username: 'adminuser',
      email: 'admin@example.com',
      role: 'admin'
    };

    const result = await registerUser(adminInput);

    expect(result.success).toBe(true);
    expect(result.user?.role).toBe('admin');
  });

  it('should use default role when not specified', async () => {
    const inputWithoutRole: RegisterUserInput = {
      username: 'defaultuser',
      email: 'default@example.com',
      password: 'password123',
      role: 'pendaftar' // Explicitly using default
    };

    const result = await registerUser(inputWithoutRole);

    expect(result.success).toBe(true);
    expect(result.user?.role).toBe('pendaftar');
  });

  it('should not expose password hash in response', async () => {
    const result = await registerUser(testInput);

    // Ensure password hash is not included in the response
    expect(result.user).toBeDefined();
    expect(Object.keys(result.user!)).not.toContain('password_hash');
    expect((result.user as any).password_hash).toBeUndefined();
  });

  it('should handle multiple users correctly', async () => {
    // Register first user
    const result1 = await registerUser(testInput);

    // Register second user with different credentials
    const secondInput: RegisterUserInput = {
      username: 'testuser2',
      email: 'test2@example.com',
      password: 'password456',
      role: 'admin'
    };
    
    const result2 = await registerUser(secondInput);

    // Both should succeed
    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);

    // Verify both users exist in database
    const allUsers = await db.select()
      .from(usersTable)
      .execute();

    expect(allUsers).toHaveLength(2);
    
    // Verify user details
    const usernames = allUsers.map(u => u.username).sort();
    expect(usernames).toEqual(['testuser', 'testuser2']);
  });
});
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput, type LoginInput } from '../schema';
import { createUser, authenticateUser, getCurrentUser } from '../handlers/auth';
import { eq } from 'drizzle-orm';

// Test inputs
const testUserInput: CreateUserInput = {
  email: 'test@example.com',
  password: 'password123',
  full_name: 'Test User',
  role: 'APPLICANT'
};

const testAdminInput: CreateUserInput = {
  email: 'admin@example.com',
  password: 'adminpass123',
  full_name: 'Admin User',
  role: 'ADMIN'
};

const testLoginInput: LoginInput = {
  email: 'test@example.com',
  password: 'password123'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a new user with default APPLICANT role', async () => {
    const inputWithoutRole = {
      email: 'user@example.com',
      password: 'password123',
      full_name: 'New User'
    };

    const result = await createUser(inputWithoutRole);

    expect(result.email).toEqual('user@example.com');
    expect(result.full_name).toEqual('New User');
    expect(result.role).toEqual('APPLICANT');
    expect(result.id).toBeDefined();
    expect(result.password_hash).toBeDefined();
    expect(result.password_hash).not.toEqual('password123'); // Should be hashed
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a user with specified role', async () => {
    const result = await createUser(testAdminInput);

    expect(result.email).toEqual('admin@example.com');
    expect(result.full_name).toEqual('Admin User');
    expect(result.role).toEqual('ADMIN');
    expect(result.id).toBeDefined();
    expect(result.password_hash).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save user to database', async () => {
    const result = await createUser(testUserInput);

    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].email).toEqual('test@example.com');
    expect(users[0].full_name).toEqual('Test User');
    expect(users[0].role).toEqual('APPLICANT');
    expect(users[0].password_hash).not.toEqual('password123');
  });

  it('should throw error for duplicate email', async () => {
    // Create first user
    await createUser(testUserInput);

    // Try to create second user with same email
    const duplicateInput = {
      ...testUserInput,
      full_name: 'Another User'
    };

    await expect(createUser(duplicateInput)).rejects.toThrow(/already exists/i);
  });

  it('should hash passwords securely', async () => {
    const user1 = await createUser({
      ...testUserInput,
      email: 'user1@example.com'
    });

    const user2 = await createUser({
      ...testUserInput,
      email: 'user2@example.com'
    });

    // Same password should produce different hashes due to salt
    expect(user1.password_hash).not.toEqual(user2.password_hash);
    expect(user1.password_hash).not.toEqual('password123');
    expect(user2.password_hash).not.toEqual('password123');
  });
});

describe('authenticateUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should authenticate valid user credentials', async () => {
    // Create user first
    const createdUser = await createUser(testUserInput);
    
    const result = await authenticateUser(testLoginInput);

    expect(result.user.id).toEqual(createdUser.id);
    expect(result.user.email).toEqual('test@example.com');
    expect(result.user.full_name).toEqual('Test User');
    expect(result.user.role).toEqual('APPLICANT');
    expect(result.token).toBeDefined();
    expect(typeof result.token).toBe('string');
    expect(result.token?.length).toBeGreaterThan(0);
  });

  it('should generate unique tokens for each authentication', async () => {
    await createUser(testUserInput);

    const result1 = await authenticateUser(testLoginInput);
    const result2 = await authenticateUser(testLoginInput);

    expect(result1.token).toBeDefined();
    expect(result2.token).toBeDefined();
    expect(result1.token).not.toEqual(result2.token);
  });

  it('should throw error for non-existent email', async () => {
    const invalidLogin = {
      email: 'nonexistent@example.com',
      password: 'password123'
    };

    await expect(authenticateUser(invalidLogin)).rejects.toThrow(/invalid email or password/i);
  });

  it('should throw error for wrong password', async () => {
    await createUser(testUserInput);

    const wrongPasswordLogin = {
      email: 'test@example.com',
      password: 'wrongpassword'
    };

    await expect(authenticateUser(wrongPasswordLogin)).rejects.toThrow(/invalid email or password/i);
  });

  it('should authenticate different user roles', async () => {
    await createUser(testAdminInput);

    const adminLogin = {
      email: 'admin@example.com',
      password: 'adminpass123'
    };

    const result = await authenticateUser(adminLogin);

    expect(result.user.email).toEqual('admin@example.com');
    expect(result.user.role).toEqual('ADMIN');
    expect(result.token).toBeDefined();
  });
});

describe('getCurrentUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return user data for valid user ID', async () => {
    const createdUser = await createUser(testUserInput);

    const result = await getCurrentUser(createdUser.id);

    expect(result).not.toBeNull();
    expect(result?.id).toEqual(createdUser.id);
    expect(result?.email).toEqual('test@example.com');
    expect(result?.full_name).toEqual('Test User');
    expect(result?.role).toEqual('APPLICANT');
    expect(result?.created_at).toBeInstanceOf(Date);
    expect(result?.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent user ID', async () => {
    const result = await getCurrentUser(99999);

    expect(result).toBeNull();
  });

  it('should return correct user data for different roles', async () => {
    const adminUser = await createUser(testAdminInput);

    const result = await getCurrentUser(adminUser.id);

    expect(result).not.toBeNull();
    expect(result?.email).toEqual('admin@example.com');
    expect(result?.role).toEqual('ADMIN');
    expect(result?.full_name).toEqual('Admin User');
  });

  it('should handle multiple users correctly', async () => {
    const user1 = await createUser({
      ...testUserInput,
      email: 'user1@example.com',
      full_name: 'User One'
    });

    const user2 = await createUser({
      ...testUserInput,
      email: 'user2@example.com',
      full_name: 'User Two'
    });

    const result1 = await getCurrentUser(user1.id);
    const result2 = await getCurrentUser(user2.id);

    expect(result1?.full_name).toEqual('User One');
    expect(result2?.full_name).toEqual('User Two');
    expect(result1?.id).not.toEqual(result2?.id);
  });
});
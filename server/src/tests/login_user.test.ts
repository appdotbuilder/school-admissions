import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginUserInput } from '../schema';
import { loginUser } from '../handlers/login_user';

describe('loginUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Create test user data
  const createTestUser = async () => {
    const passwordHash = await Bun.password.hash('testpassword123');
    const result = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: passwordHash,
        role: 'pendaftar'
      })
      .returning()
      .execute();
    
    return result[0];
  };

  it('should login successfully with valid credentials', async () => {
    // Create test user
    const testUser = await createTestUser();
    
    const loginInput: LoginUserInput = {
      username: 'testuser',
      password: 'testpassword123'
    };

    const result = await loginUser(loginInput);

    // Verify successful login
    expect(result.success).toBe(true);
    expect(result.message).toBe('Login successful');
    expect(result.user).toBeDefined();
    
    // Verify user data (should not contain password hash)
    expect(result.user!.id).toBe(testUser.id);
    expect(result.user!.username).toBe('testuser');
    expect(result.user!.email).toBe('test@example.com');
    expect(result.user!.role).toBe('pendaftar');
    expect(result.user!.created_at).toBeInstanceOf(Date);
    expect(result.user!.updated_at).toBeInstanceOf(Date);
    
    // Ensure password hash is not included
    expect(result.user).not.toHaveProperty('password_hash');
  });

  it('should fail with invalid username', async () => {
    // Create test user but try to login with different username
    await createTestUser();
    
    const loginInput: LoginUserInput = {
      username: 'nonexistentuser',
      password: 'testpassword123'
    };

    const result = await loginUser(loginInput);

    // Verify failed login
    expect(result.success).toBe(false);
    expect(result.user).toBe(null);
    expect(result.message).toBe('Invalid username or password');
  });

  it('should fail with invalid password', async () => {
    // Create test user but try to login with wrong password
    await createTestUser();
    
    const loginInput: LoginUserInput = {
      username: 'testuser',
      password: 'wrongpassword'
    };

    const result = await loginUser(loginInput);

    // Verify failed login
    expect(result.success).toBe(false);
    expect(result.user).toBe(null);
    expect(result.message).toBe('Invalid username or password');
  });

  it('should fail with empty username', async () => {
    await createTestUser();
    
    const loginInput: LoginUserInput = {
      username: '',
      password: 'testpassword123'
    };

    const result = await loginUser(loginInput);

    // Verify failed login
    expect(result.success).toBe(false);
    expect(result.user).toBe(null);
    expect(result.message).toBe('Invalid username or password');
  });

  it('should handle admin user login correctly', async () => {
    // Create admin user
    const passwordHash = await Bun.password.hash('adminpassword');
    const adminUser = await db.insert(usersTable)
      .values({
        username: 'adminuser',
        email: 'admin@example.com',
        password_hash: passwordHash,
        role: 'admin'
      })
      .returning()
      .execute();
    
    const loginInput: LoginUserInput = {
      username: 'adminuser',
      password: 'adminpassword'
    };

    const result = await loginUser(loginInput);

    // Verify successful admin login
    expect(result.success).toBe(true);
    expect(result.user!.role).toBe('admin');
    expect(result.user!.username).toBe('adminuser');
    expect(result.user!.email).toBe('admin@example.com');
  });

  it('should handle case-sensitive username correctly', async () => {
    await createTestUser();
    
    const loginInput: LoginUserInput = {
      username: 'TestUser', // Different case
      password: 'testpassword123'
    };

    const result = await loginUser(loginInput);

    // Should fail due to case sensitivity
    expect(result.success).toBe(false);
    expect(result.user).toBe(null);
    expect(result.message).toBe('Invalid username or password');
  });
});
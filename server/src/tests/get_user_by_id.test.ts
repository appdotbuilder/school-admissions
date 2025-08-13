import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type GetUserByIdInput } from '../schema';
import { getUserById } from '../handlers/get_user_by_id';

describe('getUserById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return user by ID when user exists', async () => {
    // Create test user in database
    const testUser = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword123',
        role: 'pendaftar'
      })
      .returning()
      .execute();

    const userId = testUser[0].id;
    const input: GetUserByIdInput = { id: userId };

    // Call handler
    const result = await getUserById(input);

    // Verify result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(userId);
    expect(result!.username).toEqual('testuser');
    expect(result!.email).toEqual('test@example.com');
    expect(result!.role).toEqual('pendaftar');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    
    // Verify password hash is NOT included in result
    expect((result as any).password_hash).toBeUndefined();
  });

  it('should return null when user does not exist', async () => {
    const input: GetUserByIdInput = { id: 999 }; // Non-existent ID

    const result = await getUserById(input);

    expect(result).toBeNull();
  });

  it('should return admin user correctly', async () => {
    // Create admin user in database
    const adminUser = await db.insert(usersTable)
      .values({
        username: 'admin',
        email: 'admin@example.com',
        password_hash: 'adminhashedpassword',
        role: 'admin'
      })
      .returning()
      .execute();

    const input: GetUserByIdInput = { id: adminUser[0].id };

    const result = await getUserById(input);

    expect(result).not.toBeNull();
    expect(result!.role).toEqual('admin');
    expect(result!.username).toEqual('admin');
    expect(result!.email).toEqual('admin@example.com');
  });

  it('should handle different user IDs correctly', async () => {
    // Create multiple users
    const user1 = await db.insert(usersTable)
      .values({
        username: 'user1',
        email: 'user1@example.com',
        password_hash: 'hash1',
        role: 'pendaftar'
      })
      .returning()
      .execute();

    const user2 = await db.insert(usersTable)
      .values({
        username: 'user2',
        email: 'user2@example.com',
        password_hash: 'hash2',
        role: 'admin'
      })
      .returning()
      .execute();

    // Get first user
    const result1 = await getUserById({ id: user1[0].id });
    expect(result1!.username).toEqual('user1');
    expect(result1!.role).toEqual('pendaftar');

    // Get second user
    const result2 = await getUserById({ id: user2[0].id });
    expect(result2!.username).toEqual('user2');
    expect(result2!.role).toEqual('admin');
  });

  it('should return user with correct timestamp types', async () => {
    // Create test user
    const testUser = await db.insert(usersTable)
      .values({
        username: 'timetest',
        email: 'time@example.com',
        password_hash: 'timehashedpassword',
        role: 'pendaftar'
      })
      .returning()
      .execute();

    const result = await getUserById({ id: testUser[0].id });

    expect(result).not.toBeNull();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    
    // Verify timestamps are reasonable (within last minute)
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    
    expect(result!.created_at >= oneMinuteAgo).toBe(true);
    expect(result!.created_at <= now).toBe(true);
    expect(result!.updated_at >= oneMinuteAgo).toBe(true);
    expect(result!.updated_at <= now).toBe(true);
  });
});
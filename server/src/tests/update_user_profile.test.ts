import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type UpdateUserProfileInput } from '../schema';
import { updateUserProfile } from '../handlers/update_user_profile';
import { eq } from 'drizzle-orm';

// Test user data
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password_hash: 'hashedpassword123',
  role: 'pendaftar' as const
};

const anotherUser = {
  username: 'anotheruser',
  email: 'another@example.com',
  password_hash: 'hashedpassword456',
  role: 'admin' as const
};

describe('updateUserProfile', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update username only', async () => {
    // Create test user
    const insertResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = insertResult[0].id;

    const input: UpdateUserProfileInput = {
      id: userId,
      username: 'updateduser'
    };

    const result = await updateUserProfile(input);

    // Verify result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(userId);
    expect(result!.username).toEqual('updateduser');
    expect(result!.email).toEqual(testUser.email); // Should remain unchanged
    expect(result!.role).toEqual(testUser.role);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect('password_hash' in result!).toBe(false); // Should not include password hash
  });

  it('should update email only', async () => {
    // Create test user
    const insertResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = insertResult[0].id;

    const input: UpdateUserProfileInput = {
      id: userId,
      email: 'newemail@example.com'
    };

    const result = await updateUserProfile(input);

    // Verify result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(userId);
    expect(result!.username).toEqual(testUser.username); // Should remain unchanged
    expect(result!.email).toEqual('newemail@example.com');
    expect(result!.role).toEqual(testUser.role);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should update both username and email', async () => {
    // Create test user
    const insertResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = insertResult[0].id;

    const input: UpdateUserProfileInput = {
      id: userId,
      username: 'completelynew',
      email: 'completelynew@example.com'
    };

    const result = await updateUserProfile(input);

    // Verify result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(userId);
    expect(result!.username).toEqual('completelynew');
    expect(result!.email).toEqual('completelynew@example.com');
    expect(result!.role).toEqual(testUser.role);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should update the updated_at timestamp', async () => {
    // Create test user
    const insertResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = insertResult[0].id;
    const originalUpdatedAt = insertResult[0].updated_at;

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const input: UpdateUserProfileInput = {
      id: userId,
      username: 'updateduser'
    };

    const result = await updateUserProfile(input);

    expect(result).not.toBeNull();
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should persist changes in database', async () => {
    // Create test user
    const insertResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = insertResult[0].id;

    const input: UpdateUserProfileInput = {
      id: userId,
      username: 'persisteduser',
      email: 'persisted@example.com'
    };

    await updateUserProfile(input);

    // Verify changes are persisted in database
    const updatedUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    expect(updatedUser).toHaveLength(1);
    expect(updatedUser[0].username).toEqual('persisteduser');
    expect(updatedUser[0].email).toEqual('persisted@example.com');
    expect(updatedUser[0].password_hash).toEqual(testUser.password_hash); // Should remain unchanged
    expect(updatedUser[0].role).toEqual(testUser.role); // Should remain unchanged
  });

  it('should return null for non-existent user', async () => {
    const input: UpdateUserProfileInput = {
      id: 99999, // Non-existent ID
      username: 'doesnotmatter'
    };

    const result = await updateUserProfile(input);

    expect(result).toBeNull();
  });

  it('should throw error on unique constraint violation for username', async () => {
    // Create two test users
    const user1Result = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const user1Id = user1Result[0].id;

    await db.insert(usersTable)
      .values(anotherUser)
      .returning()
      .execute();

    const input: UpdateUserProfileInput = {
      id: user1Id,
      username: anotherUser.username // Try to use existing username
    };

    await expect(updateUserProfile(input)).rejects.toThrow(/unique/i);
  });

  it('should throw error on unique constraint violation for email', async () => {
    // Create two test users
    const user1Result = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const user1Id = user1Result[0].id;

    await db.insert(usersTable)
      .values(anotherUser)
      .returning()
      .execute();

    const input: UpdateUserProfileInput = {
      id: user1Id,
      email: anotherUser.email // Try to use existing email
    };

    await expect(updateUserProfile(input)).rejects.toThrow(/unique/i);
  });

  it('should handle update with no changes gracefully', async () => {
    // Create test user
    const insertResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = insertResult[0].id;

    const input: UpdateUserProfileInput = {
      id: userId
      // No username or email provided
    };

    const result = await updateUserProfile(input);

    // Should still return user data with updated timestamp
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(userId);
    expect(result!.username).toEqual(testUser.username);
    expect(result!.email).toEqual(testUser.email);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });
});
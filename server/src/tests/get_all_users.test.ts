import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { getAllUsers } from '../handlers/get_all_users';
import { eq } from 'drizzle-orm';

describe('getAllUsers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no users exist', async () => {
    const result = await getAllUsers();

    expect(result).toEqual([]);
  });

  it('should return all users without password hashes', async () => {
    // Create test users
    await db.insert(usersTable).values([
      {
        username: 'user1',
        email: 'user1@example.com',
        password_hash: 'hashed_password_1',
        role: 'pendaftar'
      },
      {
        username: 'admin1',
        email: 'admin1@example.com',
        password_hash: 'hashed_password_2',
        role: 'admin'
      }
    ]).execute();

    const result = await getAllUsers();

    expect(result).toHaveLength(2);
    
    // Check first user
    const user1 = result.find(u => u.username === 'user1');
    expect(user1).toBeDefined();
    expect(user1!.email).toEqual('user1@example.com');
    expect(user1!.role).toEqual('pendaftar');
    expect(user1!.id).toBeDefined();
    expect(user1!.created_at).toBeInstanceOf(Date);
    expect(user1!.updated_at).toBeInstanceOf(Date);
    expect(user1).not.toHaveProperty('password_hash');

    // Check admin user
    const admin1 = result.find(u => u.username === 'admin1');
    expect(admin1).toBeDefined();
    expect(admin1!.email).toEqual('admin1@example.com');
    expect(admin1!.role).toEqual('admin');
    expect(admin1!.id).toBeDefined();
    expect(admin1!.created_at).toBeInstanceOf(Date);
    expect(admin1!.updated_at).toBeInstanceOf(Date);
    expect(admin1).not.toHaveProperty('password_hash');
  });

  it('should return users in database insertion order', async () => {
    // Create users in specific order
    const users = [
      {
        username: 'first_user',
        email: 'first@example.com',
        password_hash: 'hash1',
        role: 'pendaftar' as const
      },
      {
        username: 'second_user',
        email: 'second@example.com',
        password_hash: 'hash2',
        role: 'admin' as const
      },
      {
        username: 'third_user',
        email: 'third@example.com',
        password_hash: 'hash3',
        role: 'pendaftar' as const
      }
    ];

    // Insert users one by one to ensure order
    for (const user of users) {
      await db.insert(usersTable).values(user).execute();
    }

    const result = await getAllUsers();

    expect(result).toHaveLength(3);
    expect(result[0].username).toEqual('first_user');
    expect(result[1].username).toEqual('second_user');
    expect(result[2].username).toEqual('third_user');
  });

  it('should handle users with different roles correctly', async () => {
    // Create users with both possible roles
    await db.insert(usersTable).values([
      {
        username: 'pendaftar_user',
        email: 'pendaftar@example.com',
        password_hash: 'hash1',
        role: 'pendaftar'
      },
      {
        username: 'admin_user',
        email: 'admin@example.com',
        password_hash: 'hash2',
        role: 'admin'
      }
    ]).execute();

    const result = await getAllUsers();

    expect(result).toHaveLength(2);

    const pendaftarUser = result.find(u => u.role === 'pendaftar');
    const adminUser = result.find(u => u.role === 'admin');

    expect(pendaftarUser).toBeDefined();
    expect(pendaftarUser!.username).toEqual('pendaftar_user');
    expect(pendaftarUser!.role).toEqual('pendaftar');

    expect(adminUser).toBeDefined();
    expect(adminUser!.username).toEqual('admin_user');
    expect(adminUser!.role).toEqual('admin');
  });

  it('should verify users are saved correctly in database', async () => {
    // Create a test user via handler call context
    await db.insert(usersTable).values({
      username: 'test_user',
      email: 'test@example.com',
      password_hash: 'secret_hash',
      role: 'pendaftar'
    }).execute();

    const result = await getAllUsers();

    // Verify the result
    expect(result).toHaveLength(1);
    const user = result[0];

    // Verify against direct database query
    const dbUsers = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, user.id))
      .execute();

    expect(dbUsers).toHaveLength(1);
    const dbUser = dbUsers[0];

    // Compare returned user with database user (excluding password_hash)
    expect(user.id).toEqual(dbUser.id);
    expect(user.username).toEqual(dbUser.username);
    expect(user.email).toEqual(dbUser.email);
    expect(user.role).toEqual(dbUser.role);
    expect(user.created_at).toEqual(dbUser.created_at);
    expect(user.updated_at).toEqual(dbUser.updated_at);

    // Verify password hash is NOT included in result
    expect(user).not.toHaveProperty('password_hash');
    expect(dbUser.password_hash).toEqual('secret_hash'); // But it exists in DB
  });
});
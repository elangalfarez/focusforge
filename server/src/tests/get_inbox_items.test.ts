
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, inboxItemsTable } from '../db/schema';
import { type GetInboxItemsInput } from '../schema';
import { getInboxItems } from '../handlers/get_inbox_items';

const testUser = {
  id: 'test-user-1',
  email: 'test@example.com'
};

const testInboxItem1 = {
  user_id: testUser.id,
  content: 'First inbox item',
  tag: 'Work' as const,
  is_processed: false
};

const testInboxItem2 = {
  user_id: testUser.id,
  content: 'Second inbox item',
  tag: 'Personal' as const,
  is_processed: true
};

const testInboxItem3 = {
  user_id: 'other-user',
  content: 'Other user item',
  tag: 'Work' as const,
  is_processed: false
};

describe('getInboxItems', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get all inbox items for a user', async () => {
    // Create test user
    await db.insert(usersTable).values(testUser).execute();

    // Create test inbox items
    await db.insert(inboxItemsTable).values([
      testInboxItem1,
      testInboxItem2,
      testInboxItem3
    ]).execute();

    const input: GetInboxItemsInput = {
      user_id: testUser.id
    };

    const result = await getInboxItems(input);

    // Should return only items for this user
    expect(result).toHaveLength(2);
    expect(result.every(item => item.user_id === testUser.id)).toBe(true);
    
    // Check content
    const contents = result.map(item => item.content);
    expect(contents).toContain('First inbox item');
    expect(contents).toContain('Second inbox item');
    expect(contents).not.toContain('Other user item');
  });

  it('should filter by processed status when specified', async () => {
    // Create test user
    await db.insert(usersTable).values(testUser).execute();

    // Create test inbox items
    await db.insert(inboxItemsTable).values([
      testInboxItem1,
      testInboxItem2
    ]).execute();

    const input: GetInboxItemsInput = {
      user_id: testUser.id,
      processed_only: false
    };

    const result = await getInboxItems(input);

    // Should return only unprocessed items
    expect(result).toHaveLength(1);
    expect(result[0].content).toEqual('First inbox item');
    expect(result[0].is_processed).toBe(false);
  });

  it('should filter processed items correctly', async () => {
    // Create test user
    await db.insert(usersTable).values(testUser).execute();

    // Create test inbox items
    await db.insert(inboxItemsTable).values([
      testInboxItem1,
      testInboxItem2
    ]).execute();

    const input: GetInboxItemsInput = {
      user_id: testUser.id,
      processed_only: true
    };

    const result = await getInboxItems(input);

    // Should return only processed items
    expect(result).toHaveLength(1);
    expect(result[0].content).toEqual('Second inbox item');
    expect(result[0].is_processed).toBe(true);
  });

  it('should return empty array when no items exist', async () => {
    // Create test user but no inbox items
    await db.insert(usersTable).values(testUser).execute();

    const input: GetInboxItemsInput = {
      user_id: testUser.id
    };

    const result = await getInboxItems(input);

    expect(result).toHaveLength(0);
  });

  it('should return empty array for non-existent user', async () => {
    const input: GetInboxItemsInput = {
      user_id: 'non-existent-user'
    };

    const result = await getInboxItems(input);

    expect(result).toHaveLength(0);
  });

  it('should include all required fields in returned items', async () => {
    // Create test user
    await db.insert(usersTable).values(testUser).execute();

    // Create test inbox item
    await db.insert(inboxItemsTable).values(testInboxItem1).execute();

    const input: GetInboxItemsInput = {
      user_id: testUser.id
    };

    const result = await getInboxItems(input);

    expect(result).toHaveLength(1);
    const item = result[0];
    
    expect(item.id).toBeDefined();
    expect(item.user_id).toEqual(testUser.id);
    expect(item.content).toEqual('First inbox item');
    expect(item.tag).toEqual('Work');
    expect(item.is_processed).toBe(false);
    expect(item.created_at).toBeInstanceOf(Date);
    expect(item.updated_at).toBeInstanceOf(Date);
  });
});

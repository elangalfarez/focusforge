
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { inboxItemsTable, usersTable } from '../db/schema';
import { type DeleteItemInput } from '../schema';
import { deleteInboxItem } from '../handlers/delete_inbox_item';
import { eq, and } from 'drizzle-orm';

// Test user data
const testUser = {
  id: 'user-123',
  email: 'test@example.com'
};

// Test inbox item data
const testInboxItem = {
  user_id: 'user-123',
  content: 'Test inbox item to delete',
  tag: 'Work' as const
};

describe('deleteInboxItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an inbox item successfully', async () => {
    // Create test user
    await db.insert(usersTable).values(testUser).execute();

    // Create test inbox item
    const createdItems = await db.insert(inboxItemsTable)
      .values(testInboxItem)
      .returning()
      .execute();

    const createdItem = createdItems[0];

    // Test input
    const input: DeleteItemInput = {
      id: createdItem.id,
      user_id: testUser.id
    };

    // Delete the item
    const result = await deleteInboxItem(input);

    // Verify successful deletion
    expect(result.success).toBe(true);

    // Verify item no longer exists in database
    const deletedItems = await db.select()
      .from(inboxItemsTable)
      .where(eq(inboxItemsTable.id, createdItem.id))
      .execute();

    expect(deletedItems).toHaveLength(0);
  });

  it('should return false when item does not exist', async () => {
    // Create test user
    await db.insert(usersTable).values(testUser).execute();

    // Test input with non-existent ID
    const input: DeleteItemInput = {
      id: 999,
      user_id: testUser.id
    };

    // Attempt to delete non-existent item
    const result = await deleteInboxItem(input);

    // Verify unsuccessful deletion
    expect(result.success).toBe(false);
  });

  it('should return false when user does not own the item', async () => {
    // Create test users
    await db.insert(usersTable).values([
      testUser,
      { id: 'other-user', email: 'other@example.com' }
    ]).execute();

    // Create inbox item for first user
    const createdItems = await db.insert(inboxItemsTable)
      .values(testInboxItem)
      .returning()
      .execute();

    const createdItem = createdItems[0];

    // Test input with different user_id
    const input: DeleteItemInput = {
      id: createdItem.id,
      user_id: 'other-user' // Different user
    };

    // Attempt to delete item as different user
    const result = await deleteInboxItem(input);

    // Verify unsuccessful deletion
    expect(result.success).toBe(false);

    // Verify item still exists in database
    const existingItems = await db.select()
      .from(inboxItemsTable)
      .where(eq(inboxItemsTable.id, createdItem.id))
      .execute();

    expect(existingItems).toHaveLength(1);
    expect(existingItems[0].content).toEqual(testInboxItem.content);
  });

  it('should only delete the specified item when multiple items exist', async () => {
    // Create test user
    await db.insert(usersTable).values(testUser).execute();

    // Create multiple inbox items
    const items = await db.insert(inboxItemsTable)
      .values([
        testInboxItem,
        { ...testInboxItem, content: 'Second inbox item', tag: 'Personal' as const },
        { ...testInboxItem, content: 'Third inbox item', tag: 'Family' as const }
      ])
      .returning()
      .execute();

    // Delete the first item
    const input: DeleteItemInput = {
      id: items[0].id,
      user_id: testUser.id
    };

    const result = await deleteInboxItem(input);

    // Verify successful deletion
    expect(result.success).toBe(true);

    // Verify only the specified item was deleted
    const remainingItems = await db.select()
      .from(inboxItemsTable)
      .where(eq(inboxItemsTable.user_id, testUser.id))
      .execute();

    expect(remainingItems).toHaveLength(2);
    expect(remainingItems.find(item => item.id === items[0].id)).toBeUndefined();
    expect(remainingItems.find(item => item.id === items[1].id)).toBeDefined();
    expect(remainingItems.find(item => item.id === items[2].id)).toBeDefined();
  });
});

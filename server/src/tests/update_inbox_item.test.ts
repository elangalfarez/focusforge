
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, inboxItemsTable } from '../db/schema';
import { type UpdateInboxItemInput } from '../schema';
import { updateInboxItem } from '../handlers/update_inbox_item';
import { eq, and } from 'drizzle-orm';

// Test user data
const testUser = {
  id: 'test-user-123',
  email: 'test@example.com'
};

// Test inbox item data
const testInboxItem = {
  user_id: testUser.id,
  content: 'Original content',
  tag: 'Work' as const,
  is_processed: false
};

describe('updateInboxItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update inbox item content', async () => {
    // Create user and inbox item
    await db.insert(usersTable).values(testUser).execute();
    const [createdItem] = await db.insert(inboxItemsTable)
      .values(testInboxItem)
      .returning()
      .execute();

    const updateInput: UpdateInboxItemInput = {
      id: createdItem.id,
      user_id: testUser.id,
      content: 'Updated content'
    };

    const result = await updateInboxItem(updateInput);

    expect(result.id).toEqual(createdItem.id);
    expect(result.content).toEqual('Updated content');
    expect(result.tag).toEqual('Work');
    expect(result.is_processed).toEqual(false);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > createdItem.created_at).toBe(true);
  });

  it('should update inbox item tag', async () => {
    // Create user and inbox item
    await db.insert(usersTable).values(testUser).execute();
    const [createdItem] = await db.insert(inboxItemsTable)
      .values(testInboxItem)
      .returning()
      .execute();

    const updateInput: UpdateInboxItemInput = {
      id: createdItem.id,
      user_id: testUser.id,
      tag: 'Personal'
    };

    const result = await updateInboxItem(updateInput);

    expect(result.id).toEqual(createdItem.id);
    expect(result.content).toEqual('Original content');
    expect(result.tag).toEqual('Personal');
    expect(result.is_processed).toEqual(false);
  });

  it('should update inbox item processed status', async () => {
    // Create user and inbox item
    await db.insert(usersTable).values(testUser).execute();
    const [createdItem] = await db.insert(inboxItemsTable)
      .values(testInboxItem)
      .returning()
      .execute();

    const updateInput: UpdateInboxItemInput = {
      id: createdItem.id,
      user_id: testUser.id,
      is_processed: true
    };

    const result = await updateInboxItem(updateInput);

    expect(result.id).toEqual(createdItem.id);
    expect(result.content).toEqual('Original content');
    expect(result.tag).toEqual('Work');
    expect(result.is_processed).toEqual(true);
  });

  it('should update multiple fields at once', async () => {
    // Create user and inbox item
    await db.insert(usersTable).values(testUser).execute();
    const [createdItem] = await db.insert(inboxItemsTable)
      .values(testInboxItem)
      .returning()
      .execute();

    const updateInput: UpdateInboxItemInput = {
      id: createdItem.id,
      user_id: testUser.id,
      content: 'New content',
      tag: 'Family',
      is_processed: true
    };

    const result = await updateInboxItem(updateInput);

    expect(result.id).toEqual(createdItem.id);
    expect(result.content).toEqual('New content');
    expect(result.tag).toEqual('Family');
    expect(result.is_processed).toEqual(true);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save updated data to database', async () => {
    // Create user and inbox item
    await db.insert(usersTable).values(testUser).execute();
    const [createdItem] = await db.insert(inboxItemsTable)
      .values(testInboxItem)
      .returning()
      .execute();

    const updateInput: UpdateInboxItemInput = {
      id: createdItem.id,
      user_id: testUser.id,
      content: 'Database updated content',
      is_processed: true
    };

    await updateInboxItem(updateInput);

    // Verify changes were saved to database
    const updatedItems = await db.select()
      .from(inboxItemsTable)
      .where(eq(inboxItemsTable.id, createdItem.id))
      .execute();

    expect(updatedItems).toHaveLength(1);
    expect(updatedItems[0].content).toEqual('Database updated content');
    expect(updatedItems[0].is_processed).toEqual(true);
    expect(updatedItems[0].updated_at).toBeInstanceOf(Date);
    expect(updatedItems[0].updated_at > updatedItems[0].created_at).toBe(true);
  });

  it('should throw error for non-existent inbox item', async () => {
    await db.insert(usersTable).values(testUser).execute();

    const updateInput: UpdateInboxItemInput = {
      id: 999999,
      user_id: testUser.id,
      content: 'This should fail'
    };

    await expect(updateInboxItem(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should throw error when user tries to update another users inbox item', async () => {
    // Create two users
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(usersTable).values({
      id: 'other-user-456',
      email: 'other@example.com'
    }).execute();

    // Create inbox item for first user
    const [createdItem] = await db.insert(inboxItemsTable)
      .values(testInboxItem)
      .returning()
      .execute();

    // Try to update with different user_id
    const updateInput: UpdateInboxItemInput = {
      id: createdItem.id,
      user_id: 'other-user-456',
      content: 'Unauthorized update'
    };

    await expect(updateInboxItem(updateInput)).rejects.toThrow(/access denied/i);
  });

  it('should preserve unchanged fields when updating selectively', async () => {
    // Create user and inbox item
    await db.insert(usersTable).values(testUser).execute();
    const [createdItem] = await db.insert(inboxItemsTable)
      .values({
        ...testInboxItem,
        content: 'Preserve this content',
        tag: 'Gratitude',
        is_processed: true
      })
      .returning()
      .execute();

    // Update only the tag
    const updateInput: UpdateInboxItemInput = {
      id: createdItem.id,
      user_id: testUser.id,
      tag: 'Family'
    };

    const result = await updateInboxItem(updateInput);

    // Content and processed status should remain unchanged
    expect(result.content).toEqual('Preserve this content');
    expect(result.tag).toEqual('Family');
    expect(result.is_processed).toEqual(true);
  });
});


import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { inboxItemsTable } from '../db/schema';
import { type CreateInboxItemInput } from '../schema';
import { createInboxItem } from '../handlers/create_inbox_item';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateInboxItemInput = {
  user_id: 'test-user-123',
  content: 'Remember to buy groceries',
  tag: 'Personal'
};

describe('createInboxItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an inbox item', async () => {
    const result = await createInboxItem(testInput);

    // Basic field validation
    expect(result.user_id).toEqual('test-user-123');
    expect(result.content).toEqual('Remember to buy groceries');
    expect(result.tag).toEqual('Personal');
    expect(result.is_processed).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save inbox item to database', async () => {
    const result = await createInboxItem(testInput);

    // Query using proper drizzle syntax
    const inboxItems = await db.select()
      .from(inboxItemsTable)
      .where(eq(inboxItemsTable.id, result.id))
      .execute();

    expect(inboxItems).toHaveLength(1);
    expect(inboxItems[0].user_id).toEqual('test-user-123');
    expect(inboxItems[0].content).toEqual('Remember to buy groceries');
    expect(inboxItems[0].tag).toEqual('Personal');
    expect(inboxItems[0].is_processed).toEqual(false);
    expect(inboxItems[0].created_at).toBeInstanceOf(Date);
    expect(inboxItems[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle different tag types', async () => {
    const workInput: CreateInboxItemInput = {
      user_id: 'test-user-123',
      content: 'Finish quarterly report',
      tag: 'Work'
    };

    const result = await createInboxItem(workInput);

    expect(result.tag).toEqual('Work');
    expect(result.content).toEqual('Finish quarterly report');
    expect(result.is_processed).toEqual(false);
  });

  it('should handle long content', async () => {
    const longContentInput: CreateInboxItemInput = {
      user_id: 'test-user-123',
      content: 'This is a very long inbox item that contains multiple sentences and detailed information about a complex task that needs to be completed.',
      tag: 'Side Hustle'
    };

    const result = await createInboxItem(longContentInput);

    expect(result.content).toEqual(longContentInput.content);
    expect(result.tag).toEqual('Side Hustle');
    expect(result.id).toBeDefined();
  });
});

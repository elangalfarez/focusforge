
import { db } from '../db';
import { inboxItemsTable } from '../db/schema';
import { type UpdateInboxItemInput, type InboxItem } from '../schema';
import { eq, and } from 'drizzle-orm';

export const updateInboxItem = async (input: UpdateInboxItemInput): Promise<InboxItem> => {
  try {
    // Verify the inbox item exists and belongs to the user
    const existingItem = await db.select()
      .from(inboxItemsTable)
      .where(and(
        eq(inboxItemsTable.id, input.id),
        eq(inboxItemsTable.user_id, input.user_id)
      ))
      .execute();

    if (existingItem.length === 0) {
      throw new Error('Inbox item not found or access denied');
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.content !== undefined) {
      updateData.content = input.content;
    }

    if (input.tag !== undefined) {
      updateData.tag = input.tag;
    }

    if (input.is_processed !== undefined) {
      updateData.is_processed = input.is_processed;
    }

    // Update the inbox item
    const result = await db.update(inboxItemsTable)
      .set(updateData)
      .where(and(
        eq(inboxItemsTable.id, input.id),
        eq(inboxItemsTable.user_id, input.user_id)
      ))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Inbox item update failed:', error);
    throw error;
  }
};

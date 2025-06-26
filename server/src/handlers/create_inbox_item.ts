
import { db } from '../db';
import { inboxItemsTable } from '../db/schema';
import { type CreateInboxItemInput, type InboxItem } from '../schema';

export const createInboxItem = async (input: CreateInboxItemInput): Promise<InboxItem> => {
  try {
    // Insert inbox item record
    const result = await db.insert(inboxItemsTable)
      .values({
        user_id: input.user_id,
        content: input.content,
        tag: input.tag,
        is_processed: false // Default value
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Inbox item creation failed:', error);
    throw error;
  }
};

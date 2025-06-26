
import { db } from '../db';
import { inboxItemsTable } from '../db/schema';
import { type GetInboxItemsInput, type InboxItem } from '../schema';
import { eq, and, desc } from 'drizzle-orm';

export async function getInboxItems(input: GetInboxItemsInput): Promise<InboxItem[]> {
  try {
    let results;

    if (input.processed_only !== undefined) {
      // Filter by user_id and processed status
      results = await db.select()
        .from(inboxItemsTable)
        .where(and(
          eq(inboxItemsTable.user_id, input.user_id),
          eq(inboxItemsTable.is_processed, input.processed_only)
        ))
        .orderBy(desc(inboxItemsTable.created_at))
        .execute();
    } else {
      // Filter by user_id only
      results = await db.select()
        .from(inboxItemsTable)
        .where(eq(inboxItemsTable.user_id, input.user_id))
        .orderBy(desc(inboxItemsTable.created_at))
        .execute();
    }

    return results;
  } catch (error) {
    console.error('Get inbox items failed:', error);
    throw error;
  }
}

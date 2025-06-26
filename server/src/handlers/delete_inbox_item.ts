
import { db } from '../db';
import { inboxItemsTable } from '../db/schema';
import { type DeleteItemInput } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function deleteInboxItem(input: DeleteItemInput): Promise<{ success: boolean }> {
  try {
    // Delete the inbox item with both id and user_id to ensure user owns the item
    const result = await db.delete(inboxItemsTable)
      .where(and(
        eq(inboxItemsTable.id, input.id),
        eq(inboxItemsTable.user_id, input.user_id)
      ))
      .returning()
      .execute();

    // Return success if a record was deleted
    return { success: result.length > 0 };
  } catch (error) {
    console.error('Inbox item deletion failed:', error);
    throw error;
  }
}

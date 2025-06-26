
import { db } from '../db';
import { inboxItemsTable } from '../db/schema';
import { type GetUserDataInput, type InboxItem } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function getTodayFocusTasks(input: GetUserDataInput): Promise<{
    work: InboxItem[];
    sideHustle: InboxItem[];
    personal: InboxItem[];
}> {
    try {
        // Get all unprocessed inbox items for the user
        const unprocessedItems = await db.select()
            .from(inboxItemsTable)
            .where(
                and(
                    eq(inboxItemsTable.user_id, input.user_id),
                    eq(inboxItemsTable.is_processed, false)
                )
            )
            .execute();

        // Categorize items by tag
        const work = unprocessedItems.filter(item => item.tag === 'Work');
        const sideHustle = unprocessedItems.filter(item => item.tag === 'Side Hustle');
        const personal = unprocessedItems.filter(item => item.tag === 'Personal');

        return {
            work,
            sideHustle,
            personal
        };
    } catch (error) {
        console.error('Failed to fetch today focus tasks:', error);
        throw error;
    }
}

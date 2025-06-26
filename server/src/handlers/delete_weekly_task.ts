
import { db } from '../db';
import { weeklyTasksTable } from '../db/schema';
import { type DeleteItemInput } from '../schema';
import { eq, and } from 'drizzle-orm';

export const deleteWeeklyTask = async (input: DeleteItemInput): Promise<{ success: boolean }> => {
  try {
    // Delete the weekly task for the specific user
    const result = await db.delete(weeklyTasksTable)
      .where(and(
        eq(weeklyTasksTable.id, input.id),
        eq(weeklyTasksTable.user_id, input.user_id)
      ))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Weekly task deletion failed:', error);
    throw error;
  }
};

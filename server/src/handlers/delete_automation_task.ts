
import { db } from '../db';
import { automationTasksTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { type DeleteItemInput } from '../schema';

export async function deleteAutomationTask(input: DeleteItemInput): Promise<{ success: boolean }> {
  try {
    // Delete the automation task that matches both id and user_id for security
    const result = await db.delete(automationTasksTable)
      .where(and(
        eq(automationTasksTable.id, input.id),
        eq(automationTasksTable.user_id, input.user_id)
      ))
      .returning()
      .execute();

    // Return success based on whether a record was actually deleted
    return { success: result.length > 0 };
  } catch (error) {
    console.error('Automation task deletion failed:', error);
    throw error;
  }
}

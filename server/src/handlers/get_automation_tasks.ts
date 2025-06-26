
import { db } from '../db';
import { automationTasksTable } from '../db/schema';
import { type GetAutomationTasksInput, type AutomationTask } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function getAutomationTasks(input: GetAutomationTasksInput): Promise<AutomationTask[]> {
  try {
    // Build query conditions
    if (input.status) {
      // Filter by both user_id and status
      const results = await db.select()
        .from(automationTasksTable)
        .where(and(
          eq(automationTasksTable.user_id, input.user_id),
          eq(automationTasksTable.status, input.status)
        ))
        .execute();

      return results;
    } else {
      // Filter by user_id only
      const results = await db.select()
        .from(automationTasksTable)
        .where(eq(automationTasksTable.user_id, input.user_id))
        .execute();

      return results;
    }
  } catch (error) {
    console.error('Failed to get automation tasks:', error);
    throw error;
  }
}

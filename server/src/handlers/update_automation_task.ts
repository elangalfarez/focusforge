
import { db } from '../db';
import { automationTasksTable } from '../db/schema';
import { type UpdateAutomationTaskInput, type AutomationTask } from '../schema';
import { eq, and } from 'drizzle-orm';

export const updateAutomationTask = async (input: UpdateAutomationTaskInput): Promise<AutomationTask> => {
  try {
    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.task_name !== undefined) {
      updateData.task_name = input.task_name;
    }

    if (input.workflow_notes !== undefined) {
      updateData.workflow_notes = input.workflow_notes;
    }

    if (input.status !== undefined) {
      updateData.status = input.status;
    }

    // Update the automation task
    const result = await db.update(automationTasksTable)
      .set(updateData)
      .where(
        and(
          eq(automationTasksTable.id, input.id),
          eq(automationTasksTable.user_id, input.user_id)
        )
      )
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error('Automation task not found or unauthorized');
    }

    return result[0];
  } catch (error) {
    console.error('Automation task update failed:', error);
    throw error;
  }
};

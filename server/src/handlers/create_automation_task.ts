
import { db } from '../db';
import { automationTasksTable } from '../db/schema';
import { type CreateAutomationTaskInput, type AutomationTask } from '../schema';

export const createAutomationTask = async (input: CreateAutomationTaskInput): Promise<AutomationTask> => {
  try {
    // Insert automation task record
    const result = await db.insert(automationTasksTable)
      .values({
        user_id: input.user_id,
        task_name: input.task_name,
        workflow_notes: input.workflow_notes,
        status: input.status || 'To Automate' // Default status if not provided
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Automation task creation failed:', error);
    throw error;
  }
};


import { db } from '../db';
import { weeklyTasksTable } from '../db/schema';
import { type UpdateWeeklyTaskInput, type WeeklyTask } from '../schema';
import { eq, and } from 'drizzle-orm';

export const updateWeeklyTask = async (input: UpdateWeeklyTaskInput): Promise<WeeklyTask> => {
  try {
    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.title !== undefined) {
      updateData.title = input.title;
    }

    if (input.column !== undefined) {
      updateData.column = input.column;
    }

    if (input.position !== undefined) {
      updateData.position = input.position;
    }

    // Update the weekly task
    const result = await db.update(weeklyTasksTable)
      .set(updateData)
      .where(and(
        eq(weeklyTasksTable.id, input.id),
        eq(weeklyTasksTable.user_id, input.user_id)
      ))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error('Weekly task not found or access denied');
    }

    return result[0];
  } catch (error) {
    console.error('Weekly task update failed:', error);
    throw error;
  }
};

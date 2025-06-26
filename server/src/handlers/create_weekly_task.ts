
import { db } from '../db';
import { weeklyTasksTable } from '../db/schema';
import { type CreateWeeklyTaskInput, type WeeklyTask } from '../schema';
import { eq, and, max } from 'drizzle-orm';

export const createWeeklyTask = async (input: CreateWeeklyTaskInput): Promise<WeeklyTask> => {
  try {
    // Get the next position if not provided
    let position = input.position;
    if (position === undefined) {
      const maxPositionResult = await db.select({ maxPos: max(weeklyTasksTable.position) })
        .from(weeklyTasksTable)
        .where(
          and(
            eq(weeklyTasksTable.user_id, input.user_id),
            eq(weeklyTasksTable.column, input.column),
            eq(weeklyTasksTable.week_start_date, input.week_start_date)
          )
        )
        .execute();
      
      position = (maxPositionResult[0]?.maxPos || 0) + 1;
    }

    // Insert weekly task record
    const result = await db.insert(weeklyTasksTable)
      .values({
        user_id: input.user_id,
        title: input.title,
        column: input.column,
        position: position,
        week_start_date: input.week_start_date
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Weekly task creation failed:', error);
    throw error;
  }
};

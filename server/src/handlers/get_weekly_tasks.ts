
import { db } from '../db';
import { weeklyTasksTable } from '../db/schema';
import { type GetWeeklyTasksInput, type WeeklyTask } from '../schema';
import { eq, and, asc } from 'drizzle-orm';

export async function getWeeklyTasks(input: GetWeeklyTasksInput): Promise<WeeklyTask[]> {
  try {
    const results = await db.select()
      .from(weeklyTasksTable)
      .where(
        and(
          eq(weeklyTasksTable.user_id, input.user_id),
          eq(weeklyTasksTable.week_start_date, input.week_start_date)
        )
      )
      .orderBy(asc(weeklyTasksTable.position))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch weekly tasks:', error);
    throw error;
  }
}

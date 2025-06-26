
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { weeklyTasksTable, usersTable } from '../db/schema';
import { type CreateWeeklyTaskInput } from '../schema';
import { createWeeklyTask } from '../handlers/create_weekly_task';
import { eq, and } from 'drizzle-orm';

const testUserId = 'test-user-123';

// Test input for creating a weekly task
const testInput: CreateWeeklyTaskInput = {
  user_id: testUserId,
  title: 'Complete project proposal',
  column: 'Work',
  week_start_date: '2024-01-01',
  position: 1
};

describe('createWeeklyTask', () => {
  beforeEach(async () => {
    await createDB();
    // Create test user
    await db.insert(usersTable)
      .values({
        id: testUserId,
        email: 'test@example.com'
      })
      .execute();
  });

  afterEach(resetDB);

  it('should create a weekly task', async () => {
    const result = await createWeeklyTask(testInput);

    // Basic field validation
    expect(result.user_id).toEqual(testUserId);
    expect(result.title).toEqual('Complete project proposal');
    expect(result.column).toEqual('Work');
    expect(result.position).toEqual(1);
    expect(result.week_start_date).toEqual('2024-01-01');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save weekly task to database', async () => {
    const result = await createWeeklyTask(testInput);

    // Query using proper drizzle syntax
    const tasks = await db.select()
      .from(weeklyTasksTable)
      .where(eq(weeklyTasksTable.id, result.id))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].user_id).toEqual(testUserId);
    expect(tasks[0].title).toEqual('Complete project proposal');
    expect(tasks[0].column).toEqual('Work');
    expect(tasks[0].position).toEqual(1);
    expect(tasks[0].week_start_date).toEqual('2024-01-01');
    expect(tasks[0].created_at).toBeInstanceOf(Date);
  });

  it('should auto-assign position when not provided', async () => {
    const inputWithoutPosition: CreateWeeklyTaskInput = {
      user_id: testUserId,
      title: 'First task',
      column: 'Self',
      week_start_date: '2024-01-01'
    };

    const result = await createWeeklyTask(inputWithoutPosition);
    expect(result.position).toEqual(1);

    // Create second task without position
    const secondInput: CreateWeeklyTaskInput = {
      user_id: testUserId,
      title: 'Second task',
      column: 'Self',
      week_start_date: '2024-01-01'
    };

    const secondResult = await createWeeklyTask(secondInput);
    expect(secondResult.position).toEqual(2);
  });

  it('should handle different columns independently for positioning', async () => {
    // Create task in Work column
    const workTask: CreateWeeklyTaskInput = {
      user_id: testUserId,
      title: 'Work task',
      column: 'Work',
      week_start_date: '2024-01-01'
    };

    const workResult = await createWeeklyTask(workTask);
    expect(workResult.position).toEqual(1);

    // Create task in Family column - should start at position 1
    const familyTask: CreateWeeklyTaskInput = {
      user_id: testUserId,
      title: 'Family task',
      column: 'Family',
      week_start_date: '2024-01-01'
    };

    const familyResult = await createWeeklyTask(familyTask);
    expect(familyResult.position).toEqual(1);
  });

  it('should handle different weeks independently for positioning', async () => {
    // Create task for week 1
    const week1Task: CreateWeeklyTaskInput = {
      user_id: testUserId,
      title: 'Week 1 task',
      column: 'Work',
      week_start_date: '2024-01-01'
    };

    const week1Result = await createWeeklyTask(week1Task);
    expect(week1Result.position).toEqual(1);

    // Create task for week 2 - should start at position 1
    const week2Task: CreateWeeklyTaskInput = {
      user_id: testUserId,
      title: 'Week 2 task',
      column: 'Work',
      week_start_date: '2024-01-08'
    };

    const week2Result = await createWeeklyTask(week2Task);
    expect(week2Result.position).toEqual(1);
  });

  it('should query tasks by user and week correctly', async () => {
    // Create multiple tasks
    await createWeeklyTask(testInput);
    await createWeeklyTask({
      ...testInput,
      title: 'Another task',
      position: 2
    });

    // Query tasks for specific user and week
    const tasks = await db.select()
      .from(weeklyTasksTable)
      .where(
        and(
          eq(weeklyTasksTable.user_id, testUserId),
          eq(weeklyTasksTable.week_start_date, '2024-01-01')
        )
      )
      .execute();

    expect(tasks.length).toEqual(2);
    tasks.forEach(task => {
      expect(task.user_id).toEqual(testUserId);
      expect(task.week_start_date).toEqual('2024-01-01');
      expect(task.created_at).toBeInstanceOf(Date);
    });
  });
});

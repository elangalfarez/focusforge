
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, weeklyTasksTable } from '../db/schema';
import { type UpdateWeeklyTaskInput } from '../schema';
import { updateWeeklyTask } from '../handlers/update_weekly_task';
import { eq, and } from 'drizzle-orm';

describe('updateWeeklyTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: string;
  let testTaskId: number;

  beforeEach(async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        id: 'test-user-123',
        email: 'test@example.com'
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create test weekly task
    const taskResult = await db.insert(weeklyTasksTable)
      .values({
        user_id: testUserId,
        title: 'Original Task',
        column: 'Work',
        position: 0,
        week_start_date: '2024-01-01'
      })
      .returning()
      .execute();
    testTaskId = taskResult[0].id;
  });

  it('should update a weekly task title', async () => {
    const input: UpdateWeeklyTaskInput = {
      id: testTaskId,
      user_id: testUserId,
      title: 'Updated Task Title'
    };

    const result = await updateWeeklyTask(input);

    expect(result.id).toEqual(testTaskId);
    expect(result.title).toEqual('Updated Task Title');
    expect(result.column).toEqual('Work'); // Should remain unchanged
    expect(result.position).toEqual(0); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update a weekly task column', async () => {
    const input: UpdateWeeklyTaskInput = {
      id: testTaskId,
      user_id: testUserId,
      column: 'Family'
    };

    const result = await updateWeeklyTask(input);

    expect(result.id).toEqual(testTaskId);
    expect(result.title).toEqual('Original Task'); // Should remain unchanged
    expect(result.column).toEqual('Family');
    expect(result.position).toEqual(0); // Should remain unchanged
  });

  it('should update a weekly task position', async () => {
    const input: UpdateWeeklyTaskInput = {
      id: testTaskId,
      user_id: testUserId,
      position: 5
    };

    const result = await updateWeeklyTask(input);

    expect(result.id).toEqual(testTaskId);
    expect(result.title).toEqual('Original Task'); // Should remain unchanged
    expect(result.column).toEqual('Work'); // Should remain unchanged
    expect(result.position).toEqual(5);
  });

  it('should update multiple fields at once', async () => {
    const input: UpdateWeeklyTaskInput = {
      id: testTaskId,
      user_id: testUserId,
      title: 'Moved Task',
      column: 'Side Hustle',
      position: 3
    };

    const result = await updateWeeklyTask(input);

    expect(result.id).toEqual(testTaskId);
    expect(result.title).toEqual('Moved Task');
    expect(result.column).toEqual('Side Hustle');
    expect(result.position).toEqual(3);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save changes to database', async () => {
    const input: UpdateWeeklyTaskInput = {
      id: testTaskId,
      user_id: testUserId,
      title: 'Database Test Task',
      column: 'Self'
    };

    await updateWeeklyTask(input);

    // Verify changes were persisted
    const tasks = await db.select()
      .from(weeklyTasksTable)
      .where(eq(weeklyTasksTable.id, testTaskId))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toEqual('Database Test Task');
    expect(tasks[0].column).toEqual('Self');
    expect(tasks[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent task', async () => {
    const input: UpdateWeeklyTaskInput = {
      id: 99999,
      user_id: testUserId,
      title: 'Non-existent Task'
    };

    expect(updateWeeklyTask(input)).rejects.toThrow(/not found/i);
  });

  it('should throw error for wrong user', async () => {
    const input: UpdateWeeklyTaskInput = {
      id: testTaskId,
      user_id: 'wrong-user-id',
      title: 'Unauthorized Update'
    };

    expect(updateWeeklyTask(input)).rejects.toThrow(/not found.*access denied/i);
  });

  it('should not update when no fields provided', async () => {
    const originalTask = await db.select()
      .from(weeklyTasksTable)
      .where(eq(weeklyTasksTable.id, testTaskId))
      .execute();

    const input: UpdateWeeklyTaskInput = {
      id: testTaskId,
      user_id: testUserId
    };

    const result = await updateWeeklyTask(input);

    expect(result.title).toEqual(originalTask[0].title);
    expect(result.column).toEqual(originalTask[0].column);
    expect(result.position).toEqual(originalTask[0].position);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalTask[0].updated_at.getTime());
  });
});

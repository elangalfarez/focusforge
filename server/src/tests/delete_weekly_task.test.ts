
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, weeklyTasksTable } from '../db/schema';
import { type DeleteItemInput } from '../schema';
import { deleteWeeklyTask } from '../handlers/delete_weekly_task';
import { eq, and } from 'drizzle-orm';

// Test user data
const testUser = {
  id: 'test-user-123',
  email: 'test@example.com'
};

// Test weekly task data
const testWeeklyTask = {
  user_id: testUser.id,
  title: 'Complete project proposal',
  column: 'Work' as const,
  position: 0,
  week_start_date: '2024-01-01'
};

const testInput: DeleteItemInput = {
  id: 1, // Will be set to actual ID after creation
  user_id: testUser.id
};

describe('deleteWeeklyTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a weekly task', async () => {
    // Create test user
    await db.insert(usersTable).values(testUser).execute();

    // Create test weekly task
    const createdTask = await db.insert(weeklyTasksTable)
      .values(testWeeklyTask)
      .returning()
      .execute();

    const taskId = createdTask[0].id;

    // Delete the weekly task
    const result = await deleteWeeklyTask({
      id: taskId,
      user_id: testUser.id
    });

    expect(result.success).toBe(true);

    // Verify task was deleted from database
    const remainingTasks = await db.select()
      .from(weeklyTasksTable)
      .where(eq(weeklyTasksTable.id, taskId))
      .execute();

    expect(remainingTasks).toHaveLength(0);
  });

  it('should only delete tasks belonging to the specified user', async () => {
    // Create test users
    const otherUser = { id: 'other-user-456', email: 'other@example.com' };
    await db.insert(usersTable).values([testUser, otherUser]).execute();

    // Create weekly tasks for both users
    const userTask = await db.insert(weeklyTasksTable)
      .values(testWeeklyTask)
      .returning()
      .execute();

    const otherUserTask = await db.insert(weeklyTasksTable)
      .values({
        ...testWeeklyTask,
        user_id: otherUser.id,
        title: 'Other user task'
      })
      .returning()
      .execute();

    const userTaskId = userTask[0].id;
    const otherUserTaskId = otherUserTask[0].id;

    // Try to delete other user's task using test user's ID
    const result = await deleteWeeklyTask({
      id: otherUserTaskId,
      user_id: testUser.id
    });

    expect(result.success).toBe(true);

    // Verify other user's task was NOT deleted
    const otherUserTasks = await db.select()
      .from(weeklyTasksTable)
      .where(eq(weeklyTasksTable.id, otherUserTaskId))
      .execute();

    expect(otherUserTasks).toHaveLength(1);
    expect(otherUserTasks[0].title).toEqual('Other user task');

    // Verify test user's task still exists
    const userTasks = await db.select()
      .from(weeklyTasksTable)
      .where(eq(weeklyTasksTable.id, userTaskId))
      .execute();

    expect(userTasks).toHaveLength(1);
  });

  it('should handle deletion of non-existent task gracefully', async () => {
    // Create test user
    await db.insert(usersTable).values(testUser).execute();

    // Try to delete non-existent task
    const result = await deleteWeeklyTask({
      id: 99999,
      user_id: testUser.id
    });

    expect(result.success).toBe(true);
  });

  it('should verify task exists before deletion attempt', async () => {
    // Create test user and task
    await db.insert(usersTable).values(testUser).execute();
    
    const createdTask = await db.insert(weeklyTasksTable)
      .values(testWeeklyTask)
      .returning()
      .execute();

    const taskId = createdTask[0].id;

    // Verify task exists before deletion
    const tasksBeforeDeletion = await db.select()
      .from(weeklyTasksTable)
      .where(and(
        eq(weeklyTasksTable.id, taskId),
        eq(weeklyTasksTable.user_id, testUser.id)
      ))
      .execute();

    expect(tasksBeforeDeletion).toHaveLength(1);
    expect(tasksBeforeDeletion[0].title).toEqual('Complete project proposal');

    // Delete the task
    await deleteWeeklyTask({
      id: taskId,
      user_id: testUser.id
    });

    // Verify task no longer exists
    const tasksAfterDeletion = await db.select()
      .from(weeklyTasksTable)
      .where(and(
        eq(weeklyTasksTable.id, taskId),
        eq(weeklyTasksTable.user_id, testUser.id)
      ))
      .execute();

    expect(tasksAfterDeletion).toHaveLength(0);
  });
});

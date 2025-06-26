
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { automationTasksTable, usersTable } from '../db/schema';
import { type DeleteItemInput } from '../schema';
import { deleteAutomationTask } from '../handlers/delete_automation_task';
import { eq } from 'drizzle-orm';

const testUser = {
  id: 'user-123',
  email: 'test@example.com'
};

const testAutomationTask = {
  user_id: testUser.id,
  task_name: 'Test Automation Task',
  workflow_notes: 'Test workflow notes',
  status: 'To Automate' as const
};

describe('deleteAutomationTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should successfully delete an automation task', async () => {
    // Create test user
    await db.insert(usersTable).values(testUser).execute();

    // Create test automation task
    const [createdTask] = await db.insert(automationTasksTable)
      .values(testAutomationTask)
      .returning()
      .execute();

    const deleteInput: DeleteItemInput = {
      id: createdTask.id,
      user_id: testUser.id
    };

    const result = await deleteAutomationTask(deleteInput);

    expect(result.success).toBe(true);

    // Verify task was deleted from database
    const tasks = await db.select()
      .from(automationTasksTable)
      .where(eq(automationTasksTable.id, createdTask.id))
      .execute();

    expect(tasks).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent task', async () => {
    // Create test user
    await db.insert(usersTable).values(testUser).execute();

    const deleteInput: DeleteItemInput = {
      id: 999, // Non-existent ID
      user_id: testUser.id
    };

    const result = await deleteAutomationTask(deleteInput);

    expect(result.success).toBe(false);
  });

  it('should return false when trying to delete task with wrong user_id', async () => {
    // Create test user
    await db.insert(usersTable).values(testUser).execute();

    // Create another user
    const otherUser = {
      id: 'user-456',
      email: 'other@example.com'
    };
    await db.insert(usersTable).values(otherUser).execute();

    // Create test automation task for first user
    const [createdTask] = await db.insert(automationTasksTable)
      .values(testAutomationTask)
      .returning()
      .execute();

    // Try to delete with wrong user_id
    const deleteInput: DeleteItemInput = {
      id: createdTask.id,
      user_id: otherUser.id // Wrong user
    };

    const result = await deleteAutomationTask(deleteInput);

    expect(result.success).toBe(false);

    // Verify task still exists in database
    const tasks = await db.select()
      .from(automationTasksTable)
      .where(eq(automationTasksTable.id, createdTask.id))
      .execute();

    expect(tasks).toHaveLength(1);
  });

  it('should not affect other automation tasks when deleting one', async () => {
    // Create test user
    await db.insert(usersTable).values(testUser).execute();

    // Create multiple automation tasks
    const task1 = await db.insert(automationTasksTable)
      .values(testAutomationTask)
      .returning()
      .execute();

    const task2 = await db.insert(automationTasksTable)
      .values({
        ...testAutomationTask,
        task_name: 'Another Task'
      })
      .returning()
      .execute();

    // Delete first task
    const deleteInput: DeleteItemInput = {
      id: task1[0].id,
      user_id: testUser.id
    };

    const result = await deleteAutomationTask(deleteInput);

    expect(result.success).toBe(true);

    // Verify only first task was deleted
    const remainingTasks = await db.select()
      .from(automationTasksTable)
      .execute();

    expect(remainingTasks).toHaveLength(1);
    expect(remainingTasks[0].id).toBe(task2[0].id);
    expect(remainingTasks[0].task_name).toBe('Another Task');
  });
});

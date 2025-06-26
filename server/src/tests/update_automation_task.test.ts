
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { automationTasksTable, usersTable } from '../db/schema';
import { type UpdateAutomationTaskInput } from '../schema';
import { updateAutomationTask } from '../handlers/update_automation_task';
import { eq } from 'drizzle-orm';

const testUser = {
  id: 'test-user-id',
  email: 'test@example.com'
};

describe('updateAutomationTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update an automation task', async () => {
    // Create user first
    await db.insert(usersTable).values(testUser).execute();

    // Create automation task directly
    const [createdTask] = await db.insert(automationTasksTable)
      .values({
        user_id: testUser.id,
        task_name: 'Test Automation Task',
        workflow_notes: 'Initial workflow notes',
        status: 'To Automate'
      })
      .returning()
      .execute();

    const updateInput: UpdateAutomationTaskInput = {
      id: createdTask.id,
      user_id: testUser.id,
      task_name: 'Updated Task Name',
      workflow_notes: 'Updated workflow notes',
      status: 'In Progress'
    };

    const result = await updateAutomationTask(updateInput);

    expect(result.id).toEqual(createdTask.id);
    expect(result.user_id).toEqual(testUser.id);
    expect(result.task_name).toEqual('Updated Task Name');
    expect(result.workflow_notes).toEqual('Updated workflow notes');
    expect(result.status).toEqual('In Progress');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > createdTask.updated_at).toBe(true);
  });

  it('should update only provided fields', async () => {
    // Create user first
    await db.insert(usersTable).values(testUser).execute();

    // Create automation task directly
    const [createdTask] = await db.insert(automationTasksTable)
      .values({
        user_id: testUser.id,
        task_name: 'Test Automation Task',
        workflow_notes: 'Initial workflow notes',
        status: 'To Automate'
      })
      .returning()
      .execute();

    const updateInput: UpdateAutomationTaskInput = {
      id: createdTask.id,
      user_id: testUser.id,
      status: 'Automated'
    };

    const result = await updateAutomationTask(updateInput);

    expect(result.id).toEqual(createdTask.id);
    expect(result.user_id).toEqual(testUser.id);
    expect(result.task_name).toEqual('Test Automation Task'); // Unchanged
    expect(result.workflow_notes).toEqual('Initial workflow notes'); // Unchanged
    expect(result.status).toEqual('Automated'); // Updated
    expect(result.updated_at > createdTask.updated_at).toBe(true);
  });

  it('should update automation task in database', async () => {
    // Create user first
    await db.insert(usersTable).values(testUser).execute();

    // Create automation task directly
    const [createdTask] = await db.insert(automationTasksTable)
      .values({
        user_id: testUser.id,
        task_name: 'Test Automation Task',
        workflow_notes: 'Initial workflow notes',
        status: 'To Automate'
      })
      .returning()
      .execute();

    const updateInput: UpdateAutomationTaskInput = {
      id: createdTask.id,
      user_id: testUser.id,
      task_name: 'Database Updated Task',
      status: 'Needs Review'
    };

    await updateAutomationTask(updateInput);

    // Verify the update was persisted
    const tasks = await db.select()
      .from(automationTasksTable)
      .where(eq(automationTasksTable.id, createdTask.id))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].task_name).toEqual('Database Updated Task');
    expect(tasks[0].status).toEqual('Needs Review');
    expect(tasks[0].workflow_notes).toEqual('Initial workflow notes'); // Unchanged
  });

  it('should handle null workflow_notes', async () => {
    // Create user first
    await db.insert(usersTable).values(testUser).execute();

    // Create automation task with null workflow_notes
    const [createdTask] = await db.insert(automationTasksTable)
      .values({
        user_id: testUser.id,
        task_name: 'Test Automation Task',
        workflow_notes: null,
        status: 'To Automate'
      })
      .returning()
      .execute();

    const updateInput: UpdateAutomationTaskInput = {
      id: createdTask.id,
      user_id: testUser.id,
      workflow_notes: 'Now has notes'
    };

    const result = await updateAutomationTask(updateInput);

    expect(result.workflow_notes).toEqual('Now has notes');
  });

  it('should set workflow_notes to null when explicitly provided', async () => {
    // Create user first
    await db.insert(usersTable).values(testUser).execute();

    // Create automation task with notes
    const [createdTask] = await db.insert(automationTasksTable)
      .values({
        user_id: testUser.id,
        task_name: 'Test Automation Task',
        workflow_notes: 'Some notes',
        status: 'To Automate'
      })
      .returning()
      .execute();

    const updateInput: UpdateAutomationTaskInput = {
      id: createdTask.id,
      user_id: testUser.id,
      workflow_notes: null
    };

    const result = await updateAutomationTask(updateInput);

    expect(result.workflow_notes).toBeNull();
  });

  it('should throw error for non-existent task', async () => {
    const updateInput: UpdateAutomationTaskInput = {
      id: 999,
      user_id: testUser.id,
      task_name: 'Non-existent task'
    };

    expect(updateAutomationTask(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should throw error for unauthorized user', async () => {
    // Create user first
    await db.insert(usersTable).values(testUser).execute();

    // Create automation task directly
    const [createdTask] = await db.insert(automationTasksTable)
      .values({
        user_id: testUser.id,
        task_name: 'Test Automation Task',
        workflow_notes: 'Initial workflow notes',
        status: 'To Automate'
      })
      .returning()
      .execute();

    const updateInput: UpdateAutomationTaskInput = {
      id: createdTask.id,
      user_id: 'different-user-id',
      task_name: 'Unauthorized update'
    };

    expect(updateAutomationTask(updateInput)).rejects.toThrow(/not found.*unauthorized/i);
  });
});

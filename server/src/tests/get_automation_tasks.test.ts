
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, automationTasksTable } from '../db/schema';
import { type GetAutomationTasksInput } from '../schema';
import { getAutomationTasks } from '../handlers/get_automation_tasks';

const testUser = {
  id: 'test-user-1',
  email: 'test@example.com'
};

const testAutomationTask1 = {
  user_id: 'test-user-1',
  task_name: 'Automate email responses',
  workflow_notes: 'Set up auto-reply for common inquiries',
  status: 'To Automate' as const
};

const testAutomationTask2 = {
  user_id: 'test-user-1',
  task_name: 'Invoice generation',
  workflow_notes: 'Create automated monthly invoicing',
  status: 'In Progress' as const
};

const testAutomationTask3 = {
  user_id: 'test-user-1',
  task_name: 'Data backup',
  workflow_notes: null,
  status: 'Automated' as const
};

describe('getAutomationTasks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all automation tasks for a user', async () => {
    // Create test user
    await db.insert(usersTable).values(testUser).execute();

    // Create test automation tasks
    await db.insert(automationTasksTable).values([
      testAutomationTask1,
      testAutomationTask2,
      testAutomationTask3
    ]).execute();

    const input: GetAutomationTasksInput = {
      user_id: 'test-user-1'
    };

    const result = await getAutomationTasks(input);

    expect(result).toHaveLength(3);
    
    // Check first task
    const task1 = result.find(t => t.task_name === 'Automate email responses');
    expect(task1).toBeDefined();
    expect(task1!.user_id).toEqual('test-user-1');
    expect(task1!.workflow_notes).toEqual('Set up auto-reply for common inquiries');
    expect(task1!.status).toEqual('To Automate');
    expect(task1!.id).toBeDefined();
    expect(task1!.created_at).toBeInstanceOf(Date);
    expect(task1!.updated_at).toBeInstanceOf(Date);

    // Check task with null workflow_notes
    const task3 = result.find(t => t.task_name === 'Data backup');
    expect(task3).toBeDefined();
    expect(task3!.workflow_notes).toBeNull();
    expect(task3!.status).toEqual('Automated');
  });

  it('should filter automation tasks by status', async () => {
    // Create test user
    await db.insert(usersTable).values(testUser).execute();

    // Create test automation tasks
    await db.insert(automationTasksTable).values([
      testAutomationTask1,
      testAutomationTask2,
      testAutomationTask3
    ]).execute();

    const input: GetAutomationTasksInput = {
      user_id: 'test-user-1',
      status: 'In Progress'
    };

    const result = await getAutomationTasks(input);

    expect(result).toHaveLength(1);
    expect(result[0].task_name).toEqual('Invoice generation');
    expect(result[0].status).toEqual('In Progress');
  });

  it('should return empty array for user with no automation tasks', async () => {
    // Create test user
    await db.insert(usersTable).values(testUser).execute();

    const input: GetAutomationTasksInput = {
      user_id: 'test-user-1'
    };

    const result = await getAutomationTasks(input);

    expect(result).toHaveLength(0);
  });

  it('should return empty array for non-existent user', async () => {
    const input: GetAutomationTasksInput = {
      user_id: 'non-existent-user'
    };

    const result = await getAutomationTasks(input);

    expect(result).toHaveLength(0);
  });

  it('should return empty array when filtering by status with no matches', async () => {
    // Create test user
    await db.insert(usersTable).values(testUser).execute();

    // Create test automation task
    await db.insert(automationTasksTable).values(testAutomationTask1).execute();

    const input: GetAutomationTasksInput = {
      user_id: 'test-user-1',
      status: 'Needs Review'
    };

    const result = await getAutomationTasks(input);

    expect(result).toHaveLength(0);
  });

  it('should only return tasks for the specified user', async () => {
    // Create two test users
    await db.insert(usersTable).values([
      testUser,
      { id: 'test-user-2', email: 'test2@example.com' }
    ]).execute();

    // Create automation tasks for both users
    await db.insert(automationTasksTable).values([
      testAutomationTask1,
      {
        user_id: 'test-user-2',
        task_name: 'Other user task',
        workflow_notes: 'Should not appear',
        status: 'To Automate' as const
      }
    ]).execute();

    const input: GetAutomationTasksInput = {
      user_id: 'test-user-1'
    };

    const result = await getAutomationTasks(input);

    expect(result).toHaveLength(1);
    expect(result[0].task_name).toEqual('Automate email responses');
    expect(result[0].user_id).toEqual('test-user-1');
  });
});

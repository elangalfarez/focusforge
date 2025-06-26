
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { automationTasksTable } from '../db/schema';
import { type CreateAutomationTaskInput } from '../schema';
import { createAutomationTask } from '../handlers/create_automation_task';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateAutomationTaskInput = {
  user_id: 'test-user-123',
  task_name: 'Automate Email Responses',
  workflow_notes: 'Set up automatic email filters and responses',
  status: 'To Automate'
};

describe('createAutomationTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an automation task with all fields', async () => {
    const result = await createAutomationTask(testInput);

    // Basic field validation
    expect(result.user_id).toEqual('test-user-123');
    expect(result.task_name).toEqual('Automate Email Responses');
    expect(result.workflow_notes).toEqual('Set up automatic email filters and responses');
    expect(result.status).toEqual('To Automate');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create an automation task with minimal fields', async () => {
    const minimalInput: CreateAutomationTaskInput = {
      user_id: 'test-user-456',
      task_name: 'Simple Task'
    };

    const result = await createAutomationTask(minimalInput);

    expect(result.user_id).toEqual('test-user-456');
    expect(result.task_name).toEqual('Simple Task');
    expect(result.workflow_notes).toBeNull();
    expect(result.status).toEqual('To Automate'); // Default status
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save automation task to database', async () => {
    const result = await createAutomationTask(testInput);

    // Query using proper drizzle syntax
    const tasks = await db.select()
      .from(automationTasksTable)
      .where(eq(automationTasksTable.id, result.id))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].user_id).toEqual('test-user-123');
    expect(tasks[0].task_name).toEqual('Automate Email Responses');
    expect(tasks[0].workflow_notes).toEqual('Set up automatic email filters and responses');
    expect(tasks[0].status).toEqual('To Automate');
    expect(tasks[0].created_at).toBeInstanceOf(Date);
    expect(tasks[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle different status values', async () => {
    const inputWithDifferentStatus: CreateAutomationTaskInput = {
      user_id: 'test-user-789',
      task_name: 'Advanced Automation',
      status: 'In Progress'
    };

    const result = await createAutomationTask(inputWithDifferentStatus);

    expect(result.status).toEqual('In Progress');
    expect(result.workflow_notes).toBeNull();
  });

  it('should create multiple automation tasks for the same user', async () => {
    const task1: CreateAutomationTaskInput = {
      user_id: 'test-user-multi',
      task_name: 'Task 1'
    };

    const task2: CreateAutomationTaskInput = {
      user_id: 'test-user-multi',
      task_name: 'Task 2',
      status: 'Automated'
    };

    const result1 = await createAutomationTask(task1);
    const result2 = await createAutomationTask(task2);

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.user_id).toEqual(result2.user_id);
    expect(result1.task_name).toEqual('Task 1');
    expect(result2.task_name).toEqual('Task 2');
    expect(result1.status).toEqual('To Automate');
    expect(result2.status).toEqual('Automated');
  });
});

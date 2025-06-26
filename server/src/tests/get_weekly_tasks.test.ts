
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { weeklyTasksTable, usersTable } from '../db/schema';
import { type GetWeeklyTasksInput } from '../schema';
import { getWeeklyTasks } from '../handlers/get_weekly_tasks';

const testUser = {
  id: 'test-user-123',
  email: 'test@example.com'
};

const testWeekStartDate = '2024-01-01';
const testInput: GetWeeklyTasksInput = {
  user_id: testUser.id,
  week_start_date: testWeekStartDate
};

describe('getWeeklyTasks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no tasks exist', async () => {
    // Create user first
    await db.insert(usersTable).values(testUser).execute();

    const result = await getWeeklyTasks(testInput);

    expect(result).toEqual([]);
  });

  it('should return weekly tasks for specific user and week', async () => {
    // Create user first
    await db.insert(usersTable).values(testUser).execute();

    // Create test tasks
    await db.insert(weeklyTasksTable).values([
      {
        user_id: testUser.id,
        title: 'Work Task 1',
        column: 'Work',
        position: 1,
        week_start_date: testWeekStartDate
      },
      {
        user_id: testUser.id,
        title: 'Family Task 1',
        column: 'Family',
        position: 2,
        week_start_date: testWeekStartDate
      }
    ]).execute();

    const result = await getWeeklyTasks(testInput);

    expect(result).toHaveLength(2);
    expect(result[0].title).toEqual('Work Task 1');
    expect(result[0].column).toEqual('Work');
    expect(result[0].position).toEqual(1);
    expect(result[1].title).toEqual('Family Task 1');
    expect(result[1].column).toEqual('Family');
    expect(result[1].position).toEqual(2);
  });

  it('should only return tasks for specified user', async () => {
    // Create users
    await db.insert(usersTable).values([
      testUser,
      { id: 'other-user', email: 'other@example.com' }
    ]).execute();

    // Create tasks for different users
    await db.insert(weeklyTasksTable).values([
      {
        user_id: testUser.id,
        title: 'My Task',
        column: 'Work',
        position: 1,
        week_start_date: testWeekStartDate
      },
      {
        user_id: 'other-user',
        title: 'Other Task',
        column: 'Work',
        position: 1,
        week_start_date: testWeekStartDate
      }
    ]).execute();

    const result = await getWeeklyTasks(testInput);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('My Task');
    expect(result[0].user_id).toEqual(testUser.id);
  });

  it('should only return tasks for specified week', async () => {
    // Create user first
    await db.insert(usersTable).values(testUser).execute();

    // Create tasks for different weeks
    await db.insert(weeklyTasksTable).values([
      {
        user_id: testUser.id,
        title: 'This Week Task',
        column: 'Work',
        position: 1,
        week_start_date: testWeekStartDate
      },
      {
        user_id: testUser.id,
        title: 'Next Week Task',
        column: 'Work',  
        position: 1,
        week_start_date: '2024-01-08'
      }
    ]).execute();

    const result = await getWeeklyTasks(testInput);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('This Week Task');
    expect(result[0].week_start_date).toEqual(testWeekStartDate);
  });

  it('should return tasks ordered by position', async () => {
    // Create user first
    await db.insert(usersTable).values(testUser).execute();

    // Create tasks with different positions
    await db.insert(weeklyTasksTable).values([
      {
        user_id: testUser.id,
        title: 'Third Task',
        column: 'Work',
        position: 3,
        week_start_date: testWeekStartDate
      },
      {
        user_id: testUser.id,
        title: 'First Task',
        column: 'Work',
        position: 1,
        week_start_date: testWeekStartDate
      },
      {
        user_id: testUser.id,
        title: 'Second Task',
        column: 'Work',
        position: 2,
        week_start_date: testWeekStartDate
      }
    ]).execute();

    const result = await getWeeklyTasks(testInput);

    expect(result).toHaveLength(3);
    expect(result[0].title).toEqual('First Task');
    expect(result[0].position).toEqual(1);
    expect(result[1].title).toEqual('Second Task');
    expect(result[1].position).toEqual(2);
    expect(result[2].title).toEqual('Third Task');
    expect(result[2].position).toEqual(3);
  });

  it('should include all task properties', async () => {
    // Create user first
    await db.insert(usersTable).values(testUser).execute();

    // Create a test task
    await db.insert(weeklyTasksTable).values({
      user_id: testUser.id,
      title: 'Complete Project',
      column: 'Side Hustle',
      position: 5,
      week_start_date: testWeekStartDate
    }).execute();

    const result = await getWeeklyTasks(testInput);

    expect(result).toHaveLength(1);
    const task = result[0];
    expect(task.id).toBeDefined();
    expect(task.user_id).toEqual(testUser.id);
    expect(task.title).toEqual('Complete Project');
    expect(task.column).toEqual('Side Hustle');
    expect(task.position).toEqual(5);
    expect(task.week_start_date).toEqual(testWeekStartDate);
    expect(task.created_at).toBeInstanceOf(Date);
    expect(task.updated_at).toBeInstanceOf(Date);
  });
});


import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, dailyReviewsTable } from '../db/schema';
import { type UpdateDailyReviewInput } from '../schema';
import { updateDailyReview } from '../handlers/update_daily_review';
import { eq } from 'drizzle-orm';

// Test user setup
const testUser = {
  id: 'test-user-123',
  email: 'test@example.com'
};

describe('updateDailyReview', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create test user
    await db.insert(usersTable).values(testUser).execute();
  });

  afterEach(resetDB);

  it('should update specific fields of a daily review', async () => {
    // Create initial daily review directly in database
    const [created] = await db.insert(dailyReviewsTable).values({
      user_id: testUser.id,
      review_date: '2024-01-15',
      type: 'AM',
      todays_one_thing: 'Original task',
      top_three_tasks: 'Original three tasks',
      gratitude: 'Original gratitude'
    }).returning().execute();

    const updateInput: UpdateDailyReviewInput = {
      id: created.id,
      user_id: testUser.id,
      todays_one_thing: 'Updated task',
      gratitude: 'Updated gratitude'
    };

    const result = await updateDailyReview(updateInput);

    // Check updated fields
    expect(result.todays_one_thing).toEqual('Updated task');
    expect(result.gratitude).toEqual('Updated gratitude');
    // Check unchanged fields
    expect(result.top_three_tasks).toEqual('Original three tasks');
    expect(result.review_date).toEqual('2024-01-15');
    expect(result.type).toEqual('AM');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update PM fields correctly', async () => {
    const [created] = await db.insert(dailyReviewsTable).values({
      user_id: testUser.id,
      review_date: '2024-01-15',
      type: 'PM',
      todays_one_thing: 'Original task'
    }).returning().execute();

    const updateInput: UpdateDailyReviewInput = {
      id: created.id,
      user_id: testUser.id,
      accomplished: 'Finished all tasks',
      distractions: 'Social media',
      tomorrows_shift: 'Focus on deep work'
    };

    const result = await updateDailyReview(updateInput);

    expect(result.accomplished).toEqual('Finished all tasks');
    expect(result.distractions).toEqual('Social media');
    expect(result.tomorrows_shift).toEqual('Focus on deep work');
    // AM fields should remain unchanged
    expect(result.todays_one_thing).toEqual('Original task');
  });

  it('should handle null values correctly', async () => {
    const [created] = await db.insert(dailyReviewsTable).values({
      user_id: testUser.id,
      review_date: '2024-01-15',
      type: 'AM',
      todays_one_thing: 'Original task',
      gratitude: 'Original gratitude'
    }).returning().execute();

    const updateInput: UpdateDailyReviewInput = {
      id: created.id,
      user_id: testUser.id,
      todays_one_thing: null,
      gratitude: null
    };

    const result = await updateDailyReview(updateInput);

    expect(result.todays_one_thing).toBeNull();
    expect(result.gratitude).toBeNull();
  });

  it('should save changes to database', async () => {
    const [created] = await db.insert(dailyReviewsTable).values({
      user_id: testUser.id,
      review_date: '2024-01-15',
      type: 'PM'
    }).returning().execute();

    const updateInput: UpdateDailyReviewInput = {
      id: created.id,
      user_id: testUser.id,
      accomplished: 'Database test completed'
    };

    await updateDailyReview(updateInput);

    // Verify in database
    const saved = await db.select()
      .from(dailyReviewsTable)
      .where(eq(dailyReviewsTable.id, created.id))
      .execute();

    expect(saved).toHaveLength(1);
    expect(saved[0].accomplished).toEqual('Database test completed');
    expect(saved[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent review', async () => {
    const updateInput: UpdateDailyReviewInput = {
      id: 99999,
      user_id: testUser.id,
      todays_one_thing: 'This should fail'
    };

    expect(updateDailyReview(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should throw error for wrong user_id', async () => {
    const [created] = await db.insert(dailyReviewsTable).values({
      user_id: testUser.id,
      review_date: '2024-01-15',
      type: 'AM'
    }).returning().execute();

    const updateInput: UpdateDailyReviewInput = {
      id: created.id,
      user_id: 'wrong-user-id',
      todays_one_thing: 'This should fail'
    };

    expect(updateDailyReview(updateInput)).rejects.toThrow(/not found|access denied/i);
  });

  it('should update only provided fields and leave others unchanged', async () => {
    const [created] = await db.insert(dailyReviewsTable).values({
      user_id: testUser.id,
      review_date: '2024-01-15',
      type: 'AM',
      todays_one_thing: 'Original task',
      top_three_tasks: 'Original three tasks',
      gratitude: 'Original gratitude'
    }).returning().execute();

    const updateInput: UpdateDailyReviewInput = {
      id: created.id,
      user_id: testUser.id,
      top_three_tasks: 'Only updating this field'
    };

    const result = await updateDailyReview(updateInput);

    expect(result.top_three_tasks).toEqual('Only updating this field');
    expect(result.todays_one_thing).toEqual('Original task');
    expect(result.gratitude).toEqual('Original gratitude');
    expect(result.accomplished).toBeNull();
    expect(result.distractions).toBeNull();
    expect(result.tomorrows_shift).toBeNull();
  });
});

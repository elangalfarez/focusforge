
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { dailyReviewsTable, usersTable } from '../db/schema';
import { type GetDailyReviewInput } from '../schema';
import { getDailyReview } from '../handlers/get_daily_review';

const testUser = {
  id: 'test-user-123',
  email: 'test@example.com'
};

const testReview = {
  user_id: testUser.id,
  review_date: '2024-01-15',
  type: 'AM' as const,
  todays_one_thing: 'Complete project proposal',
  top_three_tasks: '1. Review documents 2. Send emails 3. Plan meeting',
  gratitude: 'Grateful for team support'
};

describe('getDailyReview', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return daily review for valid user and date', async () => {
    // Create test user and review
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(dailyReviewsTable).values(testReview).execute();

    const input: GetDailyReviewInput = {
      user_id: testUser.id,
      review_date: '2024-01-15'
    };

    const result = await getDailyReview(input);

    expect(result).not.toBeNull();
    expect(result!.user_id).toEqual(testUser.id);
    expect(result!.review_date).toEqual('2024-01-15');
    expect(result!.type).toEqual('AM');
    expect(result!.todays_one_thing).toEqual('Complete project proposal');
    expect(result!.top_three_tasks).toEqual('1. Review documents 2. Send emails 3. Plan meeting');
    expect(result!.gratitude).toEqual('Grateful for team support');
    expect(result!.id).toBeDefined();
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should return daily review filtered by type', async () => {
    // Create test user
    await db.insert(usersTable).values(testUser).execute();
    
    // Create both AM and PM reviews for same date
    await db.insert(dailyReviewsTable).values([
      { ...testReview, type: 'AM' },
      { 
        ...testReview, 
        type: 'PM', 
        accomplished: 'Finished all morning tasks',
        distractions: 'Social media',
        tomorrows_shift: 'Focus on client calls'
      }
    ]).execute();

    const input: GetDailyReviewInput = {
      user_id: testUser.id,
      review_date: '2024-01-15',
      type: 'PM'
    };

    const result = await getDailyReview(input);

    expect(result).not.toBeNull();
    expect(result!.type).toEqual('PM');
    expect(result!.accomplished).toEqual('Finished all morning tasks');
    expect(result!.distractions).toEqual('Social media');
    expect(result!.tomorrows_shift).toEqual('Focus on client calls');
  });

  it('should return null for non-existent review', async () => {
    await db.insert(usersTable).values(testUser).execute();

    const input: GetDailyReviewInput = {
      user_id: testUser.id,
      review_date: '2024-01-16'
    };

    const result = await getDailyReview(input);

    expect(result).toBeNull();
  });

  it('should return null for different user', async () => {
    // Create test user and review
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(dailyReviewsTable).values(testReview).execute();

    const input: GetDailyReviewInput = {
      user_id: 'different-user-456',
      review_date: '2024-01-15'
    };

    const result = await getDailyReview(input);

    expect(result).toBeNull();
  });

  it('should handle nullable fields correctly', async () => {
    // Create test user
    await db.insert(usersTable).values(testUser).execute();
    
    // Create review with minimal data (nullable fields as null)
    const minimalReview = {
      user_id: testUser.id,
      review_date: '2024-01-15',
      type: 'PM' as const,
      todays_one_thing: null,
      top_three_tasks: null,
      gratitude: null,
      accomplished: 'Minimal work done',
      distractions: null,
      tomorrows_shift: null
    };

    await db.insert(dailyReviewsTable).values(minimalReview).execute();

    const input: GetDailyReviewInput = {
      user_id: testUser.id,
      review_date: '2024-01-15'
    };

    const result = await getDailyReview(input);

    expect(result).not.toBeNull();
    expect(result!.todays_one_thing).toBeNull();
    expect(result!.top_three_tasks).toBeNull();
    expect(result!.gratitude).toBeNull();
    expect(result!.accomplished).toEqual('Minimal work done');
    expect(result!.distractions).toBeNull();
    expect(result!.tomorrows_shift).toBeNull();
  });
});

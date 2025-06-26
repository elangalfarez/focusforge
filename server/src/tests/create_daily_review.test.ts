
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { dailyReviewsTable } from '../db/schema';
import { type CreateDailyReviewInput } from '../schema';
import { createDailyReview } from '../handlers/create_daily_review';
import { eq } from 'drizzle-orm';

// Test input for AM review
const testAMInput: CreateDailyReviewInput = {
  user_id: 'test-user-123',
  review_date: '2024-01-15',
  type: 'AM',
  todays_one_thing: 'Complete the project proposal',
  top_three_tasks: '1. Review code\n2. Write tests\n3. Deploy to staging',
  gratitude: 'Grateful for my supportive team',
  accomplished: null,
  distractions: null,
  tomorrows_shift: null
};

// Test input for PM review
const testPMInput: CreateDailyReviewInput = {
  user_id: 'test-user-456',
  review_date: '2024-01-15',
  type: 'PM',
  todays_one_thing: null,
  top_three_tasks: null,
  gratitude: null,
  accomplished: 'Finished the API implementation',
  distractions: 'Too many Slack notifications',
  tomorrows_shift: 'Focus on frontend components'
};

describe('createDailyReview', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an AM daily review', async () => {
    const result = await createDailyReview(testAMInput);

    // Basic field validation
    expect(result.user_id).toEqual('test-user-123');
    expect(result.review_date).toEqual('2024-01-15');
    expect(result.type).toEqual('AM');
    expect(result.todays_one_thing).toEqual('Complete the project proposal');
    expect(result.top_three_tasks).toEqual('1. Review code\n2. Write tests\n3. Deploy to staging');
    expect(result.gratitude).toEqual('Grateful for my supportive team');
    expect(result.accomplished).toBeNull();
    expect(result.distractions).toBeNull();
    expect(result.tomorrows_shift).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a PM daily review', async () => {
    const result = await createDailyReview(testPMInput);

    // Basic field validation
    expect(result.user_id).toEqual('test-user-456');
    expect(result.review_date).toEqual('2024-01-15');
    expect(result.type).toEqual('PM');
    expect(result.todays_one_thing).toBeNull();
    expect(result.top_three_tasks).toBeNull();
    expect(result.gratitude).toBeNull();
    expect(result.accomplished).toEqual('Finished the API implementation');
    expect(result.distractions).toEqual('Too many Slack notifications');
    expect(result.tomorrows_shift).toEqual('Focus on frontend components');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save daily review to database', async () => {
    const result = await createDailyReview(testAMInput);

    // Query using proper drizzle syntax
    const reviews = await db.select()
      .from(dailyReviewsTable)
      .where(eq(dailyReviewsTable.id, result.id))
      .execute();

    expect(reviews).toHaveLength(1);
    expect(reviews[0].user_id).toEqual('test-user-123');
    expect(reviews[0].review_date).toEqual('2024-01-15');
    expect(reviews[0].type).toEqual('AM');
    expect(reviews[0].todays_one_thing).toEqual('Complete the project proposal');
    expect(reviews[0].top_three_tasks).toEqual('1. Review code\n2. Write tests\n3. Deploy to staging');
    expect(reviews[0].gratitude).toEqual('Grateful for my supportive team');
    expect(reviews[0].created_at).toBeInstanceOf(Date);
    expect(reviews[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle minimal input with only required fields', async () => {
    const minimalInput: CreateDailyReviewInput = {
      user_id: 'test-user-minimal',
      review_date: '2024-01-16',
      type: 'AM'
    };

    const result = await createDailyReview(minimalInput);

    expect(result.user_id).toEqual('test-user-minimal');
    expect(result.review_date).toEqual('2024-01-16');
    expect(result.type).toEqual('AM');
    expect(result.todays_one_thing).toBeNull();
    expect(result.top_three_tasks).toBeNull();
    expect(result.gratitude).toBeNull();
    expect(result.accomplished).toBeNull();
    expect(result.distractions).toBeNull();
    expect(result.tomorrows_shift).toBeNull();
    expect(result.id).toBeDefined();
  });

  it('should create multiple reviews for same user and date with different types', async () => {
    const amReview = await createDailyReview({
      user_id: 'test-user-both',
      review_date: '2024-01-17',
      type: 'AM',
      todays_one_thing: 'Morning task'
    });

    const pmReview = await createDailyReview({
      user_id: 'test-user-both',
      review_date: '2024-01-17',
      type: 'PM',
      accomplished: 'Evening accomplishment'
    });

    expect(amReview.id).not.toEqual(pmReview.id);
    expect(amReview.type).toEqual('AM');
    expect(pmReview.type).toEqual('PM');
    expect(amReview.todays_one_thing).toEqual('Morning task');
    expect(pmReview.accomplished).toEqual('Evening accomplishment');

    // Verify both are saved in database
    const allReviews = await db.select()
      .from(dailyReviewsTable)
      .where(eq(dailyReviewsTable.user_id, 'test-user-both'))
      .execute();

    expect(allReviews).toHaveLength(2);
  });
});

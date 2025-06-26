
import { db } from '../db';
import { dailyReviewsTable } from '../db/schema';
import { type CreateDailyReviewInput, type DailyReview } from '../schema';

export const createDailyReview = async (input: CreateDailyReviewInput): Promise<DailyReview> => {
  try {
    // Insert daily review record
    const result = await db.insert(dailyReviewsTable)
      .values({
        user_id: input.user_id,
        review_date: input.review_date,
        type: input.type,
        todays_one_thing: input.todays_one_thing || null,
        top_three_tasks: input.top_three_tasks || null,
        gratitude: input.gratitude || null,
        accomplished: input.accomplished || null,
        distractions: input.distractions || null,
        tomorrows_shift: input.tomorrows_shift || null
      })
      .returning()
      .execute();

    const dailyReview = result[0];
    return dailyReview;
  } catch (error) {
    console.error('Daily review creation failed:', error);
    throw error;
  }
};

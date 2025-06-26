
import { db } from '../db';
import { dailyReviewsTable } from '../db/schema';
import { type UpdateDailyReviewInput, type DailyReview } from '../schema';
import { eq, and } from 'drizzle-orm';

export const updateDailyReview = async (input: UpdateDailyReviewInput): Promise<DailyReview> => {
  try {
    // Build update object with only provided fields
    const updateData: Partial<typeof dailyReviewsTable.$inferInsert> = {
      updated_at: new Date()
    };

    if (input.todays_one_thing !== undefined) {
      updateData.todays_one_thing = input.todays_one_thing;
    }
    if (input.top_three_tasks !== undefined) {
      updateData.top_three_tasks = input.top_three_tasks;
    }
    if (input.gratitude !== undefined) {
      updateData.gratitude = input.gratitude;
    }
    if (input.accomplished !== undefined) {
      updateData.accomplished = input.accomplished;
    }
    if (input.distractions !== undefined) {
      updateData.distractions = input.distractions;
    }
    if (input.tomorrows_shift !== undefined) {
      updateData.tomorrows_shift = input.tomorrows_shift;
    }

    // Update the daily review record
    const result = await db.update(dailyReviewsTable)
      .set(updateData)
      .where(
        and(
          eq(dailyReviewsTable.id, input.id),
          eq(dailyReviewsTable.user_id, input.user_id)
        )
      )
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error('Daily review not found or access denied');
    }

    return result[0];
  } catch (error) {
    console.error('Daily review update failed:', error);
    throw error;
  }
};

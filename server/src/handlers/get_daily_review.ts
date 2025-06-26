
import { db } from '../db';
import { dailyReviewsTable } from '../db/schema';
import { type GetDailyReviewInput, type DailyReview } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function getDailyReview(input: GetDailyReviewInput): Promise<DailyReview | null> {
  try {
    // Build conditions for the query
    const conditions = [
      eq(dailyReviewsTable.user_id, input.user_id),
      eq(dailyReviewsTable.review_date, input.review_date)
    ];

    // Add type filter if specified
    if (input.type) {
      conditions.push(eq(dailyReviewsTable.type, input.type));
    }

    // Execute query
    const results = await db.select()
      .from(dailyReviewsTable)
      .where(and(...conditions))
      .execute();

    // Return first result or null if none found
    return results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error('Daily review fetch failed:', error);
    throw error;
  }
}

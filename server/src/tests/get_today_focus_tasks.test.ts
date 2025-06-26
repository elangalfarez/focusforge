
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, inboxItemsTable } from '../db/schema';
import { type GetUserDataInput, type CreateInboxItemInput } from '../schema';
import { getTodayFocusTasks } from '../handlers/get_today_focus_tasks';

const testUserId = 'test-user-123';
const testInput: GetUserDataInput = {
    user_id: testUserId
};

describe('getTodayFocusTasks', () => {
    beforeEach(async () => {
        await createDB();
        
        // Create test user
        await db.insert(usersTable)
            .values({
                id: testUserId,
                email: 'test@example.com'
            })
            .execute();
    });

    afterEach(resetDB);

    it('should return empty categories when no items exist', async () => {
        const result = await getTodayFocusTasks(testInput);

        expect(result.work).toHaveLength(0);
        expect(result.sideHustle).toHaveLength(0);
        expect(result.personal).toHaveLength(0);
    });

    it('should categorize unprocessed items by tag', async () => {
        // Create test inbox items
        await db.insert(inboxItemsTable)
            .values([
                {
                    user_id: testUserId,
                    content: 'Work task 1',
                    tag: 'Work',
                    is_processed: false
                },
                {
                    user_id: testUserId,
                    content: 'Work task 2',
                    tag: 'Work',
                    is_processed: false
                },
                {
                    user_id: testUserId,
                    content: 'Side hustle task',
                    tag: 'Side Hustle',
                    is_processed: false
                },
                {
                    user_id: testUserId,
                    content: 'Personal task',
                    tag: 'Personal',
                    is_processed: false
                }
            ])
            .execute();

        const result = await getTodayFocusTasks(testInput);

        expect(result.work).toHaveLength(2);
        expect(result.sideHustle).toHaveLength(1);
        expect(result.personal).toHaveLength(1);

        // Verify content
        expect(result.work[0].content).toEqual('Work task 1');
        expect(result.work[1].content).toEqual('Work task 2');
        expect(result.sideHustle[0].content).toEqual('Side hustle task');
        expect(result.personal[0].content).toEqual('Personal task');
    });

    it('should exclude processed items', async () => {
        // Create mix of processed and unprocessed items
        await db.insert(inboxItemsTable)
            .values([
                {
                    user_id: testUserId,
                    content: 'Unprocessed work task',
                    tag: 'Work',
                    is_processed: false
                },
                {
                    user_id: testUserId,
                    content: 'Processed work task',
                    tag: 'Work',
                    is_processed: true
                },
                {
                    user_id: testUserId,
                    content: 'Processed personal task',
                    tag: 'Personal',
                    is_processed: true
                }
            ])
            .execute();

        const result = await getTodayFocusTasks(testInput);

        expect(result.work).toHaveLength(1);
        expect(result.sideHustle).toHaveLength(0);
        expect(result.personal).toHaveLength(0);
        expect(result.work[0].content).toEqual('Unprocessed work task');
    });

    it('should only return items for the specified user', async () => {
        const otherUserId = 'other-user-456';
        
        // Create another user
        await db.insert(usersTable)
            .values({
                id: otherUserId,
                email: 'other@example.com'
            })
            .execute();

        // Create items for both users
        await db.insert(inboxItemsTable)
            .values([
                {
                    user_id: testUserId,
                    content: 'My work task',
                    tag: 'Work',
                    is_processed: false
                },
                {
                    user_id: otherUserId,
                    content: 'Other user work task',
                    tag: 'Work',
                    is_processed: false
                }
            ])
            .execute();

        const result = await getTodayFocusTasks(testInput);

        expect(result.work).toHaveLength(1);
        expect(result.work[0].content).toEqual('My work task');
        expect(result.work[0].user_id).toEqual(testUserId);
    });

    it('should ignore non-focus tags', async () => {
        // Create items with various tags
        await db.insert(inboxItemsTable)
            .values([
                {
                    user_id: testUserId,
                    content: 'Work task',
                    tag: 'Work',
                    is_processed: false
                },
                {
                    user_id: testUserId,
                    content: 'Gratitude note',
                    tag: 'Gratitude',
                    is_processed: false
                },
                {
                    user_id: testUserId,
                    content: 'Family task',
                    tag: 'Family',
                    is_processed: false
                },
                {
                    user_id: testUserId,
                    content: 'Idea note',
                    tag: 'Idea',
                    is_processed: false
                }
            ])
            .execute();

        const result = await getTodayFocusTasks(testInput);

        // Only Work items should be returned, others should be empty
        expect(result.work).toHaveLength(1);
        expect(result.sideHustle).toHaveLength(0);
        expect(result.personal).toHaveLength(0);
        expect(result.work[0].content).toEqual('Work task');
    });
});

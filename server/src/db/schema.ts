
import { serial, text, pgTable, timestamp, boolean, integer, varchar, pgEnum } from 'drizzle-orm/pg-core';

// Define enums
export const tagEnum = pgEnum('tag', ['Work', 'Personal', 'Side Hustle', 'Idea', 'Gratitude', 'Family', 'Self']);
export const automationStatusEnum = pgEnum('automation_status', ['To Automate', 'In Progress', 'Automated', 'Needs Review']);
export const dailyReviewTypeEnum = pgEnum('daily_review_type', ['AM', 'PM']);
export const weeklyColumnEnum = pgEnum('weekly_column', ['Work', 'Side Hustle', 'Family', 'Self']);

// Users table
export const usersTable = pgTable('users', {
  id: varchar('id', { length: 255 }).primaryKey(), // Supabase UUID
  email: varchar('email', { length: 255 }).notNull().unique(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Inbox items table
export const inboxItemsTable = pgTable('inbox_items', {
  id: serial('id').primaryKey(),
  user_id: varchar('user_id', { length: 255 }).notNull(),
  content: text('content').notNull(),
  tag: tagEnum('tag').notNull(),
  is_processed: boolean('is_processed').default(false).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Daily reviews table
export const dailyReviewsTable = pgTable('daily_reviews', {
  id: serial('id').primaryKey(),
  user_id: varchar('user_id', { length: 255 }).notNull(),
  review_date: varchar('review_date', { length: 10 }).notNull(), // YYYY-MM-DD
  type: dailyReviewTypeEnum('type').notNull(),
  // AM fields
  todays_one_thing: text('todays_one_thing'),
  top_three_tasks: text('top_three_tasks'),
  gratitude: text('gratitude'),
  // PM fields
  accomplished: text('accomplished'),
  distractions: text('distractions'),
  tomorrows_shift: text('tomorrows_shift'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Weekly tasks table
export const weeklyTasksTable = pgTable('weekly_tasks', {
  id: serial('id').primaryKey(),
  user_id: varchar('user_id', { length: 255 }).notNull(),
  title: text('title').notNull(),
  column: weeklyColumnEnum('column').notNull(),
  position: integer('position').default(0).notNull(),
  week_start_date: varchar('week_start_date', { length: 10 }).notNull(), // YYYY-MM-DD for Monday
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Automation tasks table
export const automationTasksTable = pgTable('automation_tasks', {
  id: serial('id').primaryKey(),
  user_id: varchar('user_id', { length: 255 }).notNull(),
  task_name: text('task_name').notNull(),
  workflow_notes: text('workflow_notes'),
  status: automationStatusEnum('status').default('To Automate').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// TypeScript types for table operations
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;

export type InboxItem = typeof inboxItemsTable.$inferSelect;
export type NewInboxItem = typeof inboxItemsTable.$inferInsert;

export type DailyReview = typeof dailyReviewsTable.$inferSelect;
export type NewDailyReview = typeof dailyReviewsTable.$inferInsert;

export type WeeklyTask = typeof weeklyTasksTable.$inferSelect;
export type NewWeeklyTask = typeof weeklyTasksTable.$inferInsert;

export type AutomationTask = typeof automationTasksTable.$inferSelect;
export type NewAutomationTask = typeof automationTasksTable.$inferInsert;

// Export all tables for relation queries
export const tables = {
  users: usersTable,
  inboxItems: inboxItemsTable,
  dailyReviews: dailyReviewsTable,
  weeklyTasks: weeklyTasksTable,
  automationTasks: automationTasksTable,
};

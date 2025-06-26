
import { z } from 'zod';

// Enums for predefined values
export const tagEnum = z.enum(['Work', 'Personal', 'Side Hustle', 'Idea', 'Gratitude', 'Family', 'Self']);
export const automationStatusEnum = z.enum(['To Automate', 'In Progress', 'Automated', 'Needs Review']);
export const dailyReviewTypeEnum = z.enum(['AM', 'PM']);
export const weeklyColumnEnum = z.enum(['Work', 'Side Hustle', 'Family', 'Self']);

// User schema
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Inbox item schema
export const inboxItemSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  content: z.string(),
  tag: tagEnum,
  is_processed: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type InboxItem = z.infer<typeof inboxItemSchema>;

// Daily review schema
export const dailyReviewSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  review_date: z.string(), // YYYY-MM-DD format
  type: dailyReviewTypeEnum,
  // AM fields
  todays_one_thing: z.string().nullable(),
  top_three_tasks: z.string().nullable(),
  gratitude: z.string().nullable(),
  // PM fields
  accomplished: z.string().nullable(),
  distractions: z.string().nullable(),
  tomorrows_shift: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type DailyReview = z.infer<typeof dailyReviewSchema>;

// Weekly task schema
export const weeklyTaskSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  title: z.string(),
  column: weeklyColumnEnum,
  position: z.number().int(),
  week_start_date: z.string(), // YYYY-MM-DD format for Monday of the week
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type WeeklyTask = z.infer<typeof weeklyTaskSchema>;

// Automation task schema
export const automationTaskSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  task_name: z.string(),
  workflow_notes: z.string().nullable(),
  status: automationStatusEnum,
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type AutomationTask = z.infer<typeof automationTaskSchema>;

// Input schemas for creating records
export const createInboxItemInputSchema = z.object({
  user_id: z.string(),
  content: z.string().min(1),
  tag: tagEnum
});

export type CreateInboxItemInput = z.infer<typeof createInboxItemInputSchema>;

export const updateInboxItemInputSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  content: z.string().min(1).optional(),
  tag: tagEnum.optional(),
  is_processed: z.boolean().optional()
});

export type UpdateInboxItemInput = z.infer<typeof updateInboxItemInputSchema>;

export const createDailyReviewInputSchema = z.object({
  user_id: z.string(),
  review_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
  type: dailyReviewTypeEnum,
  todays_one_thing: z.string().nullable().optional(),
  top_three_tasks: z.string().nullable().optional(),
  gratitude: z.string().nullable().optional(),
  accomplished: z.string().nullable().optional(),
  distractions: z.string().nullable().optional(),
  tomorrows_shift: z.string().nullable().optional()
});

export type CreateDailyReviewInput = z.infer<typeof createDailyReviewInputSchema>;

export const updateDailyReviewInputSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  todays_one_thing: z.string().nullable().optional(),
  top_three_tasks: z.string().nullable().optional(),
  gratitude: z.string().nullable().optional(),
  accomplished: z.string().nullable().optional(),
  distractions: z.string().nullable().optional(),
  tomorrows_shift: z.string().nullable().optional()
});

export type UpdateDailyReviewInput = z.infer<typeof updateDailyReviewInputSchema>;

export const createWeeklyTaskInputSchema = z.object({
  user_id: z.string(),
  title: z.string().min(1),
  column: weeklyColumnEnum,
  week_start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
  position: z.number().int().nonnegative().optional()
});

export type CreateWeeklyTaskInput = z.infer<typeof createWeeklyTaskInputSchema>;

export const updateWeeklyTaskInputSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  title: z.string().min(1).optional(),
  column: weeklyColumnEnum.optional(),
  position: z.number().int().nonnegative().optional()
});

export type UpdateWeeklyTaskInput = z.infer<typeof updateWeeklyTaskInputSchema>;

export const createAutomationTaskInputSchema = z.object({
  user_id: z.string(),
  task_name: z.string().min(1),
  workflow_notes: z.string().nullable().optional(),
  status: automationStatusEnum.optional()
});

export type CreateAutomationTaskInput = z.infer<typeof createAutomationTaskInputSchema>;

export const updateAutomationTaskInputSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  task_name: z.string().min(1).optional(),
  workflow_notes: z.string().nullable().optional(),
  status: automationStatusEnum.optional()
});

export type UpdateAutomationTaskInput = z.infer<typeof updateAutomationTaskInputSchema>;

// Query input schemas
export const getUserDataInputSchema = z.object({
  user_id: z.string()
});

export type GetUserDataInput = z.infer<typeof getUserDataInputSchema>;

export const getInboxItemsInputSchema = z.object({
  user_id: z.string(),
  processed_only: z.boolean().optional()
});

export type GetInboxItemsInput = z.infer<typeof getInboxItemsInputSchema>;

export const getDailyReviewInputSchema = z.object({
  user_id: z.string(),
  review_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: dailyReviewTypeEnum.optional()
});

export type GetDailyReviewInput = z.infer<typeof getDailyReviewInputSchema>;

export const getWeeklyTasksInputSchema = z.object({
  user_id: z.string(),
  week_start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

export type GetWeeklyTasksInput = z.infer<typeof getWeeklyTasksInputSchema>;

export const getAutomationTasksInputSchema = z.object({
  user_id: z.string(),
  status: automationStatusEnum.optional()
});

export type GetAutomationTasksInput = z.infer<typeof getAutomationTasksInputSchema>;

export const deleteItemInputSchema = z.object({
  id: z.number(),
  user_id: z.string()
});

export type DeleteItemInput = z.infer<typeof deleteItemInputSchema>;


import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import {
  createInboxItemInputSchema,
  getInboxItemsInputSchema,
  updateInboxItemInputSchema,
  createDailyReviewInputSchema,
  getDailyReviewInputSchema,
  updateDailyReviewInputSchema,
  createWeeklyTaskInputSchema,
  getWeeklyTasksInputSchema,
  updateWeeklyTaskInputSchema,
  createAutomationTaskInputSchema,
  getAutomationTasksInputSchema,
  updateAutomationTaskInputSchema,
  deleteItemInputSchema,
  getUserDataInputSchema
} from './schema';

// Import handlers
import { createInboxItem } from './handlers/create_inbox_item';
import { getInboxItems } from './handlers/get_inbox_items';
import { updateInboxItem } from './handlers/update_inbox_item';
import { createDailyReview } from './handlers/create_daily_review';
import { getDailyReview } from './handlers/get_daily_review';
import { updateDailyReview } from './handlers/update_daily_review';
import { createWeeklyTask } from './handlers/create_weekly_task';
import { getWeeklyTasks } from './handlers/get_weekly_tasks';
import { updateWeeklyTask } from './handlers/update_weekly_task';
import { createAutomationTask } from './handlers/create_automation_task';
import { getAutomationTasks } from './handlers/get_automation_tasks';
import { updateAutomationTask } from './handlers/update_automation_task';
import { deleteInboxItem } from './handlers/delete_inbox_item';
import { deleteWeeklyTask } from './handlers/delete_weekly_task';
import { deleteAutomationTask } from './handlers/delete_automation_task';
import { getTodayFocusTasks } from './handlers/get_today_focus_tasks';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Inbox item operations
  createInboxItem: publicProcedure
    .input(createInboxItemInputSchema)
    .mutation(({ input }) => createInboxItem(input)),

  getInboxItems: publicProcedure
    .input(getInboxItemsInputSchema)
    .query(({ input }) => getInboxItems(input)),

  updateInboxItem: publicProcedure
    .input(updateInboxItemInputSchema)
    .mutation(({ input }) => updateInboxItem(input)),

  deleteInboxItem: publicProcedure
    .input(deleteItemInputSchema)
    .mutation(({ input }) => deleteInboxItem(input)),

  // Daily review operations
  createDailyReview: publicProcedure
    .input(createDailyReviewInputSchema)
    .mutation(({ input }) => createDailyReview(input)),

  getDailyReview: publicProcedure
    .input(getDailyReviewInputSchema)
    .query(({ input }) => getDailyReview(input)),

  updateDailyReview: publicProcedure
    .input(updateDailyReviewInputSchema)
    .mutation(({ input }) => updateDailyReview(input)),

  // Weekly task operations
  createWeeklyTask: publicProcedure
    .input(createWeeklyTaskInputSchema)
    .mutation(({ input }) => createWeeklyTask(input)),

  getWeeklyTasks: publicProcedure
    .input(getWeeklyTasksInputSchema)
    .query(({ input }) => getWeeklyTasks(input)),

  updateWeeklyTask: publicProcedure
    .input(updateWeeklyTaskInputSchema)
    .mutation(({ input }) => updateWeeklyTask(input)),

  deleteWeeklyTask: publicProcedure
    .input(deleteItemInputSchema)
    .mutation(({ input }) => deleteWeeklyTask(input)),

  // Automation task operations
  createAutomationTask: publicProcedure
    .input(createAutomationTaskInputSchema)
    .mutation(({ input }) => createAutomationTask(input)),

  getAutomationTasks: publicProcedure
    .input(getAutomationTasksInputSchema)
    .query(({ input }) => getAutomationTasks(input)),

  updateAutomationTask: publicProcedure
    .input(updateAutomationTaskInputSchema)
    .mutation(({ input }) => updateAutomationTask(input)),

  deleteAutomationTask: publicProcedure
    .input(deleteItemInputSchema)
    .mutation(({ input }) => deleteAutomationTask(input)),

  // Dashboard operations
  getTodayFocusTasks: publicProcedure
    .input(getUserDataInputSchema)
    .query(({ input }) => getTodayFocusTasks(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();

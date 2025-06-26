
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { Plus, Clock, Target, CheckCircle, Circle, Trash2, GripVertical } from 'lucide-react';
import type { 
  InboxItem, 
  CreateInboxItemInput, 
  DailyReview, 
  CreateDailyReviewInput,
  UpdateDailyReviewInput,
  WeeklyTask,
  CreateWeeklyTaskInput,
  AutomationTask,
  CreateAutomationTaskInput
} from '../../server/src/schema';

// Stub user for authentication
const STUB_USER = {
  id: 'user-123',
  email: 'user@example.com',
  name: 'John Doe'
};

function App() {
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'inbox' | 'daily' | 'weekly' | 'automation'>('dashboard');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  
  // Dashboard state
  const [focusTasks, setFocusTasks] = useState<{
    work: InboxItem[];
    sideHustle: InboxItem[];
    personal: InboxItem[];
  }>({ work: [], sideHustle: [], personal: [] });

  // Inbox state
  const [inboxItems, setInboxItems] = useState<InboxItem[]>([]);
  const [showProcessedOnly, setShowProcessedOnly] = useState(false);

  // Daily review state
  const [dailyReview, setDailyReview] = useState<DailyReview | null>(null);
  const [reviewType, setReviewType] = useState<'AM' | 'PM'>('AM');

  // Weekly planner state
  const [weeklyTasks, setWeeklyTasks] = useState<WeeklyTask[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState('');

  // Automation tracker state
  const [automationTasks, setAutomationTasks] = useState<AutomationTask[]>([]);

  // Quick add form state
  const [quickAddData, setQuickAddData] = useState<CreateInboxItemInput>({
    user_id: STUB_USER.id,
    content: '',
    tag: 'Work'
  });

  // Daily review form state
  const [dailyReviewData, setDailyReviewData] = useState<Partial<CreateDailyReviewInput>>({
    user_id: STUB_USER.id,
    review_date: new Date().toISOString().split('T')[0],
    type: 'AM',
    todays_one_thing: null,
    top_three_tasks: null,
    gratitude: null,
    accomplished: null,
    distractions: null,
    tomorrows_shift: null
  });

  // Weekly task form state
  const [weeklyTaskData, setWeeklyTaskData] = useState<CreateWeeklyTaskInput>({
    user_id: STUB_USER.id,
    title: '',
    column: 'Work',
    week_start_date: ''
  });

  // Automation task form state
  const [automationTaskData, setAutomationTaskData] = useState<CreateAutomationTaskInput>({
    user_id: STUB_USER.id,
    task_name: '',
    workflow_notes: null,
    status: 'To Automate'
  });

  // Get current week start (Monday)
  const getCurrentWeekStart = useCallback(() => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
    return monday.toISOString().split('T')[0];
  }, []);

  // Get time-based greeting
  const getTimeBasedGreeting = useCallback(() => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good Morning', icon: '🌅', color: 'from-amber-400 to-orange-500' };
    if (hour < 17) return { text: 'Good Afternoon', icon: '☀️', color: 'from-blue-400 to-cyan-500' };
    return { text: 'Good Evening', icon: '🌙', color: 'from-purple-400 to-pink-500' };
  }, []);

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    try {
      const result = await trpc.getTodayFocusTasks.query({ user_id: STUB_USER.id });
      setFocusTasks(result);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  }, []);

  // Load inbox items
  const loadInboxItems = useCallback(async () => {
    try {
      const result = await trpc.getInboxItems.query({ 
        user_id: STUB_USER.id,
        processed_only: showProcessedOnly
      });
      setInboxItems(result);
    } catch (error) {
      console.error('Failed to load inbox items:', error);
    }
  }, [showProcessedOnly]);

  // Load daily review
  const loadDailyReview = useCallback(async () => {
    try {
      const result = await trpc.getDailyReview.query({
        user_id: STUB_USER.id,
        review_date: new Date().toISOString().split('T')[0],
        type: reviewType
      });
      setDailyReview(result);
      if (result) {
        setDailyReviewData({
          user_id: STUB_USER.id,
          review_date: result.review_date,
          type: result.type,
          todays_one_thing: result.todays_one_thing,
          top_three_tasks: result.top_three_tasks,
          gratitude: result.gratitude,
          accomplished: result.accomplished,
          distractions: result.distractions,
          tomorrows_shift: result.tomorrows_shift
        });
      }
    } catch (error) {
      console.error('Failed to load daily review:', error);
    }
  }, [reviewType]);

  // Load weekly tasks
  const loadWeeklyTasks = useCallback(async () => {
    const weekStart = getCurrentWeekStart();
    setCurrentWeekStart(weekStart);
    setWeeklyTaskData(prev => ({ ...prev, week_start_date: weekStart }));
    
    try {
      const result = await trpc.getWeeklyTasks.query({
        user_id: STUB_USER.id,
        week_start_date: weekStart
      });
      setWeeklyTasks(result);
    } catch (error) {
      console.error('Failed to load weekly tasks:', error);
    }
  }, [getCurrentWeekStart]);

  // Load automation tasks
  const loadAutomationTasks = useCallback(async () => {
    try {
      const result = await trpc.getAutomationTasks.query({ user_id: STUB_USER.id });
      setAutomationTasks(result);
    } catch (error) {
      console.error('Failed to load automation tasks:', error);
    }
  }, []);

  // Load data based on current page
  useEffect(() => {
    switch (currentPage) {
      case 'dashboard':
        loadDashboardData();
        break;
      case 'inbox':
        loadInboxItems();
        break;
      case 'daily':
        loadDailyReview();
        break;
      case 'weekly':
        loadWeeklyTasks();
        break;
      case 'automation':
        loadAutomationTasks();
        break;
    }
  }, [currentPage, loadDashboardData, loadInboxItems, loadDailyReview, loadWeeklyTasks, loadAutomationTasks]);

  // Reload inbox when processed filter changes
  useEffect(() => {
    if (currentPage === 'inbox') {
      loadInboxItems();
    }
  }, [showProcessedOnly, currentPage, loadInboxItems]);

  // Reload daily review when type changes
  useEffect(() => {
    if (currentPage === 'daily') {
      loadDailyReview();
    }
  }, [reviewType, currentPage, loadDailyReview]);

  // Handle quick add submission
  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await trpc.createInboxItem.mutate(quickAddData);
      setQuickAddData({
        user_id: STUB_USER.id,
        content: '',
        tag: 'Work'
      });
      setIsQuickAddOpen(false);
      if (currentPage === 'inbox') {
        loadInboxItems();
      }
      if (currentPage === 'dashboard') {
        loadDashboardData();
      }
    } catch (error) {
      console.error('Failed to create inbox item:', error);
    }
  };

  // Handle inbox item toggle
  const handleInboxToggle = async (item: InboxItem) => {
    try {
      await trpc.updateInboxItem.mutate({
        id: item.id,
        user_id: STUB_USER.id,
        is_processed: !item.is_processed
      });
      loadInboxItems();
    } catch (error) {
      console.error('Failed to update inbox item:', error);
    }
  };

  // Handle inbox item delete
  const handleInboxDelete = async (id: number) => {
    try {
      await trpc.deleteInboxItem.mutate({ id, user_id: STUB_USER.id });
      loadInboxItems();
    } catch (error) {
      console.error('Failed to delete inbox item:', error);
    }
  };

  // Handle daily review save
  const handleDailyReviewSave = async () => {
    try {
      if (dailyReview) {
        // Update existing review
        const updateData: UpdateDailyReviewInput = {
          id: dailyReview.id,
          user_id: STUB_USER.id,
          todays_one_thing: dailyReviewData.todays_one_thing,
          top_three_tasks: dailyReviewData.top_three_tasks,
          gratitude: dailyReviewData.gratitude,
          accomplished: dailyReviewData.accomplished,
          distractions: dailyReviewData.distractions,
          tomorrows_shift: dailyReviewData.tomorrows_shift
        };
        await trpc.updateDailyReview.mutate(updateData);
      } else {
        // Create new review
        const createData: CreateDailyReviewInput = {
          user_id: STUB_USER.id,
          review_date: dailyReviewData.review_date!,
          type: reviewType,
          todays_one_thing: dailyReviewData.todays_one_thing,
          top_three_tasks: dailyReviewData.top_three_tasks,
          gratitude: dailyReviewData.gratitude,
          accomplished: dailyReviewData.accomplished,
          distractions: dailyReviewData.distractions,
          tomorrows_shift: dailyReviewData.tomorrows_shift
        };
        await trpc.createDailyReview.mutate(createData);
      }
      loadDailyReview();
    } catch (error) {
      console.error('Failed to save daily review:', error);
    }
  };

  // Handle weekly task creation
  const handleWeeklyTaskCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await trpc.createWeeklyTask.mutate(weeklyTaskData);
      setWeeklyTaskData({
        user_id: STUB_USER.id,
        title: '',
        column: 'Work',
        week_start_date: currentWeekStart
      });
      loadWeeklyTasks();
    } catch (error) {
      console.error('Failed to create weekly task:', error);
    }
  };

  // Handle weekly task delete
  const handleWeeklyTaskDelete = async (id: number) => {
    try {
      await trpc.deleteWeeklyTask.mutate({ id, user_id: STUB_USER.id });
      loadWeeklyTasks();
    } catch (error) {
      console.error('Failed to delete weekly task:', error);
    }
  };

  // Handle automation task creation
  const handleAutomationTaskCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await trpc.createAutomationTask.mutate(automationTaskData);
      setAutomationTaskData({
        user_id: STUB_USER.id,
        task_name: '',
        workflow_notes: null,
        status: 'To Automate'
      });
      loadAutomationTasks();
    } catch (error) {
      console.error('Failed to create automation task:', error);
    }
  };

  // Handle automation task delete
  const handleAutomationTaskDelete = async (id: number) => {
    try {
      await trpc.deleteAutomationTask.mutate({ id, user_id: STUB_USER.id });
      loadAutomationTasks();
    } catch (error) {
      console.error('Failed to delete automation task:', error);
    }
  };

  // Handle automation task status update
  const handleAutomationStatusUpdate = async (task: AutomationTask, newStatus: AutomationTask['status']) => {
    try {
      await trpc.updateAutomationTask.mutate({
        id: task.id,
        user_id: STUB_USER.id,
        status: newStatus
      });
      loadAutomationTasks();
    } catch (error) {
      console.error('Failed to update automation task:', error);
    }
  };

  const greeting = getTimeBasedGreeting();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                FocusForge
              </h1>
            </div>
            
            <div className="flex items-center space-x-1">
              {(['dashboard', 'inbox', 'daily', 'weekly', 'automation'] as const).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="capitalize"
                >
                  {page === 'dashboard' ? 'Dashboard' : page}
                </Button>
              ))}
            </div>

            <Dialog open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Quick Add
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Quick Add to Inbox</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleQuickAdd} className="space-y-4">
                  <div>
                    <Label htmlFor="content">What's on your mind?</Label>
                    <Textarea
                      id="content"
                      placeholder="Enter your thought or task..."
                      value={quickAddData.content}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setQuickAddData((prev: CreateInboxItemInput) => ({ ...prev, content: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="tag">Tag</Label>
                    <Select
                      value={quickAddData.tag || 'Work'}
                      onValueChange={(value: string) =>
                        setQuickAddData((prev: CreateInboxItemInput) => ({ ...prev, tag: value as CreateInboxItemInput['tag'] }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Work">Work</SelectItem>
                        <SelectItem value="Personal">Personal</SelectItem>
                        <SelectItem value="Side Hustle">Side Hustle</SelectItem>
                        <SelectItem value="Idea">Idea</SelectItem>
                        <SelectItem value="Gratitude">Gratitude</SelectItem>
                        <SelectItem value="Family">Family</SelectItem>
                        <SelectItem value="Self">Self</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full">
                    Add to Inbox
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentPage === 'dashboard' && (
          <div className="space-y-8">
            {/* Greeting */}
            <div className={`bg-gradient-to-r ${greeting.color} p-8 rounded-2xl text-white shadow-lg`}>
              <div className="flex items-center space-x-4">
                <span className="text-4xl">{greeting.icon}</span>
                <div>
                  <h2 className="text-3xl font-bold">{greeting.text}, {STUB_USER.name}!</h2>
                  <p className="text-white/90 mt-1">Ready to make today productive?</p>
                </div>
              </div>
            </div>

            {/* Today's Focus Tasks */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Clock className="w-6 h-6 mr-2 text-blue-500" />
                Today's Focus Tasks
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(['Work', 'Side Hustle', 'Personal'] as const).map((category) => {
                  const tasks = category === 'Work' ? focusTasks.work : 
                               category === 'Side Hustle' ? focusTasks.sideHustle : 
                               focusTasks.personal;
                  
                  return (
                    <Card key={category} className="hover:shadow-lg transition-all duration-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-3 ${
                            category === 'Work' ? 'bg-blue-500' :
                            category === 'Side Hustle' ? 'bg-purple-500' :
                            'bg-green-500'
                          }`} />
                          {category}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {tasks.length === 0 ? (
                          <p className="text-gray-500 text-sm">No tasks yet for today</p>
                        ) : (
                          <div className="space-y-2">
                            {tasks.slice(0, 3).map((task: InboxItem) => (
                              <div key={task.id} className="flex items-start space-x-2">
                                <Circle className="w-4 h-4 mt-0.5 text-gray-400" />
                                <span className="text-sm text-gray-700 line-clamp-2">{task.content}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {currentPage === 'inbox' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-gray-900">Capture Inbox</h2>
              <div className="flex items-center space-x-3">
                <Label htmlFor="processed-filter" className="text-sm font-medium">
                  Show processed only
                </Label>
                <Switch
                  id="processed-filter"
                  checked={showProcessedOnly}
                  onCheckedChange={setShowProcessedOnly}
                />
              </div>
            </div>

            <div className="grid gap-4">
              {inboxItems.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-gray-500">No items in your inbox yet. Use the Quick Add button to capture your thoughts!</p>
                </Card>
              ) : (
                inboxItems.map((item: InboxItem) => (
                  <Card key={item.id} className={`p-4 transition-all duration-200 ${
                    item.is_processed ? 'bg-green-50 border-green-200' : 'hover:shadow-md'
                  }`}>
                    <div className="flex items-start justify-between space-x-4">
                      <div className="flex items-start space-x-3 flex-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleInboxToggle(item)}
                          className="p-1 h-auto"
                        >
                          {item.is_processed ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <Circle className="w-5 h-5 text-gray-400" />
                          )}
                        </Button>
                        <div className="flex-1">
                          <p className={`text-gray-900 ${item.is_processed ? 'line-through opacity-60' : ''}`}>
                            {item.content}
                          </p>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {item.tag}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {item.created_at.toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleInboxDelete(item.id)}
                        className="text-red-500 hover:text-red-700 p-1 h-auto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {currentPage === 'daily' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-gray-900">Daily Review</h2>
              <Tabs 
                value={reviewType} 
                onValueChange={(value: string) => setReviewType(value as 'AM' | 'PM')}
              >
                <TabsList>
                  <TabsTrigger value="AM">Morning (AM)</TabsTrigger>
                  <TabsTrigger value="PM">Evening (PM)</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <Card className="p-6">
              <div className="space-y-6">
                {reviewType === 'AM' ? (
                  <>
                    <div>
                      <Label htmlFor="todays-one-thing" className="text-base font-semibold">
                        Today's One Thing 🎯
                      </Label>
                      <p className="text-sm text-gray-600 mb-2">What's the most important thing you want to accomplish today?</p>
                      <Textarea
                        id="todays-one-thing"
                        placeholder="Focus on..."
                        value={dailyReviewData.todays_one_thing || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setDailyReviewData((prev: Partial<CreateDailyReviewInput>) => ({
                            ...prev,
                            todays_one_thing: e.target.value || null
                          }))
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="top-three-tasks" className="text-base font-semibold">
                        Top 3 Tasks ✨
                      </Label>
                      <p className="text-sm text-gray-600 mb-2">What are the three most important tasks for today?</p>
                      <Textarea
                        id="top-three-tasks"
                        placeholder="1. &#10;2. &#10;3. "
                        value={dailyReviewData.top_three_tasks || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setDailyReviewData((prev: Partial<CreateDailyReviewInput>) => ({
                            ...prev,
                            top_three_tasks: e.target.value || null
                          }))
                        }
                        rows={4}
                      />
                    </div>

                    <div>
                      <Label htmlFor="gratitude" className="text-base font-semibold">
                        Gratitude 🙏
                      </Label>
                      <p className="text-sm text-gray-600 mb-2">What are you grateful for today?</p>
                      <Textarea
                        id="gratitude"
                        placeholder="I'm grateful for..."
                        value={dailyReviewData.gratitude || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setDailyReviewData((prev: Partial<CreateDailyReviewInput>) => ({
                            ...prev,
                            gratitude: e.target.value || null
                          }))
                        }
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <Label htmlFor="accomplished" className="text-base font-semibold">
                        What Was Accomplished 🎉
                      </Label>
                      <p className="text-sm text-gray-600 mb-2">What did you achieve today?</p>
                      <Textarea
                        id="accomplished"
                        placeholder="Today I accomplished..."
                        value={dailyReviewData.accomplished || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setDailyReviewData((prev: Partial<CreateDailyReviewInput>) => ({
                            ...prev,
                            accomplished: e.target.value || null
                          }))
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="distractions" className="text-base font-semibold">
                        What Distracted You 🔍
                      </Label>
                      <p className="text-sm text-gray-600 mb-2">What pulled your attention away from your goals?</p>
                      <Textarea
                        id="distractions"
                        placeholder="I was distracted by..."
                        value={dailyReviewData.distractions || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setDailyReviewData((prev: Partial<CreateDailyReviewInput>) => ({
                            ...prev,
                            distractions: e.target.value || null
                          }))
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="tomorrows-shift" className="text-base font-semibold">
                        Tomorrow's Shift 🌅
                      </Label>
                      <p className="text-sm text-gray-600 mb-2">What will you do differently tomorrow?</p>
                      <Textarea
                        id="tomorrows-shift"
                        placeholder="Tomorrow I will..."
                        value={dailyReviewData.tomorrows_shift || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setDailyReviewData((prev: Partial<CreateDailyReviewInput>) => ({
                            ...prev,
                            tomorrows_shift: e.target.value || null
                          }))
                        }
                      />
                    </div>
                  </>
                )}

                <Button onClick={handleDailyReviewSave} className="w-full">
                  Save {reviewType} Review
                </Button>
              </div>
            </Card>
          </div>
        )}

        {currentPage === 'weekly' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900">Weekly Planner</h2>
            
            {/* Add Task Form */}
            <Card className="p-4">
              <form onSubmit={handleWeeklyTaskCreate} className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label htmlFor="task-title">Task Title</Label>
                  <Input
                    id="task-title"
                    placeholder="Enter task title..."
                    value={weeklyTaskData.title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setWeeklyTaskData((prev: CreateWeeklyTaskInput) => ({ ...prev, title: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="w-40">
                  <Label htmlFor="task-column">Column</Label>
                  <Select
                    value={weeklyTaskData.column || 'Work'}
                    onValueChange={(value: string) =>
                      setWeeklyTaskData((prev: CreateWeeklyTaskInput) => ({ ...prev, column: value as CreateWeeklyTaskInput['column'] }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Work">Work</SelectItem>
                      <SelectItem value="Side Hustle">Side Hustle</SelectItem>
                      <SelectItem value="Family">Family</SelectItem>
                      <SelectItem value="Self">Self</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit">Add Task</Button>
              </form>
            </Card>

            {/* Kanban Board */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {(['Work', 'Side Hustle', 'Family', 'Self'] as const).map((column) => {
                const columnTasks = weeklyTasks.filter((task: WeeklyTask) => task.column === column);
                
                return (
                  <Card key={column} className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-lg flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-2 ${
                          column === 'Work' ? 'bg-blue-500' :
                          column === 'Side Hustle' ? 'bg-purple-500' :
                          column === 'Family' ? 'bg-green-500' :
                          'bg-orange-500'
                        }`} />
                        {column}
                      </h3>
                      <Badge variant="secondary">{columnTasks.length}</Badge>
                    </div>
                    
                    <div className="space-y-3 min-h-[200px]">
                      {columnTasks.map((task: WeeklyTask) => (
                        <Card key={task.id} className="p-3 bg-gray-50 cursor-grab hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-2 flex-1">
                              <GripVertical className="w-4 h-4 text-gray-400 mt-0.5" />
                              <p className="text-sm font-medium text-gray-900">{task.title}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleWeeklyTaskDelete(task.id)}
                              className="text-red-500 hover:text-red-700 p-1 h-auto ml-2"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {currentPage === 'automation' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900">Automation Tracker</h2>
            
            {/* Add Automation Task Form */}
            <Card className="p-6">
              <form onSubmit={handleAutomationTaskCreate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="task-name">Task Name</Label>
                    <Input
                      id="task-name"
                      placeholder="Enter manual task to automate..."
                      value={automationTaskData.task_name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setAutomationTaskData((prev: CreateAutomationTaskInput) => ({ ...prev, task_name: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={automationTaskData.status || 'To Automate'}
                      onValueChange={(value: string) =>
                        setAutomationTaskData((prev: CreateAutomationTaskInput) => ({ ...prev, status: value as CreateAutomationTaskInput['status'] }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="To Automate">To Automate</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Automated">Automated</SelectItem>
                        <SelectItem value="Needs Review">Needs Review</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="workflow-notes">Workflow Notes</Label>
                  <Textarea
                    id="workflow-notes"
                    placeholder="Describe the current manual process and automation ideas..."
                    value={automationTaskData.workflow_notes || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setAutomationTaskData((prev: CreateAutomationTaskInput) => ({
                        ...prev,
                        workflow_notes: e.target.value || null
                      }))
                    }
                    rows={3}
                  />
                </div>
                <Button type="submit" className="w-full">Add Automation Task</Button>
              </form>
            </Card>

            {/* Automation Tasks List */}
            <div className="grid gap-4">
              {automationTasks.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-gray-500">No automation tasks yet. Add manual processes you'd like to automate!</p>
                </Card>
              ) : (
                automationTasks.map((task: AutomationTask) => (
                  <Card key={task.id} className="p-6">
                    <div className="flex items-start justify-between space-x-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{task.task_name}</h3>
                          <Badge 
                            variant={
                              task.status === 'Automated' ? 'default' :
                              task.status === 'In Progress' ? 'secondary' :
                              task.status === 'Needs Review' ? 'destructive' :
                              'outline'
                            }
                          >
                            {task.status}
                          </Badge>
                        </div>
                        {task.workflow_notes && (
                          <p className="text-gray-600 text-sm mb-3">{task.workflow_notes}</p>
                        )}
                        <div className="flex items-center space-x-4">
                          <Select
                            value={task.status}
                            onValueChange={(value: string) =>
                              handleAutomationStatusUpdate(task, value as AutomationTask['status'])
                            }
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="To Automate">To Automate</SelectItem>
                              <SelectItem value="In Progress">In Progress</SelectItem>
                              <SelectItem value="Automated">Automated</SelectItem>
                              <SelectItem value="Needs Review">Needs Review</SelectItem>
                            </SelectContent>
                          </Select>
                          <span className="text-xs text-gray-500">
                            Created: {task.created_at.toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAutomationTaskDelete(task.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;

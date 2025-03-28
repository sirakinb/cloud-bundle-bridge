
import { Task, PomodoroSession } from "@/contexts/TaskContext";
import { differenceInDays, isBefore, isAfter, isSameDay, startOfDay, addMinutes, format, addDays, parse, parseISO, isValid } from "date-fns";
import { toast } from "@/hooks/use-toast";

// Score factors - can be adjusted to change prioritization weighting
const URGENCY_WEIGHT = 3;
const DEADLINE_WEIGHT = 2;
const DIFFICULTY_WEIGHT = 1;

type PriorityScore = {
  task: Task;
  score: number;
  category: 'critical' | 'high' | 'medium' | 'low';
  deadlineProximity: number; // Days until deadline, 0 for today
};

// Calculate difficulty score (1-3)
export const getDifficultyScore = (difficulty: 'easy' | 'medium' | 'hard'): number => {
  switch (difficulty) {
    case 'hard': return 3;
    case 'medium': return 2;
    case 'easy': return 1;
    default: return 1;
  }
};

// Calculate urgency score (1-3)
export const getUrgencyScore = (urgency: 'low' | 'medium' | 'high'): number => {
  switch (urgency) {
    case 'high': return 3;
    case 'medium': return 2;
    case 'low': return 1;
    default: return 1;
  }
};

// Calculate deadline proximity score (higher for closer deadlines)
export const getDeadlineScore = (dueDate?: Date): number => {
  if (!dueDate) return 0;
  
  const today = startOfDay(new Date());
  
  // If deadline has passed, give highest priority
  if (isBefore(dueDate, today)) return 10;
  
  // If due today, high priority
  if (isSameDay(dueDate, today)) return 5;
  
  // Otherwise, score based on proximity (closer = higher score)
  const daysUntilDue = differenceInDays(dueDate, today);
  
  if (daysUntilDue <= 1) return 4;
  if (daysUntilDue <= 3) return 3;
  if (daysUntilDue <= 7) return 2;
  return 1;
};

// Calculate overall priority score for a task
export const calculatePriorityScore = (task: Task): PriorityScore => {
  const urgencyScore = getUrgencyScore(task.urgency) * URGENCY_WEIGHT;
  const difficultyScore = getDifficultyScore(task.difficulty) * DIFFICULTY_WEIGHT;
  const deadlineScore = getDeadlineScore(task.dueDate) * DEADLINE_WEIGHT;
  
  const totalScore = urgencyScore + difficultyScore + deadlineScore;
  
  // Calculate days until deadline
  let deadlineProximity = -1; // -1 means no deadline
  if (task.dueDate) {
    const today = startOfDay(new Date());
    deadlineProximity = differenceInDays(task.dueDate, today);
    // If deadline has passed, make it negative
    if (isBefore(task.dueDate, today)) {
      deadlineProximity = -deadlineProximity;
    }
  }
  
  // Assign priority category based on score
  let category: 'critical' | 'high' | 'medium' | 'low' = 'low';
  if (totalScore >= 15) category = 'critical';
  else if (totalScore >= 10) category = 'high';
  else if (totalScore >= 5) category = 'medium';
  
  return {
    task,
    score: totalScore,
    category,
    deadlineProximity
  };
};

// Get prioritized tasks sorted by score
export const getPrioritizedTasks = (tasks: Task[]): PriorityScore[] => {
  return tasks
    .filter(task => !task.completed)
    .map(calculatePriorityScore)
    .sort((a, b) => b.score - a.score);
};

// Get optimized daily workload
export const getOptimizedDailyTasks = (
  tasks: Task[], 
  maxDailyMinutes: number = 240 // Default 4 hours of focused work
): Task[] => {
  const prioritizedTasks = getPrioritizedTasks(tasks);
  const dailyTasks: Task[] = [];
  let totalMinutes = 0;
  
  // Add tasks until we reach the max daily minutes
  for (const { task } of prioritizedTasks) {
    // For multi-day tasks, check if there are any pomodoro sessions for today
    if (task.taskType === 'multi-day' && task.pomodoroSessions) {
      const today = startOfDay(new Date());
      const todaysSessions = task.pomodoroSessions.filter(
        session => isSameDay(session.startTime, today) && !session.completed
      );
      
      // Add the task if it has sessions today and isn't already included
      if (todaysSessions.length > 0 && !dailyTasks.includes(task)) {
        // Calculate time for today's sessions
        const todaysMinutes = todaysSessions.reduce(
          (total, session) => 
            total + Math.round(
              (session.endTime.getTime() - session.startTime.getTime()) / (1000 * 60)
            ), 
          0
        );
        
        // Only add if we have enough time left
        if (totalMinutes + todaysMinutes <= maxDailyMinutes) {
          dailyTasks.push(task);
          totalMinutes += todaysMinutes;
        }
      }
    } 
    // For one-time tasks
    else if (task.taskType === 'one-time') {
      // Only add if we have enough time left
      if (totalMinutes + task.duration <= maxDailyMinutes) {
        dailyTasks.push(task);
        totalMinutes += task.duration;
      }
    }
  }
  
  return dailyTasks;
};

// Constants for Pomodoro scheduling
const POMODORO_LENGTH = 25; // Standard pomodoro length in minutes
const BREAK_LENGTH = 5; // Standard break length in minutes
const LONG_BREAK_LENGTH = 15; // Length of longer breaks in minutes
const POMODOROS_BEFORE_LONG_BREAK = 4; // Number of pomodoros before a long break

// Schedule Pomodoro sessions based on prioritized tasks
export const schedulePomodoroSessions = (
  tasks: Task[],
  isTimeUnavailable: (date: Date) => boolean,
  startDate: Date = new Date(),
  daysToSchedule: number = 7
): { task: Task, sessions: PomodoroSession[] }[] => {
  const prioritizedTasks = getPrioritizedTasks(tasks)
    .filter(({ task }) => !task.completed);
  
  // Result array containing tasks with their scheduled sessions
  const scheduledTasks: { task: Task, sessions: PomodoroSession[] }[] = [];
  
  // Start scheduling from the beginning of the provided start date
  let currentDate = startOfDay(startDate);
  let endSchedulingDate = addDays(currentDate, daysToSchedule);
  
  // Track how many pomodoros have been scheduled before a long break
  let pomodorosUntilLongBreak = POMODOROS_BEFORE_LONG_BREAK;
  
  // Function to find next available time slot
  const findNextAvailableSlot = (fromDate: Date, duration: number): Date | null => {
    // Create a copy of the date to avoid modifying the original
    let testDate = new Date(fromDate);
    let maxAttempts = 336; // Try slots for up to 7 days (48 slots per day * 7 days)
    let attempts = 0;
    
    // Start searching from 8am
    if (testDate.getHours() < 8) {
      testDate.setHours(8, 0, 0, 0);
    }
    
    // Stay within scheduling period
    if (isAfter(testDate, endSchedulingDate)) {
      return null;
    }
    
    while (attempts < maxAttempts) {
      attempts++;
      
      // If we're past 8pm, move to 8am the next day
      if (testDate.getHours() >= 20) {
        testDate = addDays(testDate, 1);
        testDate.setHours(8, 0, 0, 0);
        
        // Check if we're still within the scheduling period
        if (isAfter(testDate, endSchedulingDate)) {
          return null;
        }
      }
      
      // Check if this time slot is available
      const endTime = addMinutes(testDate, duration);
      let slotIsAvailable = true;
      
      // Check every 5 minutes during the proposed session to make sure none are unavailable
      let checkTime = new Date(testDate);
      while (isBefore(checkTime, endTime)) {
        if (isTimeUnavailable(checkTime)) {
          slotIsAvailable = false;
          break;
        }
        checkTime = addMinutes(checkTime, 5);
      }
      
      // Also check for overlaps with already scheduled sessions
      for (const { sessions } of scheduledTasks) {
        for (const session of sessions) {
          if (
            (isBefore(testDate, session.endTime) && isAfter(endTime, session.startTime)) ||
            isSameDay(testDate, session.startTime)
          ) {
            // There's an overlap
            slotIsAvailable = false;
            // Move past this session
            testDate = new Date(session.endTime);
            break;
          }
        }
        if (!slotIsAvailable) break;
      }
      
      if (slotIsAvailable) {
        return testDate;
      }
      
      // Move to the next 15-minute increment
      testDate = addMinutes(testDate, 15);
    }
    
    // If we've tried all possible slots and none are available
    return null;
  };
  
  // Schedule each task based on priority
  for (const { task } of prioritizedTasks) {
    const taskSessions: PomodoroSession[] = [];
    
    // Calculate how many pomodoros we need based on task duration and difficulty
    let totalPomodorosNeeded = Math.ceil(task.duration / POMODORO_LENGTH);
    
    // For hard or long tasks, add extra pomodoros for breaks and potential overruns
    if (task.difficulty === 'hard' || task.duration > 60) {
      totalPomodorosNeeded = Math.ceil(totalPomodorosNeeded * 1.25);
    }
    
    // Determine max pomodoros per day based on task urgency
    let maxPomodorosPerDay = 4; // Default
    if (task.urgency === 'high') maxPomodorosPerDay = 6;
    else if (task.urgency === 'medium') maxPomodorosPerDay = 5;
    
    // Set our starting point for scheduling
    let schedulingDate = new Date(currentDate);
    let pomodorosScheduledToday = 0;
    let pomodorosScheduled = 0;
    
    // Schedule all needed pomodoros
    while (pomodorosScheduled < totalPomodorosNeeded) {
      // Check if we need to start a new day
      if (pomodorosScheduledToday >= maxPomodorosPerDay) {
        schedulingDate = addDays(schedulingDate, 1);
        schedulingDate.setHours(8, 0, 0, 0); // Start at 8am
        pomodorosScheduledToday = 0;
        pomodorosUntilLongBreak = POMODOROS_BEFORE_LONG_BREAK; // Reset long break counter for new day
      }
      
      // Determine break type (regular or long)
      const breakDuration = pomodorosUntilLongBreak === 1 ? LONG_BREAK_LENGTH : BREAK_LENGTH;
      
      // Find next available slot for this pomodoro + break
      const sessionStartTime = findNextAvailableSlot(schedulingDate, POMODORO_LENGTH + breakDuration);
      
      if (!sessionStartTime) {
        // If we couldn't find any slots in the scheduling period, stop trying
        break;
      }
      
      // Set the end time for this pomodoro
      const sessionEndTime = addMinutes(sessionStartTime, POMODORO_LENGTH);
      
      // Create the pomodoro session
      const session: PomodoroSession = {
        id: Math.random().toString(36).substring(2, 9),
        taskId: task.id,
        startTime: sessionStartTime,
        endTime: sessionEndTime,
        completed: false
      };
      
      taskSessions.push(session);
      pomodorosScheduled++;
      pomodorosScheduledToday++;
      pomodorosUntilLongBreak--;
      
      // Reset long break counter if needed
      if (pomodorosUntilLongBreak === 0) {
        pomodorosUntilLongBreak = POMODOROS_BEFORE_LONG_BREAK;
      }
      
      // Set the next scheduling start time to after this pomodoro + break
      schedulingDate = addMinutes(sessionEndTime, breakDuration);
    }
    
    // Only add tasks where we were able to schedule at least one pomodoro
    if (taskSessions.length > 0) {
      scheduledTasks.push({
        task,
        sessions: taskSessions
      });
      
      // Show a success toast notification
      toast({
        title: "Task scheduled",
        description: `${taskSessions.length} focus sessions scheduled for "${task.name}"`,
      });
    }
  }
  
  return scheduledTasks;
};

// Apply scheduled Pomodoro sessions to tasks
export const applyScheduledPomodoros = (
  tasks: Task[],
  scheduledTasks: { task: Task, sessions: PomodoroSession[] }[]
): Task[] => {
  // Create a copy of the tasks array to avoid mutating the original
  const updatedTasks = [...tasks];
  
  // Apply the scheduled sessions to each task
  for (const { task, sessions } of scheduledTasks) {
    // Find the task in our tasks array
    const taskIndex = updatedTasks.findIndex(t => t.id === task.id);
    
    if (taskIndex !== -1) {
      // Update the task with the new sessions
      updatedTasks[taskIndex] = {
        ...updatedTasks[taskIndex],
        taskType: 'multi-day', // Convert to multi-day if it wasn't already
        pomodoroSessions: sessions
      };
    }
  }
  
  return updatedTasks;
};

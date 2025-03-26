import { Task } from "@/contexts/TaskContext";
import { differenceInDays, isBefore, isAfter, isSameDay, startOfDay } from "date-fns";

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

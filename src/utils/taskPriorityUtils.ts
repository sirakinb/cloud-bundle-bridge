import { differenceInDays, isBefore, isAfter, isSameDay, startOfDay, addMinutes, format, addDays, parse, parseISO, isValid, isWithinInterval } from "date-fns";
import { toast } from "@/hooks/use-toast";

// Score factors - can be adjusted to change prioritization weighting
const URGENCY_WEIGHT = 5;
const DEADLINE_WEIGHT = 3;
const DIFFICULTY_WEIGHT = 2;

type PriorityScore = {
  task: Task;
  score: number;
  category: 'critical' | 'high' | 'medium' | 'low';
  deadlineProximity: number; // Days until deadline, 0 for today
};

interface UnavailableTimeBlock {
  days: string[];
  startTime: string;
  endTime: string;
}

interface Task {
  id: string;
  name: string;
  difficulty: 'easy' | 'medium' | 'hard';
  completed: boolean;
  estimatedDuration?: number;
  allowMoreThanFourPomodoros?: boolean;
  urgency: 'high' | 'medium' | 'low';
  dueDate: Date;
  taskType: string;
  pomodoroSessions: PomodoroSession[];
  duration?: number;
}

interface PomodoroSession {
  id: string;
  taskId: string;
  taskName: string;
  startTime: Date;
  endTime: Date;
  completed: boolean;
  sessionNumber: number;
  totalSessions: number;
}

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

// Get prioritized tasks with scores
export const getPrioritizedTasks = (tasks: Task[]): PriorityScore[] => {
  const today = new Date();
  
  return tasks
    .map(task => {
      let score = 0;
      let deadlineProximity = task.dueDate ? differenceInDays(task.dueDate, today) : 14;
      
      // Urgency score (0-5)
      const urgencyScores = { high: 5, medium: 3, low: 1 };
      score += (urgencyScores[task.urgency] || 1) * URGENCY_WEIGHT;
      
      // Deadline proximity score (0-5)
      if (task.dueDate) {
        const daysUntilDue = Math.max(0, deadlineProximity);
        score += ((5 - Math.min(5, daysUntilDue)) * DEADLINE_WEIGHT);
      }
      
      // Difficulty score (0-5)
      const difficultyScores = { hard: 5, medium: 3, easy: 1 };
      score += (difficultyScores[task.difficulty] || 1) * DIFFICULTY_WEIGHT;
      
      // Determine priority category
      let category: 'critical' | 'high' | 'medium' | 'low';
      if (score >= 35) category = 'critical';
      else if (score >= 25) category = 'high';
      else if (score >= 15) category = 'medium';
      else category = 'low';
      
      return {
        task,
        score,
        category,
        deadlineProximity
      };
    })
    .sort((a, b) => {
      // First sort by score (descending)
      if (b.score !== a.score) return b.score - a.score;
      
      // If scores are equal, sort by deadline proximity (ascending)
      return a.deadlineProximity - b.deadlineProximity;
    });
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
const MAX_POMODOROS_PER_DAY = 8; // Maximum number of pomodoros per day
const MAX_SEQUENTIAL_POMODOROS = 4; // Maximum number of pomodoros in sequence

// Check if a time slot is already occupied by another session
const isTimeSlotOccupied = (
  time: Date,
  duration: number,
  existingSessions: PomodoroSession[]
): boolean => {
  const endTime = addMinutes(time, duration);
  
  return existingSessions.some(session => {
    return (
      (isWithinInterval(time, { start: session.startTime, end: session.endTime }) ||
       isWithinInterval(endTime, { start: session.startTime, end: session.endTime }) ||
       isWithinInterval(session.startTime, { start: time, end: endTime }))
    );
  });
};

// Schedule Pomodoro sessions based on prioritized tasks
export const schedulePomodoroSessions = (
  prioritizedTasks: PriorityScore[],
  unavailableTimes: UnavailableTimeBlock[],
  startDate: Date = new Date()
): PomodoroSession[] => {
  const sessions: PomodoroSession[] = [];
  let currentDate = startOfDay(startDate);
  let currentTime = startDate;
  let pomodorosToday = 0;
  let sequentialPomodoros = 0;

  for (const { task } of prioritizedTasks) {
    if (task.completed) continue;

    // Calculate number of pomodoros needed based on estimated duration
    const pomodorosNeeded = calculatePomodorosNeeded(task);
    let pomodorosScheduled = 0;

    while (pomodorosScheduled < pomodorosNeeded) {
      // Check if we need to move to next day
      if (pomodorosToday >= MAX_POMODOROS_PER_DAY) {
        currentDate = addDays(currentDate, 1);
        currentTime = startOfDay(currentDate);
        pomodorosToday = 0;
        sequentialPomodoros = 0;
      }

      // Find next available time slot that's not occupied
      while (
        isTimeSlotUnavailable(currentTime, unavailableTimes) ||
        isTimeSlotOccupied(currentTime, POMODORO_LENGTH, sessions)
      ) {
        currentTime = addMinutes(currentTime, 30); // Try next 30-minute slot
        if (format(currentTime, 'HH:mm') === '00:00') {
          // If we've reached midnight, move to next day
          currentDate = addDays(currentDate, 1);
          currentTime = startOfDay(currentDate);
          pomodorosToday = 0;
          sequentialPomodoros = 0;
        }
      }

      // Schedule a pomodoro session
      const session: PomodoroSession = {
        id: crypto.randomUUID(),
        taskId: task.id,
        taskName: task.name,
        startTime: currentTime,
        endTime: addMinutes(currentTime, POMODORO_LENGTH),
        completed: false,
        sessionNumber: pomodorosScheduled + 1,
        totalSessions: pomodorosNeeded
      };
      sessions.push(session);
      pomodorosScheduled++;
      pomodorosToday++;
      sequentialPomodoros++;

      // Move to next time slot
      currentTime = session.endTime;

      // Add appropriate break
      if (pomodorosScheduled < pomodorosNeeded) { // Only add break if not the last pomodoro
        if (sequentialPomodoros === POMODOROS_BEFORE_LONG_BREAK) {
          // Add long break if we've completed 4 pomodoros
          if (!isTimeSlotUnavailable(currentTime, unavailableTimes) && 
              !isTimeSlotOccupied(currentTime, LONG_BREAK_LENGTH, sessions)) {
            sessions.push({
              id: crypto.randomUUID(),
              taskId: task.id,
              taskName: `${task.name} - Long Break`,
              startTime: currentTime,
              endTime: addMinutes(currentTime, LONG_BREAK_LENGTH),
              completed: false,
              sessionNumber: 0,
              totalSessions: 0
            });
            currentTime = addMinutes(currentTime, LONG_BREAK_LENGTH);
          }
          sequentialPomodoros = 0;
        } else {
          // Add short break
          if (!isTimeSlotUnavailable(currentTime, unavailableTimes) && 
              !isTimeSlotOccupied(currentTime, BREAK_LENGTH, sessions)) {
            sessions.push({
              id: crypto.randomUUID(),
              taskId: task.id,
              taskName: `${task.name} - Short Break`,
              startTime: currentTime,
              endTime: addMinutes(currentTime, BREAK_LENGTH),
              completed: false,
              sessionNumber: 0,
              totalSessions: 0
            });
            currentTime = addMinutes(currentTime, BREAK_LENGTH);
          }
        }
      }
    }
  }

  return sessions;
};

// Calculate number of Pomodoro sessions needed based on duration
const calculatePomodorosNeeded = (task: Task): number => {
  if (task.estimatedDuration) {
    // Calculate number of full Pomodoros needed
    return Math.ceil(task.estimatedDuration / POMODORO_LENGTH);
  }
  
  // Fallback to difficulty-based calculation if no duration specified
  const difficultyMultipliers = {
    easy: 1,
    medium: 2,
    hard: 4
  };
  
  return difficultyMultipliers[task.difficulty] || 1;
};

const getDailyTaskPomodoroCount = (
  sessions: PomodoroSession[],
  taskId: string,
  date: Date
): number => {
  return sessions.filter(session => 
    session.taskId === taskId &&
    session.completed === false &&
    isSameDay(session.startTime, date)
  ).length;
};

const isTimeSlotUnavailable = (
  time: Date,
  unavailableTimes: UnavailableTimeBlock[]
): boolean => {
  const dayOfWeek = format(time, 'EEEE').toLowerCase();
  const timeString = format(time, 'HH:mm');
  
  return unavailableTimes.some(block => {
    if (block.days.includes(dayOfWeek)) {
      const blockStart = parse(block.startTime, 'HH:mm', time);
      const blockEnd = parse(block.endTime, 'HH:mm', time);
      const currentTime = parse(timeString, 'HH:mm', time);
      
      // Set the dates to be the same for proper comparison
      blockStart.setFullYear(time.getFullYear(), time.getMonth(), time.getDate());
      blockEnd.setFullYear(time.getFullYear(), time.getMonth(), time.getDate());
      currentTime.setFullYear(time.getFullYear(), time.getMonth(), time.getDate());
      
      return isWithinInterval(currentTime, { start: blockStart, end: blockEnd });
    }
    return false;
  });
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

export function generatePomodoroSessions(taskId: string, startDate: Date): PomodoroSession[] {
  const sessions: PomodoroSession[] = [];
  let currentTime = startDate;

  for (let i = 0; i < MAX_POMODOROS_PER_DAY; i++) {
    const session: PomodoroSession = {
      id: crypto.randomUUID(),
      taskId: taskId,
      taskName: '',
      startTime: currentTime,
      endTime: addMinutes(currentTime, POMODORO_LENGTH),
      completed: false,
      sessionNumber: i + 1,
      totalSessions: MAX_POMODOROS_PER_DAY
    };
    sessions.push(session);
    currentTime = addMinutes(currentTime, POMODORO_LENGTH);

    // Add a long break after every 4 pomodoros
    if ((i + 1) % POMODOROS_BEFORE_LONG_BREAK === 0) {
      sessions.push({
        id: crypto.randomUUID(),
        taskId: taskId,
        taskName: 'Long Break',
        startTime: currentTime,
        endTime: addMinutes(currentTime, LONG_BREAK_LENGTH),
        completed: false,
        sessionNumber: 0,
        totalSessions: 0
      });
      currentTime = addMinutes(currentTime, LONG_BREAK_LENGTH);
    } else if (i < MAX_POMODOROS_PER_DAY - 1) {
      // Add a short break between pomodoros (except after the last one)
      sessions.push({
        id: crypto.randomUUID(),
        taskId: taskId,
        taskName: 'Short Break',
        startTime: currentTime,
        endTime: addMinutes(currentTime, BREAK_LENGTH),
        completed: false,
        sessionNumber: 0,
        totalSessions: 0
      });
      currentTime = addMinutes(currentTime, BREAK_LENGTH);
    }
  }

  return sessions;
}

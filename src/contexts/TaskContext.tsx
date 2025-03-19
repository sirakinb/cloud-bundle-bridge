import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { differenceInDays, isToday, addDays, subDays, addMinutes } from "date-fns";
import { useUnavailableTimes } from "./UnavailableTimesContext";

export type TaskType = 'one-time' | 'multi-day';

export interface PomodoroSession {
  id: string;
  taskId: string;
  startTime: Date;
  endTime: Date;
  completed: boolean;
}

export interface Task {
  id: string;
  name: string;
  description: string;
  dueDate?: Date;
  startDate?: Date;
  urgency: 'low' | 'medium' | 'high';
  difficulty: 'easy' | 'medium' | 'hard';
  completed: boolean;
  duration: number;
  taskType: TaskType;
  pomodoroSessions?: PomodoroSession[];
}

interface TaskContextType {
  tasks: Task[];
  addTask: (task: Omit<Task, "id" | "completed" | "urgency" | "startDate" | "pomodoroSessions">) => void;
  removeTask: (id: string) => void;
  toggleTaskCompletion: (id: string) => void;
  updateTaskDifficulty: (id: string, difficulty: 'easy' | 'medium' | 'hard') => void;
  calculateUrgency: (dueDate?: Date) => 'low' | 'medium' | 'high';
  getTasksForDateRange: (startDate: Date, endDate: Date) => Task[];
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

const getTaskDuration = (difficulty: 'easy' | 'medium' | 'hard'): number => {
  switch (difficulty) {
    case 'easy': return 30;
    case 'medium': return 60;
    case 'hard': return 120;
    default: return 60;
  }
};

const calculateStartDate = (dueDate?: Date, duration: number = 60): Date | undefined => {
  if (!dueDate) return undefined;

  const daysToSubtract = Math.max(1, Math.ceil(duration / 120));
  return subDays(dueDate, daysToSubtract);
};

// Generate Pomodoro sessions for multi-day tasks
const generatePomodoroSessions = (
  taskId: string, 
  startDate?: Date, 
  dueDate?: Date, 
  totalDuration: number = 60,
  isTimeUnavailable?: (date: Date) => boolean
): PomodoroSession[] => {
  if (!startDate || !dueDate) return [];
  
  const sessions: PomodoroSession[] = [];
  const daysDifference = Math.max(1, differenceInDays(dueDate, startDate));
  
  // Standard Pomodoro: 25 min work
  const POMODORO_LENGTH = 25; // in minutes
  
  // Calculate total number of Pomodoros needed
  const totalPomodoros = Math.ceil(totalDuration / POMODORO_LENGTH);
  
  // Calculate minimum pomodoros per day (evenly distribute across all days)
  let minPomodorosPerDay = Math.floor(totalPomodoros / daysDifference);
  
  // Calculate remaining pomodoros after even distribution
  let remainingPomodoros = totalPomodoros - (minPomodorosPerDay * daysDifference);
  
  // Create a distribution plan - start with minimum per day
  const distributionPlan: number[] = Array(daysDifference).fill(minPomodorosPerDay);
  
  // Distribute remaining pomodoros (one extra to some days)
  for (let i = 0; i < remainingPomodoros; i++) {
    distributionPlan[i % daysDifference]++;
  }
  
  // Now generate the actual pomodoro sessions based on the distribution plan
  let currentDate = new Date(startDate);
  let dayIndex = 0;
  
  while (dayIndex < distributionPlan.length) {
    const pomodorosForThisDay = distributionPlan[dayIndex];
    if (pomodorosForThisDay > 0) {
      const dayPomodoros = createPomodorosForDay(
        taskId,
        new Date(currentDate),
        pomodorosForThisDay,
        isTimeUnavailable
      );
      
      sessions.push(...dayPomodoros);
    }
    
    // Move to next day
    currentDate = addDays(currentDate, 1);
    dayIndex++;
  }
  
  return sessions;
};

// Helper function to create multiple pomodoro sessions for a specific day
const createPomodorosForDay = (
  taskId: string,
  date: Date,
  count: number,
  isTimeUnavailable?: (date: Date) => boolean
): PomodoroSession[] => {
  const sessions: PomodoroSession[] = [];
  const POMODORO_LENGTH = 25; // minutes
  const BREAK_LENGTH = 5; // minutes
  
  // Spread pomodoros throughout the day (8am - 8pm = 12 hours)
  // If we need many in one day, we'll group them with breaks in between
  
  // Start sessions at 8 AM by default
  const sessionDate = new Date(date);
  sessionDate.setHours(8, 0, 0, 0);
  
  // Try to create pomodoro groups
  let pomodorosCreated = 0;
  let maxAttempts = count * 4; // Give ourselves plenty of attempts
  let attemptCount = 0;
  
  // Try different start times throughout the day (8am to 7pm)
  for (let hour = 8; hour < 20 && pomodorosCreated < count && attemptCount < maxAttempts; hour++) {
    // Try multiple time slots within each hour
    for (let minute = 0; minute < 60 && pomodorosCreated < count && attemptCount < maxAttempts; minute += 15) {
      attemptCount++;
      
      // How many pomodoros can we fit in sequence here (with breaks)?
      // Start with at least 1, up to 3 in a row
      const maxSequentialPomodoros = Math.min(3, count - pomodorosCreated);
      
      // Check if we can fit at least one pomodoro here
      let sequentialPomodoros = 0;
      let currentSlotTime = new Date(sessionDate);
      currentSlotTime.setHours(hour, minute, 0, 0);
      
      // Try to fit up to maxSequentialPomodoros in sequence
      for (let i = 0; i < maxSequentialPomodoros; i++) {
        const sessionStart = new Date(currentSlotTime);
        const sessionEnd = new Date(sessionStart);
        sessionEnd.setMinutes(sessionEnd.getMinutes() + POMODORO_LENGTH);
        
        // Check if this time slot is available
        if (!isTimeUnavailable || 
            (!isTimeUnavailable(sessionStart) && !isTimeUnavailable(sessionEnd))) {
          sequentialPomodoros++;
          
          // Add this session
          sessions.push({
            id: Math.random().toString(36).substring(2, 9),
            taskId,
            startTime: new Date(sessionStart),
            endTime: new Date(sessionEnd),
            completed: false
          });
          
          pomodorosCreated++;
          
          // Update current slot time to after a break
          currentSlotTime = new Date(sessionEnd);
          currentSlotTime.setMinutes(currentSlotTime.getMinutes() + BREAK_LENGTH);
        } else {
          // This slot isn't available, stop trying to add sequential pomodoros
          break;
        }
        
        // If we've added all needed pomodoros, exit
        if (pomodorosCreated >= count) break;
      }
      
      // If we added any pomodoros in this slot, jump ahead to the next 30-min boundary
      if (sequentialPomodoros > 0) {
        minute = Math.ceil(minute / 30) * 30;
      }
    }
  }
  
  // If we couldn't schedule all pomodoros due to unavailable times,
  // create them anyway but mark them as potential conflicts
  if (pomodorosCreated < count) {
    console.warn(`Could only schedule ${pomodorosCreated} of ${count} required Pomodoro sessions for ${date.toDateString()} due to time constraints.`);
    
    // Add remaining pomodoros at 9pm (as a fallback)
    let fallbackTime = new Date(date);
    fallbackTime.setHours(21, 0, 0, 0);
    
    for (let i = pomodorosCreated; i < count; i++) {
      const sessionStart = new Date(fallbackTime);
      const sessionEnd = new Date(sessionStart);
      sessionEnd.setMinutes(sessionEnd.getMinutes() + POMODORO_LENGTH);
      
      sessions.push({
        id: Math.random().toString(36).substring(2, 9),
        taskId,
        startTime: sessionStart,
        endTime: sessionEnd,
        completed: false
      });
      
      // Add a break between sessions
      fallbackTime = new Date(sessionEnd);
      fallbackTime.setMinutes(fallbackTime.getMinutes() + BREAK_LENGTH);
    }
  }
  
  return sessions;
};

export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const { isTimeBlockUnavailable } = useUnavailableTimes();
  
  const calculateUrgency = (dueDate?: Date): 'low' | 'medium' | 'high' => {
    if (!dueDate) return 'low';
    
    const today = new Date();
    const daysDifference = differenceInDays(dueDate, today);
    
    if (isToday(dueDate) || daysDifference <= 1) {
      return 'high';
    } else if (daysDifference <= 3) {
      return 'medium';
    } else {
      return 'low';
    }
  };

  const getTasksForDateRange = (startDate: Date, endDate: Date): Task[] => {
    return tasks.filter(task => {
      // First check for tasks with their main date range in the requested period
      if (task.startDate || task.dueDate) {
        const taskStart = task.startDate || task.dueDate;
        const taskEnd = task.dueDate || task.startDate;
        
        if (taskStart && taskEnd) {
          const isMainTaskInRange = (
            (taskStart >= startDate && taskStart <= endDate) ||
            (taskEnd >= startDate && taskEnd <= endDate) ||
            (taskStart <= startDate && taskEnd >= endDate)
          );
          
          if (isMainTaskInRange) return true;
        }
      }
      
      // Then check for pomodoro sessions in the requested period
      if (task.pomodoroSessions && task.pomodoroSessions.length > 0) {
        return task.pomodoroSessions.some(session => 
          (session.startTime >= startDate && session.startTime <= endDate) ||
          (session.endTime >= startDate && session.endTime <= endDate) ||
          (session.startTime <= startDate && session.endTime >= endDate)
        );
      }
      
      return false;
    });
  };

  useEffect(() => {
    const updateAllTasksUrgency = () => {
      setTasks(prevTasks => 
        prevTasks.map(task => ({
          ...task,
          urgency: calculateUrgency(task.dueDate)
        }))
      );
    };

    updateAllTasksUrgency();
    
    const midnight = new Date();
    midnight.setHours(0, 0, 0, 0);
    midnight.setDate(midnight.getDate() + 1);
    
    const timeUntilMidnight = midnight.getTime() - new Date().getTime();
    
    const dailyUpdateTimer = setTimeout(() => {
      updateAllTasksUrgency();
      const dailyInterval = setInterval(updateAllTasksUrgency, 24 * 60 * 60 * 1000);
      return () => clearInterval(dailyInterval);
    }, timeUntilMidnight);
    
    return () => clearTimeout(dailyUpdateTimer);
  }, []);

  const addTask = (task: Omit<Task, "id" | "completed" | "urgency" | "startDate" | "pomodoroSessions">) => {
    const urgency = calculateUrgency(task.dueDate);
    const duration = task.duration || getTaskDuration(task.difficulty);
    const startDate = calculateStartDate(task.dueDate, duration);
    
    const taskId = Math.random().toString(36).substring(2, 9);
    
    let pomodoroSessions: PomodoroSession[] | undefined = undefined;
    
    if (task.taskType === 'multi-day' && startDate && task.dueDate) {
      pomodoroSessions = generatePomodoroSessions(
        taskId, 
        startDate, 
        task.dueDate, 
        duration,
        isTimeBlockUnavailable
      );
    }
    
    const newTask = {
      ...task,
      id: taskId,
      completed: false,
      urgency,
      duration,
      startDate,
      pomodoroSessions
    };
    
    setTasks((prevTasks) => [...prevTasks, newTask]);
  };

  const removeTask = (id: string) => {
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== id));
  };

  const toggleTaskCompletion = (id: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };
  
  const updateTaskDifficulty = (id: string, difficulty: 'easy' | 'medium' | 'hard') => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (task.id === id) {
          const duration = getTaskDuration(difficulty);
          const startDate = calculateStartDate(task.dueDate, duration);
          
          // Regenerate pomodoro sessions if this is a multi-day task
          let pomodoroSessions = task.pomodoroSessions;
          if (task.taskType === 'multi-day' && startDate && task.dueDate) {
            pomodoroSessions = generatePomodoroSessions(
              task.id, 
              startDate, 
              task.dueDate, 
              duration,
              isTimeBlockUnavailable
            );
          }
          
          return { 
            ...task, 
            difficulty,
            duration,
            startDate,
            pomodoroSessions
          };
        }
        return task;
      })
    );
  };

  return (
    <TaskContext.Provider value={{ 
      tasks, 
      addTask, 
      removeTask, 
      toggleTaskCompletion, 
      updateTaskDifficulty,
      calculateUrgency,
      getTasksForDateRange
    }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error("useTasks must be used within a TaskProvider");
  }
  return context;
}

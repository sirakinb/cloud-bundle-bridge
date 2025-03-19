
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
  
  // Standard Pomodoro: 25 min work, 5 min break
  const POMODORO_LENGTH = 25; // in minutes
  
  // Calculate total number of Pomodoros needed
  const totalPomodoros = Math.ceil(totalDuration / POMODORO_LENGTH);
  
  // Distribute pomodoros evenly across days, with at least 1 per day if possible
  let pomodorosPerDay = Math.ceil(totalPomodoros / daysDifference);
  
  let currentDate = new Date(startDate);
  let pomodorosCreated = 0;
  let maxAttempts = totalPomodoros * 3; // Limit the number of attempts to prevent infinite loops
  let attemptCount = 0;
  
  // Try to create all required pomodoro sessions
  while (pomodorosCreated < totalPomodoros && currentDate < dueDate && attemptCount < maxAttempts) {
    attemptCount++;
    
    // Start sessions at 8 AM each day by default
    const sessionDate = new Date(currentDate);
    sessionDate.setHours(8, 0, 0, 0);
    
    // Calculate how many pomodoros to create for this day
    // On the last day, make sure we create all remaining pomodoros
    const isLastDay = differenceInDays(dueDate, currentDate) === 0;
    const dayPomodoros = isLastDay 
      ? Math.min(totalPomodoros - pomodorosCreated, 12) // Max 12 per day on last day (realistic limit)
      : Math.min(pomodorosPerDay, totalPomodoros - pomodorosCreated);
    
    // Try to create the desired number of pomodoros for this day
    let dayPomodorosCreated = 0;
    
    // Try different time slots throughout the day (8am to 8pm)
    for (let hourOffset = 0; hourOffset < 12 && dayPomodorosCreated < dayPomodoros; hourOffset++) {
      // Try multiple time slots within each hour
      for (let minuteOffset = 0; minuteOffset < 3 && dayPomodorosCreated < dayPomodoros; minuteOffset++) {
        const potentialStart = new Date(sessionDate);
        potentialStart.setHours(8 + hourOffset);
        potentialStart.setMinutes(minuteOffset * 20); // Try at 0, 20, and 40 minutes past the hour
        
        const potentialEnd = new Date(potentialStart);
        potentialEnd.setMinutes(potentialEnd.getMinutes() + POMODORO_LENGTH);
        
        // Check if both the start and end times are available
        if (!isTimeUnavailable || 
            (!isTimeUnavailable(potentialStart) && !isTimeUnavailable(potentialEnd))) {
          
          // This slot is available, create the session
          sessions.push({
            id: Math.random().toString(36).substring(2, 9),
            taskId,
            startTime: new Date(potentialStart),
            endTime: new Date(potentialEnd),
            completed: false
          });
          
          pomodorosCreated++;
          dayPomodorosCreated++;
          
          // If we've created all needed pomodoros, break out
          if (pomodorosCreated >= totalPomodoros) break;
        }
      }
    }
    
    // Move to next day
    currentDate = addDays(currentDate, 1);
    
    // If we're approaching the due date and haven't scheduled all pomodoros,
    // we may need to increase the pomodoros per day for remaining days
    const remainingDays = Math.max(1, differenceInDays(dueDate, currentDate));
    const remainingPomodoros = totalPomodoros - pomodorosCreated;
    
    if (remainingDays > 0 && remainingPomodoros > 0) {
      pomodorosPerDay = Math.ceil(remainingPomodoros / remainingDays);
    }
  }
  
  // If we couldn't create all pomodoros due to unavailable times,
  // try to fit remaining ones wherever possible
  if (pomodorosCreated < totalPomodoros) {
    console.warn(`Could only schedule ${pomodorosCreated} of ${totalPomodoros} required Pomodoro sessions due to time constraints.`);
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

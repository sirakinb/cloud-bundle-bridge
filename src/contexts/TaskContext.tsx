
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
  
  // Distribute pomodoros evenly across days
  const pomodorosPerDay = Math.ceil(totalPomodoros / daysDifference);
  
  let currentDate = new Date(startDate);
  let pomodorosCreated = 0;
  
  while (pomodorosCreated < totalPomodoros && currentDate < dueDate) {
    // Start sessions at 9 AM each day
    const sessionDate = new Date(currentDate);
    sessionDate.setHours(9, 0, 0, 0);
    
    // Create pomodoros for this day
    const dayPomodoros = Math.min(pomodorosPerDay, totalPomodoros - pomodorosCreated);
    
    for (let i = 0; i < dayPomodoros; i++) {
      // Try different times until we find an available slot
      let foundAvailableSlot = false;
      
      // Try different starting times, from 8am to 8pm (12 hour window)
      for (let hourOffset = 0; hourOffset < 12; hourOffset++) {
        // Try up to 4 different 30-minute slots within each hour
        for (let minuteOffset = 0; minuteOffset < 4; minuteOffset++) {
          const potentialStart = new Date(sessionDate);
          // Start at 8am and try different times throughout the day
          potentialStart.setHours(8 + hourOffset);
          potentialStart.setMinutes(minuteOffset * 15);
          
          const potentialEnd = new Date(potentialStart);
          potentialEnd.setMinutes(potentialEnd.getMinutes() + POMODORO_LENGTH);
          
          // Check if this time slot is available
          if (!isTimeUnavailable || 
              (!isTimeUnavailable(potentialStart) && !isTimeUnavailable(potentialEnd))) {
            // This slot is available, create the session
            sessions.push({
              id: Math.random().toString(36).substring(2, 9),
              taskId,
              startTime: potentialStart,
              endTime: potentialEnd,
              completed: false
            });
            
            pomodorosCreated++;
            foundAvailableSlot = true;
            break;
          }
        }
        
        if (foundAvailableSlot) break;
      }
      
      // If we tried all slots and couldn't find any available time, just add it anyway
      if (!foundAvailableSlot) {
        const fallbackStart = new Date(sessionDate);
        // Default to standard slot if all else fails
        fallbackStart.setHours(8 + (i * 2)); 
        fallbackStart.setMinutes(0);
        
        const fallbackEnd = new Date(fallbackStart);
        fallbackEnd.setMinutes(fallbackEnd.getMinutes() + POMODORO_LENGTH);
        
        sessions.push({
          id: Math.random().toString(36).substring(2, 9),
          taskId,
          startTime: fallbackStart,
          endTime: fallbackEnd,
          completed: false
        });
        
        pomodorosCreated++;
      }
    }
    
    // Move to next day
    currentDate = addDays(currentDate, 1);
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

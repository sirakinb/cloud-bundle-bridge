import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { differenceInDays, isToday, addDays, subDays } from "date-fns";

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
}

interface TaskContextType {
  tasks: Task[];
  addTask: (task: Omit<Task, "id" | "completed" | "urgency" | "startDate">) => void;
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

export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  
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
      if (!task.startDate && !task.dueDate) return false;
      
      const taskStart = task.startDate || task.dueDate;
      const taskEnd = task.dueDate || task.startDate;
      
      if (!taskStart || !taskEnd) return false;
      
      return (
        (taskStart >= startDate && taskStart <= endDate) ||
        (taskEnd >= startDate && taskEnd <= endDate) ||
        (taskStart <= startDate && taskEnd >= endDate)
      );
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

  const addTask = (task: Omit<Task, "id" | "completed" | "urgency" | "startDate">) => {
    const urgency = calculateUrgency(task.dueDate);
    const duration = task.duration || getTaskDuration(task.difficulty);
    const startDate = calculateStartDate(task.dueDate, duration);
    
    const newTask = {
      ...task,
      id: Math.random().toString(36).substring(2, 9),
      completed: false,
      urgency,
      duration,
      startDate,
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
          return { 
            ...task, 
            difficulty,
            duration,
            startDate
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

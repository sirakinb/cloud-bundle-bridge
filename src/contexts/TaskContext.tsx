
import React, { createContext, useContext, useState, ReactNode } from "react";

export interface Task {
  id: string;
  name: string;
  description: string;
  dueDate?: Date;
}

interface TaskContextType {
  tasks: Task[];
  addTask: (task: Omit<Task, "id">) => void;
  removeTask: (id: string) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);

  const addTask = (task: Omit<Task, "id">) => {
    const newTask = {
      ...task,
      id: Math.random().toString(36).substring(2, 9),
    };
    setTasks((prevTasks) => [...prevTasks, newTask]);
  };

  const removeTask = (id: string) => {
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== id));
  };

  return (
    <TaskContext.Provider value={{ tasks, addTask, removeTask }}>
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

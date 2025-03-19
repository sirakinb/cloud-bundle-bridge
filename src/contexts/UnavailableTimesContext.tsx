
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

export interface UnavailableTimeBlock {
  id: string;
  dayOfWeek: number; // 0-6 where 0 is Sunday, 1 is Monday, etc.
  startHour: number; // 0-23
  startMinute: number; // 0-59
  endHour: number; // 0-23
  endMinute: number; // 0-59
  label?: string;
}

interface UnavailableTimesContextType {
  unavailableTimes: UnavailableTimeBlock[];
  addUnavailableTime: (block: Omit<UnavailableTimeBlock, "id">) => void;
  removeUnavailableTime: (id: string) => void;
  isTimeBlockUnavailable: (date: Date) => boolean;
}

const UnavailableTimesContext = createContext<UnavailableTimesContextType | undefined>(undefined);

export function UnavailableTimesProvider({ children }: { children: ReactNode }) {
  const [unavailableTimes, setUnavailableTimes] = useState<UnavailableTimeBlock[]>([]);

  // Load saved unavailable times from localStorage on component mount
  useEffect(() => {
    const savedTimes = localStorage.getItem('unavailableTimes');
    if (savedTimes) {
      try {
        setUnavailableTimes(JSON.parse(savedTimes));
      } catch (e) {
        console.error("Error loading unavailable times from localStorage:", e);
      }
    }
  }, []);

  // Save unavailable times to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('unavailableTimes', JSON.stringify(unavailableTimes));
  }, [unavailableTimes]);

  // Add a new unavailable time block
  const addUnavailableTime = (block: Omit<UnavailableTimeBlock, "id">) => {
    const newBlock = {
      ...block,
      id: Math.random().toString(36).substring(2, 9),
    };
    setUnavailableTimes((prevTimes) => [...prevTimes, newBlock]);
  };

  // Remove an unavailable time block
  const removeUnavailableTime = (id: string) => {
    setUnavailableTimes((prevTimes) => prevTimes.filter((time) => time.id !== id));
  };

  // Check if a given time is within any unavailable blocks
  const isTimeBlockUnavailable = (date: Date): boolean => {
    const dayOfWeek = date.getDay();
    const hour = date.getHours();
    const minute = date.getMinutes();

    return unavailableTimes.some((block) => {
      if (block.dayOfWeek !== dayOfWeek) return false;

      const startMinutes = block.startHour * 60 + block.startMinute;
      const endMinutes = block.endHour * 60 + block.endMinute;
      const currentMinutes = hour * 60 + minute;

      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    });
  };

  return (
    <UnavailableTimesContext.Provider
      value={{
        unavailableTimes,
        addUnavailableTime,
        removeUnavailableTime,
        isTimeBlockUnavailable,
      }}
    >
      {children}
    </UnavailableTimesContext.Provider>
  );
}

export function useUnavailableTimes() {
  const context = useContext(UnavailableTimesContext);
  if (context === undefined) {
    throw new Error("useUnavailableTimes must be used within an UnavailableTimesProvider");
  }
  return context;
}

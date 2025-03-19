import { useState } from "react";
import { format, startOfWeek, addDays, isSameDay, isToday, differenceInDays, endOfWeek, parseISO, isWithinInterval } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { AppSidebar } from "@/components/AppSidebar";
import { Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { useTasks } from "@/contexts/TaskContext";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Clock, Flame, HardHat } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CalendarPage = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view, setView] = useState<'day' | 'week'>('day');
  const { tasks, getTasksForDateRange } = useTasks();

  // Get the start and end of the week for the weekly view
  const startOfCurrentWeek = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Start on Monday
  const endOfCurrentWeek = endOfWeek(selectedDate, { weekStartsOn: 1 });
  
  // Create array of days for the week view
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(startOfCurrentWeek, i);
    return {
      date,
      dayName: format(date, 'EEE'),
      dayNumber: format(date, 'd'),
    };
  });

  // Filter tasks for the selected date in day view
  const getTasksForDate = (date: Date) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    
    return tasks.filter(task => {
      // If the task has a startDate and dueDate, check if the selected date falls within that range
      if (task.startDate && task.dueDate) {
        return isWithinInterval(date, { start: task.startDate, end: task.dueDate });
      }
      
      // If there's only a startDate, check if it matches the selected date
      if (task.startDate && !task.dueDate) {
        return isSameDay(task.startDate, date);
      }
      
      // If there's only a dueDate, check if it matches the selected date
      if (!task.startDate && task.dueDate) {
        return isSameDay(task.dueDate, date);
      }
      
      return false;
    }).sort((a, b) => {
      // Sort by due date time first
      if (a.dueDate && b.dueDate) {
        return a.dueDate.getTime() - b.dueDate.getTime();
      }
      return 0;
    });
  };

  // Get all tasks for the week view
  const getTasksForWeek = () => {
    return getTasksForDateRange(startOfCurrentWeek, endOfCurrentWeek);
  };

  // Get color based on urgency
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'border-red-500 bg-red-50 dark:bg-red-950/10';
      case 'medium':
        return 'border-amber-500 bg-amber-50 dark:bg-amber-950/10';
      case 'low':
        return 'border-green-500 bg-green-50 dark:bg-green-950/10';
      default:
        return 'border-gray-300 bg-gray-50 dark:bg-gray-800/10';
    }
  };

  // Generate time blocks for the day
  const timeBlocks = Array.from({ length: 17 }, (_, i) => {
    return format(new Date().setHours(i + 8, 0, 0, 0), 'h:mm a');
  });

  // Calculate task position in the day view
  const getTaskPosition = (task: typeof tasks[0], date: Date) => {
    // If task has both start and due dates, we need to spread it across days
    if (task.startDate && task.dueDate) {
      // If this is the start date, position it in the morning
      if (isSameDay(task.startDate, date)) {
        return {
          top: '8rem', // Start around 8am
          height: '4rem', // Show for 4 hours
        };
      }
      // If this is the due date, position it to end by 5pm
      else if (isSameDay(task.dueDate, date)) {
        return {
          top: '12rem', // Start around 12pm
          height: '5rem', // Show for 5 hours
        };
      }
      // For days in between, position in middle of day
      else {
        return {
          top: '10rem', // Middle of work day
          height: '3rem',
        };
      }
    }
    
    // For tasks with only a due date, show on the specified time
    if (task.dueDate) {
      const hour = task.dueDate.getHours();
      const minute = task.dueDate.getMinutes();
      
      // Calculate top position based on time (each hour is 4rem tall)
      // Adjust calculation to account for the 8am start time
      const topPosition = (hour - 8) * 4 + (minute / 60) * 4;
      
      // Calculate height based on task duration (1 hour = 4rem)
      const height = (task.duration / 60) * 4;
      
      return {
        top: `${topPosition}rem`,
        height: `${height}rem`,
      };
    }
    
    // Default position if no dates are specified
    return {
      top: '9rem',
      height: '3rem',
    };
  };

  // Handle navigation in the calendar
  const navigateDate = (direction: 'prev' | 'next') => {
    if (view === 'day') {
      setSelectedDate(prevDate => 
        direction === 'prev' ? addDays(prevDate, -1) : addDays(prevDate, 1)
      );
    } else {
      setSelectedDate(prevDate => 
        direction === 'prev' ? addDays(prevDate, -7) : addDays(prevDate, 7)
      );
    }
  };

  // Show task completion status visually
  const getTaskStatusIndicator = (task: typeof tasks[0]) => {
    if (task.completed) {
      return <div className="absolute top-0 right-0 h-3 w-3 bg-green-500 rounded-full"></div>;
    }
    return null;
  };

  // Get the display text for task dates
  const getTaskDateText = (task: typeof tasks[0]) => {
    if (task.startDate && task.dueDate) {
      return `${format(task.startDate, 'MMM d')} - ${format(task.dueDate, 'MMM d')}`;
    }
    if (task.dueDate) {
      return `Due: ${format(task.dueDate, 'MMM d')}`;
    }
    if (task.startDate) {
      return `Start: ${format(task.startDate, 'MMM d')}`;
    }
    return '';
  };

  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <SidebarInset className="p-3 lg:p-4 overflow-hidden">
        <div className="w-full max-w-7xl mx-auto">
          <div className="flex flex-col gap-3">
            {/* Calendar Header */}
            <div className="flex justify-between items-center">
              <h1 className="text-xl lg:text-2xl font-bold font-heading text-primary">Calendar</h1>
              <div className="flex items-center gap-2">
                <Tabs defaultValue="day" value={view} onValueChange={(v) => setView(v as 'day' | 'week')}>
                  <TabsList>
                    <TabsTrigger value="day">Day</TabsTrigger>
                    <TabsTrigger value="week">Week</TabsTrigger>
                  </TabsList>
                </Tabs>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" onClick={() => navigateDate('prev')} className="h-8 w-8">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedDate(new Date())} className="h-8 text-xs">
                    Today
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => navigateDate('next')} className="h-8 w-8">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 h-[calc(100vh-120px)] overflow-hidden">
              {/* Mini Calendar Component */}
              <Card className="md:col-span-1 overflow-auto">
                <CardContent className="p-2">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    className="rounded-md border"
                  />
                </CardContent>
              </Card>

              {/* Calendar Schedule View */}
              <div className="md:col-span-3 overflow-hidden">
                <Card className="h-full">
                  <CardContent className="p-2 h-full overflow-hidden">
                    {view === 'day' ? (
                      <div className="h-full flex flex-col">
                        <h2 className="text-xl font-semibold mb-2">
                          {isToday(selectedDate) ? 'Today' : format(selectedDate, 'EEEE, MMMM d, yyyy')}
                        </h2>
                        
                        <div className="relative border rounded-md flex-1 overflow-auto">
                          {/* Time indicators */}
                          <div className="absolute top-0 left-0 w-14 h-full border-r">
                            {timeBlocks.map((time) => (
                              <div 
                                key={time} 
                                className="h-16 border-b text-xs text-muted-foreground flex items-start justify-center pt-1"
                              >
                                {time}
                              </div>
                            ))}
                          </div>
                          
                          {/* Tasks positioned by time */}
                          <div className="ml-14 relative">
                            {/* Hour grid lines */}
                            {timeBlocks.map((time) => (
                              <div 
                                key={time} 
                                className="border-b w-full bg-background h-16"
                              />
                            ))}
                            
                            {/* Current time indicator */}
                            {isToday(selectedDate) && (
                              <div 
                                className="absolute w-full h-0.5 bg-red-500 z-10"
                                style={{ 
                                  top: `${(new Date().getHours() - 8) * 4 + (new Date().getMinutes() / 60) * 4}rem` 
                                }}
                              >
                                <div className="absolute -left-1 -top-1.5 rounded-full w-3 h-3 bg-red-500" />
                              </div>
                            )}
                            
                            {/* Tasks */}
                            {getTasksForDate(selectedDate).map(task => (
                              <div 
                                key={task.id}
                                className={`absolute rounded-md p-1 border-l-4 mx-1 overflow-hidden shadow-sm ${getUrgencyColor(task.urgency)} ${task.completed ? 'opacity-60' : ''}`}
                                style={{
                                  ...getTaskPosition(task, selectedDate),
                                  maxHeight: '4rem',
                                  width: 'calc(100% - 0.5rem)'
                                }}
                              >
                                <div className="flex flex-col h-full overflow-hidden relative">
                                  {getTaskStatusIndicator(task)}
                                  <h3 className={`font-medium text-xs truncate ${task.completed ? 'line-through' : ''}`}>
                                    {task.name}
                                  </h3>
                                  
                                  <div className="flex items-center gap-1 text-xs mt-0.5">
                                    <span className="flex items-center">
                                      <Clock className="h-2.5 w-2.5 mr-0.5" />
                                      {task.duration} min
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col">
                        <h2 className="text-xl font-semibold mb-2">
                          Week of {format(startOfCurrentWeek, 'MMMM d, yyyy')}
                        </h2>
                        
                        <div className="grid grid-cols-7 border rounded-md flex-1 overflow-auto">
                          {/* Day headers */}
                          <div className="contents">
                            {weekDays.map(day => (
                              <div 
                                key={day.dayName} 
                                className={cn(
                                  "p-1 border-b text-center sticky top-0 bg-background z-10",
                                  isToday(day.date) && "bg-primary/5 font-bold"
                                )}
                              >
                                <div className="text-xs font-medium">{day.dayName}</div>
                                <div className={cn(
                                  "flex items-center justify-center rounded-full mx-auto w-6 h-6 text-xs",
                                  isToday(day.date) && "bg-primary text-primary-foreground"
                                )}>
                                  {day.dayNumber}
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {/* Week view content */}
                          {weekDays.map(day => (
                            <div 
                              key={day.dayName} 
                              className={cn(
                                "p-1 border-r min-h-[10rem] relative",
                                isToday(day.date) && "bg-primary/5"
                              )}
                            >
                              {getTasksForDate(day.date).map(task => (
                                <div 
                                  key={task.id} 
                                  className={`mb-1 p-1 rounded-md border-l-2 text-xs ${getUrgencyColor(task.urgency)} ${task.completed ? 'opacity-60' : ''}`}
                                >
                                  <div className={`font-medium truncate ${task.completed ? 'line-through' : ''}`}>
                                    {task.name}
                                  </div>
                                  
                                  {task.dueDate && (
                                    <div className="text-xs text-muted-foreground flex items-center">
                                      <Clock className="h-2.5 w-2.5 mr-0.5" />
                                      {format(task.dueDate, 'h:mm a')}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </div>
  );
};

export default CalendarPage;

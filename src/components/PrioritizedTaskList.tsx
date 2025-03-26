
import React from "react";
import { Task, useTasks } from "@/contexts/TaskContext";
import TaskItem from "@/components/TaskItem";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getPrioritizedTasks, getOptimizedDailyTasks } from "@/utils/taskPriorityUtils";
import { format, isSameDay } from "date-fns";

interface PrioritizedTaskListProps {
  title?: string;
  description?: string;
  maxTasks?: number;
  showOptimized?: boolean;
  maxDailyMinutes?: number;
}

const PrioritizedTaskList = ({ 
  title = "Prioritized Tasks", 
  description,
  maxTasks = 10,
  showOptimized = true,
  maxDailyMinutes = 240
}: PrioritizedTaskListProps) => {
  const { tasks } = useTasks();
  
  const prioritizedTasks = getPrioritizedTasks(tasks)
    .slice(0, maxTasks)
    .map(item => item.task);
    
  const optimizedTasks = showOptimized 
    ? getOptimizedDailyTasks(tasks, maxDailyMinutes)
    : prioritizedTasks;
    
  const displayTasks = showOptimized ? optimizedTasks : prioritizedTasks;
  
  // Calculate total estimated time
  const getTotalTime = (taskList: Task[]): number => {
    return taskList.reduce((total, task) => {
      if (task.taskType === 'multi-day' && task.pomodoroSessions) {
        const today = new Date();
        const todaysSessions = task.pomodoroSessions.filter(
          session => isSameDay(session.startTime, today) && !session.completed
        );
        
        // Sum up today's sessions duration
        return total + todaysSessions.reduce(
          (sessionTotal, session) => 
            sessionTotal + Math.round(
              (session.endTime.getTime() - session.startTime.getTime()) / (1000 * 60)
            ), 
          0
        );
      } else {
        return total + task.duration;
      }
    }, 0);
  };
  
  const totalTime = getTotalTime(displayTasks);
  const totalHours = Math.floor(totalTime / 60);
  const totalMinutes = totalTime % 60;
  
  // Group tasks by priority category
  const criticalTasks = displayTasks.filter(task => task.urgency === 'high');
  const highPriorityTasks = displayTasks.filter(task => 
    task.urgency === 'medium' && !criticalTasks.includes(task)
  );
  const normalTasks = displayTasks.filter(task => 
    !criticalTasks.includes(task) && !highPriorityTasks.includes(task)
  );
  
  return (
    <Card className="transition-all duration-300 hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle>{title}</CardTitle>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              {totalHours > 0 ? `${totalHours}h ` : ''}
              {totalMinutes}m
            </span>
          </div>
        </div>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="pt-0">
        {displayTasks.length === 0 ? (
          <p className="text-foreground/60 py-2">No tasks to display</p>
        ) : (
          <div className="space-y-1">
            {/* Critical tasks section */}
            {criticalTasks.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="destructive" className="flex gap-1 items-center">
                    <AlertTriangle className="h-3 w-3" />
                    <span>Critical</span>
                  </Badge>
                </div>
                <div className="space-y-1">
                  {criticalTasks.map((task) => (
                    <TaskItem key={`critical-${task.id}`} task={task} />
                  ))}
                </div>
              </div>
            )}
            
            {/* High priority tasks section */}
            {highPriorityTasks.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="flex gap-1 items-center">
                    <span>High Priority</span>
                  </Badge>
                </div>
                <div className="space-y-1">
                  {highPriorityTasks.map((task) => (
                    <TaskItem key={`high-${task.id}`} task={task} />
                  ))}
                </div>
              </div>
            )}
            
            {/* Normal tasks section */}
            {normalTasks.length > 0 && (
              <div>
                {(criticalTasks.length > 0 || highPriorityTasks.length > 0) && (
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">
                      <span>Other Tasks</span>
                    </Badge>
                  </div>
                )}
                <div className="space-y-1">
                  {normalTasks.map((task) => (
                    <TaskItem key={`normal-${task.id}`} task={task} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PrioritizedTaskList;

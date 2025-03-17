
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { Check, Clock, Flame, HardHat, Trash2, Calendar, Hourglass, Repeat } from "lucide-react";
import { Task, useTasks } from "@/contexts/TaskContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Badge } from "@/components/ui/badge";

interface TaskItemProps {
  task: Task;
}

const TaskItem = ({ task }: TaskItemProps) => {
  const { removeTask, toggleTaskCompletion } = useTasks();
  const { theme } = useTheme();

  // Map urgency to specific colors - now using color variables that change with theme
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'text-destructive bg-destructive/10';
      case 'medium':
        return 'text-primary bg-primary/10';
      case 'low':
        return 'text-accent-foreground bg-accent/50';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  // Map difficulty to specific colors
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'hard':
        return 'text-secondary-foreground bg-secondary/70';
      case 'medium':
        return 'text-primary bg-primary/20';
      case 'easy':
        return 'text-accent-foreground bg-accent/30';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  // Count Pomodoro sessions
  const pomodoroCount = task.pomodoroSessions?.length || 0;
  const completedPomodoros = task.pomodoroSessions?.filter(s => s.completed).length || 0;

  return (
    <div className={`p-4 border rounded-md mb-3 bg-card text-card-foreground shadow-sm hover:shadow-md transition-all duration-300 ${task.completed ? 'opacity-70' : ''}`}>
      <div className="flex justify-between items-start">
        <div className="flex gap-3">
          <div className="flex items-center pt-0.5">
            <Checkbox 
              id={`task-${task.id}`}
              checked={task.completed}
              onCheckedChange={() => toggleTaskCompletion(task.id)}
              className="data-[state=checked]:bg-primary"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>{task.name}</h3>
              {task.taskType === 'multi-day' ? (
                <Badge variant="outline" className="flex items-center gap-1 text-xs">
                  <Repeat className="h-3 w-3" />
                  <span>Multi-day</span>
                </Badge>
              ) : (
                <Badge variant="outline" className="flex items-center gap-1 text-xs">
                  <Hourglass className="h-3 w-3" />
                  <span>One-time</span>
                </Badge>
              )}
            </div>
            
            {task.description && (
              <p className={`text-sm text-muted-foreground mt-1 ${task.completed ? 'line-through' : ''}`}>{task.description}</p>
            )}
            
            <div className="flex flex-wrap gap-2 mt-2">
              {/* Schedule timeline */}
              {(task.startDate || task.dueDate) && (
                <div className="flex items-center text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span>
                    {task.startDate && task.dueDate
                      ? `${format(task.startDate, "MMM d")} - ${format(task.dueDate, "MMM d")}`
                      : task.startDate
                      ? `Start: ${format(task.startDate, "MMM d")}`
                      : `Due: ${format(task.dueDate!, "MMM d")}`}
                  </span>
                </div>
              )}
              
              {/* Due time if available */}
              {task.dueDate && (
                <div className="flex items-center text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>{format(task.dueDate, "h:mm a")}</span>
                </div>
              )}
              
              <div className={`flex items-center text-xs px-2 py-1 rounded-full ${getUrgencyColor(task.urgency)}`}>
                <Flame className="h-3 w-3 mr-1" />
                <span className="capitalize">{task.urgency} Urgency</span>
              </div>
              
              <div className={`flex items-center text-xs px-2 py-1 rounded-full ${getDifficultyColor(task.difficulty)}`}>
                <HardHat className="h-3 w-3 mr-1" />
                <span className="capitalize">{task.difficulty} Difficulty</span>
              </div>
              
              <div className="flex items-center text-xs px-2 py-1 rounded-full text-muted-foreground bg-muted">
                <Clock className="h-3 w-3 mr-1" />
                <span>{task.duration} min</span>
              </div>
              
              {/* Pomodoro sessions for multi-day tasks */}
              {task.taskType === 'multi-day' && pomodoroCount > 0 && (
                <div className="flex items-center text-xs px-2 py-1 rounded-full text-primary bg-primary/10">
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>{completedPomodoros}/{pomodoroCount} Pomodoros</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => removeTask(task.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TaskItem;

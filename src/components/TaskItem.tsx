
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { Check, Clock, Flame, HardHat, Trash2 } from "lucide-react";
import { Task, useTasks } from "@/contexts/TaskContext";
import { useTheme } from "@/contexts/ThemeContext";

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
            <h3 className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>{task.name}</h3>
            {task.description && (
              <p className={`text-sm text-muted-foreground mt-1 ${task.completed ? 'line-through' : ''}`}>{task.description}</p>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              {task.dueDate && (
                <div className="flex items-center text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>{format(task.dueDate, "PPP 'at' h:mm a")}</span>
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

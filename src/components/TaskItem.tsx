
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { Check, Clock, Flame, HardHat, Trash2 } from "lucide-react";
import { Task, useTasks } from "@/contexts/TaskContext";

interface TaskItemProps {
  task: Task;
}

const TaskItem = ({ task }: TaskItemProps) => {
  const { removeTask, toggleTaskCompletion } = useTasks();

  // Map urgency to specific colors
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-orange-600 bg-orange-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  // Map difficulty to specific colors
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'hard':
        return 'text-purple-600 bg-purple-50';
      case 'medium':
        return 'text-blue-600 bg-blue-50';
      case 'easy':
        return 'text-teal-600 bg-teal-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className={`p-4 border rounded-md mb-3 bg-white shadow-sm hover:shadow-md transition-all duration-300 ${task.completed ? 'opacity-70' : ''}`}>
      <div className="flex justify-between items-start">
        <div className="flex gap-3">
          <div className="flex items-center pt-0.5">
            <Checkbox 
              id={`task-${task.id}`}
              checked={task.completed}
              onCheckedChange={() => toggleTaskCompletion(task.id)}
              className="data-[state=checked]:bg-green-600"
            />
          </div>
          <div>
            <h3 className={`font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>{task.name}</h3>
            {task.description && (
              <p className={`text-sm text-gray-500 mt-1 ${task.completed ? 'line-through' : ''}`}>{task.description}</p>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              {task.dueDate && (
                <div className="flex items-center text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
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
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
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

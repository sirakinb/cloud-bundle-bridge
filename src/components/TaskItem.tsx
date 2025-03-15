
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Check, Clock, Trash2 } from "lucide-react";
import { Task, useTasks } from "@/contexts/TaskContext";

interface TaskItemProps {
  task: Task;
}

const TaskItem = ({ task }: TaskItemProps) => {
  const { removeTask } = useTasks();

  return (
    <div className="p-4 border rounded-md mb-3 bg-white shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium">{task.name}</h3>
          {task.description && (
            <p className="text-sm text-gray-500 mt-1">{task.description}</p>
          )}
          {task.dueDate && (
            <div className="flex items-center mt-2 text-xs text-gray-500">
              <Clock className="h-3 w-3 mr-1" />
              <span>Due: {format(task.dueDate, "PPP 'at' h:mm a")}</span>
            </div>
          )}
        </div>
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
          >
            <Check className="h-4 w-4" />
          </Button>
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

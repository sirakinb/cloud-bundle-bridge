
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Clock, Flame, HardHat } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTasks } from "@/contexts/TaskContext";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type TaskDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const TaskDialog = ({ open, onOpenChange }: TaskDialogProps) => {
  const [taskName, setTaskName] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [hour, setHour] = useState<string>("12");
  const [minute, setMinute] = useState<string>("00");
  const [ampm, setAmPm] = useState<string>("PM");
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('medium');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  
  const { addTask } = useTasks();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please enter a task name",
      });
      return;
    }

    // Prepare the full date with time if a date was selected
    let dueDateTime = undefined;
    if (date) {
      dueDateTime = new Date(date);
      const hours = parseInt(hour) + (ampm === "PM" && hour !== "12" ? 12 : 0) - (ampm === "AM" && hour === "12" ? 12 : 0);
      dueDateTime.setHours(hours, parseInt(minute), 0);
    }

    // Add task to context
    addTask({
      name: taskName,
      description,
      dueDate: dueDateTime,
      urgency,
      difficulty,
    });

    toast({
      title: "Task created",
      description: `Your task has been added successfully${dueDateTime ? ` and is due on ${format(dueDateTime, "PPP 'at' h:mm a")}` : ""}`,
    });

    // Reset form
    setTaskName("");
    setDescription("");
    setDate(undefined);
    setHour("12");
    setMinute("00");
    setAmPm("PM");
    setUrgency('medium');
    setDifficulty('medium');
    onOpenChange(false);
  };

  // Generate hours for the select dropdown
  const hours = Array.from({ length: 12 }, (_, i) => {
    const hour = i + 1;
    return hour.toString();
  });

  // Generate minutes for the select dropdown
  const minutes = Array.from({ length: 60 }, (_, i) => {
    return i.toString().padStart(2, "0");
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
            <DialogDescription>
              Create a new task for your study plan
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Task
              </Label>
              <Input
                id="name"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                className="col-span-3"
                placeholder="Enter task name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3"
                placeholder="Add details about this task"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="due-date" className="text-right">
                Due Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="due-date"
                    variant={"outline"}
                    className={cn(
                      "col-span-3 justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Due Time</Label>
              <div className="col-span-3 flex space-x-2 items-center">
                <div className="flex items-center">
                  <Select value={hour} onValueChange={setHour}>
                    <SelectTrigger className="w-[70px]">
                      <SelectValue placeholder="Hour" />
                    </SelectTrigger>
                    <SelectContent>
                      {hours.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <span className="mx-1">:</span>

                  <Select value={minute} onValueChange={setMinute}>
                    <SelectTrigger className="w-[70px]">
                      <SelectValue placeholder="Min" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px] overflow-y-auto">
                      {minutes.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Select value={ampm} onValueChange={setAmPm}>
                  <SelectTrigger className="w-[70px]">
                    <SelectValue placeholder="AM/PM" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AM">AM</SelectItem>
                    <SelectItem value="PM">PM</SelectItem>
                  </SelectContent>
                </Select>

                <Clock className="h-4 w-4 text-gray-400" />
              </div>
            </div>

            {/* Urgency Selection */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">
                Urgency <Flame className="inline h-4 w-4 text-red-500" />
              </Label>
              <RadioGroup
                value={urgency}
                onValueChange={(val) => setUrgency(val as 'low' | 'medium' | 'high')}
                className="col-span-3 flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="low" id="urgency-low" />
                  <Label htmlFor="urgency-low" className="cursor-pointer">Low</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="medium" id="urgency-medium" />
                  <Label htmlFor="urgency-medium" className="cursor-pointer">Medium</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="high" id="urgency-high" />
                  <Label htmlFor="urgency-high" className="cursor-pointer">High</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Difficulty Selection */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">
                Difficulty <HardHat className="inline h-4 w-4 text-yellow-500" />
              </Label>
              <RadioGroup
                value={difficulty}
                onValueChange={(val) => setDifficulty(val as 'easy' | 'medium' | 'hard')}
                className="col-span-3 flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="easy" id="difficulty-easy" />
                  <Label htmlFor="difficulty-easy" className="cursor-pointer">Easy</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="medium" id="difficulty-medium" />
                  <Label htmlFor="difficulty-medium" className="cursor-pointer">Medium</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hard" id="difficulty-hard" />
                  <Label htmlFor="difficulty-hard" className="cursor-pointer">Hard</Label>
                </div>
              </RadioGroup>
            </div>

          </div>
          <DialogFooter>
            <Button type="submit" className="hover-glow glow-primary">Add Task</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDialog;

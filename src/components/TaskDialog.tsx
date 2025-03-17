
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
import { format, isBefore } from "date-fns";
import { CalendarIcon, Clock, HardHat, Info, Hourglass, RepeatCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTasks, TaskType } from "@/contexts/TaskContext";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";

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
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [duration, setDuration] = useState<number>(60); // Default 60 minutes
  const [taskType, setTaskType] = useState<TaskType>('one-time');
  
  const { addTask, calculateUrgency } = useTasks();

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

    // Calculate urgency based on due date (will be shown in toast message)
    const calculatedUrgency = calculateUrgency(dueDateTime);

    // Add task to context
    addTask({
      name: taskName,
      description,
      dueDate: dueDateTime,
      difficulty,
      duration,
      taskType,
    });

    // Show toast with schedule information
    toast({
      title: "Task scheduled",
      description: `Your ${taskType === 'multi-day' ? 'multi-day' : 'one-time'} task has been scheduled${dueDateTime ? ` to be completed by ${format(dueDateTime, "PPP 'at' h:mm a")}` : ""}. Urgency: ${calculatedUrgency.toUpperCase()}`,
    });

    // Reset form
    setTaskName("");
    setDescription("");
    setDate(undefined);
    setHour("12");
    setMinute("00");
    setAmPm("PM");
    setDifficulty('medium');
    setDuration(60);
    setTaskType('one-time');
    onOpenChange(false);
  };

  // Update duration when difficulty changes
  const handleDifficultyChange = (val: string) => {
    const difficultyValue = val as 'easy' | 'medium' | 'hard';
    setDifficulty(difficultyValue);
    
    // Set default durations based on difficulty
    switch (difficultyValue) {
      case 'easy':
        setDuration(30);
        break;
      case 'medium':
        setDuration(60);
        break;
      case 'hard':
        setDuration(120);
        break;
    }
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
              Create a new task. It will be scheduled to be completed by the due date.
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
            
            {/* Task Type Selection */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">Task Type</Label>
              <div className="col-span-3 grid grid-cols-2 gap-3">
                <Card 
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    taskType === 'one-time' ? "border-primary bg-primary/5" : "border-muted"
                  )}
                  onClick={() => setTaskType('one-time')}
                >
                  <CardContent className="pt-4 flex flex-col items-center text-center">
                    <Hourglass className={cn(
                      "w-8 h-8 mb-2",
                      taskType === 'one-time' ? "text-primary" : "text-muted-foreground"
                    )} />
                    <h3 className="font-medium">One-time Task</h3>
                    <p className="text-sm text-muted-foreground">Complete in one session</p>
                  </CardContent>
                </Card>
                
                <Card 
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    taskType === 'multi-day' ? "border-primary bg-primary/5" : "border-muted"
                  )}
                  onClick={() => setTaskType('multi-day')}
                >
                  <CardContent className="pt-4 flex flex-col items-center text-center">
                    <RepeatCircle className={cn(
                      "w-8 h-8 mb-2",
                      taskType === 'multi-day' ? "text-primary" : "text-muted-foreground"
                    )} />
                    <h3 className="font-medium">Multi-day Task</h3>
                    <p className="text-sm text-muted-foreground">Split into Pomodoro sessions</p>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="text-right flex items-center justify-end gap-1">
                <Label htmlFor="due-date">Due Date</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        {taskType === 'multi-day' 
                          ? "Multi-day tasks will be split into Pomodoro sessions (25-minute focused work periods) spread out between start and due date"
                          : "Tasks will automatically be scheduled to start before the due date based on difficulty"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
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

            {/* Difficulty Selection */}
            <div className="grid grid-cols-4 items-start gap-4">
              <div className="text-right flex items-center justify-end gap-1">
                <Label className="pt-2">Difficulty</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HardHat className="h-4 w-4 text-yellow-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{taskType === 'multi-day' 
                        ? "Harder tasks will generate more Pomodoro sessions" 
                        : "Harder tasks will be scheduled to start earlier"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <RadioGroup
                value={difficulty}
                onValueChange={handleDifficultyChange}
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

            {/* Task Duration */}
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="text-right flex items-center justify-end gap-1">
                <Label>Duration</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {taskType === 'multi-day' 
                          ? "Total time needed, will be split into 25-minute Pomodoro sessions" 
                          : "How long the task will take to complete"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="col-span-2">
                <Slider
                  value={[duration]}
                  min={15}
                  max={240}
                  step={15}
                  onValueChange={(values) => setDuration(values[0])}
                />
              </div>
              <div className="text-sm">
                {duration} minutes
                {taskType === 'multi-day' && (
                  <div className="text-xs text-muted-foreground mt-1">
                    ≈ {Math.ceil(duration / 25)} Pomodoro sessions
                  </div>
                )}
              </div>
            </div>

          </div>
          <DialogFooter>
            <Button type="submit" className="hover-glow glow-primary">Schedule Task</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDialog;

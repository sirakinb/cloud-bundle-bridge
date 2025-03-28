
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { schedulePomodoroSessions, applyScheduledPomodoros } from "@/utils/taskPriorityUtils";
import { useTasks } from "@/contexts/TaskContext";
import { useUnavailableTimes } from "@/contexts/UnavailableTimesContext";
import { CalendarIcon, Clock } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, addDays } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";

type AutoScheduleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const AutoScheduleDialog = ({ open, onOpenChange }: AutoScheduleDialogProps) => {
  const { tasks, toggleTaskCompletion } = useTasks();
  const { isTimeBlockUnavailable } = useUnavailableTimes();
  
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [daysToSchedule, setDaysToSchedule] = useState<number>(7);
  const [balanceWorkload, setBalanceWorkload] = useState<boolean>(true);
  const [maxDailyPomodoros, setMaxDailyPomodoros] = useState<number>(8);
  const [isScheduling, setIsScheduling] = useState<boolean>(false);

  const handleAutoSchedule = () => {
    setIsScheduling(true);
    
    try {
      // Get only incomplete tasks
      const incompleteTasks = tasks.filter(task => !task.completed);
      
      if (incompleteTasks.length === 0) {
        toast({
          title: "No tasks to schedule",
          description: "Add some tasks first or mark existing ones as incomplete.",
          variant: "destructive"
        });
        setIsScheduling(false);
        return;
      }
      
      // Schedule pomodoro sessions
      const scheduledTasks = schedulePomodoroSessions(
        incompleteTasks,
        isTimeBlockUnavailable,
        startDate,
        daysToSchedule
      );
      
      if (scheduledTasks.length === 0) {
        toast({
          title: "Scheduling failed",
          description: "Couldn't schedule any tasks. Try expanding your available time slots.",
          variant: "destructive"
        });
        setIsScheduling(false);
        return;
      }
      
      // Count total sessions scheduled
      const totalSessions = scheduledTasks.reduce(
        (count, { sessions }) => count + sessions.length, 
        0
      );
      
      // Success toast
      toast({
        title: "Scheduling complete",
        description: `Scheduled ${totalSessions} focus sessions across ${scheduledTasks.length} tasks`
      });
      
      // Close the dialog
      onOpenChange(false);
    } catch (error) {
      console.error("Error scheduling tasks:", error);
      toast({
        title: "Scheduling error",
        description: "An error occurred while scheduling tasks. Please try again.",
        variant: "destructive"
      });
    }
    
    setIsScheduling(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Auto-Schedule Focus Sessions</DialogTitle>
          <DialogDescription>
            Automatically schedule Pomodoro focus sessions for your tasks based on priority, difficulty, and deadlines.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Start Date */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="startDate" className="text-right">
              Start Date
            </Label>
            <div className="col-span-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          {/* Days to Schedule */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="daysToSchedule" className="text-right">
              Schedule For
            </Label>
            <div className="col-span-3 space-y-1">
              <div className="flex justify-between">
                <span>{daysToSchedule} days</span>
                <span className="text-muted-foreground">
                  Until {format(addDays(startDate, daysToSchedule), "MMM d")}
                </span>
              </div>
              <Slider
                id="daysToSchedule"
                min={1}
                max={14}
                step={1}
                value={[daysToSchedule]}
                onValueChange={(value) => setDaysToSchedule(value[0])}
              />
            </div>
          </div>
          
          {/* Max Daily Pomodoros */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="maxPomodoros" className="text-right">
              Max Daily Sessions
            </Label>
            <div className="col-span-3 space-y-1">
              <div className="flex justify-between">
                <span>{maxDailyPomodoros} sessions</span>
                <span className="text-muted-foreground">
                  {maxDailyPomodoros * 25} minutes
                </span>
              </div>
              <Slider
                id="maxPomodoros"
                min={2}
                max={12}
                step={1}
                value={[maxDailyPomodoros]}
                onValueChange={(value) => setMaxDailyPomodoros(value[0])}
              />
            </div>
          </div>
          
          {/* Balance Workload */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="balanceWorkload" className="text-right">
              Balance Workload
            </Label>
            <div className="flex items-center gap-2 col-span-3">
              <Switch
                id="balanceWorkload"
                checked={balanceWorkload}
                onCheckedChange={setBalanceWorkload}
              />
              <span className="text-sm text-muted-foreground">
                Distribute sessions evenly to prevent burnout
              </span>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleAutoSchedule} 
            disabled={isScheduling}
            className="flex items-center gap-1"
          >
            <Clock className="h-4 w-4" />
            {isScheduling ? "Scheduling..." : "Schedule Sessions"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AutoScheduleDialog;

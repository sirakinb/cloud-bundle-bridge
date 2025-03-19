
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Clock, Trash2, Ban, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useUnavailableTimes, UnavailableTimeBlock } from "@/contexts/UnavailableTimesContext";

type UnavailableTimesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const UnavailableTimesDialog = ({ open, onOpenChange }: UnavailableTimesDialogProps) => {
  const { unavailableTimes, addUnavailableTime, removeUnavailableTime } = useUnavailableTimes();
  
  const [dayOfWeek, setDayOfWeek] = useState<string>("1"); // Default to Monday
  const [startHour, setStartHour] = useState<string>("9");
  const [startMinute, setStartMinute] = useState<string>("00");
  const [endHour, setEndHour] = useState<string>("17");
  const [endMinute, setEndMinute] = useState<string>("00");
  const [label, setLabel] = useState<string>("");

  const dayNames = [
    "Sunday", 
    "Monday", 
    "Tuesday", 
    "Wednesday", 
    "Thursday", 
    "Friday", 
    "Saturday"
  ];

  // Generate hours for the select dropdown (8am to midnight)
  const hours = Array.from({ length: 17 }, (_, i) => {
    const hour = i + 8;
    return hour.toString();
  });

  // Generate minutes for the select dropdown
  const minutes = Array.from({ length: 60 }, (_, i) => {
    return i.toString().padStart(2, "0");
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert string values to numbers
    const startHourNum = parseInt(startHour);
    const startMinuteNum = parseInt(startMinute);
    const endHourNum = parseInt(endHour);
    const endMinuteNum = parseInt(endMinute);
    const dayOfWeekNum = parseInt(dayOfWeek);
    
    // Validate time range
    const startTime = startHourNum * 60 + startMinuteNum;
    const endTime = endHourNum * 60 + endMinuteNum;
    
    if (startTime >= endTime) {
      toast({
        variant: "destructive",
        title: "Invalid time range",
        description: "End time must be after start time",
      });
      return;
    }
    
    // Check for overlapping time blocks
    const isOverlapping = unavailableTimes.some(block => {
      if (block.dayOfWeek !== dayOfWeekNum) return false;
      
      const blockStartTime = block.startHour * 60 + block.startMinute;
      const blockEndTime = block.endHour * 60 + block.endMinute;
      
      return (
        (startTime >= blockStartTime && startTime < blockEndTime) ||
        (endTime > blockStartTime && endTime <= blockEndTime) ||
        (startTime <= blockStartTime && endTime >= blockEndTime)
      );
    });
    
    if (isOverlapping) {
      toast({
        variant: "destructive",
        title: "Overlapping time block",
        description: "This time block overlaps with an existing unavailable time",
      });
      return;
    }
    
    // Add the new unavailable time block
    addUnavailableTime({
      dayOfWeek: dayOfWeekNum,
      startHour: startHourNum,
      startMinute: startMinuteNum,
      endHour: endHourNum,
      endMinute: endMinuteNum,
      label: label.trim() || `Unavailable on ${dayNames[dayOfWeekNum]}`,
    });
    
    // Reset form
    setLabel("");
    
    toast({
      title: "Unavailable time added",
      description: `Added unavailable time on ${dayNames[dayOfWeekNum]}`,
    });
  };

  const formatTime = (hour: number, minute: number) => {
    const hourDisplay = hour > 12 ? hour - 12 : hour;
    const ampm = hour >= 12 ? "PM" : "AM";
    return `${hourDisplay}:${minute.toString().padStart(2, "0")} ${ampm}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Manage Unavailable Times</DialogTitle>
          <DialogDescription>
            Set recurring time blocks when you're unavailable. No tasks will be scheduled during these times.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="day-of-week" className="text-right">
              Day
            </Label>
            <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent>
                {dayNames.map((day, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Start Time</Label>
            <div className="col-span-3 flex space-x-2 items-center">
              <Select value={startHour} onValueChange={setStartHour}>
                <SelectTrigger className="w-[80px]">
                  <SelectValue placeholder="Hour" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px] overflow-y-auto">
                  {hours.map((h) => (
                    <SelectItem key={`start-${h}`} value={h}>
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <span>:</span>

              <Select value={startMinute} onValueChange={setStartMinute}>
                <SelectTrigger className="w-[80px]">
                  <SelectValue placeholder="Min" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px] overflow-y-auto">
                  {minutes.map((m) => (
                    <SelectItem key={`start-${m}`} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Clock className="h-4 w-4 text-gray-400" />
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">End Time</Label>
            <div className="col-span-3 flex space-x-2 items-center">
              <Select value={endHour} onValueChange={setEndHour}>
                <SelectTrigger className="w-[80px]">
                  <SelectValue placeholder="Hour" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px] overflow-y-auto">
                  {hours.map((h) => (
                    <SelectItem key={`end-${h}`} value={h}>
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <span>:</span>

              <Select value={endMinute} onValueChange={setEndMinute}>
                <SelectTrigger className="w-[80px]">
                  <SelectValue placeholder="Min" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px] overflow-y-auto">
                  {minutes.map((m) => (
                    <SelectItem key={`end-${m}`} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Clock className="h-4 w-4 text-gray-400" />
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="label" className="text-right">
              Label (Optional)
            </Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="col-span-3"
              placeholder="e.g., Class, Meeting, Gym"
            />
          </div>
          
          <div className="flex justify-end">
            <Button type="submit" className="flex items-center gap-1">
              <Plus className="h-4 w-4" />
              Add Unavailable Time
            </Button>
          </div>
        </form>
        
        <div className="pt-4 border-t">
          <h3 className="text-sm font-medium mb-2">Your Unavailable Times</h3>
          
          {unavailableTimes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No unavailable times set</p>
          ) : (
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {unavailableTimes.map((time) => (
                <Card key={time.id} className="border-muted">
                  <CardContent className="p-3 flex justify-between items-center">
                    <div>
                      <div className="font-medium">{dayNames[time.dayOfWeek]}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatTime(time.startHour, time.startMinute)} - {formatTime(time.endHour, time.endMinute)}
                      </div>
                      {time.label && <div className="text-xs mt-1">{time.label}</div>}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeUnavailableTime(time.id)}
                      aria-label="Remove unavailable time"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UnavailableTimesDialog;

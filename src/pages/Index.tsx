
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { File, Mic, Plus, Calendar, BookOpen, PanelLeft, MoreHorizontal } from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";
import { Sidebar, SidebarInset } from "@/components/ui/sidebar";
import TaskDialog from "@/components/TaskDialog";
import { useTasks } from "@/contexts/TaskContext";
import TaskItem from "@/components/TaskItem";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import PrioritizedTaskList from "@/components/PrioritizedTaskList";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

const Index = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { tasks } = useTasks();
  const navigate = useNavigate();
  const { colorScheme } = useTheme();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Handle window resize to detect mobile vs desktop
  useState(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  });

  // Combined function to handle quick actions
  const handleQuickAction = (action: string) => {
    switch(action) {
      case 'record':
        navigate('/record');
        break;
      case 'note':
        navigate('/notes/new');
        break;
      case 'task':
        setDialogOpen(true);
        break;
    }
  };
  
  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <SidebarInset className="p-6">
        <div className="w-full max-w-7xl mx-auto">
          {/* Welcome Banner - animation removed */}
          <div className="bg-accent/20 rounded-lg p-8 mb-8 transition-all duration-300 hover:shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="bg-accent p-3 rounded-full shadow-md transition-transform hover:scale-110 duration-300 mr-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-8 h-8 text-primary"
                  >
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                    <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-primary transition-colors hover:text-primary">Welcome, Student</h1>
                  <p className="text-foreground/70 text-lg">Track your tasks and recordings in one place.</p>
                </div>
              </div>

              {/* Unified Quick Actions Button */}
              {isMobile ? (
                <Drawer>
                  <DrawerTrigger asChild>
                    <Button variant="outline" size="icon" className="hover:bg-accent/30">
                      <Plus className="h-5 w-5" />
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent className="px-4 py-6">
                    <div className="grid gap-4">
                      <h3 className="text-lg font-semibold text-center mb-2">Quick Actions</h3>
                      <Button onClick={() => handleQuickAction('record')} className="flex justify-start">
                        <Mic className="mr-2 h-5 w-5" /> New Recording
                      </Button>
                      <Button onClick={() => handleQuickAction('note')} className="flex justify-start">
                        <File className="mr-2 h-5 w-5" /> New Note
                      </Button>
                      <Button onClick={() => handleQuickAction('task')} className="flex justify-start">
                        <Plus className="mr-2 h-5 w-5" /> Add Task
                      </Button>
                    </div>
                  </DrawerContent>
                </Drawer>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" /> Quick Action
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => handleQuickAction('record')}>
                      <Mic className="mr-2 h-4 w-4" /> New Recording
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleQuickAction('note')}>
                      <File className="mr-2 h-4 w-4" /> New Note
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleQuickAction('task')}>
                      <Plus className="mr-2 h-4 w-4" /> Add Task
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* Optimized Daily Tasks with inline add button */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Today's Tasks</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center gap-1"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="h-4 w-4" /> Add
              </Button>
            </div>
            <PrioritizedTaskList 
              title="" 
              description="Optimized for maximum productivity" 
              showOptimized={true}
              maxDailyMinutes={240}
            />
          </div>

          {/* All Upcoming Tasks - simplified heading */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">All Upcoming Tasks</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center gap-1"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="h-4 w-4" /> Add
              </Button>
            </div>
            <PrioritizedTaskList 
              title="" 
              description="Sorted by urgency and deadline" 
              showOptimized={false}
              maxTasks={10}
            />
          </div>

          {/* Recent Recordings with View All link */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Recent Recordings</h2>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1"
                onClick={() => navigate('/record')}
              >
                <Mic className="h-4 w-4" /> Record
              </Button>
            </div>
            <Card className="transition-all duration-300 hover:shadow-md">
              <CardContent className="p-6">
                <p className="text-foreground/60">No recordings yet</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>

      {/* Task Dialog */}
      <TaskDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
      />
    </div>
  );
};

export default Index;

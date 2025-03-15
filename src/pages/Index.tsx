
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { File, Mic, Plus } from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";
import { Sidebar, SidebarInset } from "@/components/ui/sidebar";
import TaskDialog from "@/components/TaskDialog";

const Index = () => {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <SidebarInset className="p-6">
        <div className="w-full max-w-7xl mx-auto">
          {/* Welcome Banner */}
          <div className="bg-blue-50 rounded-lg p-8 mb-8 transition-all duration-300 hover:shadow-lg animate-pulse">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-blue-100 p-3 rounded-full shadow-md transition-transform hover:scale-110 duration-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-8 h-8 text-blue-600"
                >
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
                </svg>
              </div>
            </div>
            <h1 className="text-4xl font-bold text-blue-600 mb-2 text-center transition-colors hover:text-blue-700">Welcome, Student</h1>
            <p className="text-gray-600 text-center text-lg">Track your tasks and recordings in one place.</p>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="bg-red-50 border-red-100 transition-all duration-300 hover:shadow-xl hover:bg-red-100 cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="mr-4 bg-red-200 p-3 rounded-full transition-all duration-300 group-hover:bg-red-300 shadow-md">
                    <Mic className="h-6 w-6 text-red-500 transition-transform group-hover:scale-110" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold mb-1 group-hover:text-red-700 transition-colors">New Recording</h2>
                    <p className="text-gray-600 group-hover:text-gray-700 transition-colors">Start recording your lecture</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-100 transition-all duration-300 hover:shadow-xl hover:bg-blue-100 cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="mr-4 bg-blue-200 p-3 rounded-full transition-all duration-300 group-hover:bg-blue-300 shadow-md">
                    <File className="h-6 w-6 text-blue-500 transition-transform group-hover:scale-110" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold mb-1 group-hover:text-blue-700 transition-colors">New Note</h2>
                    <p className="text-gray-600 group-hover:text-gray-700 transition-colors">Create a new study note</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Today's Tasks */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Today's Tasks</h2>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1 hover:shadow-md transition-all duration-300 hover:bg-blue-50"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="h-4 w-4" /> Add Task
              </Button>
            </div>
            <Card className="transition-all duration-300 hover:shadow-md">
              <CardContent className="p-6">
                <p className="text-gray-500">No tasks for today</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Recordings */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Recent Recordings</h2>
            <Card className="transition-all duration-300 hover:shadow-md">
              <CardContent className="p-6">
                <p className="text-gray-500">No recordings yet</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>

      {/* Task Dialog */}
      <TaskDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
};

export default Index;

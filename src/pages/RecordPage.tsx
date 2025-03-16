
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { AppSidebar } from "@/components/AppSidebar";
import { Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { AlertTriangle, Check, Mic, Square } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { toast as sonnerToast } from "sonner";

const RecordPage = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingInterval, setRecordingInterval] = useState<NodeJS.Timeout | null>(null);
  const [recordingTitle, setRecordingTitle] = useState("");
  const [recordingNotes, setRecordingNotes] = useState("");
  const { toast } = useToast();

  const startRecording = () => {
    if (!recordingTitle.trim()) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please provide a title for your recording",
      });
      return;
    }

    setIsRecording(true);
    
    // Setup interval to update recording time
    const interval = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
    
    setRecordingInterval(interval);
    
    sonnerToast("Recording Started", {
      description: "Your lecture recording has begun",
    });
  };
  
  const stopRecording = () => {
    if (recordingInterval) {
      clearInterval(recordingInterval);
    }
    
    setIsRecording(false);
    
    toast({
      title: "Recording Saved",
      description: `Your recording "${recordingTitle}" has been saved.`,
    });
    
    // Reset form after saving
    setRecordingTime(0);
    setRecordingTitle("");
    setRecordingNotes("");
  };
  
  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <SidebarInset className="p-6">
        <div className="w-full max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Record Lecture</h1>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Recording Information</CardTitle>
              <CardDescription>Provide details about the lecture you are recording</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="recording-title" className="block text-sm font-medium text-gray-700 mb-1">
                  Recording Title
                </label>
                <input
                  id="recording-title"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter a title for your recording"
                  value={recordingTitle}
                  onChange={(e) => setRecordingTitle(e.target.value)}
                  disabled={isRecording}
                />
              </div>
              
              <div>
                <label htmlFor="recording-notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <Textarea
                  id="recording-notes"
                  placeholder="Add any notes about this recording (optional)"
                  value={recordingNotes}
                  onChange={(e) => setRecordingNotes(e.target.value)}
                  disabled={isRecording}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center">
                {isRecording ? (
                  <>
                    <div className="flex items-center justify-center w-24 h-24 rounded-full bg-red-100 mb-4 relative">
                      <div className="absolute inset-0 rounded-full bg-red-400 animate-pulse opacity-50"></div>
                      <div className="z-10 text-red-600 font-mono text-xl font-semibold">
                        {formatTime(recordingTime)}
                      </div>
                    </div>
                    <p className="text-red-600 font-medium text-lg mb-6">Recording in progress...</p>
                    <Button 
                      variant="destructive"
                      size="lg"
                      className="flex items-center gap-2 hover-glow glow-red" 
                      onClick={stopRecording}
                    >
                      <Square className="h-4 w-4" />
                      Stop Recording
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-center w-24 h-24 rounded-full bg-green-100 mb-4">
                      <Mic className="h-10 w-10 text-green-600" />
                    </div>
                    <p className="text-lg mb-6">Ready to record your lecture</p>
                    <Button 
                      variant="default"
                      size="lg"
                      className="bg-green-600 hover:bg-green-700 flex items-center gap-2 hover-glow glow-green" 
                      onClick={startRecording}
                    >
                      <Mic className="h-4 w-4" />
                      Start Recording
                    </Button>
                  </>
                )}
              </div>

              {!isRecording && (
                <div className="mt-8 bg-amber-50 border border-amber-200 rounded-md p-4">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 mr-2" />
                    <div>
                      <h4 className="text-sm font-medium text-amber-800">Before you start</h4>
                      <p className="text-sm text-amber-700 mt-1">
                        Make sure you have permission to record the lecture and that your microphone is working properly.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </div>
  );
};

export default RecordPage;

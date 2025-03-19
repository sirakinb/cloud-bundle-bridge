
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { AppSidebar } from "@/components/AppSidebar";
import { Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { 
  AlertTriangle, 
  Check, 
  Mic, 
  Square, 
  Play, 
  Pause, 
  RotateCcw, 
  Save,
  FolderPlus,
  Trash2,
  FileText,
  Folder,
  ChevronRight,
  ChevronDown
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { toast as sonnerToast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { useTheme } from "@/contexts/ThemeContext";
import { saveRecording, getRecordings, deleteRecording, Recording, getFolders, Folder as FolderType } from "@/utils/recordingUtils";
import { FolderDialog } from "@/components/FolderDialog";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const RecordPage = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingInterval, setRecordingInterval] = useState<NodeJS.Timeout | null>(null);
  const [recordingTitle, setRecordingTitle] = useState("");
  const [recordingNotes, setRecordingNotes] = useState("");
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>("default");
  const [showRecordings, setShowRecordings] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<string[]>(['default']);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const { colorScheme } = useTheme();

  useEffect(() => {
    // Load recordings and folders when component mounts
    setRecordings(getRecordings());
    setFolders(getFolders());
  }, []);

  // Group recordings by folder
  const recordingsByFolder = recordings.reduce((acc, recording) => {
    const folderId = recording.folderId || 'default';
    if (!acc[folderId]) {
      acc[folderId] = [];
    }
    acc[folderId].push(recording);
    return acc;
  }, {} as Record<string, Recording[]>);

  // Get folder name by ID
  const getFolderName = (folderId: string): string => {
    const folder = folders.find(f => f.id === folderId);
    return folder ? folder.name : 'Default';
  };

  // Function to toggle expanded state of a folder
  const toggleFolderExpanded = (folderId: string) => {
    setExpandedFolders(prev => 
      prev.includes(folderId) 
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    );
  };

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
    setIsPaused(false);
    
    const interval = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
    
    intervalRef.current = interval;
    setRecordingInterval(interval);
    
    sonnerToast("Recording Started", {
      description: "Your lecture recording has begun",
    });
  };
  
  const pauseRecording = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setIsPaused(true);
    
    sonnerToast("Recording Paused", {
      description: "Your recording has been paused",
    });
  };
  
  const resumeRecording = () => {
    setIsPaused(false);
    
    const interval = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
    
    intervalRef.current = interval;
    
    sonnerToast("Recording Resumed", {
      description: "Your recording has been resumed",
    });
  };
  
  const stopRecording = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setIsRecording(false);
    setIsPaused(false);
    
    // Open folder dialog to save recording
    setFolderDialogOpen(true);
  };
  
  const handleSaveRecording = (folderId: string) => {
    // Create new recording object
    const newRecording: Recording = {
      id: Date.now().toString(36),
      title: recordingTitle,
      notes: recordingNotes,
      duration: recordingTime,
      date: new Date().toISOString(),
      folderId: folderId
    };
    
    // Save recording
    saveRecording(newRecording);
    
    // Update local state
    setRecordings([...recordings, newRecording]);
    
    toast({
      title: "Recording Saved",
      description: `Your recording "${recordingTitle}" has been saved.`,
    });
    
    // Don't reset form after stopping to allow for review
  };
  
  const restartRecording = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setRecordingTime(0);
    
    const interval = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
    
    intervalRef.current = interval;
    setIsPaused(false);
    
    sonnerToast("Recording Restarted", {
      description: "Your recording has been restarted",
    });
  };
  
  const resetRecording = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setIsRecording(false);
    setIsPaused(false);
    setRecordingTime(0);
    setRecordingTitle("");
    setRecordingNotes("");
    
    toast({
      title: "Recording Reset",
      description: "All recording data has been cleared.",
    });
  };
  
  const handleDeleteRecording = (id: string) => {
    deleteRecording(id);
    setRecordings(recordings.filter(rec => rec.id !== id));
    toast({
      title: "Recording Deleted",
      description: "The recording has been removed.",
    });
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <SidebarInset className="p-6">
        <div className="w-full max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-foreground">Record Lecture</h1>
            <div>
              <Button 
                variant="outline"
                onClick={() => setShowRecordings(!showRecordings)}
                className="flex items-center gap-2"
              >
                {showRecordings ? <Mic className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                {showRecordings ? "New Recording" : "My Recordings"}
              </Button>
            </div>
          </div>

          {showRecordings ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">My Recordings</CardTitle>
                <CardDescription>Manage your saved recordings</CardDescription>
              </CardHeader>
              <CardContent>
                {recordings.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium mb-2 text-foreground">No recordings yet</p>
                    <p className="text-muted-foreground mb-4">Your saved recordings will appear here</p>
                    <Button 
                      onClick={() => setShowRecordings(false)}
                      className="flex items-center gap-2"
                    >
                      <Mic className="h-4 w-4" />
                      Create New Recording
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Accordion type="multiple" defaultValue={['default']} className="w-full">
                      {Object.keys(recordingsByFolder).map((folderId) => (
                        <AccordionItem key={folderId} value={folderId}>
                          <AccordionTrigger className="hover:no-underline text-foreground">
                            <div className="flex items-center">
                              <Folder className="h-4 w-4 mr-2 text-primary" />
                              <span>{getFolderName(folderId)}</span>
                              <span className="ml-2 text-xs text-muted-foreground">
                                ({recordingsByFolder[folderId].length})
                              </span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="pl-6 space-y-2">
                              {recordingsByFolder[folderId].map((recording) => (
                                <div key={recording.id} className="flex justify-between items-start border rounded-lg p-4 hover:bg-accent/5 transition-colors">
                                  <div>
                                    <div className="font-medium text-foreground">{recording.title}</div>
                                    <div className="text-sm text-muted-foreground mt-1">
                                      {formatDate(recording.date)} • {formatTime(recording.duration)}
                                    </div>
                                    {recording.notes && (
                                      <p className="text-sm mt-2 line-clamp-2 text-foreground/80">{recording.notes}</p>
                                    )}
                                  </div>
                                  <div className="flex gap-2">
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="h-8 w-8 p-0"
                                      onClick={() => handleDeleteRecording(recording.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      <span className="sr-only">Delete</span>
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-foreground">Recording Information</CardTitle>
                  <CardDescription>Provide details about the lecture you are recording</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label htmlFor="recording-title" className="block text-sm font-medium text-foreground/80 mb-1">
                      Recording Title
                    </label>
                    <Input
                      id="recording-title"
                      type="text"
                      placeholder="Enter a title for your recording"
                      value={recordingTitle}
                      onChange={(e) => setRecordingTitle(e.target.value)}
                      disabled={isRecording}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="recording-notes" className="block text-sm font-medium text-foreground/80 mb-1">
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
                        <div className="flex items-center justify-center w-24 h-24 rounded-full bg-accent/20 mb-4 relative">
                          <div className={`absolute inset-0 rounded-full bg-primary/30 ${isPaused ? '' : 'animate-pulse'} opacity-50`}></div>
                          <div className="z-10 text-primary font-mono text-xl font-semibold">
                            {formatTime(recordingTime)}
                          </div>
                        </div>
                        
                        <div className="w-full max-w-md mb-6">
                          <Progress value={100} className="h-2" />
                        </div>
                        
                        <p className={`text-${isPaused ? 'accent' : 'primary'} font-medium text-lg mb-4`}>
                          {isPaused ? 'Recording paused' : 'Recording in progress...'}
                        </p>
                        
                        <div className="flex flex-wrap gap-3 justify-center mb-6">
                          {isPaused ? (
                            <Button 
                              variant="default"
                              size="lg"
                              className="bg-primary hover:bg-primary/90 flex items-center gap-2 hover-glow" 
                              onClick={resumeRecording}
                            >
                              <Play className="h-4 w-4" />
                              Resume
                            </Button>
                          ) : (
                            <Button 
                              variant="outline"
                              size="lg"
                              className="flex items-center gap-2 hover-glow" 
                              onClick={pauseRecording}
                            >
                              <Pause className="h-4 w-4" />
                              Pause
                            </Button>
                          )}
                          
                          <Button 
                            variant="outline"
                            size="lg"
                            className="flex items-center gap-2 hover-glow" 
                            onClick={restartRecording}
                          >
                            <RotateCcw className="h-4 w-4" />
                            Restart
                          </Button>
                          
                          <Button 
                            variant="destructive"
                            size="lg"
                            className="flex items-center gap-2 hover-glow" 
                            onClick={stopRecording}
                          >
                            <Square className="h-4 w-4" />
                            Stop
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-center w-24 h-24 rounded-full bg-accent/20 mb-4">
                          <Mic className="h-10 w-10 text-primary" />
                        </div>
                        <p className="text-lg mb-6">Ready to record your lecture</p>
                        <Button 
                          variant="default"
                          size="lg"
                          className="bg-primary hover:bg-primary/90 flex items-center gap-2 hover-glow" 
                          onClick={startRecording}
                        >
                          <Mic className="h-4 w-4" />
                          Start Recording
                        </Button>
                        
                        {recordingTime > 0 && (
                          <div className="mt-4">
                            <p className="text-sm text-foreground/70 mb-2">Previous recording: {formatTime(recordingTime)}</p>
                            <Button 
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-2" 
                              onClick={resetRecording}
                            >
                              Clear
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {!isRecording && (
                    <div className="mt-8 bg-accent/10 border border-accent/20 rounded-md p-4">
                      <div className="flex items-start">
                        <AlertTriangle className="h-5 w-5 text-primary/80 mt-0.5 mr-2" />
                        <div>
                          <h4 className="text-sm font-medium text-foreground">Before you start</h4>
                          <p className="text-sm text-foreground/80 mt-1">
                            Make sure you have permission to record the lecture and that your microphone is working properly.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </SidebarInset>
      
      <FolderDialog 
        open={folderDialogOpen} 
        onOpenChange={setFolderDialogOpen} 
        onSelectFolder={(folderId) => {
          handleSaveRecording(folderId);
          setFolderDialogOpen(false);
        }} 
      />
    </div>
  );
};

export default RecordPage;


import React, { useState, useRef, useEffect } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Mic, Stop, Save, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Sidebar, SidebarInset } from "@/components/ui/sidebar";

const RecordPage = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [title, setTitle] = useState("");
  const [recordings, setRecordings] = useState<{ id: string; title: string; duration: number }[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const { toast } = useToast();

  // Handle recording timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      toast({
        title: "Recording started",
        description: "Your lecture is now being recorded",
      });
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        variant: "destructive",
        title: "Recording failed",
        description: "Could not access microphone. Please check your permissions.",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      mediaRecorderRef.current.onstop = () => {
        const recordingId = Math.random().toString(36).substring(2, 9);
        // In a real app, we would save the audio blob
        setRecordings((prev) => [
          ...prev,
          { id: recordingId, title: title || `Recording ${prev.length + 1}`, duration: recordingTime },
        ]);
        
        toast({
          title: "Recording stopped",
          description: "Your recording has been saved",
        });
        
        // Reset form
        setTitle("");
      };
      
      // Stop all tracks on the stream
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const deleteRecording = (id: string) => {
    setRecordings((prev) => prev.filter((rec) => rec.id !== id));
    toast({
      title: "Recording deleted",
      description: "The recording has been removed",
    });
  };

  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <SidebarInset className="p-6">
        <div className="w-full max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Record Lecture</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <Card className="bg-white shadow-md">
              <CardHeader>
                <CardTitle>New Recording</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="recording-title" className="block text-sm font-medium text-gray-700 mb-1">
                      Recording Title
                    </label>
                    <Input
                      id="recording-title"
                      placeholder="Enter recording title..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      disabled={isRecording}
                    />
                  </div>

                  <div className="flex justify-center items-center py-8">
                    {isRecording ? (
                      <div className="text-center">
                        <div className="text-4xl font-bold text-red-500 mb-3">{formatTime(recordingTime)}</div>
                        <div className="animate-pulse h-4 w-32 mx-auto bg-red-200 rounded-full mb-4"></div>
                        <Button
                          variant="destructive"
                          size="lg"
                          className="rounded-full p-6"
                          onClick={stopRecording}
                        >
                          <Stop className="h-8 w-8" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="lg"
                        className="rounded-full p-6 border-2 border-red-500 text-red-500 hover:bg-red-50"
                        onClick={startRecording}
                      >
                        <Mic className="h-8 w-8" />
                      </Button>
                    )}
                  </div>

                  <div className="text-center text-sm text-gray-500">
                    {isRecording
                      ? "Click the stop button to end your recording"
                      : "Click the microphone to start recording"}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-md">
              <CardHeader>
                <CardTitle>Recent Recordings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recordings.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No recordings yet</p>
                  ) : (
                    recordings.map((recording) => (
                      <div
                        key={recording.id}
                        className="border rounded-md p-3 flex justify-between items-center hover:bg-gray-50"
                      >
                        <div>
                          <h3 className="font-medium">{recording.title}</h3>
                          <p className="text-sm text-gray-500">Duration: {formatTime(recording.duration)}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              toast({
                                title: "Note created",
                                description: "Navigate to Notes to view your created note",
                              });
                            }}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => deleteRecording(recording.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </div>
  );
};

export default RecordPage;

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Player } from "@shared/schema";

const SessionRecording = () => {
  const { toast } = useToast();
  
  const [batchName, setBatchName] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [sessionTitle, setSessionTitle] = useState("");
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);

  const { data: players } = useQuery<Player[]>({
    queryKey: ["/api/players"],
  });
  
  // Get unique batch names from players data
  const batches = players 
    ? Array.from(new Set(players.map(player => player.batch)))
    : [];

  // Function to start video recording
  const startRecording = async () => {
    try {
      // Reset previous recordings
      setRecordedChunks([]);
      setPreviewUrl(null);
      
      // Get user media with video and audio
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: true
      });
      
      // Set stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp9",
      });
      
      // Store data when available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks((prev) => [...prev, event.data]);
        }
      };
      
      // Store references
      mediaRecorderRef.current = mediaRecorder;
      streamRef.current = stream;
      
      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      
      // Set up timer
      let seconds = 0;
      timerRef.current = window.setInterval(() => {
        seconds += 1;
        setRecordingTime(seconds);
      }, 1000);
      
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        variant: "destructive",
        title: "Camera Access Error",
        description: "Could not access your camera. Please check permissions."
      });
    }
  };

  // Function to stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && streamRef.current) {
      // Stop media recorder
      mediaRecorderRef.current.stop();
      
      // Stop all tracks in the stream
      streamRef.current.getTracks().forEach(track => track.stop());
      
      // Clear video source
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      
      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      setIsRecording(false);
    }
  };

  // Effect to create preview URL when recording chunks change
  useEffect(() => {
    if (recordedChunks.length > 0 && !isRecording) {
      const videoBlob = new Blob(recordedChunks, { type: "video/webm" });
      const videoUrl = URL.createObjectURL(videoBlob);
      setPreviewUrl(videoUrl);
    }
  }, [recordedChunks, isRecording]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Stop recording when component unmounts
      if (mediaRecorderRef.current && streamRef.current) {
        mediaRecorderRef.current.stop();
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Clear any preview URLs to avoid memory leaks
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [previewUrl]);

  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Save the recorded video
  const saveVideo = async () => {
    if (!recordedChunks.length || !sessionTitle || !batchName) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please provide a session title and select a batch before saving."
      });
      return;
    }

    try {
      // Create form data
      const formData = new FormData();
      const videoBlob = new Blob(recordedChunks, { type: "video/webm" });
      formData.append("video", videoBlob, `${sessionTitle.replace(/\s+/g, '_')}.webm`);
      formData.append("title", sessionTitle);
      formData.append("batchName", batchName);
      
      // Submit video to server
      const response = await fetch(`/api/sessions/videos/upload`, {
        method: "POST",
        body: formData
      });
      
      if (!response.ok) {
        throw new Error("Failed to upload video");
      }
      
      toast({
        title: "Session Video Saved",
        description: "Your recording has been saved successfully."
      });
      
      // Reset form
      setSessionTitle("");
      setBatchName("");
      setRecordedChunks([]);
      setPreviewUrl(null);
      
    } catch (error) {
      console.error("Error saving video:", error);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: "There was a problem saving your video. Please try again."
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-neutral-400">Training Session Recording</h2>
        <p className="text-neutral-600">Record videos of your coaching sessions by batch</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="border-b border-neutral-200 p-4">
            <CardTitle>Camera</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="relative aspect-video bg-neutral-900 rounded overflow-hidden mb-4">
              {isRecording && (
                <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center z-10">
                  <span className="animate-pulse mr-1">●</span> 
                  {formatTime(recordingTime)}
                </div>
              )}
              
              {previewUrl ? (
                <video 
                  src={previewUrl} 
                  controls 
                  className="w-full h-full object-contain"
                />
              ) : (
                <video 
                  ref={videoRef}
                  autoPlay 
                  playsInline
                  muted 
                  className="w-full h-full object-cover"
                />
              )}
              
              {!isRecording && !previewUrl && (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2">
                    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
                    <circle cx="12" cy="13" r="3"></circle>
                  </svg>
                  <p className="text-white text-center">Press Start Recording to begin</p>
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2">
              {!isRecording && !previewUrl && (
                <Button 
                  onClick={startRecording} 
                  className="bg-primary hover:bg-primary-dark"
                >
                  Start Recording
                </Button>
              )}
              
              {isRecording && (
                <Button 
                  onClick={stopRecording} 
                  variant="destructive"
                >
                  Stop Recording
                </Button>
              )}
              
              {previewUrl && (
                <>
                  <Button 
                    onClick={() => {
                      setPreviewUrl(null);
                      setRecordedChunks([]);
                    }}
                    variant="outline"
                  >
                    Discard
                  </Button>
                  
                  <Button 
                    onClick={startRecording}
                  >
                    Record Again
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="border-b border-neutral-200 p-4">
            <CardTitle>Session Details</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="sessionTitle">Session Title</Label>
                <Input
                  id="sessionTitle"
                  placeholder="Enter session title"
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="batchSelect">Select Batch</Label>
                <Select value={batchName} onValueChange={setBatchName}>
                  <SelectTrigger id="batchSelect">
                    <SelectValue placeholder="Select a batch" />
                  </SelectTrigger>
                  <SelectContent>
                    {batches.map((batch) => (
                      <SelectItem key={batch} value={batch}>
                        {batch}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={saveVideo}
                disabled={!previewUrl || !sessionTitle || !batchName}
                className="w-full mt-4"
              >
                Save Session Video
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SessionRecording;
import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import VideoPlayer from "@/components/VideoPlayer";
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
  const timerRef = useRef<number | null>(null);
  
  const { data: players } = useQuery<Player[]>({
    queryKey: ['/api/players'],
  });
  
  // Find all unique batch names
  const batchOptions = players ? [...new Set(players.map(player => player.batch))].filter(Boolean) : [];
  
  // Filter players by selected batch
  const batchPlayers = players ? players.filter(player => player.batch === batchName) : [];
  
  useEffect(() => {
    return () => {
      // Clean up when component unmounts
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
      
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);
  
  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const startRecording = async () => {
    if (!batchName) {
      toast({
        title: "Batch selection required",
        description: "Please select a batch before starting the recording.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks(prev => [...prev, event.data]);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'video/mp4' });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        
        // Clean up media stream
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      };
      
      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error("Error accessing media devices:", error);
      toast({
        title: "Camera access denied",
        description: "Please allow access to your camera and microphone to record sessions.",
        variant: "destructive"
      });
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setIsRecording(false);
  };
  
  const handleSaveRecording = async () => {
    if (!previewUrl || !sessionTitle || !batchName) {
      toast({
        title: "Missing information",
        description: "Please provide a title for this session recording.",
        variant: "destructive"
      });
      return;
    }
    
    // Create a form to send the video file
    const formData = new FormData();
    const videoBlob = new Blob(recordedChunks, { type: 'video/mp4' });
    formData.append('video', videoBlob, `${sessionTitle.replace(/\s+/g, '_')}.mp4`);
    formData.append('title', sessionTitle);
    formData.append('batch', batchName);
    
    toast({
      title: "Success!",
      description: "Your session has been saved. You can view it in the session history below.",
    });
    
    // Clear recording state
    setPreviewUrl(null);
    setRecordedChunks([]);
    setSessionTitle("");
  };
  
  return (
    <div className="container py-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Session Recording</h1>
        <p className="text-neutral-600 mt-1">
          Record training sessions for entire batches of players
        </p>
      </div>
      
      {/* Recording Interface */}
      <Card>
        <CardHeader>
          <CardTitle>Record New Session</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="batch">Select Batch</Label>
                <Select value={batchName} onValueChange={setBatchName}>
                  <SelectTrigger id="batch">
                    <SelectValue placeholder="Choose a batch" />
                  </SelectTrigger>
                  <SelectContent>
                    {batchOptions.map((batch) => (
                      <SelectItem key={batch} value={batch}>
                        {batch}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {batchName && (
                <div>
                  <h3 className="font-semibold mb-2">Players in this batch:</h3>
                  <div className="bg-neutral-50 p-3 rounded-md max-h-40 overflow-y-auto space-y-1">
                    {batchPlayers.map((player) => (
                      <div key={player.id} className="text-sm">
                        • {player.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {previewUrl && (
                <div className="space-y-3">
                  <Label htmlFor="title">Session Title</Label>
                  <Input 
                    id="title" 
                    placeholder="Enter a title for this session"
                    value={sessionTitle}
                    onChange={(e) => setSessionTitle(e.target.value)}
                  />
                  <Button 
                    className="w-full" 
                    onClick={handleSaveRecording}
                    disabled={!sessionTitle}
                  >
                    Save Recording
                  </Button>
                </div>
              )}
            </div>
            
            <div className="aspect-video bg-neutral-900 relative rounded-md overflow-hidden">
              {!previewUrl ? (
                <>
                  {isRecording ? (
                    <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded flex items-center space-x-1">
                      <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                      <span className="ml-1 font-mono">{formatTime(recordingTime)}</span>
                    </div>
                  ) : null}
                  <video 
                    ref={videoRef}
                    autoPlay 
                    muted
                    className="w-full h-full object-cover"
                  ></video>
                </>
              ) : (
                <video 
                  src={previewUrl}
                  className="w-full h-full object-cover"
                  controls
                ></video>
              )}
              
              {!isRecording && !previewUrl && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                  <div className="text-5xl mb-4">📹</div>
                  <p className="text-lg mb-2">Ready to Record</p>
                  <p className="text-sm opacity-70 max-w-md text-center">
                    Select a batch and click Record to start capturing a training session
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-center pt-2">
            {!isRecording && !previewUrl ? (
              <Button 
                onClick={startRecording} 
                disabled={!batchName}
                className="bg-red-600 hover:bg-red-700 px-8"
              >
                Start Recording
              </Button>
            ) : isRecording ? (
              <Button 
                variant="destructive" 
                onClick={stopRecording}
                className="px-8"
              >
                Stop Recording
              </Button>
            ) : (
              <Button 
                variant="outline" 
                onClick={() => {
                  if (previewUrl) {
                    URL.revokeObjectURL(previewUrl);
                  }
                  setPreviewUrl(null);
                  setRecordedChunks([]);
                }}
                className="px-8"
              >
                Discard & Record Again
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Session History */}
      <div>
        <h2 className="text-xl font-bold mb-4">Session History</h2>
        
        <div className="flex overflow-x-auto pb-4 space-x-4">
          {/* Recent Session Video */}
          <div className="flex-shrink-0 w-80">
            <Card className="overflow-hidden h-full">
              <div className="aspect-video">
                <VideoPlayer 
                  videoUrl="/assets/Video 3.mp4"
                  title="Advanced Batting Session"
                  className="w-full h-full"
                />
              </div>
              <CardContent className="p-3">
                <h4 className="font-bold">Advanced Batting Session</h4>
                <p className="text-sm text-neutral-600">Recorded on May 10, 2023</p>
                <div className="mt-1">
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    Advanced Batch
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Example Video 1 */}
          <div className="flex-shrink-0 w-80">
            <Card className="overflow-hidden h-full">
              <div className="aspect-video">
                <VideoPlayer 
                  videoUrl="/assets/Video 1.mp4"
                  title="Morning Batch Batting Practice"
                  className="w-full h-full"
                />
              </div>
              <CardContent className="p-3">
                <h4 className="font-bold">Morning Batch Batting Practice</h4>
                <p className="text-sm text-neutral-600">Recorded on July 15, 2023</p>
                <div className="mt-1">
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    Morning Batch
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Example Video 2 */}
          <div className="flex-shrink-0 w-80">
            <Card className="overflow-hidden h-full">
              <div className="aspect-video">
                <VideoPlayer 
                  videoUrl="/assets/Video 2.mp4"
                  title="Footwork Drill Session"
                  className="w-full h-full"
                />
              </div>
              <CardContent className="p-3">
                <h4 className="font-bold">Footwork Drill Session</h4>
                <p className="text-sm text-neutral-600">Recorded on June 5, 2023</p>
                <div className="mt-1">
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    Intermediate Batch
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Example Video 4 */}
          <div className="flex-shrink-0 w-80">
            <Card className="overflow-hidden h-full">
              <div className="aspect-video">
                <VideoPlayer 
                  videoUrl="/assets/Video 4.mp4"
                  title="Bowling Technique Workshop"
                  className="w-full h-full"
                />
              </div>
              <CardContent className="p-3">
                <h4 className="font-bold">Bowling Technique Workshop</h4>
                <p className="text-sm text-neutral-600">Recorded on August 21, 2023</p>
                <div className="mt-1">
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    Advanced Batch
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionRecording;
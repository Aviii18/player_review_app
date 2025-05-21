import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import StarRating from "@/components/StarRating";
import VideoPlayer from "@/components/VideoPlayer";
import type { Player, Video } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface ProblemArea {
  type: string;
  rating: number;
  notes: string;
}

const PerformanceAssessment = () => {
  const params = useParams<{ id: string }>();
  const playerId = params.id ? parseInt(params.id) : 0;
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  
  // State for video attribute tagging
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isTaggingMode, setIsTaggingMode] = useState(false);
  const [videoTags, setVideoTags] = useState<{
    shotType: string;
    ballLength: string;
    ballSpeed: string;
    batConnect: string;
    notes: string;
  }>({
    shotType: '',
    ballLength: '',
    ballSpeed: '',
    batConnect: '',
    notes: ''
  });

  const { data: player, isLoading: isPlayerLoading } = useQuery<Player>({
    queryKey: [`/api/players/${playerId}`],
    enabled: !isNaN(playerId)
  });

  const [shotTypeFilter, setShotTypeFilter] = useState("All Shot Types");
  const [ballSpeedFilter, setBallSpeedFilter] = useState("All Speeds");
  const [batConnectFilter, setBatConnectFilter] = useState("All");
  const [sessionNotes, setSessionNotes] = useState("");
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [problemAreas, setProblemAreas] = useState<ProblemArea[]>([
    { type: "bat_connect", rating: 0, notes: "" },
    { type: "foot_movement", rating: 0, notes: "" }
  ]);
  
  // Shot Specific Performance Areas
  const [selectedShotType, setSelectedShotType] = useState<string>("Cover Drive");
  const [shotTypeNotes, setShotTypeNotes] = useState<string>("");
  
  interface ShotSpecificArea {
    id: string;
    name: string;
    rating: number;
    notes: string;
  }
  
  const [shotSpecificAreas, setShotSpecificAreas] = useState<ShotSpecificArea[]>([
    { id: "hands_grip", name: "Hands Grip", rating: 0, notes: "" },
    { id: "top_hand_forearm", name: "Top Hand Forearm Push", rating: 0, notes: "" },
    { id: "head_stability", name: "Head Stability", rating: 0, notes: "" },
    { id: "bat_movement", name: "Bat Movement Line", rating: 0, notes: "" },
    { id: "foot_position", name: "Front & Back Foot Movement & Position", rating: 0, notes: "" },
    { id: "weight_transfer", name: "Weight Transfer to Front Foot", rating: 0, notes: "" },
    { id: "elbow_shoulder", name: "Elbow Shoulder Alignment", rating: 0, notes: "" }
  ]);

  // Fetch videos with filters
  const { data: videos, isLoading: isVideosLoading } = useQuery<Video[]>({
    queryKey: [
      `/api/players/${playerId}/videos`, 
      { shotType: shotTypeFilter, ballSpeed: ballSpeedFilter, batConnect: batConnectFilter }
    ],
    enabled: !isNaN(playerId)
  });

  // Create a new assessment with problem areas
  const createAssessment = useMutation({
    mutationFn: async () => {
      // Create assessment
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay()); // Start of current week (Sunday)
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6); // End of week (Saturday)
      
      const assessmentResponse = await apiRequest('POST', `/api/players/${playerId}/assessments`, {
        weekStart,
        weekEnd,
        notes: sessionNotes,
        isLatest: true
      });
      
      const assessment = await assessmentResponse.json();
      
      // Create problem areas for this assessment
      const validProblemAreas = problemAreas.filter(pa => pa.rating > 0);
      
      for (const pa of validProblemAreas) {
        await apiRequest('POST', `/api/assessments/${assessment.id}/problem-areas`, {
          areaType: pa.type,
          rating: pa.rating,
          notes: pa.notes
        });
      }
      
      return assessment;
    },
    onSuccess: () => {
      toast({
        title: "Assessment saved",
        description: "The player assessment has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/players/${playerId}/assessments`] });
      navigate(`/players/${playerId}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save the assessment. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSaveAssessment = () => {
    createAssessment.mutate();
  };

  const handleProblemAreaChange = (index: number, field: keyof ProblemArea, value: string | number) => {
    const newProblemAreas = [...problemAreas];
    newProblemAreas[index] = {
      ...newProblemAreas[index],
      [field]: value
    };
    setProblemAreas(newProblemAreas);
  };

  const addProblemArea = () => {
    // Add a new problem area with default values
    const problemAreaTypes = ["bat_connect", "foot_movement", "bat_swing", "reaction_time"];
    const existingTypes = problemAreas.map(pa => pa.type);
    const availableTypes = problemAreaTypes.filter(type => !existingTypes.includes(type));
    
    if (availableTypes.length > 0) {
      setProblemAreas([
        ...problemAreas,
        { type: availableTypes[0], rating: 0, notes: "" }
      ]);
    } else {
      toast({
        title: "Cannot add more problem areas",
        description: "All available problem areas have been added.",
        variant: "destructive"
      });
    }
  };

  const getProblemAreaName = (type: string) => {
    const nameMap: Record<string, string> = {
      bat_connect: "Bat Connect",
      foot_movement: "Foot Movement",
      bat_swing: "Bat Swing",
      reaction_time: "Reaction Time"
    };
    return nameMap[type] || type;
  };

  // Video tagging functions
  const handleVideoSelect = (video: Video) => {
    setSelectedVideo(video);
    // Initialize tags with video's existing values
    setVideoTags({
      shotType: video.shotType || '',
      ballLength: 'Full', // New property not in Video type
      ballSpeed: video.ballSpeed || 'Medium',
      batConnect: video.batConnect || 'Middle',
      notes: ''
    });
    setIsTaggingMode(true);
  };
  
  const handleTagChange = (field: keyof typeof videoTags, value: string) => {
    setVideoTags({
      ...videoTags,
      [field]: value
    });
  };
  
  const handleSaveTags = () => {
    if (!selectedVideo) return;
    
    // In a real implementation, this would save the tags to the backend
    // Here we just update the UI and show a toast
    toast({
      title: "Shot Tagged",
      description: `Tagged ${selectedVideo.title} with ${videoTags.shotType}, ${videoTags.ballLength} length, ${videoTags.ballSpeed} speed`,
    });
    
    setIsTaggingMode(false);
  };

  const isLoading = isPlayerLoading || isVideosLoading;
  const isPending = createAssessment.isPending;

  // Carousel logic
  const [carouselPosition, setCarouselPosition] = useState(0);
  const moveCarousel = (direction: 'prev' | 'next') => {
    if (!videos) return;
    
    const cardWidth = 264; // card width + margin
    const maxVideos = videos.length;
    const visibleVideos = 3; // Show 3 items at a time on desktop
    
    if (direction === 'prev') {
      setCarouselPosition(Math.min(carouselPosition + cardWidth, 0));
    } else {
      const maxPosition = -((maxVideos - visibleVideos) * cardWidth);
      setCarouselPosition(Math.max(carouselPosition - cardWidth, maxPosition));
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {isTaggingMode && selectedVideo && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Tag Video: {selectedVideo.title}</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsTaggingMode(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="shotType">Shot Type</Label>
                <Select value={videoTags.shotType} onValueChange={(value) => handleTagChange('shotType', value)}>
                  <SelectTrigger id="shotType">
                    <SelectValue placeholder="Select Shot Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cover Drive">Cover Drive</SelectItem>
                    <SelectItem value="Straight Drive">Straight Drive</SelectItem>
                    <SelectItem value="Pull Shot">Pull Shot</SelectItem>
                    <SelectItem value="Cut Shot">Cut Shot</SelectItem>
                    <SelectItem value="Defensive Block">Defensive Block</SelectItem>
                    <SelectItem value="Sweep">Sweep</SelectItem>
                    <SelectItem value="Flick">Flick</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="ballLength">Ball Length</Label>
                <Select value={videoTags.ballLength} onValueChange={(value) => handleTagChange('ballLength', value)}>
                  <SelectTrigger id="ballLength">
                    <SelectValue placeholder="Select Ball Length" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full">Full</SelectItem>
                    <SelectItem value="Good">Good</SelectItem>
                    <SelectItem value="Short">Short</SelectItem>
                    <SelectItem value="Yorker">Yorker</SelectItem>
                    <SelectItem value="Half-volley">Half-volley</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="ballSpeed">Ball Speed</Label>
                <Select value={videoTags.ballSpeed} onValueChange={(value) => handleTagChange('ballSpeed', value)}>
                  <SelectTrigger id="ballSpeed">
                    <SelectValue placeholder="Select Ball Speed" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fast">Fast (80+ km/h)</SelectItem>
                    <SelectItem value="Medium">Medium (60-80 km/h)</SelectItem>
                    <SelectItem value="Slow">Slow (&lt; 60 km/h)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="batConnect">Bat Connect</Label>
                <Select value={videoTags.batConnect} onValueChange={(value) => handleTagChange('batConnect', value)}>
                  <SelectTrigger id="batConnect">
                    <SelectValue placeholder="Select Bat Connect" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Middle">Middle</SelectItem>
                    <SelectItem value="Edge">Edge</SelectItem>
                    <SelectItem value="Bottom">Bottom</SelectItem>
                    <SelectItem value="Missed">Missed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="mb-4">
              <Label htmlFor="notes">Notes</Label>
              <Textarea 
                id="notes" 
                placeholder="Add any additional notes about this shot"
                value={videoTags.notes}
                onChange={(e) => handleTagChange('notes', e.target.value)}
                className="min-h-[80px]"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsTaggingMode(false)}>Cancel</Button>
              <Button onClick={handleSaveTags}>Save Tags</Button>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex items-center mb-6">
        <Link href={`/players/${playerId}`}>
          <Button variant="ghost" className="mr-2 p-2 rounded-full hover:bg-neutral-200">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left">
              <path d="m12 19-7-7 7-7"></path>
              <path d="M19 12H5"></path>
            </svg>
          </Button>
        </Link>
        <h2 className="text-2xl font-bold text-neutral-400">New Assessment</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Player Info & Videos */}
        <div className="lg:col-span-2">
          <Card className="mb-6">
            <CardContent className="p-6">
              {isPlayerLoading ? (
                <div className="flex items-center">
                  <Skeleton className="w-16 h-16 rounded-full mr-4" />
                  <div>
                    <Skeleton className="h-6 w-32 mb-1" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                </div>
              ) : (
                player && (
                  <div className="flex items-center">
                    <div className="w-16 h-16 bg-neutral-200 rounded-full overflow-hidden mr-4">
                      <img src={player.image} alt={player.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl">{player.name}</h3>
                      <p className="text-neutral-300">{player.batch} - {new Date().toLocaleDateString()}</p>
                    </div>
                  </div>
                )
              )}
            </CardContent>
          </Card>

          {/* Video Filters */}
          <Card className="mb-6">
            <CardHeader className="border-b border-neutral-200 p-4">
              <CardTitle>Video Filters</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-2">
                <div className="w-full md:w-auto">
                  <Label className="block text-sm text-neutral-600 font-medium mb-1">Shot Type</Label>
                  <Select value={shotTypeFilter} onValueChange={setShotTypeFilter}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="All Shot Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All Shot Types">All Shot Types</SelectItem>
                      <SelectItem value="Cover Drive">Cover Drive</SelectItem>
                      <SelectItem value="Straight Drive">Straight Drive</SelectItem>
                      <SelectItem value="Pull Shot">Pull Shot</SelectItem>
                      <SelectItem value="Cut Shot">Cut Shot</SelectItem>
                      <SelectItem value="Defensive Block">Defensive Block</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full md:w-auto">
                  <Label className="block text-sm text-neutral-600 font-medium mb-1">Ball Speed</Label>
                  <Select value={ballSpeedFilter} onValueChange={setBallSpeedFilter}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="All Speeds" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All Speeds">All Speeds</SelectItem>
                      <SelectItem value="Fast">Fast (80+ km/h)</SelectItem>
                      <SelectItem value="Medium">Medium (60-80 km/h)</SelectItem>
                      <SelectItem value="Slow">Slow (&lt; 60 km/h)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full md:w-auto">
                  <Label className="block text-sm text-neutral-600 font-medium mb-1">Bat Connect</Label>
                  <Select value={batConnectFilter} onValueChange={setBatConnectFilter}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All</SelectItem>
                      <SelectItem value="Middle">Middle</SelectItem>
                      <SelectItem value="Edge">Edge</SelectItem>
                      <SelectItem value="Bottom">Bottom</SelectItem>
                      <SelectItem value="Missed">Missed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Video Carousel */}
          <Card className="mb-6">
            <CardHeader className="border-b border-neutral-200 p-4">
              <CardTitle>Latest Videos</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {isVideosLoading ? (
                <div className="flex space-x-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex-shrink-0 w-64">
                      <Skeleton className="h-36 w-full rounded mb-2" />
                      <Skeleton className="h-4 w-3/4 mb-1" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : videos && videos.length > 0 ? (
                <div className="relative">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white/80 rounded-full p-1 shadow-md"
                    onClick={() => moveCarousel('prev')}
                    disabled={carouselPosition === 0}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-left">
                      <path d="m15 18-6-6 6-6"></path>
                    </svg>
                  </Button>
                  <div className="overflow-hidden">
                    <div 
                      className="flex space-x-4 transition-transform duration-300" 
                      style={{ transform: `translateX(${carouselPosition}px)` }}
                    >
                      {videos.map((video, index) => {
                        // Determine badge color based on batConnect
                        let badgeColor = "bg-neutral-500";
                        if (video.batConnect === "Middle") badgeColor = "bg-green-500";
                        else if (video.batConnect === "Edge") badgeColor = "bg-amber-500";
                        else if (video.batConnect === "Missed") badgeColor = "bg-red-500";

                        return (
                          <div key={index} className="flex-shrink-0 w-64">
                            <div className="h-36 w-full relative">
                              <div className="relative w-full h-full">
                                <VideoPlayer
                                  videoUrl={video.url}
                                  title={video.title}
                                  className="w-full h-full object-cover rounded"
                                  triggerClassName="w-full h-full flex items-center justify-center bg-neutral-200 rounded"
                                />
                                <Button 
                                  size="sm"
                                  className="absolute top-2 right-2 bg-primary/80 hover:bg-primary text-white p-1 rounded"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleVideoSelect(video);
                                    setIsTaggingMode(true);
                                  }}
                                  title="Tag attributes in this video"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                                    <line x1="7" y1="7" x2="7.01" y2="7"></line>
                                  </svg>
                                </Button>
                              </div>
                            </div>
                            <div className="mt-2">
                              <p className="font-bold text-sm">{video.shotType}</p>
                              <p className="text-xs text-neutral-600 font-medium">Ball Speed: {video.ballSpeed}</p>
                              <div className="flex items-center mt-1">
                                <span className={`text-xs ${badgeColor} text-white px-2 py-0.5 rounded-full`}>
                                  {video.batConnect}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white/80 rounded-full p-1 shadow-md"
                    onClick={() => moveCarousel('next')}
                    disabled={videos.length <= 3 || carouselPosition <= -((videos.length - 3) * 264)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-right">
                      <path d="m9 18 6-6-6-6"></path>
                    </svg>
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-neutral-400">No videos available for this player.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Assessment Form */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader className="bg-primary text-white p-4">
              <CardTitle>Performance Assessment</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <form onSubmit={(e) => { e.preventDefault(); handleSaveAssessment(); }}>
                {/* Session Notes */}
                <div className="mb-6 border-2 border-primary/10 rounded-lg p-4 bg-primary/5">
                  <h3 className="text-lg font-bold mb-3 text-primary">Session Notes</h3>
                  <Textarea 
                    className="w-full px-3 py-2 border border-neutral-200 rounded h-32" 
                    placeholder="Enter overall notes for this assessment session..."
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                  />
                </div>


                {/* General Performance Areas */}
                <div className="mb-6 border-2 border-secondary/10 rounded-lg p-4 bg-secondary/5">
                  <h3 className="text-lg font-bold mb-3 text-secondary">General Performance Areas</h3>

                  {problemAreas.map((area, index) => (
                    <div key={index} className="border border-neutral-200 rounded p-3 mb-3">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`focus-${area.type}`}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            checked={focusAreas.includes(area.type)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFocusAreas([...focusAreas, area.type]);
                              } else {
                                setFocusAreas(focusAreas.filter(a => a !== area.type));
                              }
                            }}
                          />
                          <Label htmlFor={`focus-${area.type}`} className="font-medium cursor-pointer">
                            {getProblemAreaName(area.type)}
                          </Label>
                        </div>
                        <StarRating 
                          initialRating={area.rating}
                          onChange={(rating) => handleProblemAreaChange(index, 'rating', rating)}
                        />
                      </div>
                      <Textarea 
                        className="w-full px-3 py-2 border border-neutral-200 rounded h-20 text-sm" 
                        placeholder={`Add notes about ${getProblemAreaName(area.type).toLowerCase()}...`}
                        value={area.notes}
                        onChange={(e) => handleProblemAreaChange(index, 'notes', e.target.value)}
                      />
                    </div>
                  ))}

                  {/* Add Performance Area */}
                  <div className="mt-3">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      className="flex items-center text-primary font-medium"
                      onClick={addProblemArea}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="mr-1" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M12 8v8"></path>
                        <path d="M8 12h8"></path>
                      </svg>
                      <span>Add Performance Area</span>
                    </Button>
                  </div>
                </div>

                {/* Shot Specific Performance Areas */}
                <div className="mb-6 border-2 border-amber-500/20 rounded-lg p-4 bg-amber-500/5">
                  <h3 className="text-lg font-bold mb-3 text-amber-600">Shot Specific Performance Areas</h3>
                  
                  <div className="mb-4">
                    <Label htmlFor="shotType" className="block mb-2">Shot Type</Label>
                    <select
                      id="shotType"
                      className="w-full px-3 py-2 border border-neutral-200 rounded"
                      value={selectedShotType}
                      onChange={(e) => setSelectedShotType(e.target.value)}
                    >
                      <option value="Cover Drive">Cover Drive</option>
                      <option value="Straight Drive">Straight Drive</option>
                      <option value="Pull Shot">Pull Shot</option>
                      <option value="Cut Shot">Cut Shot</option>
                      <option value="Sweep Shot">Sweep Shot</option>
                    </select>
                  </div>
                  
                  <div className="mb-4">
                    <Label htmlFor="shot-notes" className="block mb-2">Shot-Specific Notes</Label>
                    <Textarea 
                      id="shot-notes"
                      className="w-full px-3 py-2 border border-neutral-200 rounded h-24"
                      placeholder={`Enter overall notes about ${selectedShotType} technique...`}
                      value={shotTypeNotes}
                      onChange={(e) => setShotTypeNotes(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    {shotSpecificAreas.map((area, index) => (
                      <div key={area.id} className="border border-neutral-200 rounded p-3">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`focus-shot-${area.id}`}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                              checked={focusAreas.includes(`shot-${area.id}`)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFocusAreas([...focusAreas, `shot-${area.id}`]);
                                } else {
                                  setFocusAreas(focusAreas.filter(a => a !== `shot-${area.id}`));
                                }
                              }}
                            />
                            <Label htmlFor={`focus-shot-${area.id}`} className="font-medium cursor-pointer">
                              {area.name}
                            </Label>
                          </div>
                          <StarRating 
                            initialRating={area.rating}
                            onChange={(rating) => {
                              const updatedAreas = [...shotSpecificAreas];
                              updatedAreas[index].rating = rating;
                              setShotSpecificAreas(updatedAreas);
                            }}
                          />
                        </div>
                        <Textarea 
                          className="w-full px-3 py-2 border border-neutral-200 rounded h-20 text-sm" 
                          placeholder={`Add notes about ${area.name.toLowerCase()}...`}
                          value={area.notes}
                          onChange={(e) => {
                            const updatedAreas = [...shotSpecificAreas];
                            updatedAreas[index].notes = e.target.value;
                            setShotSpecificAreas(updatedAreas);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="mt-6">
                  <Button 
                    type="submit"
                    className="w-full bg-secondary text-white font-bold py-3 px-4 rounded"
                    disabled={isPending}
                  >
                    {isPending ? 'Saving...' : 'Save Assessment'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PerformanceAssessment;

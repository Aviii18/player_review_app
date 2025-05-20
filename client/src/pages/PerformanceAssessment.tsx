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
import type { Player, Video } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface ProblemArea {
  type: string;
  rating: number;
  notes: string;
}

const PerformanceAssessment = () => {
  const { id } = useParams();
  const playerId = parseInt(id);
  const [_, navigate] = useLocation();
  const { toast } = useToast();

  const { data: player, isLoading: isPlayerLoading } = useQuery<Player>({
    queryKey: [`/api/players/${playerId}`],
    enabled: !isNaN(playerId)
  });

  const [shotTypeFilter, setShotTypeFilter] = useState("All Shot Types");
  const [ballSpeedFilter, setBallSpeedFilter] = useState("All Speeds");
  const [batConnectFilter, setBatConnectFilter] = useState("All");
  const [sessionNotes, setSessionNotes] = useState("");
  const [problemAreas, setProblemAreas] = useState<ProblemArea[]>([
    { type: "bat_connect", rating: 0, notes: "" },
    { type: "foot_movement", rating: 0, notes: "" }
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
    const problemAreaTypes = ["bat_connect", "foot_movement", "bat_swing", "weight_shifting"];
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
      weight_shifting: "Weight Shifting"
    };
    return nameMap[type] || type;
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
                  <Label className="block text-sm text-neutral-300 mb-1">Shot Type</Label>
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
                  <Label className="block text-sm text-neutral-300 mb-1">Ball Speed</Label>
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
                  <Label className="block text-sm text-neutral-300 mb-1">Bat Connect</Label>
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
                            <div 
                              className="video-thumbnail h-36 bg-neutral-200 rounded cursor-pointer relative overflow-hidden"
                              onClick={() => window.open(video.url, "_blank")}
                            >
                              {/* Placeholder video thumbnail */}
                              <div className="absolute inset-0 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="text-white text-6xl" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="10"></circle>
                                  <polygon points="10 8 16 12 10 16 10 8"></polygon>
                                </svg>
                              </div>
                            </div>
                            <div className="mt-2">
                              <p className="font-bold text-sm">{video.shotType}</p>
                              <p className="text-xs text-neutral-300">Ball Speed: {video.ballSpeed}</p>
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
                {/* Overall Notes */}
                <div className="mb-4">
                  <Label className="block font-bold mb-2">Session Notes</Label>
                  <Textarea 
                    className="w-full px-3 py-2 border border-neutral-200 rounded h-32" 
                    placeholder="Enter overall notes for this assessment session..."
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                  />
                </div>

                {/* Problem Areas */}
                <div className="mb-6">
                  <h4 className="font-bold mb-3">Problem Areas</h4>

                  {problemAreas.map((area, index) => (
                    <div key={index} className="border border-neutral-200 rounded p-3 mb-3">
                      <div className="flex justify-between items-center mb-2">
                        <Label className="font-medium">{getProblemAreaName(area.type)}</Label>
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

                  {/* Add Problem Area */}
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
                      <span>Add Problem Area</span>
                    </Button>
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

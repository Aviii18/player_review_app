import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, addDays, previousMonday } from "date-fns";
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

// Local interface for problem areas (matching backend schema)
interface ProblemAreaInput {
  areaType: string;
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
    footwork: string;
  }>({
    shotType: '',
    ballLength: '',
    ballSpeed: '',
    batConnect: '',
    footwork: ''
  });

  const { data: player, isLoading: isPlayerLoading } = useQuery<Player>({
    queryKey: [`/api/players/${playerId}`],
    enabled: !isNaN(playerId)
  });

  // Filter state
  const [shotTypeFilter, setShotTypeFilter] = useState("All");
  const [ballLengthFilter, setBallLengthFilter] = useState("All");
  const [ballSpeedFilter, setBallSpeedFilter] = useState("All");
  const [batConnectFilter, setBatConnectFilter] = useState("All");
  const [footworkFilter, setFootworkFilter] = useState("All");
  const [sessionNotes, setSessionNotes] = useState("");
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [problemAreas, setProblemAreas] = useState<ProblemAreaInput[]>([
    { areaType: "bat_connect", rating: 0, notes: "" },
    { areaType: "foot_movement", rating: 0, notes: "" },
    { areaType: "bat_swing", rating: 0, notes: "" },
    { areaType: "reaction_time", rating: 0, notes: "" }
  ]);
  
  // Shot Specific Performance Areas
  const [selectedShotType, setSelectedShotType] = useState<string>("Cover Drive");
  const [shotTypeNotes, setShotTypeNotes] = useState<string>("");
  const [shotTypeRating, setShotTypeRating] = useState<number>(0);
  
  interface ShotSpecificArea {
    id: string;
    name: string;
    rating: number;
    notes: string;
  }
  
  interface ShotTypeAssessment {
    shotType: string;
    notes: string;
    rating: number;
    areas: ShotSpecificArea[];
  }
  
  const defaultAreas = [
    { id: "hands_grip", name: "Hands Grip", rating: 0, notes: "" },
    { id: "top_hand_forearm", name: "Top Hand Forearm Push", rating: 0, notes: "" },
    { id: "head_stability", name: "Head Stability", rating: 0, notes: "" },
    { id: "bat_movement", name: "Bat Movement Line", rating: 0, notes: "" },
    { id: "foot_position", name: "Front & Back Foot Movement & Position", rating: 0, notes: "" },
    { id: "weight_transfer", name: "Weight Transfer to Front Foot", rating: 0, notes: "" },
    { id: "elbow_shoulder", name: "Elbow Shoulder Alignment", rating: 0, notes: "" }
  ];
  
  const [shotSpecificAreas, setShotSpecificAreas] = useState<ShotSpecificArea[]>([...defaultAreas]);
  
  const [savedShotAssessments, setSavedShotAssessments] = useState<ShotTypeAssessment[]>([]);
  
  const addShotTypeAssessment = () => {
    // Save current shot assessment
    const newShotAssessment: ShotTypeAssessment = {
      shotType: selectedShotType,
      notes: shotTypeNotes,
      rating: shotTypeRating,
      areas: [...shotSpecificAreas]
    };
    
    setSavedShotAssessments([...savedShotAssessments, newShotAssessment]);
    
    // Reset form for next shot type
    setSelectedShotType("Cover Drive");
    setShotTypeNotes("");
    setShotTypeRating(0);
    setShotSpecificAreas([...defaultAreas]);
  };

  // Fetch videos with filters
  const { data: videos, isLoading: isVideosLoading } = useQuery<Video[]>({
    queryKey: [
      `/api/players/${playerId}/videos`, 
      shotTypeFilter,
      ballLengthFilter,
      ballSpeedFilter,
      batConnectFilter,
      footworkFilter
    ],
    enabled: !isNaN(playerId)
  });

  // Create a new assessment with problem areas
  const createAssessment = useMutation({
    mutationFn: async () => {
      // Create assessment
      const today = new Date();
      const weekStart = format(previousMonday(today), 'yyyy-MM-dd');
      const weekEnd = format(addDays(new Date(weekStart), 6), 'yyyy-MM-dd');
      
      const assessmentResponse = await apiRequest('POST', `/api/players/${playerId}/assessments`, {
        weekStart,
        weekEnd,
        notes: sessionNotes,
        isLatest: true
      });
      
      // Create problem areas for this assessment
      const validProblemAreas = problemAreas.filter(pa => pa.rating > 0);
      
      for (const pa of validProblemAreas) {
        await apiRequest('POST', `/api/assessments/${assessmentResponse.id}/problem-areas`, {
          areaType: pa.areaType,
          rating: pa.rating,
          notes: pa.notes
        });
      }
      
      // Save shot-specific assessments as metrics
      for (const shotAssessment of savedShotAssessments) {
        // Save the overall shot type assessment
        await apiRequest('POST', `/api/assessments/${assessmentResponse.id}/metrics`, {
          metricType: shotAssessment.shotType.toLowerCase().replace(' ', '_'),
          rating: shotAssessment.rating, // Use the overall shot type rating
          value: shotAssessment.areas.filter(a => a.rating > 0).length + ' areas evaluated',
          notes: shotAssessment.notes,
          videoUrl: videos && videos.length > 0 ? videos[0].url : ''
        });
        
        // Save each specific technical area within the shot
        for (const area of shotAssessment.areas) {
          // We need to save all areas for proper display later
          await apiRequest('POST', `/api/assessments/${assessmentResponse.id}/metrics`, {
            metricType: `${shotAssessment.shotType.toLowerCase().replace(' ', '_')}_${area.id}`,
            rating: area.rating,
            value: area.rating === 1 ? 'Needs Work' : 'Good',
            notes: area.notes,
            videoUrl: videos && videos.length > 0 ? videos[0].url : ''
          });
        }
      }
      
      return assessmentResponse;
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

  const handleProblemAreaChange = (index: number, field: keyof ProblemAreaInput, value: string | number) => {
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
    const existingTypes = problemAreas.map(pa => pa.areaType);
    const availableTypes = problemAreaTypes.filter(type => !existingTypes.includes(type));
    
    if (availableTypes.length > 0) {
      setProblemAreas([
        ...problemAreas,
        { areaType: availableTypes[0], rating: 0, notes: "" }
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
      'bat_connect': 'Bat Connect',
      'foot_movement': 'Foot Movement',
      'bat_swing': 'Bat Swing',
      'reaction_time': 'Reaction Time'
    };
    return nameMap[type] || type;
  };

  const handleVideoSelect = (video: Video) => {
    setSelectedVideo(video);
    
    // Reset video tags
    setVideoTags({
      shotType: video.shotType || '',
      ballLength: video.ballLength || '',
      ballSpeed: video.ballSpeed || '',
      batConnect: video.batConnect || '',
      footwork: video.footwork || ''
    });
    
    setIsTaggingMode(false);
  };

  const startTaggingMode = () => {
    if (!selectedVideo) return;
    setIsTaggingMode(true);
  };

  const updateVideoTag = (field: keyof typeof videoTags, value: string) => {
    setVideoTags({ ...videoTags, [field]: value });
  };

  const saveVideoTags = async () => {
    if (!selectedVideo) return;
    
    try {
      await apiRequest('POST', `/api/players/${playerId}/videos`, {
        id: selectedVideo.id,
        ...videoTags
      });
      
      toast({
        title: "Video tagged",
        description: "Video attributes have been updated successfully.",
      });
      
      queryClient.invalidateQueries({ queryKey: [`/api/players/${playerId}/videos`] });
      setIsTaggingMode(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update video attributes.",
        variant: "destructive"
      });
    }
  };

  if (isPlayerLoading || isVideosLoading) {
    return <div className="container mx-auto px-4 py-8"><Skeleton className="h-screen w-full" /></div>;
  }

  const handleFocusAreaToggle = (area: string) => {
    setFocusAreas(prev => prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link href={`/players/${playerId}`}>
          <Button variant="ghost" className="mr-2 p-2 rounded-full hover:bg-neutral-200">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left">
              <path d="m12 19-7-7 7-7"></path>
              <path d="M19 12H5"></path>
            </svg>
          </Button>
        </Link>
        <h2 className="text-2xl font-bold text-neutral-400">New Performance Assessment</h2>
      </div>

      {player ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column - Videos and Filters */}
          <div className="md:col-span-1">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-xl">
                  Player: {player.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-neutral-500 mb-4">
                  <p><strong>Batch:</strong> {player.batch}</p>
                  <p><strong>Age:</strong> {player.age || 'N/A'}</p>
                  <p><strong>Dominant Hand:</strong> {player.dominantHand || 'N/A'}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Video Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <div className="grid grid-cols-2 gap-2">
                    {/* Shot Type Filter */}
                    <div className="mb-2">
                      <Label htmlFor="shotType" className="block mb-1 text-xs">Shot Type</Label>
                      <select
                        id="shotType"
                        className="w-full px-2 py-1 text-sm border border-neutral-200 rounded"
                        value={shotTypeFilter}
                        onChange={(e) => setShotTypeFilter(e.target.value)}
                      >
                        <option value="All">All</option>
                        <option value="Cover Drive">Cover Drive</option>
                        <option value="Straight Drive">Straight Drive</option>
                        <option value="Pull Shot">Pull Shot</option>
                        <option value="Cut Shot">Cut Shot</option>
                      </select>
                    </div>
                    
                    {/* Ball Length Filter */}
                    <div className="mb-2">
                      <Label htmlFor="ballLength" className="block mb-1 text-xs">Ball Length</Label>
                      <select
                        id="ballLength"
                        className="w-full px-2 py-1 text-sm border border-neutral-200 rounded"
                        value={ballLengthFilter}
                        onChange={(e) => setBallLengthFilter(e.target.value)}
                      >
                        <option value="All">All</option>
                        <option value="Full">Full</option>
                        <option value="Good">Good</option>
                        <option value="Short">Short</option>
                        <option value="Yorker">Yorker</option>
                      </select>
                    </div>
                    
                    {/* Ball Speed Filter */}
                    <div className="mb-2">
                      <Label htmlFor="ballSpeed" className="block mb-1 text-xs">Ball Speed</Label>
                      <select
                        id="ballSpeed"
                        className="w-full px-2 py-1 text-sm border border-neutral-200 rounded"
                        value={ballSpeedFilter}
                        onChange={(e) => setBallSpeedFilter(e.target.value)}
                      >
                        <option value="All">All</option>
                        <option value="Fast">Fast</option>
                        <option value="Medium">Medium</option>
                        <option value="Slow">Slow</option>
                      </select>
                    </div>
                    
                    {/* Bat Connect Filter */}
                    <div className="mb-2">
                      <Label htmlFor="batConnect" className="block mb-1 text-xs">Bat Connect</Label>
                      <select
                        id="batConnect"
                        className="w-full px-2 py-1 text-sm border border-neutral-200 rounded"
                        value={batConnectFilter}
                        onChange={(e) => setBatConnectFilter(e.target.value)}
                      >
                        <option value="All">All</option>
                        <option value="Middle">Middle</option>
                        <option value="Edge">Edge</option>
                        <option value="Bottom">Bottom</option>
                        <option value="Missed">Missed</option>
                      </select>
                    </div>
                    
                    {/* Foot Movement Filter */}
                    <div className="mb-2">
                      <Label htmlFor="footwork" className="block mb-1 text-xs">Foot Movement</Label>
                      <select
                        id="footwork"
                        className="w-full px-2 py-1 text-sm border border-neutral-200 rounded"
                        value={footworkFilter}
                        onChange={(e) => setFootworkFilter(e.target.value)}
                      >
                        <option value="All">All</option>
                        <option value="Good">Good</option>
                        <option value="Average">Average</option>
                        <option value="Poor">Poor</option>
                      </select>
                    </div>
                    
                    {/* Session Filter */}
                    <div className="mb-2">
                      <Label htmlFor="session" className="block mb-1 text-xs">Session</Label>
                      <select
                        id="session"
                        className="w-full px-2 py-1 text-sm border border-neutral-200 rounded"
                      >
                        <option value="All">All</option>
                        <option value="Morning">Morning</option>
                        <option value="Afternoon">Afternoon</option>
                        <option value="Evening">Evening</option>
                      </select>
                    </div>
                  </div>
                </div>


                
                {/* Video List */}
                <div className="space-y-2">
                  {videos && videos.length > 0 ? (
                    videos.map((video) => (
                      <div 
                        key={video.id} 
                        className={`p-2 border rounded cursor-pointer transition ${selectedVideo?.id === video.id ? 'border-primary bg-primary/5' : 'border-neutral-200 hover:bg-neutral-100'}`}
                        onClick={() => handleVideoSelect(video)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h5 className="font-medium">{video.title}</h5>
                            <p className="text-xs text-neutral-500">{new Date(video.recordedDate).toLocaleDateString()}</p>
                            <div className="flex flex-wrap mt-1 gap-1">
                              {video.shotType && <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded">{video.shotType}</span>}
                              {video.ballLength && <span className="text-xs bg-green-100 text-green-800 px-1 rounded">{video.ballLength}</span>}
                              {video.ballSpeed && <span className="text-xs bg-yellow-100 text-yellow-800 px-1 rounded">{video.ballSpeed}</span>}
                            </div>
                          </div>
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-play">
                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                          </svg>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-neutral-500 text-center py-4">No videos found matching filters</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Assessment Form */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Performance Assessment</CardTitle>
              </CardHeader>
              <CardContent>

                

                
                {/* Session Notes */}
                <div className="mb-6">
                  <Label htmlFor="session-notes" className="block mb-2 font-medium">Session Notes</Label>
                  <Textarea 
                    id="session-notes"
                    className="w-full px-3 py-2 border border-neutral-200 rounded h-24"
                    placeholder="Enter overall session notes, observations, and feedback..."
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                  />
                </div>


                <div className="grid grid-cols-1 gap-6">
                  {/* General Performance Areas */}
                  <div className="mb-6 border-2 border-secondary/10 rounded-lg p-4 bg-secondary/5">
                    <h3 className="text-lg font-bold mb-3 text-secondary">General Performance Areas</h3>

                    {problemAreas.map((area, index) => (
                      <div key={index} className="border border-neutral-200 rounded p-3 mb-3">
                        <div className="flex justify-between items-center mb-2">
                          <Label className="font-medium">
                            {getProblemAreaName(area.areaType)}
                          </Label>
                          <StarRating 
                            initialRating={area.rating}
                            onChange={(rating) => handleProblemAreaChange(index, 'rating', rating)}
                          />
                        </div>
                        <Textarea 
                          className="w-full px-3 py-2 border border-neutral-200 rounded mt-2" 
                          placeholder={`Notes for ${getProblemAreaName(area.areaType)}...`}
                          value={area.notes}
                          onChange={(e) => handleProblemAreaChange(index, 'notes', e.target.value)}
                          rows={2}
                        />
                      </div>
                    ))}

                    {/* Add Performance Area */}
                    <div className="mt-3">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={addProblemArea}
                        className="w-full"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus mr-1">
                          <path d="M5 12h14"></path>
                          <path d="M12 5v14"></path>
                        </svg>
                        <span>Add Performance Area</span>
                      </Button>
                    </div>
                  </div>
                  
                  {/* Shot Specific Assessments */}
                  <div className="border-2 border-amber-500/20 rounded-lg p-4 bg-amber-500/5">
                    <h3 className="text-lg font-bold mb-3 text-amber-600">Shot Specific Performance Areas</h3>
                    
                    {/* Saved Shot Assessments */}
                    {savedShotAssessments.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium mb-2">Saved Shot Assessments</h4>
                        {savedShotAssessments.map((assessment, index) => (
                          <div key={index} className="border border-neutral-200 rounded p-3 mb-2">
                            <div className="flex justify-between items-center">
                              <h5 className="font-bold">{assessment.shotType}</h5>
                              <div className="flex items-center">
                                <span className="mr-2 text-sm">Rating:</span>
                                <StarRating 
                                  initialRating={assessment.rating}
                                  readOnly={true}
                                />
                              </div>
                            </div>
                            {assessment.notes && (
                              <p className="text-sm text-neutral-600 mt-1">{assessment.notes}</p>
                            )}
                            <div className="mt-2 text-xs text-neutral-500">
                              {assessment.areas.filter(a => a.rating > 0).length} technical areas evaluated
                              <div className="border-b border-dashed border-gray-300 my-4"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Current Shot Type Assessment Form */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <Label htmlFor="shotType" className="block">Shot Type</Label>
                        <div className="flex items-center">
                          <Label className="mr-2 text-sm">Overall Rating:</Label>
                          <StarRating 
                            initialRating={shotTypeRating}
                            onChange={(rating) => setShotTypeRating(rating)}
                          />
                        </div>
                      </div>
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
                          <div className="flex justify-between items-center">
                            <Label className="font-medium">
                              {area.name}
                            </Label>
                            <div className="flex space-x-2">
                              <button
                                type="button"
                                className={`px-3 py-1 rounded text-sm font-medium ${area.rating === 1 ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                                onClick={() => {
                                  const updatedAreas = [...shotSpecificAreas];
                                  updatedAreas[index].rating = 1;
                                  setShotSpecificAreas(updatedAreas);
                                }}
                              >
                                Needs Work
                              </button>
                              <button
                                type="button"
                                className={`px-3 py-1 rounded text-sm font-medium ${area.rating === 2 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                                onClick={() => {
                                  const updatedAreas = [...shotSpecificAreas];
                                  updatedAreas[index].rating = 2;
                                  setShotSpecificAreas(updatedAreas);
                                }}
                              >
                                Good
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4">
                      <Button 
                        onClick={addShotTypeAssessment}
                        className="w-full"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus mr-1">
                          <path d="M5 12h14"></path>
                          <path d="M12 5v14"></path>
                        </svg>
                        <span>Add Shot Assessment</span>
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <Button 
                    onClick={handleSaveAssessment}
                    disabled={createAssessment.isPending}
                    className="bg-primary text-white px-4 py-2 rounded-lg"
                  >
                    {createAssessment.isPending ? "Saving..." : "Save Assessment"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="flex justify-center items-center h-64">
          <p className="text-neutral-500">Player not found</p>
        </div>
      )}
    </div>
  );
};

export default PerformanceAssessment;
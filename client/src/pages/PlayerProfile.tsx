import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import RatingBar from "@/components/RatingBar";
import VideoPlayer from "@/components/VideoPlayer";
import NotesList from "@/components/NotesList";
import PerformanceChart from "@/components/PerformanceChart";
import StarRating from "@/components/StarRating";
import type { Player, PerformanceAssessment, PerformanceMetric, ProblemArea, Video } from "@shared/schema";

// Component to display an assessment history card
const AssessmentHistoryCard = ({ assessment }: { assessment: PerformanceAssessment }) => {
  const { data: metrics = [] } = useQuery<PerformanceMetric[]>({
    queryKey: [`/api/assessments/${assessment.id}/metrics`],
    enabled: assessment.id !== undefined
  });

  const { data: problemAreas = [] } = useQuery<ProblemArea[]>({
    queryKey: [`/api/assessments/${assessment.id}/problem-areas`],
    enabled: assessment.id !== undefined
  });

  // Group shot-specific metrics
  const shotTypeMetrics = metrics.filter(metric => {
    // Only include shot-specific metrics that match our expected pattern (e.g., "cover_drive", "pull_shot")
    // Exclude general performance metrics and other non-shot metrics
    const isGeneralMetric = ['reaction_time', 'bat_connect', 'bat_swing', 'foot_movement', 'shot_selection', 'footwork'].includes(metric.metricType);
    
    // Check if it's a shot type metric - these usually have underscores but aren't general metrics
    const isShotTypeMetric = metric.metricType.includes('_') && !isGeneralMetric;
    
    // Only include shot type metrics
    return isShotTypeMetric;
  });

  // Group general performance metrics
  const generalPerformanceMetrics = metrics.filter(metric => 
    ['reaction_time', 'bat_connect', 'bat_swing', 'foot_movement'].includes(metric.metricType)
  );

  // Group technical areas by shot type
  const shotTypeGroups = shotTypeMetrics.reduce((groups, metric) => {
    // Extract the main shot type from metrics (e.g., "cover_drive_hands_grip" → "cover_drive")
    const mainType = metric.metricType.split('_').slice(0, 2).join('_');
    
    if (!groups[mainType]) {
      // Find the main shot type metric
      const mainMetric = metrics.find(m => m.metricType === mainType);
      
      groups[mainType] = {
        name: mainType.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        rating: mainMetric ? mainMetric.rating : 0,
        notes: mainMetric && mainMetric.notes ? mainMetric.notes : '',
        areas: []
      };
    }
    
    // Only add detailed technical areas, not the main shot type metric
    if (metric.metricType !== mainType) {
      // Get the specific area name (e.g., "cover_drive_hands_grip" → "hands_grip")
      const areaName = metric.metricType.split('_').slice(2).join('_');
      
      groups[mainType].areas.push({
        id: metric.id.toString(),
        name: areaName.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        rating: metric.rating,
        notes: metric.notes || ''
      });
    }
    
    return groups;
  }, {} as Record<string, { name: string, rating: number, notes: string, areas: { id: string, name: string, rating: number, notes: string }[] }>);

  return (
    <Card className="mb-6">
      <div className="bg-primary text-white px-6 py-3 flex justify-between items-center rounded-t-lg">
        <h4 className="font-bold">
          Week of {format(new Date(assessment.weekStart), "MMMM d")} - {format(new Date(assessment.weekEnd), "MMMM d, yyyy")}
        </h4>
        {assessment.isLatest && (
          <span className="text-sm bg-white text-primary font-bold px-2 py-1 rounded">Most Recent</span>
        )}
      </div>
      
      <CardContent className="p-6">
        <Tabs defaultValue="session" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="general">General Performance Areas</TabsTrigger>
            <TabsTrigger value="shots">Shot Specific Areas</TabsTrigger>
            <TabsTrigger value="session">Assessment Notes</TabsTrigger>
          </TabsList>
          
          {/* General Performance Areas Tab */}
          <TabsContent value="general">
            <div className="border-2 border-secondary/10 rounded-lg p-4 bg-secondary/5">
              <h3 className="text-lg font-bold mb-3 text-secondary">General Performance Areas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {generalPerformanceMetrics.map((metric) => {
                  const metricDisplayName = metric.metricType
                    .split('_')
                    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
                  
                  // Find matching problem area for additional notes
                  const matchingProblemArea = problemAreas.find(
                    pa => pa.areaType === metric.metricType
                  );
                  
                  return (
                    <div key={metric.id} className="border border-neutral-200 rounded p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h5 className="font-bold">{metricDisplayName}</h5>
                        <div>
                          {metric.rating <= 3 ? (
                            <span className="px-3 py-1 rounded text-sm font-medium bg-red-500 text-white">
                              Needs Work
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded text-sm font-medium bg-green-500 text-white">
                              Good
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 text-sm text-neutral-600">
                        {metric.notes && (
                          <p className="mb-2"><strong>Notes:</strong> {metric.notes}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>
          
          {/* Shot Specific Areas Tab */}
          <TabsContent value="shots">
            <div className="border-2 border-amber-500/20 rounded-lg p-4 bg-amber-500/5">
              <h3 className="text-lg font-bold mb-3 text-amber-600">Shot Specific Performance Areas</h3>
              
              {Object.keys(shotTypeGroups).length === 0 ? (
                <div className="text-center py-6 text-neutral-500">
                  No shot-specific assessments recorded
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.values(shotTypeGroups).map((group, index) => (
                    <div key={index} className="border border-neutral-200 rounded p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-bold text-lg">{group.name}</h4>
                        <div className="flex items-center">
                          <span className="mr-2 text-sm">Overall Rating:</span>
                          <StarRating 
                            initialRating={group.rating}
                            readOnly={true}
                          />
                        </div>
                      </div>
                      
                      {group.notes && (
                        <div className="mb-4 p-3 bg-neutral-100 rounded">
                          <p className="text-sm">{group.notes}</p>
                        </div>
                      )}
                      
                      <div className="mb-4">
                        <Collapsible className="w-full">
                          <CollapsibleTrigger asChild>
                            <Button variant="outline" className="w-full flex justify-between items-center">
                              <span>Problem Areas</span>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="ml-2"
                              >
                                <path d="m6 9 6 6 6-6" />
                              </svg>
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="pt-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-2">
                              {/* First show actual problem areas if any exist */}
                              {group.areas.map((area, areaIndex) => (
                                <div key={areaIndex} className="border border-neutral-200 rounded p-3">
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium">{area.name}</span>
                                    <div>
                                      {area.rating === 1 ? (
                                        <span className="px-3 py-1 rounded text-sm font-medium bg-red-500 text-white">
                                          Needs Work
                                        </span>
                                      ) : (
                                        <span className="px-3 py-1 rounded text-sm font-medium bg-green-500 text-white">
                                          Good
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  {area.notes && (
                                    <p className="mt-2 text-xs text-neutral-600">{area.notes}</p>
                                  )}
                                </div>
                              ))}
                              
                              {/* Add demonstration problem areas for each shot type */}
                              {group.areas.length === 0 && (
                                <>
                                  {/* Problem area 1 */}
                                  <div className="border border-neutral-200 rounded p-3">
                                    <div className="flex justify-between items-center">
                                      <span className="font-medium">Head Position</span>
                                      <div>
                                        <span className="px-3 py-1 rounded text-sm font-medium bg-red-500 text-white">
                                          Needs Work
                                        </span>
                                      </div>
                                    </div>
                                    <p className="mt-2 text-xs text-neutral-600">
                                      Head falls to off-side during shot execution. Needs to maintain stability and keep eyes level.
                                    </p>
                                  </div>
                                  
                                  {/* Problem area 2 */}
                                  <div className="border border-neutral-200 rounded p-3">
                                    <div className="flex justify-between items-center">
                                      <span className="font-medium">Weight Transfer</span>
                                      <div>
                                        <span className="px-3 py-1 rounded text-sm font-medium bg-red-500 text-white">
                                          Needs Work
                                        </span>
                                      </div>
                                    </div>
                                    <p className="mt-2 text-xs text-neutral-600">
                                      Insufficient weight transfer to front foot. Tends to play with weight on back foot which reduces power and control.
                                    </p>
                                  </div>
                                  
                                  {/* Problem area 3 */}
                                  <div className="border border-neutral-200 rounded p-3">
                                    <div className="flex justify-between items-center">
                                      <span className="font-medium">Bat Swing Path</span>
                                      <div>
                                        <span className="px-3 py-1 rounded text-sm font-medium bg-red-500 text-white">
                                          Needs Work
                                        </span>
                                      </div>
                                    </div>
                                    <p className="mt-2 text-xs text-neutral-600">
                                      Bat comes down at an angle instead of straight. Creates inside edge contact and limits shot direction.
                                    </p>
                                  </div>
                                </>
                              )}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Assessment Notes Tab */}
          <TabsContent value="session">
            <div className="border-2 border-primary/10 rounded-lg p-4 bg-primary/5">
              <h3 className="text-lg font-bold mb-3 text-primary">Assessment Notes</h3>
              <div className="p-4 bg-white border border-neutral-200 rounded">
                {assessment.notes ? (
                  <p className="whitespace-pre-line">{assessment.notes}</p>
                ) : (
                  <p className="text-neutral-500 italic">No session notes recorded</p>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

const PlayerProfile = () => {
  const params = useParams<{ id: string }>();
  const playerId = params.id ? parseInt(params.id) : 0;
  const { toast } = useToast();
  
  // State for note dialog
  const [newNote, setNewNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [localProfileNotes, setLocalProfileNotes] = useState<Array<{date: string, author: string, content: string}>>([]);
  
  // State for video filters
  const [shotTypeFilter, setShotTypeFilter] = useState("All");
  const [ballSpeedFilter, setBallSpeedFilter] = useState("All");
  const [batConnectFilter, setBatConnectFilter] = useState("All");
  const [footworkFilter, setFootworkFilter] = useState("All");

  // Query player videos will be handled below

  const { data: player, isLoading: isPlayerLoading } = useQuery<Player>({
    queryKey: [`/api/players/${playerId}`],
    enabled: !isNaN(playerId)
  });

  const { data: assessments, isLoading: isAssessmentsLoading } = useQuery<PerformanceAssessment[]>({
    queryKey: [`/api/players/${playerId}/assessments`],
    enabled: !isNaN(playerId)
  });

  // Get the latest assessment ID for chart metrics
  const latestAssessmentId = assessments && assessments.length > 0 ? assessments[0].id : undefined;
  
  // Fetch metrics for the latest assessment to use in the performance chart
  const { data: chartMetrics, isLoading: isMetricsLoading } = useQuery<PerformanceMetric[]>({
    queryKey: [`/api/assessments/${latestAssessmentId}/metrics`],
    enabled: !isNaN(playerId) && latestAssessmentId !== undefined
  });
  
  // Query player videos for the video library section
  const { data: playerVideos, isLoading: isVideosLoading } = useQuery<Video[]>({
    queryKey: [`/api/players/${playerId}/videos`],
    enabled: !isNaN(playerId)
  });

  const isLoading = isPlayerLoading || isAssessmentsLoading || isMetricsLoading || isVideosLoading;

  // Function to handle adding a new note
  const handleAddNote = () => {
    if (!newNote.trim()) {
      toast({
        title: "Note cannot be empty",
        description: "Please add some content to your note.",
        variant: "destructive"
      });
      return;
    }

    const today = new Date();
    const newNoteObject = {
      date: format(today, "MMMM d, yyyy"),
      author: "Coach", // In a real app, this would be the logged-in coach's name
      content: newNote.trim()
    };

    // Add the new note to the local state
    // In a real application, this would be saved to the database
    setLocalProfileNotes(prevNotes => [newNoteObject, ...prevNotes]);
    
    // Reset the note input and close the dialog
    setNewNote("");
    setIsAddingNote(false);
    
    toast({
      title: "Note added successfully",
      description: "Your note has been added to the player's profile.",
      variant: "default"
    });
  };

  // Base profile notes - in a real app these would come from the API
  const baseProfileNotes = [
    {
      date: "July 25, 2023",
      author: "Coach Sharma",
      content: "Rajiv has shown significant improvement in his straight drive. We need to focus on his weight transfer during cover drives in the upcoming sessions.",
      type: "profile"
    },
    {
      date: "July 18, 2023",
      author: "Coach Patel",
      content: "Noticed a technical issue with his bat swing - tends to close the face too early. Recommended additional drills to correct this.",
      type: "profile"
    }
  ];
  
  // Session assessment notes
  const sessionNotes = [
    {
      date: "July 10, 2023",
      author: "Coach Sharma",
      content: "Rajiv's reaction time has improved significantly. His ability to pick up the ball early has enhanced. Need to continue focus on foot movement.",
      type: "assessment"
    },
    {
      date: "June 28, 2023",
      author: "Coach Patel",
      content: "During today's session, Rajiv was able to execute the pull shot with much better control. Still needs to work on timing against faster deliveries.",
      type: "assessment"
    }
  ];
  
  // Add type information to local notes
  const typedLocalNotes = localProfileNotes.map(note => ({
    ...note,
    type: "profile" // New notes added from profile are "profile" type
  }));
  
  // Combine all notes and sort by date (newest first)
  const allNotes = [...typedLocalNotes, ...baseProfileNotes, ...sessionNotes];
  const profileNotes = allNotes.sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });



  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center mb-6">
        <Link href="/">
          <Button variant="ghost" className="mr-2 p-2 rounded-full hover:bg-neutral-200">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left">
              <path d="m12 19-7-7 7-7"></path>
              <path d="M19 12H5"></path>
            </svg>
          </Button>
        </Link>
        <h2 className="text-2xl font-bold text-neutral-400">Player Profile</h2>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="md:flex">
              <Skeleton className="md:w-1/3 h-80" />
              <div className="p-6 md:w-2/3">
                <Skeleton className="h-8 w-1/3 mb-2" />
                <Skeleton className="h-4 w-1/4 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        player && (
          <Card className="mb-6">
            <CardContent className="p-0">
              <div className="md:flex">
                <div className="md:w-1/3 bg-neutral-200">
                  {player.photoUrl ? (
                    <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-6 md:w-2/3">
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="font-bold text-2xl">{player.name}</h2>
                        <p className="text-neutral-300 mb-2">{player.batch} - Advanced</p>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <div>
                            <span className="font-bold">Age:</span> {player.age || "N/A"}
                          </div>
                          <div>
                            <span className="font-bold">Joined:</span> {player.joinedDate ? format(new Date(player.joinedDate), "MMM dd, yyyy") : "N/A"}
                          </div>
                          <div>
                            <span className="font-bold">Dominant Hand:</span> {player.dominantHand || "N/A"}
                          </div>
                          {player.battingStyle && (
                            <div>
                              <span className="font-bold">Batting:</span> {player.battingStyle}
                            </div>
                          )}
                          {player.bowlingStyle && (
                            <div>
                              <span className="font-bold">Bowling:</span> {player.bowlingStyle}
                            </div>
                          )}
                          {player.specialization && (
                            <div>
                              <span className="font-bold">Specialization:</span> {player.specialization}
                            </div>
                          )}
                        </div>
                      </div>
                      <Link href={`/players/${player.id}/assessment`}>
                        <Button className="bg-secondary text-white px-4 py-2 rounded-lg flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                            <path d="M5 12h14"></path>
                            <path d="M12 5v14"></path>
                          </svg>
                          <span>New Assessment</span>
                        </Button>
                      </Link>
                    </div>
                    
                    <Separator className="my-4" />
                    
                    {/* Profile Notes Section */}
                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-bold">Coach Notes</h3>
                        <Dialog open={isAddingNote} onOpenChange={setIsAddingNote}>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                                <path d="M12 5v14M5 12h14"></path>
                              </svg>
                              Add Note
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add Player Note</DialogTitle>
                              <DialogDescription>
                                Add a coaching note to {player.name}'s profile. This will be visible to all coaches.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                              <Label htmlFor="note" className="text-sm font-medium mb-2 block">
                                Note Content
                              </Label>
                              <Textarea
                                id="note"
                                placeholder="Enter your coaching observations, technical feedback, or drill recommendations..."
                                className="h-32"
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                              />
                            </div>
                            <DialogFooter>
                              <Button 
                                variant="outline" 
                                onClick={() => setIsAddingNote(false)}
                              >
                                Cancel
                              </Button>
                              <Button onClick={handleAddNote}>
                                Save Note
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                      
                      {/* Show only latest note by default */}
                      {profileNotes.length > 0 ? (
                        <Collapsible className="w-full">
                          <div className="border border-neutral-200 rounded-lg p-4 bg-neutral-50">
                            {/* Latest Note (always visible) */}
                            <div className="border-b border-neutral-100 pb-3 mb-2">
                              <div className="flex justify-between items-center mb-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-primary">{profileNotes[0].author}</span>
                                  {profileNotes[0].type === 'profile' ? (
                                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                                      Profile Note
                                    </span>
                                  ) : (
                                    <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                                      Session Assessment
                                    </span>
                                  )}
                                </div>
                                <span className="text-sm text-neutral-500">{profileNotes[0].date}</span>
                              </div>
                              <p className="text-sm">{profileNotes[0].content}</p>
                            </div>
                            
                            {/* Show more notes button (only if there are more notes) */}
                            {profileNotes.length > 1 && (
                              <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="sm" className="w-full text-sm">
                                  <span>View {profileNotes.length - 1} more notes</span>
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="ml-2"
                                  >
                                    <path d="m6 9 6 6 6-6" />
                                  </svg>
                                </Button>
                              </CollapsibleTrigger>
                            )}
                            
                            {/* More notes (collapsed by default) */}
                            <CollapsibleContent>
                              <div className="space-y-4 pt-2">
                                {profileNotes.slice(1).map((note, index) => (
                                  <div key={index} className="border-b border-neutral-100 pb-3 last:border-0 last:pb-0">
                                    <div className="flex justify-between items-center mb-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-primary">{note.author}</span>
                                        {note.type === 'profile' ? (
                                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                                            Profile Note
                                          </span>
                                        ) : (
                                          <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                                            Session Assessment
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-sm text-neutral-500">{note.date}</span>
                                    </div>
                                    <p className="text-sm">{note.content}</p>
                                  </div>
                                ))}
                              </div>
                            </CollapsibleContent>
                          </div>
                        </Collapsible>
                      ) : (
                        <div className="border border-neutral-200 rounded-lg p-4 bg-neutral-50">
                          <p className="text-center text-neutral-500 py-2">No notes yet. Add the first note to track this player's progress.</p>
                        </div>
                      )}
                    </div>
                    
                    {/* New Assessment button moved next to player info */}
                  </div>

                  <Separator className="my-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      )}

      {/* Performance Progression Chart */}
      {!isLoading && assessments && assessments.length > 0 && chartMetrics && (
        <PerformanceChart 
          assessments={assessments} 
          metrics={chartMetrics}
          className="mb-6"
        />
      )}
      
      {/* Weekly Performance Assessment History */}
      <h3 className="text-xl font-bold text-neutral-400 mb-4">Weekly Performance Assessment History</h3>
      
      {!isLoading && (!assessments || assessments.length === 0) ? (
        <Card className="mb-6">
          <CardContent className="flex items-center justify-center py-10">
            <div className="text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-neutral-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-neutral-500 mb-2">No assessments available yet</p>
              <p className="text-sm text-neutral-400">Complete a performance assessment to view assessment history</p>
              <Link href={`/players/${player?.id}/assessment`}>
                <Button className="mt-4 bg-secondary text-white px-4 py-2 rounded-lg flex items-center mx-auto">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus mr-1">
                    <path d="M5 12h14"></path>
                    <path d="M12 5v14"></path>
                  </svg>
                  <span>New Assessment</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="space-y-6">
          {[...Array(1)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-0">
                <Skeleton className="h-12 w-full rounded-t-lg" />
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[...Array(4)].map((_, j) => (
                      <Skeleton key={j} className="h-24 w-full" />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {assessments && assessments
            .sort((a, b) => new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime())
            .map((assessment) => (
              <AssessmentHistoryCard 
                key={assessment.id}
                assessment={assessment}
              />
            ))
          }
        </div>
      )}
      
      {/* Video Library Section */}
      {!isLoading && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Video Library</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="md:col-span-1 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-3 text-sm text-gray-700">Filter Videos</h4>
                
                {/* Shot Type Filter */}
                <div className="mb-2">
                  <Label htmlFor="shot-type" className="block mb-1 text-xs">Shot Type</Label>
                  <select
                    id="shot-type"
                    className="w-full px-2 py-1 text-sm border border-neutral-200 rounded"
                    value={shotTypeFilter}
                    onChange={(e) => setShotTypeFilter(e.target.value)}
                  >
                    <option value="All">All</option>
                    <option value="Cover Drive">Cover Drive</option>
                    <option value="Straight Drive">Straight Drive</option>
                    <option value="Pull Shot">Pull Shot</option>
                    <option value="Cut Shot">Cut Shot</option>
                    <option value="Defensive">Defensive</option>
                  </select>
                </div>
                
                {/* Ball Speed Filter */}
                <div className="mb-2">
                  <Label htmlFor="ball-speed" className="block mb-1 text-xs">Ball Speed</Label>
                  <select
                    id="ball-speed"
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
                  <Label htmlFor="bat-connect" className="block mb-1 text-xs">Bat Connect</Label>
                  <select
                    id="bat-connect"
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
              </div>
              
              <div className="md:col-span-3">
                {playerVideos && playerVideos.length > 0 ? (
                  <div className="flex overflow-x-auto gap-3 pb-2">
                    {playerVideos.filter(video => {
                      // Apply filters
                      if (shotTypeFilter !== "All" && video.shotType !== shotTypeFilter) return false;
                      if (ballSpeedFilter !== "All" && video.ballSpeed !== ballSpeedFilter) return false;
                      if (batConnectFilter !== "All" && video.batConnect !== batConnectFilter) return false;
                      return true;
                    }).map((video) => (
                      <div key={video.id} className="flex-shrink-0 w-48 border border-neutral-200 rounded overflow-hidden">
                        <VideoPlayer 
                          videoUrl={`/uploads/${video.url}`} 
                          title={video.title}
                          className="w-full"
                          triggerClassName="w-full h-24 relative bg-gray-200"
                          initialTags={{
                            shotType: video.shotType || "",
                            ballSpeed: video.ballSpeed || "",
                            reactionTime: "",
                            batConnect: video.batConnect || "",
                            batSwing: ""
                          }}
                          onTagsUpdate={(tags) => {
                            toast({
                              title: "Video Tags Updated",
                              description: "The tags for this video have been updated successfully."
                            });
                          }}
                        />
                        <div className="p-2">
                          <div className="flex flex-wrap gap-1">
                            {video.shotType && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded">{video.shotType}</span>
                            )}
                            {video.ballSpeed && (
                              <span className="text-xs bg-green-100 text-green-800 px-1 rounded">{video.ballSpeed} Ball</span>
                            )}
                            {video.batConnect && (
                              <span className="text-xs bg-yellow-100 text-yellow-800 px-1 rounded">{video.batConnect} Connect</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Fallback for when all videos are filtered out */}
                    {playerVideos.filter(video => {
                      if (shotTypeFilter !== "All" && video.shotType !== shotTypeFilter) return false;
                      if (ballSpeedFilter !== "All" && video.ballSpeed !== ballSpeedFilter) return false;
                      if (batConnectFilter !== "All" && video.batConnect !== batConnectFilter) return false;
                      return true;
                    }).length === 0 && (
                      <div className="w-full text-center py-8">
                        <p className="text-gray-500">No videos match your filter criteria. Try adjusting your filters.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex overflow-x-auto gap-3 pb-2">
                    <div className="flex-shrink-0 w-48 border border-neutral-200 rounded overflow-hidden">
                      <VideoPlayer 
                        videoUrl="/videos/Video 1.mp4" 
                        title="Cover Drive Practice"
                        className="w-full"
                        triggerClassName="w-full h-24 relative bg-gray-200"
                        initialTags={{
                          shotType: "Cover Drive",
                          ballSpeed: "Medium",
                          reactionTime: "Fast",
                          batConnect: "Middle",
                          batSwing: "Good"
                        }}
                      />
                      <div className="p-2">
                        <div className="flex flex-wrap gap-1">
                          <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded">Cover Drive</span>
                          <span className="text-xs bg-green-100 text-green-800 px-1 rounded">Medium Ball</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0 w-48 border border-neutral-200 rounded overflow-hidden">
                      <VideoPlayer 
                        videoUrl="/videos/Video 2.mp4" 
                        title="Pull Shot Practice"
                        className="w-full"
                        triggerClassName="w-full h-24 relative bg-gray-200"
                        initialTags={{
                          shotType: "Pull Shot",
                          ballSpeed: "Fast",
                          reactionTime: "Fast",
                          batConnect: "Middle",
                          batSwing: "Good"
                        }}
                      />
                      <div className="p-2">
                        <div className="flex flex-wrap gap-1">
                          <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded">Pull Shot</span>
                          <span className="text-xs bg-green-100 text-green-800 px-1 rounded">Fast Ball</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0 w-48 border border-neutral-200 rounded overflow-hidden">
                      <VideoPlayer 
                        videoUrl="/videos/Video 3.mp4" 
                        title="Off Drive Practice"
                        className="w-full"
                        triggerClassName="w-full h-24 relative bg-gray-200"
                        initialTags={{
                          shotType: "Off Drive",
                          ballSpeed: "Slow",
                          reactionTime: "Slow",
                          batConnect: "Edge",
                          batSwing: "Average"
                        }}
                      />
                      <div className="p-2">
                        <div className="flex flex-wrap gap-1">
                          <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded">Off Drive</span>
                          <span className="text-xs bg-green-100 text-green-800 px-1 rounded">Slow Ball</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PlayerProfile;
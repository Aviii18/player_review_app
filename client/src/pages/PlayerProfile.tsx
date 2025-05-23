import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import RatingBar from "@/components/RatingBar";
import VideoPlayer from "@/components/VideoPlayer";
import NotesList from "@/components/NotesList";
import PerformanceChart from "@/components/PerformanceChart";
import StarRating from "@/components/StarRating";
import type { Player, PerformanceAssessment, PerformanceMetric, ProblemArea } from "@shared/schema";

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
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="general">General Performance Areas</TabsTrigger>
            <TabsTrigger value="shots">Shot Specific Areas</TabsTrigger>
            <TabsTrigger value="session">Session Notes</TabsTrigger>
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
                        {matchingProblemArea && matchingProblemArea.notes && (
                          <p className="mt-2"><strong>Focus Area Notes:</strong> {matchingProblemArea.notes}</p>
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
          
          {/* Session Notes Tab */}
          <TabsContent value="session">
            <div className="border-2 border-primary/10 rounded-lg p-4 bg-primary/5">
              <h3 className="text-lg font-bold mb-3 text-primary">Session Notes</h3>
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

  const isLoading = isPlayerLoading || isAssessmentsLoading || isMetricsLoading;

  // Mock data for profile notes
  const profileNotes = [
    {
      date: "July 25, 2023",
      author: "Coach Sharma",
      content: "Rajiv has shown significant improvement in his straight drive. We need to focus on his weight transfer during cover drives in the upcoming sessions."
    },
    {
      date: "July 18, 2023",
      author: "Coach Patel",
      content: "Noticed a technical issue with his bat swing - tends to close the face too early. Recommended additional drills to correct this."
    },
    {
      date: "July 10, 2023",
      author: "Coach Sharma",
      content: "Rajiv's reaction time has improved significantly. His ability to pick up the ball early has enhanced. Need to continue focus on foot movement."
    }
  ];



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
                  <img src={player.image} alt={player.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-6 md:w-2/3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="font-bold text-2xl">{player.name}</h2>
                      <p className="text-neutral-300 mb-2">{player.batch} - Advanced</p>
                      <div className="flex space-x-4 text-sm">
                        <div>
                          <span className="font-bold">Age:</span> {player.age || "N/A"}
                        </div>
                        <div>
                          <span className="font-bold">Joined:</span> {player.joinedDate ? format(new Date(player.joinedDate), "MMM dd, yyyy") : "N/A"}
                        </div>
                        <div>
                          <span className="font-bold">Dominant Hand:</span> {player.dominantHand || "N/A"}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <NotesList 
                        title={`Profile Notes - ${player.name}`}
                        notes={profileNotes}
                        count={profileNotes.length}
                      />
                      <Link href={`/players/${player.id}/assessment`}>
                        <Button className="bg-secondary text-white px-4 py-2 rounded-lg flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus mr-1">
                            <path d="M5 12h14"></path>
                            <path d="M12 5v14"></path>
                          </svg>
                          <span>New Assessment</span>
                        </Button>
                      </Link>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  {/* Batting Stats section removed as requested */}
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
    </div>
  );
};

export default PlayerProfile;
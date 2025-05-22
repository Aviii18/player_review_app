import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import RatingBar from "@/components/RatingBar";
import VideoPlayer from "@/components/VideoPlayer";
import NotesList from "@/components/NotesList";
import PerformanceChart from "@/components/PerformanceChart";
import type { Player, PerformanceAssessment, PerformanceMetric } from "@shared/schema";

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

  // Always use assessment ID 1 for metrics, since this is where our data is stored
  const { data: firstAssessmentMetrics, isLoading: isMetricsLoading } = useQuery<PerformanceMetric[]>({
    queryKey: [`/api/assessments/1/metrics`],
    enabled: !isNaN(playerId)
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

  // Mock data for weekly notes (in a real app, this would come from the API)
  const getWeeklyNotes = (weekNumber: number) => {
    if (weekNumber === 1) {
      return [
        {
          date: "July 30, 2023",
          author: "Coach Sharma",
          content: "Excellent session today. Rajiv implemented the corrections for bat swing. His timing has improved significantly."
        },
        {
          date: "July 28, 2023",
          author: "Coach Patel",
          content: "Focused on cover drives today. Still having issues with weight transfer, but improved towards the end of the session."
        },
        {
          date: "July 26, 2023",
          author: "Coach Sharma",
          content: "Worked on reaction time drills. Rajiv performed exceptionally well against fast bowling."
        }
      ];
    } else {
      return [
        {
          date: "July 23, 2023",
          author: "Coach Sharma",
          content: "Rajiv struggled with the spin bowling today. Need to focus more on reading the ball from the hand."
        },
        {
          date: "July 21, 2023",
          author: "Coach Patel",
          content: "Good session overall. Bat connect has improved but still inconsistent against faster deliveries."
        }
      ];
    }
  };

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

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-bold text-lg">Batting Stats</h3>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div className="bg-primary/10 p-3 rounded">
                          <p className="text-xs text-neutral-600 font-medium">Avg. Reaction Time</p>
                          <p className="font-mono font-bold">0.72s</p>
                        </div>
                        <div className="bg-primary/10 p-3 rounded">
                          <p className="text-xs text-neutral-600 font-medium">Bat Connect %</p>
                          <p className="font-mono font-bold">87%</p>
                        </div>
                        <div className="bg-primary/10 p-3 rounded">
                          <p className="text-xs text-neutral-600 font-medium">Shot Selection Accuracy</p>
                          <p className="font-mono font-bold">82%</p>
                        </div>
                        <div className="bg-primary/10 p-3 rounded">
                          <p className="text-xs text-neutral-600 font-medium">Footwork Score</p>
                          <p className="font-mono font-bold">7.5/10</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Current Focus Areas</h3>
                      <ul className="mt-2 space-y-2">
                        <li className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="text-red-500 mr-2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" x2="12" y1="8" y2="12"></line>
                            <line x1="12" x2="12.01" y1="16" y2="16"></line>
                          </svg>
                          <span>Weight shifting during drive shots</span>
                        </li>
                        <li className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="text-amber-500 mr-2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" x2="12" y1="8" y2="12"></line>
                            <line x1="12" x2="12.01" y1="16" y2="16"></line>
                          </svg>
                          <span>Bat swing consistency</span>
                        </li>
                        <li className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="text-green-500 mr-2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                          </svg>
                          <span>Bat connect timing</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      )}

      {/* Performance Progression Chart */}
      {!isLoading && assessments && assessments.length > 0 && firstAssessmentMetrics && (
        <PerformanceChart 
          assessments={assessments} 
          metrics={firstAssessmentMetrics} 
          className="mb-6"
        />
      )}
      
      <h3 className="text-xl font-bold text-neutral-400 mb-4">Weekly Performance Assessment</h3>

      {!isLoading && (!assessments || assessments.length === 0) ? (
        <Card className="mb-6">
          <CardContent className="flex items-center justify-center py-10">
            <div className="text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-neutral-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-neutral-500 mb-2">No assessments available yet</p>
              <p className="text-sm text-neutral-400">Complete a performance assessment to view weekly progress</p>
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
          {[...Array(3)].map((_, i) => (
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
        assessments && assessments
          .sort((a, b) => new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime())
          .map((assessment, index) => {
            // For the first assessment, use the fetched metrics
            const metrics = index === 0 ? firstAssessmentMetrics || [] : [];
            const weekNumber = index + 1;
            const weekNotes = getWeeklyNotes(weekNumber);
            
            return (
              <Card key={assessment.id} className="mb-6">
                <div className="bg-primary text-white px-6 py-3 flex justify-between items-center rounded-t-lg">
                  <h4 className="font-bold">
                    Week of {format(new Date(assessment.weekStart), "MMMM d")} - {format(new Date(assessment.weekEnd), "MMMM d, yyyy")}
                  </h4>
                  <div className="flex space-x-2">
                    <NotesList 
                      title={`Weekly Notes - ${format(new Date(assessment.weekStart), "MMMM d")} - ${format(new Date(assessment.weekEnd), "MMMM d, yyyy")}`}
                      notes={weekNotes}
                    />
                    {assessment.isLatest && (
                      <span className="text-sm bg-white text-primary font-bold px-2 py-1 rounded">Most Recent</span>
                    )}
                  </div>
                </div>
                <CardContent className="p-6">
                  {/* Shot Specific Performance Areas */}
                  <div className="mb-6 border-2 border-amber-500/20 rounded-lg p-4 bg-amber-500/5">
                    <h3 className="text-lg font-bold mb-3 text-amber-600">Shot Specific Performance Areas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {metrics.filter(metric => 
                        ['cover_drive', 'straight_drive'].includes(metric.metricType)
                      ).map((metric: PerformanceMetric) => {
                        const metricDisplayName = metric.metricType
                          .split('_')
                          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(' ');
                          
                        return (
                          <div key={metric.id} className="border border-neutral-200 rounded p-4">
                            <div className="flex justify-between items-center mb-2">
                              <h5 className="font-bold">{metricDisplayName}</h5>
                              <VideoPlayer 
                                videoUrl={metric.videoUrl || ""}
                                title={`${metricDisplayName} Assessment - ${format(new Date(assessment.weekEnd), "MMMM d, yyyy")}`}
                              />
                            </div>
                            <div className="mb-1 flex justify-between text-sm">
                              <span>Performance</span>
                              <span className="font-mono">{metric.value}</span>
                            </div>
                            <RatingBar rating={metric.rating} />
                            <div className="mt-3 text-sm text-neutral-600">
                              <p>{metric.notes}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* General Performance Areas */}
                  <div className="mb-6 border-2 border-secondary/10 rounded-lg p-4 bg-secondary/5">
                    <h3 className="text-lg font-bold mb-3 text-secondary">General Performance Areas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {metrics.filter(metric => 
                        ['reaction_time', 'bat_connect', 'shot_selection', 'footwork'].includes(metric.metricType)
                      ).map((metric: PerformanceMetric) => {
                        const metricDisplayName = metric.metricType
                          .split('_')
                          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(' ');
                          
                        return (
                          <div key={metric.id} className="border border-neutral-200 rounded p-4">
                            <div className="flex justify-between items-center mb-2">
                              <h5 className="font-bold">{metricDisplayName}</h5>
                              <VideoPlayer 
                                videoUrl={metric.videoUrl || ""}
                                title={`${metricDisplayName} Assessment - ${format(new Date(assessment.weekEnd), "MMMM d, yyyy")}`}
                              />
                            </div>
                            <div className="mb-1 flex justify-between text-sm">
                              <span>Performance</span>
                              <span className="font-mono">{metric.value}</span>
                            </div>
                            <RatingBar rating={metric.rating} />
                            <div className="mt-3 text-sm text-neutral-600">
                              <p>{metric.notes}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Other Metrics (if any) */}
                  {metrics.filter(metric => 
                    !['cover_drive', 'straight_drive', 'reaction_time', 'bat_connect', 'shot_selection', 'footwork'].includes(metric.metricType)
                  ).length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {metrics.filter(metric => 
                        !['cover_drive', 'straight_drive', 'reaction_time', 'bat_connect', 'shot_selection', 'footwork'].includes(metric.metricType)
                      ).map((metric: PerformanceMetric) => {
                        const metricDisplayName = metric.metricType
                          .split('_')
                          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(' ');
                          
                        return (
                          <div key={metric.id} className="border border-neutral-200 rounded p-4">
                            <div className="flex justify-between items-center mb-2">
                              <h5 className="font-bold">{metricDisplayName}</h5>
                              <VideoPlayer 
                                videoUrl={metric.videoUrl || ""}
                                title={`${metricDisplayName} Assessment - ${format(new Date(assessment.weekEnd), "MMMM d, yyyy")}`}
                              />
                            </div>
                            <div className="mb-1 flex justify-between text-sm">
                              <span>Performance</span>
                              <span className="font-mono">{metric.value}</span>
                            </div>
                            <RatingBar rating={metric.rating} />
                            <div className="mt-3 text-sm text-neutral-600">
                              <p>{metric.notes}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
      )}

      {/* Video Library Section with Actions */}
      <div className="flex justify-between items-center mt-8 mb-4">
        <h3 className="text-xl font-bold text-neutral-400">Video Library</h3>
        <Link href={`/players/${playerId}/record`}>
          <Button className="bg-primary hover:bg-primary-dark">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
              <circle cx="12" cy="12" r="10"></circle>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            Record New Video
          </Button>
        </Link>
      </div>
      
      {/* Week 1 */}
      <Card className="mb-6">
        <div className="bg-primary text-white px-6 py-3 flex justify-between items-center rounded-t-lg">
          <h4 className="font-bold">Week of July 24 - July 30, 2023</h4>
        </div>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {["Cover Drive", "Pull Shot", "Straight Drive", "Defensive Block"].map((shotType, index) => (
              <div key={index} className="video-thumbnail bg-neutral-100 rounded-lg overflow-hidden">
                <div className="h-36 relative">
                  <div className="absolute inset-0 flex items-center justify-center bg-neutral-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="text-primary" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polygon points="10 8 16 12 10 16 10 8"></polygon>
                    </svg>
                  </div>
                </div>
                <div className="p-3">
                  <p className="font-medium text-sm">{shotType}</p>
                  <div className="flex items-center mt-1">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full mr-1">
                      {index % 2 === 0 ? "Middle" : "Edge"}
                    </span>
                    <span className="text-xs bg-neutral-200 text-neutral-600 px-2 py-0.5 rounded-full">
                      {index % 2 === 0 ? "Medium" : "Fast"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Week 2 */}
      <Card className="mb-6">
        <div className="bg-primary text-white px-6 py-3 flex justify-between items-center rounded-t-lg">
          <h4 className="font-bold">Week of July 17 - July 23, 2023</h4>
        </div>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {["Cover Drive", "Sweep Shot", "Square Cut", "Flick"].map((shotType, index) => (
              <div key={index} className="video-thumbnail bg-neutral-100 rounded-lg overflow-hidden">
                <div className="h-36 relative">
                  <div className="absolute inset-0 flex items-center justify-center bg-neutral-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="text-primary" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polygon points="10 8 16 12 10 16 10 8"></polygon>
                    </svg>
                  </div>
                </div>
                <div className="p-3">
                  <p className="font-medium text-sm">{shotType}</p>
                  <div className="flex items-center mt-1">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full mr-1">
                      {index % 3 === 0 ? "Middle" : index % 3 === 1 ? "Edge" : "Missed"}
                    </span>
                    <span className="text-xs bg-neutral-200 text-neutral-600 px-2 py-0.5 rounded-full">
                      {index % 2 === 0 ? "Slow" : "Medium"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Week 3 */}
      <Card className="mb-6">
        <div className="bg-primary text-white px-6 py-3 flex justify-between items-center rounded-t-lg">
          <h4 className="font-bold">Week of July 10 - July 16, 2023</h4>
        </div>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {["Cover Drive", "Reverse Sweep", "On Drive", "Defensive Block"].map((shotType, index) => (
              <div key={index} className="video-thumbnail bg-neutral-100 rounded-lg overflow-hidden">
                <div className="h-36 relative">
                  <div className="absolute inset-0 flex items-center justify-center bg-neutral-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="text-primary" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polygon points="10 8 16 12 10 16 10 8"></polygon>
                    </svg>
                  </div>
                </div>
                <div className="p-3">
                  <p className="font-medium text-sm">{shotType}</p>
                  <div className="flex items-center mt-1">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full mr-1">
                      {index % 4 === 0 ? "Middle" : index % 4 === 1 ? "Edge" : index % 4 === 2 ? "Bottom" : "Missed"}
                    </span>
                    <span className="text-xs bg-neutral-200 text-neutral-600 px-2 py-0.5 rounded-full">
                      {index % 3 === 0 ? "Fast" : index % 3 === 1 ? "Medium" : "Slow"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlayerProfile;

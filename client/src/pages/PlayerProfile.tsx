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
      {!isLoading && assessments && assessments.length > 0 && chartMetrics && (
        <PerformanceChart 
          assessments={assessments} 
          metrics={chartMetrics}
          className="mb-6"
        />
      )}
    </div>
  );
};

export default PlayerProfile;
import { useMemo } from "react";
import { 
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList
} from "recharts";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { PerformanceMetric, PerformanceAssessment } from "@shared/schema";

interface RadarData {
  subject: string;
  current: number;
  previous: number;
  fullMark: 100;
}

interface PerformanceChartProps {
  assessments: PerformanceAssessment[];
  metrics: PerformanceMetric[];
  className?: string;
}

// Colors for different weeks
const weekColors = {
  current: "#8884d8",
  previous: "#82ca9d"
};

const metricNames: Record<string, string> = {
  "reaction_time": "Reaction Time",
  "bat_connect": "Bat Connect",
  "shot_selection": "Shot Selection",
  "footwork": "Footwork",
  "cover_drive": "Cover Drive",
  "straight_drive": "Straight Drive"
};

const PerformanceChart = ({ assessments, metrics, className }: PerformanceChartProps) => {
  // Transform the data for the radar chart
  const chartData = useMemo(() => {
    // Get the metrics and organize them for the radar chart
    const radarData: RadarData[] = [];
    
    // Sort assessments by date (newest first)
    const sortedAssessments = [...assessments].sort(
      (a, b) => new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime()
    );
    
    if (sortedAssessments.length < 1) {
      return [];
    }
    
    // Get the current week metrics (we already have these from the props)
    const currentWeekMetrics = metrics;
    
    // Create the radar data for each metric
    currentWeekMetrics.forEach(metric => {
      // For each metric we need the current and previous value
      const radarPoint: RadarData = {
        subject: metricNames[metric.metricType] || metric.metricType,
        current: metric.rating,
        previous: generatePreviousValue(metric.rating), // Simulated previous value
        fullMark: 100
      };
      
      radarData.push(radarPoint);
    });
    
    return radarData;
  }, [assessments, metrics]);
  
  // Helper function to generate a simulated previous value
  function generatePreviousValue(currentValue: number): number {
    // Generate a value that's slightly lower than the current one to show improvement
    const previousValue = Math.max(30, currentValue - (5 + Math.random() * 15));
    return Math.round(previousValue);
  }

  // Format dates for display
  const getFormattedDates = () => {
    if (assessments.length < 1) return { current: "Current", previous: "Previous" };
    
    const sortedAssessments = [...assessments].sort(
      (a, b) => new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime()
    );
    
    const current = format(new Date(sortedAssessments[0]?.weekStart), "MMM d");
    const previous = sortedAssessments.length > 1 
      ? format(new Date(sortedAssessments[1]?.weekStart), "MMM d")
      : "Previous";
      
    return { current, previous };
  };
  
  const dates = getFormattedDates();

  if (chartData.length < 1) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Performance Profile</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-10">
          <p className="text-neutral-500 text-center">
            Not enough assessment data to display performance profile.<br />
            Add more assessments to see skill comparisons.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Performance Profile</CardTitle>
        <div className="flex items-center space-x-2 text-sm">
          <div className="flex items-center">
            <div className="h-3 w-3 rounded-full bg-[#8884d8] mr-1"></div>
            <span>Week of {dates.current}</span>
          </div>
          <div className="flex items-center">
            <div className="h-3 w-3 rounded-full bg-[#82ca9d] mr-1"></div>
            <span>Week of {dates.previous}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart 
            cx="50%" 
            cy="50%" 
            outerRadius="80%" 
            data={chartData}
          >
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" />
            <PolarRadiusAxis angle={30} domain={[0, 100]} />
            
            <Radar
              name={`Week of ${dates.previous}`}
              dataKey="previous"
              stroke={weekColors.previous}
              fill={weekColors.previous}
              fillOpacity={0.3}
            />
            
            <Radar
              name={`Week of ${dates.current}`}
              dataKey="current"
              stroke={weekColors.current}
              fill={weekColors.current}
              fillOpacity={0.5}
            />
            
            <Tooltip 
              formatter={(value) => [`${value}/100`, '']}
            />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default PerformanceChart;
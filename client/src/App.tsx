import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Header from "@/components/Header";
import PlayerList from "@/pages/PlayerList";
import PlayerProfile from "@/pages/PlayerProfile";
import PerformanceAssessment from "@/pages/PerformanceAssessment";
import VideoRecording from "@/pages/VideoRecording";

function Router() {
  return (
    <Switch>
      <Route path="/" component={PlayerList} />
      <Route path="/players/:id" component={PlayerProfile} />
      <Route path="/players/:id/assessment" component={PerformanceAssessment} />
      <Route path="/players/:id/record" component={VideoRecording} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-grow">
            <Router />
          </main>
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

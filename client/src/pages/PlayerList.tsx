import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import PlayerCard from "@/components/PlayerCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { Player } from "@shared/schema";

const PlayerList = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [batchFilter, setBatchFilter] = useState("All Batches");
  
  const { data: players, isLoading } = useQuery<Player[]>({
    queryKey: ["/api/players"],
  });

  const filteredPlayers = players?.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBatch = batchFilter === "All Batches" || player.batch === batchFilter;
    return matchesSearch && matchesBatch;
  });
  
  // Extract unique batch values for filter
  const batches = players 
    ? ["All Batches", ...new Set(players.map(player => player.batch))]
    : ["All Batches"];
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-neutral-400">Player Roster</h2>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search players..."
              className="pl-8 pr-4 py-2"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-2 top-1/2 transform -translate-y-1/2 text-neutral-300" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.3-4.3"></path>
            </svg>
          </div>
          <Select value={batchFilter} onValueChange={setBatchFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Batches" />
            </SelectTrigger>
            <SelectContent>
              {batches.map((batch) => (
                <SelectItem key={batch} value={batch}>
                  {batch}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <div className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {filteredPlayers && filteredPlayers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredPlayers.map((player) => (
                <PlayerCard key={player.id} player={player} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-lg text-neutral-400">No players found matching your criteria.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PlayerList;

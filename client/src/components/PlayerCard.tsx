import { Link } from "wouter";
import type { Player } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface PlayerCardProps {
  player: Player;
}

const PlayerCard = ({ player }: PlayerCardProps) => {
  const getStatusIcon = (status: string | null | undefined) => {
    switch (status) {
      case "improving":
        return (
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="text-green-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m22 7-8.5 8.5-5-5L2 17"/>
            </svg>
            <span className="text-sm ml-1">Improving</span>
          </div>
        );
      case "stable":
        return (
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="text-amber-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14"/>
            </svg>
            <span className="text-sm ml-1">Stable</span>
          </div>
        );
      case "needs focus":
        return (
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="text-red-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m22 17-8.5-8.5-5 5L2 7"/>
            </svg>
            <span className="text-sm ml-1">Needs focus</span>
          </div>
        );
      default:
        return null;
    }
  };

  const joinedText = player.joinedDate 
    ? formatDistanceToNow(new Date(player.joinedDate), { addSuffix: true })
    : "N/A";

  return (
    <Link href={`/players/${player.id}`}>
      <div className="bg-white rounded-lg shadow-md overflow-hidden player-card cursor-pointer hover:translate-y-[-5px] transition-transform duration-200">
        <div className="relative h-48 bg-neutral-200">
          {player.photoUrl ? (
            <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
            <span className="inline-block bg-secondary text-white text-xs font-bold px-2 py-1 rounded">{player.batch}</span>
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-bold text-lg">{player.name}</h3>
          <div className="flex justify-between items-center mt-2">
            <div className="text-sm text-neutral-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="inline-block mr-1" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 2v4"></path>
                <path d="M16 2v4"></path>
                <rect width="18" height="18" x="3" y="4" rx="2"></rect>
                <path d="M3 10h18"></path>
              </svg>
              Joined: {joinedText}
            </div>
            {getStatusIcon(player.status)}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PlayerCard;

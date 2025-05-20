import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
  thumbnail?: string;
  className?: string;
  triggerClassName?: string;
}

const VideoPlayer = ({ videoUrl, title, thumbnail, className, triggerClassName }: VideoPlayerProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const getYouTubeEmbedUrl = (url: string) => {
    // Handle various YouTube URL formats
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    
    return match && match[2].length === 11
      ? `https://www.youtube.com/embed/${match[2]}?autoplay=1`
      : url;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          className={`p-1 text-primary hover:text-primary-dark focus:ring-0 ${triggerClassName}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-play-circle">
            <circle cx="12" cy="12" r="10"></circle>
            <polygon points="10 8 16 12 10 16 10 8"></polygon>
          </svg>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="aspect-w-16 aspect-h-9 mt-2">
          <iframe 
            src={getYouTubeEmbedUrl(videoUrl)} 
            className={`w-full h-[500px] ${className}`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoPlayer;

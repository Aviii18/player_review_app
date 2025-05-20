import { useState, useEffect, useRef } from "react";
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
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(thumbnail || null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const isLocalVideo = (url: string) => {
    return url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.ogg');
  };

  useEffect(() => {
    // Only generate thumbnail if not provided and it's a local video
    if (!thumbnail && isLocalVideo(videoUrl)) {
      const video = document.createElement('video');
      video.src = videoUrl;
      video.crossOrigin = "anonymous";
      video.preload = "metadata";
      
      video.onloadeddata = () => {
        // Move to 25% through the video to get a more representative frame
        video.currentTime = video.duration * 0.25;
      };
      
      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg');
          setThumbnailUrl(dataUrl);
        }
        
        video.remove();
      };
    }
  }, [videoUrl, thumbnail]);

  const getVideoPlayer = () => {
    if (isLocalVideo(videoUrl)) {
      return (
        <video 
          ref={videoRef}
          src={videoUrl}
          className={`w-full max-h-[500px] ${className}`}
          controls
          autoPlay
        />
      );
    } else {
      // Handle YouTube URLs
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = videoUrl.match(regExp);
      
      const embedUrl = match && match[2].length === 11
        ? `https://www.youtube.com/embed/${match[2]}?autoplay=1`
        : videoUrl;
        
      return (
        <iframe 
          src={embedUrl} 
          className={`w-full h-[500px] ${className}`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          className={`p-1 text-primary hover:text-primary-dark focus:ring-0 ${triggerClassName}`}
        >
          {thumbnailUrl ? (
            <div className="relative w-full h-full overflow-hidden">
              <img 
                src={thumbnailUrl} 
                alt={title} 
                className="w-full h-full object-cover rounded"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-md">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polygon points="10 8 16 12 10 16 10 8" fill="white"></polygon>
                </svg>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-neutral-200 rounded">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-play-circle">
                <circle cx="12" cy="12" r="10"></circle>
                <polygon points="10 8 16 12 10 16 10 8"></polygon>
              </svg>
            </div>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="aspect-w-16 aspect-h-9 mt-2">
          {getVideoPlayer()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoPlayer;

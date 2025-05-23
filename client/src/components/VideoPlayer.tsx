import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface VideoTag {
  shotType: string;
  ballSpeed: string;
  reactionTime: string;
  batConnect: string;
  batSwing: string;
}

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
  thumbnail?: string;
  className?: string;
  triggerClassName?: string;
  onTagsUpdate?: (tags: VideoTag) => void;
  initialTags?: Partial<VideoTag>;
}

const VideoPlayer = ({ 
  videoUrl, 
  title, 
  thumbnail, 
  className, 
  triggerClassName,
  onTagsUpdate,
  initialTags = {}
}: VideoPlayerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(thumbnail || null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [tags, setTags] = useState<Partial<VideoTag>>({
    shotType: initialTags.shotType || '',
    ballSpeed: initialTags.ballSpeed || '',
    reactionTime: initialTags.reactionTime || '',
    batConnect: initialTags.batConnect || '',
    batSwing: initialTags.batSwing || ''
  });

  const isLocalVideo = (url: string) => {
    return url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.ogg');
  };

  useEffect(() => {
    // Simply use a generic cricket shot image for thumbnails
    if (!thumbnail) {
      // Set color-coded thumbnails instead of trying to generate them
      // Map for thumbnail background colors based on video content
      const fileName = videoUrl.split('/').pop() || '';
      
      // Determine color based on filename
      let bgColor = '%23cccccc'; // Default gray
      
      if (fileName === 'Video 1.mp4') {
        bgColor = '%233b82f6'; // blue-500
      } else if (fileName === 'Video 2.mp4') {
        bgColor = '%2322c55e'; // green-500
      } else if (fileName === 'Video 3.mp4') {
        bgColor = '%23eab308'; // yellow-500
      } else if (fileName === 'Video 4.mp4') {
        bgColor = '%23ef4444'; // red-500
      }
      
      setThumbnailUrl(`data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="150" viewBox="0 0 300 150"><rect width="300" height="150" fill="${bgColor}"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="24" fill="white">Cricket Training</text></svg>`);
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

  // Function to handle saving tags
  const handleSaveTags = () => {
    // Only trigger update if callback is provided and all tags are filled
    if (onTagsUpdate && 
        tags.shotType && 
        tags.ballSpeed && 
        tags.reactionTime && 
        tags.batConnect && 
        tags.batSwing) {
      onTagsUpdate(tags as VideoTag);
    }
    setShowTagDialog(false);
  };

  const handleTagChange = (value: string, field: keyof VideoTag) => {
    setTags({
      ...tags,
      [field]: value
    });
  };

  // Tag selection options
  const shotTypes = ['Cover Drive', 'Pull Shot', 'Off Drive', 'Straight Drive', 'Cut Shot', 'Sweep Shot', 'Defensive Block', 'Miscellaneous'];
  const ballSpeeds = ['Fast', 'Medium', 'Slow'];
  const reactionTimes = ['Fast', 'Avg', 'Slow'];
  const batConnectOptions = ['Good', 'Avg', 'Poor'];
  const batSwingOptions = ['Good', 'Avg', 'Poor'];

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="ghost" 
            className={`p-1 text-primary hover:text-primary-dark focus:ring-0 ${triggerClassName}`}
          >
            {thumbnailUrl ? (
              <div className="relative w-full h-full overflow-hidden aspect-video">
                <img 
                  src={thumbnailUrl} 
                  alt={title} 
                  className="w-full h-full object-cover rounded"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-lg">
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
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowTagDialog(true)}
            >
              Tag Video
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tag Dialog - with video visible */}
      <Dialog open={showTagDialog} onOpenChange={setShowTagDialog}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Tag Video: {title}</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Video Player on the left */}
            <div className="aspect-video bg-black rounded-md overflow-hidden">
              <video 
                src={videoUrl}
                className="w-full h-full"
                controls
                autoPlay
                loop
              />
            </div>
            
            {/* Tagging Form on the right */}
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-12 items-center gap-2">
                <label className="col-span-4 text-sm font-medium">Shot Type:</label>
                <div className="col-span-8">
                  <Select 
                    value={tags.shotType} 
                    onValueChange={(value) => handleTagChange(value, 'shotType')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select shot type" />
                    </SelectTrigger>
                    <SelectContent>
                      {shotTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-12 items-center gap-2">
                <label className="col-span-4 text-sm font-medium">Ball Speed:</label>
                <div className="col-span-8">
                  <Select 
                    value={tags.ballSpeed} 
                    onValueChange={(value) => handleTagChange(value, 'ballSpeed')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select ball speed" />
                    </SelectTrigger>
                    <SelectContent>
                      {ballSpeeds.map(speed => (
                        <SelectItem key={speed} value={speed}>{speed}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-12 items-center gap-2">
                <label className="col-span-4 text-sm font-medium">Reaction Time:</label>
                <div className="col-span-8">
                  <Select 
                    value={tags.reactionTime} 
                    onValueChange={(value) => handleTagChange(value, 'reactionTime')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select reaction time" />
                    </SelectTrigger>
                    <SelectContent>
                      {reactionTimes.map(time => (
                        <SelectItem key={time} value={time}>{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-12 items-center gap-2">
                <label className="col-span-4 text-sm font-medium">Bat Connect:</label>
                <div className="col-span-8">
                  <Select 
                    value={tags.batConnect} 
                    onValueChange={(value) => handleTagChange(value, 'batConnect')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select bat connect" />
                    </SelectTrigger>
                    <SelectContent>
                      {batConnectOptions.map(option => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-12 items-center gap-2">
                <label className="col-span-4 text-sm font-medium">Bat Swing:</label>
                <div className="col-span-8">
                  <Select 
                    value={tags.batSwing} 
                    onValueChange={(value) => handleTagChange(value, 'batSwing')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select bat swing" />
                    </SelectTrigger>
                    <SelectContent>
                      {batSwingOptions.map(option => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-auto">
                <Button variant="outline" onClick={() => setShowTagDialog(false)}>Cancel</Button>
                <Button onClick={handleSaveTags}>Save Tags</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VideoPlayer;

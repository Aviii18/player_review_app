import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Note {
  date: string;
  author: string;
  content: string;
}

interface NotesListProps {
  title: string;
  notes: Note[];
  count?: number;
}

const NotesList = ({ title, notes, count }: NotesListProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          className="p-2 rounded-full hover:bg-neutral-100 relative"
          title="View Notes"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clipboard-list">
            <rect width="8" height="4" x="8" y="2" rx="1" ry="1"></rect>
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
            <path d="M12 11h4"></path>
            <path d="M12 16h4"></path>
            <path d="M8 11h.01"></path>
            <path d="M8 16h.01"></path>
          </svg>
          {count && count > 0 && (
            <Badge variant="secondary" className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0">
              {count}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          {notes.map((note, index) => (
            <div key={index} className="border-l-4 border-primary pl-3 py-1">
              <p className="text-sm text-neutral-300">{note.date} - {note.author}</p>
              <p>{note.content}</p>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NotesList;

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PlayerCard from "@/components/PlayerCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import type { Player, InsertPlayer } from "@shared/schema";

const NewPlayerForm = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<InsertPlayer>({
    defaultValues: {
      name: '',
      age: 0,
      batch: '',
      bio: '',
      photoUrl: null,
      dateOfBirth: '',
      battingStyle: 'Right Hand',
      bowlingStyle: 'Right Arm Fast',
      specialization: 'Batsman',
      yearsOfExperience: 0,
      height: '',
      weight: '',
      dominantHand: 'Right'
    }
  });
  
  const createPlayerMutation = useMutation({
    mutationFn: async (data: InsertPlayer) => {
      const response = await fetch('/api/players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create player');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/players'] });
      toast({
        title: "Player created successfully",
        description: "The new player has been added to the roster"
      });
      reset();
      setPhotoPreview(null);
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to create player",
        description: "There was an error adding the player",
        variant: "destructive"
      });
      console.error(error);
    }
  });
  
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const onSubmit = (data: InsertPlayer) => {
    // Add photo preview as base64 string to the form data
    if (photoPreview) {
      data.photoUrl = photoPreview;
    }
    createPlayerMutation.mutate(data);
  };
  
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button className="bg-secondary hover:bg-secondary/90 text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add New Player
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Player</DialogTitle>
          <DialogDescription>
            Enter the player's details to add them to the roster.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Player Photo Upload */}
            <div className="md:col-span-2 flex flex-col items-center">
              <div className="w-32 h-32 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden mb-2">
                {photoPreview ? (
                  <img src={photoPreview} alt="Player preview" className="w-full h-full object-cover" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                )}
              </div>
              <Label htmlFor="photo" className="cursor-pointer px-3 py-1.5 text-sm bg-primary text-white rounded hover:bg-primary/90">
                Upload Photo
              </Label>
              <input 
                type="file" 
                id="photo" 
                className="hidden" 
                accept="image/*"
                onChange={handlePhotoChange}
              />
            </div>
            
            {/* Basic Info */}
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" {...register('name', { required: 'Name is required' })} className="mt-1" />
              {errors.name && <span className="text-red-500 text-sm">{errors.name.message}</span>}
            </div>
            
            <div>
              <Label htmlFor="batch">Batch</Label>
              <Input id="batch" {...register('batch', { required: 'Batch is required' })} placeholder="e.g. Morning Batch" className="mt-1" />
              {errors.batch && <span className="text-red-500 text-sm">{errors.batch.message}</span>}
            </div>
            
            <div>
              <Label htmlFor="dob">Date of Birth</Label>
              <Input id="dob" type="date" {...register('dateOfBirth')} className="mt-1" />
            </div>
            
            <div>
              <Label htmlFor="age">Age</Label>
              <Input id="age" type="number" {...register('age', { valueAsNumber: true })} className="mt-1" />
            </div>
            
            {/* Cricket Specific Info */}
            <div>
              <Label htmlFor="battingStyle">Batting Style</Label>
              <Select 
                onValueChange={(value) => {
                  // Update the form field manually since register doesn't work with radix-ui Select
                  // You would need a controlled component with setValue from react-hook-form
                  document.getElementsByName('battingStyle')[0].setAttribute('value', value);
                }}
                defaultValue="Right Hand"
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="Select batting style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Right Hand">Right Hand</SelectItem>
                  <SelectItem value="Left Hand">Left Hand</SelectItem>
                </SelectContent>
              </Select>
              <input type="hidden" {...register('battingStyle')} />
            </div>
            
            <div>
              <Label htmlFor="bowlingStyle">Bowling Style</Label>
              <Select 
                onValueChange={(value) => {
                  document.getElementsByName('bowlingStyle')[0].setAttribute('value', value);
                }}
                defaultValue="Right Arm Fast"
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="Select bowling style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Right Arm Fast">Right Arm Fast</SelectItem>
                  <SelectItem value="Right Arm Medium">Right Arm Medium</SelectItem>
                  <SelectItem value="Right Arm Spin">Right Arm Spin</SelectItem>
                  <SelectItem value="Left Arm Fast">Left Arm Fast</SelectItem>
                  <SelectItem value="Left Arm Medium">Left Arm Medium</SelectItem>
                  <SelectItem value="Left Arm Spin">Left Arm Spin</SelectItem>
                </SelectContent>
              </Select>
              <input type="hidden" {...register('bowlingStyle')} />
            </div>
            
            <div>
              <Label htmlFor="specialization">Specialization</Label>
              <Select 
                onValueChange={(value) => {
                  document.getElementsByName('specialization')[0].setAttribute('value', value);
                }}
                defaultValue="Batsman"
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="Select specialization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Batsman">Batsman</SelectItem>
                  <SelectItem value="Bowler">Bowler</SelectItem>
                  <SelectItem value="All-rounder">All-rounder</SelectItem>
                  <SelectItem value="Wicket Keeper">Wicket Keeper</SelectItem>
                </SelectContent>
              </Select>
              <input type="hidden" {...register('specialization')} />
            </div>
            
            <div>
              <Label htmlFor="experience">Years of Experience</Label>
              <Input id="experience" type="number" {...register('yearsOfExperience', { valueAsNumber: true })} className="mt-1" />
            </div>
            
            <div>
              <Label htmlFor="dominantHand">Dominant Hand</Label>
              <Select 
                onValueChange={(value) => {
                  document.getElementsByName('dominantHand')[0].setAttribute('value', value);
                }}
                defaultValue="Right"
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="Select dominant hand" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Right">Right</SelectItem>
                  <SelectItem value="Left">Left</SelectItem>
                  <SelectItem value="Ambidextrous">Ambidextrous</SelectItem>
                </SelectContent>
              </Select>
              <input type="hidden" {...register('dominantHand')} />
            </div>
            
            <div>
              <Label htmlFor="height">Height</Label>
              <Input id="height" {...register('height')} placeholder="e.g. 5'10''" className="mt-1" />
            </div>
            
            <div>
              <Label htmlFor="weight">Weight</Label>
              <Input id="weight" {...register('weight')} placeholder="e.g. 70 kg" className="mt-1" />
            </div>
          </div>
          
          <div>
            <Label htmlFor="bio">Player Bio</Label>
            <Textarea id="bio" {...register('bio')} placeholder="Add any additional information about the player" className="mt-1" />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button type="submit" className="bg-primary" disabled={createPlayerMutation.isPending}>
              {createPlayerMutation.isPending ? 'Saving...' : 'Save Player'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

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
    ? ["All Batches", ...Array.from(new Set(players.map(player => player.batch)))]
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
          <NewPlayerForm />
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

//PlayerList.tsx

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
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";

// Define Player interface if not imported
interface Player {
  id: string;
  name: string;
  age: number;
  batch: string;
  specialization: string;
  batting_style: string;
  bowling_style: string;
  photo_url?: string | null;
  position?: string | null;
  overall_rating?: number;
  total_assessments?: number;
  bio?: string | null;
  dob?: string | null;
  height?: number | null;
  weight?: number | null;
}

// Updated interface to match your Supabase table
interface CreatePlayerData {
  name: string;
  age: number;
  batting_style: string;
  bowling_style: string;
  specialization: string;
  photo_url?: string | null;
  batch: string;
  position?: string | null;
  overall_rating?: number;
  total_assessments?: number;
  bio?: string | null;
  dob?: string | null;
  height?: number | null;
  weight?: number | null;
}

// Simple fetch wrapper to replace apiRequest
const fetchPlayers = async (): Promise<Player[]> => {
  const response = await fetch('/api/players', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch players: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

const NewPlayerForm = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<CreatePlayerData>({
    defaultValues: {
      name: '',
      age: 18,
      batch: '',
      photo_url: null,
      batting_style: 'Right Hand',
      bowling_style: 'Right Arm Fast',
      specialization: 'Batsman',
      position: null,
      overall_rating: 0,
      total_assessments: 0,
      bio: null,
      dob: null,
      height: null,
      weight: null
    }
  });
  
  const createPlayerMutation = useMutation({
    mutationFn: async (data: CreatePlayerData) => {
      const response = await fetch('/api/players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error:', errorText);
        throw new Error(`Failed to create player: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      toast({
        title: "Player created successfully",
        description: "The new player has been added to the roster"
      });
      reset();
      setPhotoPreview(null);
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create player",
        description: error.message || "There was an error adding the player",
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

  // Calculate age from date of birth
  const calculateAge = (dob: string) => {
    if (!dob) return 0;
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dob = e.target.value;
    setValue('dob', dob);
    
    if (dob) {
      const calculatedAge = calculateAge(dob);
      setValue('age', calculatedAge);
    }
  };
  
  const onSubmit = (data: CreatePlayerData) => {
    // Add photo preview as base64 string to the form data
    if (photoPreview) {
      data.photo_url = photoPreview;
    }
    
    // Convert empty strings and zero values to null for optional fields
    if (!data.height || data.height === 0) data.height = null;
    if (!data.weight || data.weight === 0) data.weight = null;
    if (!data.bio || data.bio === '') data.bio = null;
    if (!data.dob || data.dob === '') data.dob = null;
    if (!data.position || data.position === '') data.position = null;
    
    // Debug: Log the data being sent
    console.log('Form data being submitted:', data);
    
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
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Add New Player</DialogTitle>
          <DialogDescription>
            Enter the player's details to add them to the roster.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
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
              <Label htmlFor="dob">Date of Birth</Label>
              <Input 
                id="dob" 
                type="date" 
                {...register('dob')} 
                onChange={handleDobChange}
                className="mt-1" 
              />
              {errors.dob && <span className="text-red-500 text-sm">{errors.dob.message}</span>}
            </div>
            
            <div>
              <Label htmlFor="age">Age</Label>
              <Input 
                id="age" 
                type="number" 
                {...register('age', { 
                  required: 'Age is required', 
                  min: { value: 1, message: 'Age must be at least 1' },
                  valueAsNumber: true
                })} 
                className="mt-1" 
                readOnly
              />
              {errors.age && <span className="text-red-500 text-sm">{errors.age.message}</span>}
            </div>
            
            <div>
              <Label htmlFor="batch">Batch</Label>
              <Input id="batch" {...register('batch', { required: 'Batch is required' })} className="mt-1" />
              {errors.batch && <span className="text-red-500 text-sm">{errors.batch.message}</span>}
            </div>
            
            <div>
              <Label htmlFor="position">Position</Label>
              <Input id="position" {...register('position')} className="mt-1" />
            </div>
            
            <div>
              <Label htmlFor="height">Height (cm)</Label>
              <Input 
                id="height" 
                type="number" 
                {...register('height', { 
                  valueAsNumber: true,
                  validate: (value) => value === null || value === undefined || value > 0 || 'Height must be positive'
                })} 
                className="mt-1" 
                placeholder="Enter height in cm"
              />
              {errors.height && <span className="text-red-500 text-sm">{errors.height.message}</span>}
            </div>
            
            <div>
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input 
                id="weight" 
                type="number" 
                {...register('weight', { 
                  valueAsNumber: true,
                  validate: (value) => value === null || value === undefined || value > 0 || 'Weight must be positive'
                })} 
                className="mt-1" 
                placeholder="Enter weight in kg"
              />
              {errors.weight && <span className="text-red-500 text-sm">{errors.weight.message}</span>}
            </div>
            
            <div>
              <Label htmlFor="batting_style">Batting Style</Label>
              <Select 
                defaultValue="Right Hand"
                onValueChange={(value) => setValue('batting_style', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select batting style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Right Hand">Right Hand</SelectItem>
                  <SelectItem value="Left Hand">Left Hand</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="bowling_style">Bowling Style</Label>
              <Select 
                defaultValue="Right Arm Fast"
                onValueChange={(value) => setValue('bowling_style', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select bowling style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Right Arm Fast">Right Arm Fast</SelectItem>
                  <SelectItem value="Left Arm Fast">Left Arm Fast</SelectItem>
                  <SelectItem value="Right Arm Medium">Right Arm Medium</SelectItem>
                  <SelectItem value="Left Arm Medium">Left Arm Medium</SelectItem>
                  <SelectItem value="Right Arm Spin">Right Arm Spin</SelectItem>
                  <SelectItem value="Left Arm Spin">Left Arm Spin</SelectItem>
                  <SelectItem value="Leg Spin">Leg Spin</SelectItem>
                  <SelectItem value="Off Spin">Off Spin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="specialization">Specialization</Label>
              <Select 
                defaultValue="Batsman"
                onValueChange={(value) => setValue('specialization', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select specialization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Batsman">Batsman</SelectItem>
                  <SelectItem value="Bowler">Bowler</SelectItem>
                  <SelectItem value="All-rounder">All-rounder</SelectItem>
                  <SelectItem value="Wicket Keeper">Wicket Keeper</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea 
                id="bio" 
                {...register('bio')} 
                className="mt-1" 
                rows={3}
                placeholder="Player's biography..."
              />
            </div>
          </div>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            onClick={handleSubmit(onSubmit)}
            disabled={createPlayerMutation.isPending}
          >
            {createPlayerMutation.isPending ? 'Creating...' : 'Create Player'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const PlayerList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBatch, setSelectedBatch] = useState<string>("all");
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>("all");

  const { data: players, isLoading, error } = useQuery({
    queryKey: ['players'],
    queryFn: fetchPlayers
  });

  const filteredPlayers = players?.filter((player: any) => {
    const matchesSearch = player.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBatch = selectedBatch === "all" || player.batch === selectedBatch;
    const matchesSpecialization = selectedSpecialization === "all" || player.specialization === selectedSpecialization;
    
    return matchesSearch && matchesBatch && matchesSpecialization;
  });

  // Get unique batches for filter
  const uniqueBatches = Array.from(new Set(players?.map((player: any) => player.batch).filter(Boolean) || []));

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">Error loading players: {(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Player Roster</h1>
        <NewPlayerForm />
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <Label htmlFor="search">Search Players</Label>
          <Input
            id="search"
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="batch-filter">Filter by Batch</Label>
          <Select value={selectedBatch} onValueChange={setSelectedBatch}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select batch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Batches</SelectItem>
              {uniqueBatches.map(batch => (
                <SelectItem key={batch} value={batch}>
                  {batch}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="specialization-filter">Filter by Specialization</Label>
          <Select value={selectedSpecialization} onValueChange={setSelectedSpecialization}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select specialization" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Specializations</SelectItem>
              <SelectItem value="Batsman">Batsman</SelectItem>
              <SelectItem value="Bowler">Bowler</SelectItem>
              <SelectItem value="All-rounder">All-rounder</SelectItem>
              <SelectItem value="Wicket Keeper">Wicket Keeper</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Players Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="p-4 border rounded-lg">
              <div className="flex items-center space-x-4">
                <Skeleton className="w-16 h-16 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlayers?.map((player: any) => (
            <PlayerCard key={player.id} player={player} />
          ))}
        </div>
      )}

      {filteredPlayers && filteredPlayers.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-gray-500">No players found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};

export default PlayerList;

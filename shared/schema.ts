// shared/schema.ts

export interface Player {
  id: string;
  name: string;
  age?: number;
  batting_style?: string;
  bowling_style?: string;
  specialization?: string;
  photo_url?: string;
  overall_rating?: number;
  total_assessments?: number;
  bio?: string;
  dob?: string; // DATE type from PostgreSQL comes as string in JavaScript
  height?: number; // DECIMAL(5,2) 
  weight?: number; // DECIMAL(5,2)
  batch?: string; // Manually added field
  position?: string; // Manually added field
  created_at?: string;
}

export interface Assessment {
  id: string;
  player_id: string;
  technique_rating: number;
  fitness_rating: number;
  game_awareness_rating: number;
  mental_strength_rating: number;
  overall_rating: number;
  notes?: string;
  session_date?: string; // DATE type comes as string
  created_at?: string;
}

export interface Video {
  id: string;
  player_id: string;
  title: string;
  file_url: string;
  file_size?: number; // BIGINT
  duration?: number; // REAL type
  tags?: string[]; // TEXT[] array
  technique_focus?: string;
  quality_rating?: number;
  created_at?: string;
}

export interface Session {
  id: string;
  name: string;
  date: string; // DATE type comes as string
  participants?: string[]; // TEXT[] array
  duration_minutes?: number;
  focus_areas?: string[]; // TEXT[] array
  notes?: string;
  created_at?: string;
}

// Additional utility types for database operations
export type PlayerInsert = Omit<Player, 'id' | 'created_at' | 'overall_rating' | 'total_assessments'>;
export type PlayerUpdate = Partial<PlayerInsert>;

export type AssessmentInsert = Omit<Assessment, 'id' | 'created_at'>;
export type AssessmentUpdate = Partial<AssessmentInsert>;

export type VideoInsert = Omit<Video, 'id' | 'created_at'>;
export type VideoUpdate = Partial<VideoInsert>;

export type SessionInsert = Omit<Session, 'id' | 'created_at'>;
export type SessionUpdate = Partial<SessionInsert>;
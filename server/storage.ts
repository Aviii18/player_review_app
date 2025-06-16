// server/storage.ts - CORRECTED VERSION
import { supabase, TABLES } from './supabase';
import { Player, Assessment, Video, Session } from '../shared/schema';

// Interface matching your EXACT Supabase table structure
interface CreatePlayerData {
  name: string;
  age?: number;
  batting_style?: string;  
  bowling_style?: string;
  specialization?: string;
  photo_url?: string | null; // Allow null values
  bio?: string | null;
  dob?: string | null; // Date string in YYYY-MM-DD format
  height?: number | null; // Height in cm
  weight?: number | null; // Weight in kg
  batch?: string | null; // Manually added field
  position?: string | null; // Manually added field
  // overall_rating and total_assessments are auto-calculated by triggers
}

export class SupabaseStorage {
  
  // PLAYER METHODS
  async getPlayers(): Promise<Player[]> {
    const { data, error } = await supabase
      .from(TABLES.PLAYERS)
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching players:', error);
      return [];
    }
    
    return data || [];
  }

  async getPlayer(id: string): Promise<Player | null> {
    const { data, error } = await supabase
      .from(TABLES.PLAYERS)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching player:', error);
      return null;
    }
    
    return data;
  }
  
  async createPlayer(playerData: CreatePlayerData): Promise<Player> {
    console.log('Data being inserted into Supabase:', playerData);

    // Let Supabase handle ID generation and timestamps
    const { data, error } = await supabase
      .from(TABLES.PLAYERS)
      .insert([playerData])
      .select()
      .single();

    if (error) {
      console.error('Supabase insertion error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw new Error(`Failed to create player: ${error.message}`);
    }

    return data;
  }

  async updatePlayer(id: string, updates: Partial<CreatePlayerData>): Promise<Player | null> {
    const { data, error } = await supabase
      .from(TABLES.PLAYERS)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating player:', error);
      return null;
    }

    return data;
  }

  // ASSESSMENT METHODS
  async getPlayerAssessments(playerId: string): Promise<Assessment[]> {
    const { data, error } = await supabase
      .from(TABLES.ASSESSMENTS)
      .select('*')
      .eq('player_id', playerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching assessments:', error);
      return [];
    }

    return data || [];
  }

  async createAssessment(assessment: Omit<Assessment, 'id' | 'created_at'>): Promise<Assessment> {
    // Let Supabase handle ID generation and timestamps
    const { data, error } = await supabase
      .from(TABLES.ASSESSMENTS)
      .insert([assessment])
      .select()
      .single();

    if (error) {
      console.error('Error creating assessment:', error);
      throw new Error(`Failed to create assessment: ${error.message}`);
    }

    return data;
  }

  // VIDEO METHODS
  async getPlayerVideos(playerId: string): Promise<Video[]> {
    const { data, error } = await supabase
      .from(TABLES.VIDEOS)
      .select('*')
      .eq('player_id', playerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching videos:', error);
      return [];
    }

    return data || [];
  }

  async createVideo(video: Omit<Video, 'id' | 'created_at'>): Promise<Video> {
    // Let Supabase handle ID generation and timestamps
    const { data, error } = await supabase
      .from(TABLES.VIDEOS)
      .insert([video])
      .select()
      .single();

    if (error) {
      console.error('Error creating video:', error);
      throw new Error(`Failed to create video: ${error.message}`);
    }

    return data;
  }

  // SESSION METHODS
  async getSessions(): Promise<Session[]> {
    const { data, error } = await supabase
      .from(TABLES.SESSIONS)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching sessions:', error);
      return [];
    }

    return data || [];
  }

  async createSession(session: Omit<Session, 'id' | 'created_at'>): Promise<Session> {
    // Let Supabase handle ID generation and timestamps
    const { data, error } = await supabase
      .from(TABLES.SESSIONS)
      .insert([session])
      .select()
      .single();

    if (error) {
      console.error('Error creating session:', error);
      throw new Error(`Failed to create session: ${error.message}`);
    }

    return data;
  }

  // FILE UPLOAD METHOD
  async uploadFile(file: Buffer, fileName: string, contentType: string): Promise<string> {
    const filePath = `uploads/${Date.now()}-${fileName}`;
    
    const { data, error } = await supabase.storage
      .from('cricket-files')
      .upload(filePath, file, {
        contentType,
        duplex: 'half'
      });

    if (error) {
      console.error('Error uploading file:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('cricket-files')
      .getPublicUrl(filePath);

    return publicUrl;
  }

  // Additional utility methods
  async deletePlayer(id: string): Promise<boolean> {
    const { error } = await supabase
      .from(TABLES.PLAYERS)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting player:', error);
      return false;
    }

    return true;
  }

  async searchPlayers(searchTerm: string): Promise<Player[]> {
    const { data, error } = await supabase
      .from(TABLES.PLAYERS)
      .select('*')
      .or(`name.ilike.%${searchTerm}%,specialization.ilike.%${searchTerm}%,batting_style.ilike.%${searchTerm}%,bowling_style.ilike.%${searchTerm}%`)
      .order('name');
    
    if (error) {
      console.error('Error searching players:', error);
      return [];
    }
    
    return data || [];
  }
}

// Export a single instance
export const storage = new SupabaseStorage();
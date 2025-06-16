// server/routes.ts - REPLACE your existing routes.ts with this
import express from 'express';
import multer from 'multer';
import { storage } from './storage';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
});

// Interface for player creation data validation
interface CreatePlayerRequest {
  name: string;
  age: number;
  batting_style: string;
  bowling_style: string;
  specialization: string;
  photo_url?: string | null;
  batch: string;
  position?: string;
  overall_rating?: number;
  total_assessments?: number;
  bio?: string;
  dob?: string; // Date string in YYYY-MM-DD format
  height?: number; // Height in cm
  weight?: number; // Weight in kg
}

// Validation function for player data
const validatePlayerData = (data: any): string[] => {
  const errors: string[] = [];
  
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push('Name is required and must be a non-empty string');
  }
  
  if (!data.age || typeof data.age !== 'number' || data.age < 5 || data.age > 100) {
    errors.push('Age is required and must be a number between 5 and 100');
  }
  
  if (!data.batch || typeof data.batch !== 'string' || data.batch.trim().length === 0) {
    errors.push('Batch is required and must be a non-empty string');
  }
  
  if (!data.batting_style || typeof data.batting_style !== 'string') {
    errors.push('Batting style is required');
  }
  
  if (!data.bowling_style || typeof data.bowling_style !== 'string') {
    errors.push('Bowling style is required');
  }
  
  if (!data.specialization || typeof data.specialization !== 'string') {
    errors.push('Specialization is required');
  }
  
  if (data.overall_rating !== undefined && (typeof data.overall_rating !== 'number' || data.overall_rating < 0 || data.overall_rating > 10)) {
    errors.push('Overall rating must be a number between 0 and 10');
  }
  
  if (data.total_assessments !== undefined && (typeof data.total_assessments !== 'number' || data.total_assessments < 0)) {
    errors.push('Total assessments must be a non-negative number');
  }

  // Validate new fields
  if (data.bio !== undefined && (typeof data.bio !== 'string' || data.bio.length > 1000)) {
    errors.push('Bio must be a string with maximum 1000 characters');
  }

  if (data.dob !== undefined && data.dob !== null && data.dob !== '') {
    const dobDate = new Date(data.dob);
    const today = new Date();
    const minDate = new Date('1900-01-01');
    
    if (isNaN(dobDate.getTime()) || dobDate > today || dobDate < minDate) {
      errors.push('Date of birth must be a valid date between 1900 and today');
    }
  }

  if (data.height !== undefined && data.height !== null && data.height !== '') {
    const heightNum = parseFloat(data.height);
    if (isNaN(heightNum) || heightNum < 100 || heightNum > 250) {
      errors.push('Height must be a number between 100 and 250 cm');
    }
  }

  if (data.weight !== undefined && data.weight !== null && data.weight !== '') {
    const weightNum = parseFloat(data.weight);
    if (isNaN(weightNum) || weightNum < 20 || weightNum > 200) {
      errors.push('Weight must be a number between 20 and 200 kg');
    }
  }
  
  return errors;
};

// PLAYER ROUTES
router.get('/players', async (req, res) => {
  try {
    const players = await storage.getPlayers();
    res.json(players);
  } catch (error) {
    console.error('Error fetching players:', error);
    res.status(500).json({ error: 'Failed to fetch players' });
  }
});

router.post('/players', async (req, res) => {
  try {
    console.log('Received player creation request:', req.body);
    
    // Validate the request data
    const validationErrors = validatePlayerData(req.body);
    if (validationErrors.length > 0) {
      console.error('Validation errors:', validationErrors);
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validationErrors 
      });
    }
    
    // Clean and prepare the data
    const playerData: CreatePlayerRequest = {
      name: req.body.name.trim(),
      age: parseInt(req.body.age.toString()),
      batting_style: req.body.batting_style,
      bowling_style: req.body.bowling_style,
      specialization: req.body.specialization,
      batch: req.body.batch.trim(),
      photo_url: req.body.photo_url || null,
      position: req.body.position ? req.body.position.trim() : null,
      overall_rating: req.body.overall_rating ? parseFloat(req.body.overall_rating.toString()) : 0,
      total_assessments: req.body.total_assessments ? parseInt(req.body.total_assessments.toString()) : 0,
      bio: req.body.bio ? req.body.bio.trim() : null,
      dob: req.body.dob || null,
      height: req.body.height ? parseFloat(req.body.height.toString()) : undefined,
      weight: req.body.weight ? parseFloat(req.body.weight.toString()) : undefined
    };
    
    console.log('Cleaned player data:', playerData);
    
    const player = await storage.createPlayer(playerData);
    console.log('Player created successfully:', player);
    
    res.status(201).json(player);
  } catch (error) {
    console.error('Error creating player:', error);
    
    // Send more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ 
      error: 'Failed to create player',
      details: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/players/:id', async (req, res) => {
  try {
    const player = await storage.getPlayer(req.params.id);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    res.json(player);
  } catch (error) {
    console.error('Error fetching player:', error);
    res.status(500).json({ error: 'Failed to fetch player' });
  }
});

router.put('/players/:id', async (req, res) => {
  try {
    const player = await storage.updatePlayer(req.params.id, req.body);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    res.json(player);
  } catch (error) {
    console.error('Error updating player:', error);
    res.status(500).json({ error: 'Failed to update player' });
  }
});

// ASSESSMENT ROUTES
router.get('/players/:id/assessments', async (req, res) => {
  try {
    const assessments = await storage.getPlayerAssessments(req.params.id);
    res.json(assessments);
  } catch (error) {
    console.error('Error fetching assessments:', error);
    res.status(500).json({ error: 'Failed to fetch assessments' });
  }
});

router.post('/players/:id/assessments', async (req, res) => {
  try {
    const assessmentData = {
      ...req.body,
      player_id: req.params.id,
    };
    const assessment = await storage.createAssessment(assessmentData);
    res.status(201).json(assessment);
  } catch (error) {
    console.error('Error creating assessment:', error);
    res.status(500).json({ error: 'Failed to create assessment' });
  }
});

// VIDEO ROUTES
router.get('/players/:id/videos', async (req, res) => {
  try {
    const videos = await storage.getPlayerVideos(req.params.id);
    res.json(videos);
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

router.post('/players/:id/videos/upload', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    // Upload file to Supabase storage
    const fileUrl = await storage.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    // Create video record in database
    const videoData = {
      player_id: req.params.id,
      title: req.body.title || req.file.originalname,
      file_url: fileUrl,
      file_size: req.file.size,
      tags: req.body.tags ? req.body.tags.split(',') : [],
      technique_focus: req.body.technique_focus,
      quality_rating: req.body.quality_rating ? parseFloat(req.body.quality_rating) : 0,
    };

    const video = await storage.createVideo(videoData);
    res.status(201).json(video);
  } catch (error) {
    console.error('Error uploading video:', error);
    res.status(500).json({ error: 'Failed to upload video' });
  }
});

// SESSION ROUTES
router.get('/sessions', async (req, res) => {
  try {
    const sessions = await storage.getSessions();
    res.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

router.post('/sessions', async (req, res) => {
  try {
    const session = await storage.createSession(req.body);
    res.status(201).json(session);
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// PHOTO UPLOAD ROUTE
router.post('/players/:id/photo', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No photo file provided' });
    }

    // Upload photo to Supabase storage
    const photoUrl = await storage.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    // Update player with photo URL
    const player = await storage.updatePlayer(req.params.id, {
      photo_url: photoUrl 
    });

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    res.json({ photo_url: photoUrl });
  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).json({ error: 'Failed to upload photo' });
  }
});

export default router;
import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertPerformanceAssessmentSchema, 
  insertPerformanceMetricSchema,
  insertProblemAreaSchema,
  insertVideoSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all players
  app.get("/api/players", async (_req: Request, res: Response) => {
    const players = await storage.getPlayers();
    res.json(players);
  });

  // Get a specific player
  app.get("/api/players/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid player ID" });
    }

    const player = await storage.getPlayer(id);
    if (!player) {
      return res.status(404).json({ message: "Player not found" });
    }

    res.json(player);
  });

  // Get player assessments
  app.get("/api/players/:id/assessments", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid player ID" });
    }

    const assessments = await storage.getPlayerAssessments(id);
    res.json(assessments);
  });

  // Get assessment metrics
  app.get("/api/assessments/:id/metrics", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid assessment ID" });
    }

    const metrics = await storage.getAssessmentMetrics(id);
    res.json(metrics);
  });

  // Get assessment problem areas
  app.get("/api/assessments/:id/problem-areas", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid assessment ID" });
    }

    const problemAreas = await storage.getAssessmentProblemAreas(id);
    res.json(problemAreas);
  });

  // Get player videos
  app.get("/api/players/:id/videos", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid player ID" });
    }

    const { shotType, ballSpeed, batConnect } = req.query;
    
    const videos = await storage.getFilteredVideos(id, {
      shotType: shotType as string,
      ballSpeed: ballSpeed as string,
      batConnect: batConnect as string
    });
    
    res.json(videos);
  });

  // Create a new assessment
  app.post("/api/players/:id/assessments", async (req: Request, res: Response) => {
    const playerId = parseInt(req.params.id);
    if (isNaN(playerId)) {
      return res.status(400).json({ message: "Invalid player ID" });
    }

    try {
      const validatedData = insertPerformanceAssessmentSchema.parse({
        ...req.body,
        playerId
      });
      
      const assessment = await storage.createAssessment(validatedData);
      res.status(201).json(assessment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid assessment data", errors: error.errors });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Add a metric to an assessment
  app.post("/api/assessments/:id/metrics", async (req: Request, res: Response) => {
    const assessmentId = parseInt(req.params.id);
    if (isNaN(assessmentId)) {
      return res.status(400).json({ message: "Invalid assessment ID" });
    }

    try {
      const validatedData = insertPerformanceMetricSchema.parse({
        ...req.body,
        assessmentId
      });
      
      const metric = await storage.createMetric(validatedData);
      res.status(201).json(metric);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid metric data", errors: error.errors });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Add a problem area to an assessment
  app.post("/api/assessments/:id/problem-areas", async (req: Request, res: Response) => {
    const assessmentId = parseInt(req.params.id);
    if (isNaN(assessmentId)) {
      return res.status(400).json({ message: "Invalid assessment ID" });
    }

    try {
      const validatedData = insertProblemAreaSchema.parse({
        ...req.body,
        assessmentId
      });
      
      const problemArea = await storage.createProblemArea(validatedData);
      res.status(201).json(problemArea);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid problem area data", errors: error.errors });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Add a video
  app.post("/api/players/:id/videos", async (req: Request, res: Response) => {
    const playerId = parseInt(req.params.id);
    if (isNaN(playerId)) {
      return res.status(400).json({ message: "Invalid player ID" });
    }

    try {
      const validatedData = insertVideoSchema.parse({
        ...req.body,
        playerId
      });
      
      const video = await storage.createVideo(validatedData);
      res.status(201).json(video);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid video data", errors: error.errors });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

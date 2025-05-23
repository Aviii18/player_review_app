import { pgTable, text, serial, integer, boolean, json, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  batch: text("batch").notNull(),
  photoUrl: text("photo_url"),
  dateOfBirth: text("date_of_birth"),
  age: integer("age"),
  bio: text("bio"),
  battingStyle: text("batting_style"),
  bowlingStyle: text("bowling_style"),
  specialization: text("specialization"),
  yearsOfExperience: integer("years_experience"),
  height: text("height"),
  weight: text("weight"),
  dominantHand: text("dominant_hand"),
  status: text("status"), // "improving", "stable", "needs focus"
  joinedDate: timestamp("joined_date").defaultNow(),
});

export const insertPlayerSchema = createInsertSchema(players).omit({ id: true });

export const performanceAssessments = pgTable("performance_assessments", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull(),
  weekStart: timestamp("week_start").notNull(),
  weekEnd: timestamp("week_end").notNull(),
  notes: text("notes"),
  isLatest: boolean("is_latest").default(false),
});

export const insertPerformanceAssessmentSchema = createInsertSchema(performanceAssessments).omit({ id: true });

export const performanceMetrics = pgTable("performance_metrics", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").notNull(),
  metricType: text("metric_type").notNull(), // "reaction_time", "bat_connect", "cover_drive", "straight_drive" etc.
  rating: integer("rating").notNull(), // 0-100 for percentage, can be converted to colors
  value: text("value"), // actual value like "0.65s" for reaction time
  notes: text("notes"),
  videoUrl: text("video_url"),
});

export const insertPerformanceMetricSchema = createInsertSchema(performanceMetrics).omit({ id: true });

export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  recordedDate: timestamp("recorded_date").notNull(),
  shotType: text("shot_type"), // "cover_drive", "straight_drive", "pull_shot" etc.
  ballLength: text("ball_length"), // "full", "good", "short", "yorker", "half-volley"
  ballSpeed: text("ball_speed"), // "fast", "medium", "slow"
  batConnect: text("bat_connect"), // "middle", "edge", "bottom", "missed"
});

export const insertVideoSchema = createInsertSchema(videos).omit({ id: true });

export const problemAreas = pgTable("problem_areas", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").notNull(),
  areaType: text("area_type").notNull(), // "bat_connect", "foot_movement", "bat_swing", "weight_shifting"
  rating: integer("rating").notNull(), // 1-5 stars
  notes: text("notes"),
});

export const insertProblemAreaSchema = createInsertSchema(problemAreas).omit({ id: true });

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = typeof players.$inferSelect;

export type InsertPerformanceAssessment = z.infer<typeof insertPerformanceAssessmentSchema>;
export type PerformanceAssessment = typeof performanceAssessments.$inferSelect;

export type InsertPerformanceMetric = z.infer<typeof insertPerformanceMetricSchema>;
export type PerformanceMetric = typeof performanceMetrics.$inferSelect;

export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type Video = typeof videos.$inferSelect;

export type InsertProblemArea = z.infer<typeof insertProblemAreaSchema>;
export type ProblemArea = typeof problemAreas.$inferSelect;

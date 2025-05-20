import { 
  Player, InsertPlayer, 
  PerformanceAssessment, InsertPerformanceAssessment,
  PerformanceMetric, InsertPerformanceMetric,
  Video, InsertVideo,
  ProblemArea, InsertProblemArea,
  User, InsertUser
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Player methods
  getPlayers(): Promise<Player[]>;
  getPlayer(id: number): Promise<Player | undefined>;
  createPlayer(player: InsertPlayer): Promise<Player>;
  updatePlayer(id: number, player: Partial<InsertPlayer>): Promise<Player | undefined>;

  // Performance Assessment methods
  getPlayerAssessments(playerId: number): Promise<PerformanceAssessment[]>;
  getAssessment(id: number): Promise<PerformanceAssessment | undefined>;
  createAssessment(assessment: InsertPerformanceAssessment): Promise<PerformanceAssessment>;

  // Performance Metric methods
  getAssessmentMetrics(assessmentId: number): Promise<PerformanceMetric[]>;
  createMetric(metric: InsertPerformanceMetric): Promise<PerformanceMetric>;

  // Video methods
  getPlayerVideos(playerId: number): Promise<Video[]>;
  getFilteredVideos(playerId: number, filters: { shotType?: string, ballSpeed?: string, batConnect?: string }): Promise<Video[]>;
  createVideo(video: InsertVideo): Promise<Video>;

  // Problem Area methods
  getAssessmentProblemAreas(assessmentId: number): Promise<ProblemArea[]>;
  createProblemArea(problemArea: InsertProblemArea): Promise<ProblemArea>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private players: Map<number, Player>;
  private assessments: Map<number, PerformanceAssessment>;
  private metrics: Map<number, PerformanceMetric>;
  private videos: Map<number, Video>;
  private problemAreas: Map<number, ProblemArea>;
  
  private userCurrentId: number;
  private playerCurrentId: number;
  private assessmentCurrentId: number;
  private metricCurrentId: number;
  private videoCurrentId: number;
  private problemAreaCurrentId: number;

  constructor() {
    this.users = new Map();
    this.players = new Map();
    this.assessments = new Map();
    this.metrics = new Map();
    this.videos = new Map();
    this.problemAreas = new Map();
    
    this.userCurrentId = 1;
    this.playerCurrentId = 1;
    this.assessmentCurrentId = 1;
    this.metricCurrentId = 1;
    this.videoCurrentId = 1;
    this.problemAreaCurrentId = 1;
    
    // Initialize with some demo data
    this.initDemoData();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Player methods
  async getPlayers(): Promise<Player[]> {
    return Array.from(this.players.values());
  }

  async getPlayer(id: number): Promise<Player | undefined> {
    return this.players.get(id);
  }

  async createPlayer(insertPlayer: InsertPlayer): Promise<Player> {
    const id = this.playerCurrentId++;
    const player: Player = { ...insertPlayer, id };
    this.players.set(id, player);
    return player;
  }

  async updatePlayer(id: number, playerUpdate: Partial<InsertPlayer>): Promise<Player | undefined> {
    const existingPlayer = this.players.get(id);
    if (!existingPlayer) {
      return undefined;
    }
    
    const updatedPlayer = { ...existingPlayer, ...playerUpdate };
    this.players.set(id, updatedPlayer);
    return updatedPlayer;
  }

  // Performance Assessment methods
  async getPlayerAssessments(playerId: number): Promise<PerformanceAssessment[]> {
    return Array.from(this.assessments.values()).filter(
      (assessment) => assessment.playerId === playerId
    );
  }

  async getAssessment(id: number): Promise<PerformanceAssessment | undefined> {
    return this.assessments.get(id);
  }

  async createAssessment(insertAssessment: InsertPerformanceAssessment): Promise<PerformanceAssessment> {
    // If this is set as latest, update other assessments for this player
    if (insertAssessment.isLatest) {
      const playerAssessments = await this.getPlayerAssessments(insertAssessment.playerId);
      for (const assessment of playerAssessments) {
        if (assessment.isLatest) {
          this.assessments.set(assessment.id, { ...assessment, isLatest: false });
        }
      }
    }
    
    const id = this.assessmentCurrentId++;
    const assessment: PerformanceAssessment = { ...insertAssessment, id };
    this.assessments.set(id, assessment);
    return assessment;
  }

  // Performance Metric methods
  async getAssessmentMetrics(assessmentId: number): Promise<PerformanceMetric[]> {
    return Array.from(this.metrics.values()).filter(
      (metric) => metric.assessmentId === assessmentId
    );
  }

  async createMetric(insertMetric: InsertPerformanceMetric): Promise<PerformanceMetric> {
    const id = this.metricCurrentId++;
    const metric: PerformanceMetric = { ...insertMetric, id };
    this.metrics.set(id, metric);
    return metric;
  }

  // Video methods
  async getPlayerVideos(playerId: number): Promise<Video[]> {
    return Array.from(this.videos.values()).filter(
      (video) => video.playerId === playerId
    );
  }

  async getFilteredVideos(
    playerId: number, 
    filters: { shotType?: string, ballSpeed?: string, batConnect?: string }
  ): Promise<Video[]> {
    let videos = await this.getPlayerVideos(playerId);
    
    if (filters.shotType && filters.shotType !== 'All Shot Types') {
      videos = videos.filter(video => video.shotType === filters.shotType);
    }
    
    if (filters.ballSpeed && filters.ballSpeed !== 'All Speeds') {
      videos = videos.filter(video => video.ballSpeed === filters.ballSpeed);
    }
    
    if (filters.batConnect && filters.batConnect !== 'All') {
      videos = videos.filter(video => video.batConnect === filters.batConnect);
    }
    
    return videos;
  }

  async createVideo(insertVideo: InsertVideo): Promise<Video> {
    const id = this.videoCurrentId++;
    const video: Video = { ...insertVideo, id };
    this.videos.set(id, video);
    return video;
  }

  // Problem Area methods
  async getAssessmentProblemAreas(assessmentId: number): Promise<ProblemArea[]> {
    return Array.from(this.problemAreas.values()).filter(
      (area) => area.assessmentId === assessmentId
    );
  }

  async createProblemArea(insertProblemArea: InsertProblemArea): Promise<ProblemArea> {
    const id = this.problemAreaCurrentId++;
    const problemArea: ProblemArea = { ...insertProblemArea, id };
    this.problemAreas.set(id, problemArea);
    return problemArea;
  }

  // Initialize with demo data
  private initDemoData() {
    // Add demo players
    const players: InsertPlayer[] = [
      {
        name: "Rajiv Sharma",
        batch: "Morning Batch",
        image: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?ixlib=rb-4.0.3&auto=format&fit=crop&q=80",
        joinedDate: new Date("2023-01-15"),
        age: 17,
        dominantHand: "Right",
        status: "improving"
      },
      {
        name: "Priya Patel",
        batch: "Evening Batch",
        image: "https://images.unsplash.com/photo-1628779238951-be2c9f2a59f4?ixlib=rb-4.0.3&auto=format&fit=crop&q=80",
        joinedDate: new Date("2023-01-10"),
        age: 16,
        dominantHand: "Right",
        status: "stable"
      },
      {
        name: "Arjun Singh",
        batch: "Weekend Batch",
        image: "https://images.unsplash.com/photo-1562077772-3bd90403f7f0?ixlib=rb-4.0.3&auto=format&fit=crop&q=80",
        joinedDate: new Date("2023-05-05"),
        age: 15,
        dominantHand: "Left",
        status: "improving"
      },
      {
        name: "Meera Reddy",
        batch: "Morning Batch",
        image: "https://images.unsplash.com/photo-1580748141549-71748dbe0bdc?ixlib=rb-4.0.3&auto=format&fit=crop&q=80",
        joinedDate: new Date("2023-03-15"),
        age: 17,
        dominantHand: "Right",
        status: "needs focus"
      }
    ];
    
    players.forEach(player => this.createPlayer(player));
    
    // Add performance assessments for Rajiv (player 1)
    const assessments: InsertPerformanceAssessment[] = [
      {
        playerId: 1,
        weekStart: new Date("2023-07-24"),
        weekEnd: new Date("2023-07-30"),
        notes: "Great improvement this week.",
        isLatest: true
      },
      {
        playerId: 1,
        weekStart: new Date("2023-07-17"),
        weekEnd: new Date("2023-07-23"),
        notes: "Struggled with spin bowling.",
        isLatest: false
      },
      {
        playerId: 1,
        weekStart: new Date("2023-07-10"),
        weekEnd: new Date("2023-07-16"),
        notes: "Worked on footwork.",
        isLatest: false
      },
      {
        playerId: 1,
        weekStart: new Date("2023-07-03"),
        weekEnd: new Date("2023-07-09"),
        notes: "Initial assessment, needs improvement in several areas.",
        isLatest: false
      }
    ];
    
    // Create assessments and keep track of IDs
    const assessmentIds: number[] = [];
    assessments.forEach(async assessment => {
      const created = await this.createAssessment(assessment);
      assessmentIds.push(created.id);
    });
    
    // Add metrics for the first assessment (most recent)
    const metricTypes = ["reaction_time", "bat_connect", "shot_selection", "footwork", "cover_drive", "straight_drive"];
    const values = ["0.65s", "85%", "78%", "7.5/10", "70%", "85%"];
    const ratings = [90, 75, 65, 70, 55, 75]; // Corresponding to green, yellow, yellow, yellow, red, yellow
    const notes = [
      "Quick response to both fast and spin bowling this week.",
      "Middle of the bat connection has improved, but still inconsistent against spin.",
      "Good selection against pace, but needs work against spin bowling. Often chooses wrong shot for delivery type.",
      "Lateral movement is strong, but front-to-back transitions need improvement. Balance issues on off-side play.",
      "Weight transfer issues affecting shot placement. Elbow positioning improved.",
      "Improved head position. Follow-through still needs work."
    ];
    const videoUrls = [
      "/assets/Video 1.mp4",
      "/assets/Video 2.mp4",
      "/assets/Video 3.mp4",
      "/assets/Video 4.mp4",
      "/assets/Video 1.mp4",
      "/assets/Video 2.mp4"
    ];
    
    metricTypes.forEach((type, index) => {
      this.createMetric({
        assessmentId: 1, // First assessment is the most recent
        metricType: type,
        rating: ratings[index],
        value: values[index],
        notes: notes[index],
        videoUrl: videoUrls[index]
      });
    });
    
    // Add videos for assessment
    const videos: InsertVideo[] = [
      {
        playerId: 1,
        title: "Cover Drive",
        url: "/assets/Video 1.mp4",
        recordedDate: new Date("2023-07-31"),
        shotType: "Cover Drive",
        ballSpeed: "Medium",
        batConnect: "Middle"
      },
      {
        playerId: 1,
        title: "Straight Drive",
        url: "/assets/Video 2.mp4",
        recordedDate: new Date("2023-07-31"),
        shotType: "Straight Drive", 
        ballSpeed: "Fast",
        batConnect: "Edge"
      },
      {
        playerId: 1,
        title: "Pull Shot",
        url: "/assets/Video 3.mp4",
        recordedDate: new Date("2023-07-31"),
        shotType: "Pull Shot",
        ballSpeed: "Fast",
        batConnect: "Missed"
      },
      {
        playerId: 1,
        title: "Defensive Block",
        url: "/assets/Video 4.mp4",
        recordedDate: new Date("2023-07-31"),
        shotType: "Defensive Block",
        ballSpeed: "Medium",
        batConnect: "Middle"
      }
    ];
    
    videos.forEach(video => this.createVideo(video));
    
    // Add problem areas
    const problemAreaTypes = ["bat_connect", "foot_movement", "bat_swing", "weight_shifting"];
    const problemAreaRatings = [3, 2, 4, 1]; // 1-5 stars
    const problemAreaNotes = [
      "Improved middle connection, but still inconsistent with spin",
      "Needs to improve footwork for off-side shots",
      "Good bat swing path, minor adjustments needed",
      "Major issue with weight transfer during drive shots"
    ];
    
    problemAreaTypes.forEach((type, index) => {
      this.createProblemArea({
        assessmentId: 1,
        areaType: type,
        rating: problemAreaRatings[index],
        notes: problemAreaNotes[index]
      });
    });
  }
}

export const storage = new MemStorage();

# Cricket Coaching Application

A comprehensive cricket coaching and performance analysis platform that leverages advanced technologies to provide granular, shot-specific player assessment tools with an intuitive and engaging user experience.

## Features

- **Player Management**: Add and manage cricket players with detailed profiles including batting style, bowling style, specialization, and photos
- **Performance Assessment**: Track player performance with star ratings and detailed metrics
- **Video Analysis**: Upload and tag cricket training videos with technical criteria
- **Performance Charts**: Visual progression tracking with interactive charts
- **Session Recording**: Record training sessions with multiple players
- **Mobile Responsive**: Optimized for both desktop and mobile devices

## Technology Stack

- **Frontend**: React with TypeScript, Vite, TailwindCSS, Shadcn/ui components
- **Backend**: Express.js with TypeScript
- **Database**: In-memory storage (MemStorage) - can be easily switched to PostgreSQL
- **Video Handling**: Multer for file uploads, streaming video support
- **State Management**: TanStack Query for API state management
- **Routing**: Wouter for client-side routing

## Installation Instructions

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn package manager

### Setup Steps

1. **Extract the project files** to your desired directory

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Variables** (optional):
   Create a `.env` file in the root directory if you need to configure:
   ```
   NODE_ENV=development
   PORT=5000
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Access the application**:
   Open your browser and navigate to `http://localhost:5000`

### Production Deployment

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Start the production server**:
   ```bash
   npm start
   ```

### File Structure

```
cricket-coaching-app/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Application pages
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utility functions
├── server/                 # Backend Express.js application
│   ├── index.ts           # Main server file
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Data storage layer
│   └── vite.ts            # Vite integration
├── shared/                 # Shared types and schemas
│   └── schema.ts          # Database schema definitions
├── attached_assets/        # Video assets
├── uploads/               # User uploaded files
├── public/                # Static assets
└── package.json           # Dependencies and scripts
```

### Key Pages

- `/players` - Player roster with search and filtering
- `/players/:id` - Individual player profile with performance history
- `/players/:id/assessment` - Performance assessment form
- `/session-recording` - Record training sessions
- `/video-recording` - Upload and manage videos

### API Endpoints

- `GET /api/players` - Get all players
- `POST /api/players` - Create new player
- `GET /api/players/:id` - Get specific player
- `GET /api/players/:id/assessments` - Get player assessments
- `POST /api/players/:id/assessments` - Create new assessment
- `GET /api/players/:id/videos` - Get player videos
- `POST /api/players/:id/videos/upload` - Upload video

### Database Migration

To switch from in-memory storage to PostgreSQL:

1. Install PostgreSQL dependencies:
   ```bash
   npm install pg @types/pg drizzle-orm
   ```

2. Update the storage implementation in `server/storage.ts`
3. Configure database connection in environment variables
4. Run database migrations using Drizzle

### Customization

- **Styling**: Modify TailwindCSS classes in components
- **Metrics**: Add new performance metrics in `shared/schema.ts`
- **Video Formats**: Configure supported formats in `server/routes.ts`
- **Assessment Criteria**: Customize rating scales and categories

### Troubleshooting

- **Port conflicts**: Change the PORT in package.json scripts
- **Video playback issues**: Ensure proper MIME types are configured
- **Build errors**: Clear node_modules and reinstall dependencies

### Support

For technical support or feature requests, refer to the codebase documentation or contact the development team.
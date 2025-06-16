# Cricket Coaching Application

A comprehensive cricket coaching and performance analysis platform that leverages advanced technologies to provide granular, shot-specific player assessment tools with an intuitive and engaging user experience.

## Features

- **Player Management**: Add and manage cricket players with detailed profiles including batting style, bowling style, specialization, and photos
- **Performance Assessment**: Track player performance with star ratings and detailed metrics
- **Video Analysis**: Upload and tag cricket training videos with technical criteria
- **Performance Charts**: Visual progression tracking with interactive charts
- **Session Recording**: Record training sessions with multiple players
- **Cloud Storage**: Integrated with Supabase for scalable data persistence
- **Mobile Responsive**: Optimized for both desktop and mobile devices

## Technology Stack

- **Frontend**: React with TypeScript, Vite, TailwindCSS, Shadcn/ui components
- **Backend**: Express.js with TypeScript
- **Database**: Supabase (PostgreSQL) with real-time capabilities
- **Cloud Storage**: Supabase Storage for file uploads and media management
- **Video Handling**: Multer for file uploads, streaming video support
- **State Management**: TanStack Query for API state management
- **Routing**: Wouter for client-side routing

## Installation Instructions

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn package manager
- Supabase account and project setup

### Setup Steps

1. **Extract the project files** to your desired directory

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Variables**:
   Create a `.env` file in the root directory with your Supabase credentials:
   ```
   NODE_ENV=development
   PORT=5000
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_KEY=your_supabase_service_role_key
   ```

4. **Supabase Setup**:
   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Set up your database tables (schema available in `shared/schema.ts`)
   - Configure storage buckets for video uploads
   - Update your environment variables with the project credentials

5. **Start the development server**:
   ```bash
   npm run dev
   ```

6. **Access the application**:
   Open your browser and navigate to `http://localhost:5000`

### Production Deployment

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Set production environment variables**:
   Ensure all Supabase credentials are properly configured for your production environment

3. **Start the production server**:
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
│   ├── index.ts           # Main server file and application entry point
│   ├── routes.ts          # API routes and endpoint definitions
│   ├── storage.ts         # Data storage layer and database operations
│   ├── supabase.ts        # Supabase client configuration and setup
│   └── vite.ts            # Vite integration for development
├── shared/                 # Shared types and schemas
│   └── schema.ts          # Database schema definitions
├── attached_assets/        # Static video assets
├── uploads/               # Temporary user uploaded files
├── public/                # Static assets
└── package.json           # Dependencies and scripts
```

### Backend Architecture

#### Core Files

- **`server/index.ts`**: Main Express server setup, middleware configuration, and application bootstrapping
- **`server/routes.ts`**: RESTful API endpoints for players, assessments, videos, and sessions
- **`server/storage.ts`**: Database abstraction layer handling CRUD operations with Supabase
- **`server/supabase.ts`**: Supabase client initialization and configuration
- **`server/vite.ts`**: Development server integration with Vite for hot reloading

### Key Pages

- `/players` - Player roster with search and filtering
- `/players/:id` - Individual player profile with performance history
- `/players/:id/assessment` - Performance assessment form
- `/session-recording` - Record training sessions
- `/video-recording` - Upload and manage videos

### API Endpoints

- `GET /api/players` - Get all players with optional filtering
- `POST /api/players` - Create new player profile
- `GET /api/players/:id` - Get specific player details
- `PUT /api/players/:id` - Update player information
- `DELETE /api/players/:id` - Remove player from system
- `GET /api/players/:id/assessments` - Get player assessment history
- `POST /api/players/:id/assessments` - Create new performance assessment
- `GET /api/players/:id/videos` - Get player's uploaded videos
- `POST /api/players/:id/videos/upload` - Upload new video content
- `GET /api/sessions` - Get training session records
- `POST /api/sessions` - Create new training session

### Database Schema

The application uses Supabase (PostgreSQL) with the following main tables:
- **players**: Player profiles and basic information
- **assessments**: Performance assessment records
- **videos**: Video metadata and storage references
- **sessions**: Training session data

### Supabase Configuration

#### Required Tables
Set up the following tables in your Supabase dashboard:

1. **Players Table**:
   - Configure row-level security (RLS) policies
   - Set up proper indexes for search functionality

2. **Storage Buckets**:
   - Create a `videos` bucket for video file storage
   - Configure appropriate access policies

3. **Real-time Subscriptions**:
   - Enable real-time updates for collaborative features

### Development Features

- **Hot Reloading**: Full-stack development with Vite integration
- **Type Safety**: End-to-end TypeScript coverage
- **Real-time Updates**: Supabase real-time subscriptions
- **File Upload**: Seamless video upload to cloud storage
- **Error Handling**: Comprehensive error handling and logging

### Customization

- **Styling**: Modify TailwindCSS classes in components
- **Metrics**: Add new performance metrics in `shared/schema.ts`
- **Video Formats**: Configure supported formats in `server/routes.ts`
- **Assessment Criteria**: Customize rating scales and categories
- **Database Schema**: Extend tables in Supabase dashboard and update `storage.ts`

### Troubleshooting

- **Port conflicts**: Change the PORT in package.json scripts or environment variables
- **Supabase connection issues**: Verify your environment variables and project status
- **Video playback issues**: Check Supabase storage bucket policies and CORS settings
- **Build errors**: Clear node_modules and reinstall dependencies
- **Database errors**: Verify table schemas match the application expectations

### Environment Setup Checklist

- [ ] Node.js 18+ installed
- [ ] Supabase project created
- [ ] Environment variables configured
- [ ] Database tables created
- [ ] Storage buckets configured
- [ ] Dependencies installed
- [ ] Development server running

### Support

For technical support or feature requests, refer to the codebase documentation or contact the development team. For Supabase-specific issues, consult the [Supabase documentation](https://supabase.com/docs).

### Migration Notes

If migrating from the previous in-memory storage version:
1. Export existing data from the old system
2. Set up Supabase project and tables
3. Import data using the provided migration scripts
4. Update environment variables
5. Test all functionality thoroughly

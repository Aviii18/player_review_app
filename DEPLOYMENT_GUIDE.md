# Cricket Coaching App - Deployment Guide

## Essential Files to Copy

Copy these files and directories to your new server:

### Root Files
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `vite.config.ts` - Vite build configuration
- `tailwind.config.ts` - TailwindCSS configuration
- `postcss.config.js` - PostCSS configuration
- `components.json` - Shadcn UI configuration
- `drizzle.config.ts` - Database configuration
- `README.md` - Project documentation

### Source Code Directories
- `client/` - Frontend React application
- `server/` - Backend Express.js application
- `shared/` - Shared TypeScript types
- `public/` - Static assets
- `attached_assets/` - Video files (optional demo videos)

### Installation Commands

1. **Create project directory:**
   ```bash
   mkdir cricket-coaching-app
   cd cricket-coaching-app
   ```

2. **Copy all files to this directory**

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Create required directories:**
   ```bash
   mkdir -p uploads
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

6. **For production deployment:**
   ```bash
   npm run build
   npm start
   ```

## Server Requirements

- Node.js 18+
- npm or yarn
- 2GB RAM minimum
- 10GB disk space
- Port 5000 access (or configure different port)

## Environment Configuration

Create `.env` file with:
```
NODE_ENV=production
PORT=5000
```

## File Structure After Setup

```
cricket-coaching-app/
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── lib/
│   └── index.html
├── server/
│   ├── index.ts
│   ├── routes.ts
│   ├── storage.ts
│   └── vite.ts
├── shared/
│   └── schema.ts
├── attached_assets/
├── uploads/
├── public/
├── package.json
├── README.md
└── other config files
```

## Database Setup (Optional)

Currently uses in-memory storage. To use PostgreSQL:

1. Install PostgreSQL
2. Update connection in `server/storage.ts`
3. Run migrations with Drizzle

## Production Considerations

- Use process manager (PM2)
- Set up reverse proxy (Nginx)
- Configure SSL certificates
- Set up database backups
- Monitor logs and performance
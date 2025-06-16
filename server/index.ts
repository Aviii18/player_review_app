// server/index.ts - REPLACE your existing server/index.ts with this
import express from 'express';
import cors from 'cors';
import path from 'path';
import routes from './routes';

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API routes
app.use('/api', routes);

// Serve static files
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('dist'));
  
  // Handle client-side routing
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
} else {
  // Development mode - serve from public folder or let Vite handle it
  app.use(express.static('public'));
  
  // Fallback for development
  app.get('*', (req, res) => {
    res.send(`
      <html>
        <body>
          <h1>🏏 Cricket Coaching API Server</h1>
          <p>API is running on port ${port}</p>
          <p>Frontend should be served by Vite on a different port</p>
          <p>API endpoints available at:</p>
          <ul>
            <li>GET /api/players</li>
            <li>POST /api/players</li>
            <li>GET /api/sessions</li>
          </ul>
        </body>
      </html>
    `);
  });
}

app.listen(port, () => {
  console.log(`🏏 Cricket Coaching App running on port ${port}`);
  console.log(`📊 API available at http://localhost:${port}/api`);
  console.log(`🎯 Backend server ready!`);
  
  if (process.env.NODE_ENV !== 'production') {
    console.log('🔧 Development mode - API server only');
    console.log('💡 Run your frontend separately with Vite');
  }
});
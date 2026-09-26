import express from 'express';
import cors from 'cors';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimiter';
import path from 'path';
import { serverConfig } from './config';

const app = express();

if (serverConfig.NODE_ENV === 'production') app.set('trust proxy', 1);

// Middleware
app.use(cors({
    origin: serverConfig.NODE_ENV === 'production'
        ? serverConfig.CLIENT_URL.split(',').map((origin) => origin.trim())
        : true
}));
app.use(express.json({ limit: '1mb' }));
app.use(generalLimiter);

// API Routes
app.use('/api', routes);

app.get('/api/config', (_req, res) => {
    res.json({ gameUrl: serverConfig.PUBLIC_GAME_URL });
});

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// 404 for unmatched API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'Not Found' });
});

// Serve static client files in production
if (serverConfig.NODE_ENV === 'production') {
    const clientPath = path.join(__dirname, '../../client/dist');
    app.use(express.static(clientPath));
    app.get('*', (req, res) => {
        res.sendFile(path.join(clientPath, 'index.html'));
    });
}

// Error handling (must be last)
app.use(errorHandler);

export default app;

import { createServer } from 'http';
import app from './app';
import { serverConfig } from './config';
import { migrate } from './database/migrate';
import { setupSocket } from './websocket';
import { GameService } from './services/game.service';
import { logger } from './utils/logger';

async function startServer() {
    try {
        logger.info('Starting Cybotics Tap server...');
        
        // 1. Run migrations
        await migrate();
        
        // 2. Setup HTTP and Socket.IO
        const httpServer = createServer(app);
        setupSocket(httpServer);
        
        // 3. Start listening
        httpServer.listen(serverConfig.PORT, () => {
            logger.info(`Server running on port ${serverConfig.PORT}`);
            logger.info(`Environment: ${serverConfig.NODE_ENV}`);
        });

        // 4. Background tasks
        setInterval(async () => {
            try {
                await GameService.expireStaleGames();
            } catch (e) {
                logger.error('Failed to expire stale games', e);
            }
        }, 5 * 60 * 1000); // Every 5 minutes

        // 5. Graceful shutdown
        const shutdown = () => {
            logger.info('Shutting down server...');
            httpServer.close(() => {
                logger.info('Server closed');
                process.exit(0);
            });
        };
        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);

    } catch (err) {
        logger.error('Failed to start server:', err);
        process.exit(1);
    }
}

startServer();

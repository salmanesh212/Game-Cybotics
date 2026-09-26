import { Router } from 'express';
import gameRoutes from './game.routes';
import adminRoutes from './admin.routes';
import leaderboardRoutes from './leaderboard.routes';
import playerRoutes from './player.routes';
import statsRoutes from './stats.routes';

const router = Router();

router.use('/games', gameRoutes);
router.use('/admin', adminRoutes);
router.use('/leaderboard', leaderboardRoutes);
router.use('/players', playerRoutes);
router.use('/stats', statsRoutes);

export default router;

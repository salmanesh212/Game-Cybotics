import { Router } from 'express';
import { getLeaderboard, getPlayerLeaderboard } from '../controllers/leaderboard.controller';
import { generalLimiter } from '../middleware/rateLimiter';

const router = Router();

router.get('/', generalLimiter, getLeaderboard);
router.get('/player/:playerId', generalLimiter, getPlayerLeaderboard);

export default router;

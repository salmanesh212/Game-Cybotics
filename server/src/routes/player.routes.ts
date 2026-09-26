import { Router } from 'express';
import { registerPlayer } from '../controllers/game.controller';
import { generalLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/', generalLimiter, registerPlayer);

export default router;

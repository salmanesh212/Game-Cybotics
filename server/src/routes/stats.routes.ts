import { Router } from 'express';
import { getStats } from '../controllers/stats.controller';
import { generalLimiter } from '../middleware/rateLimiter';

const router = Router();

router.get('/', generalLimiter, getStats);

export default router;

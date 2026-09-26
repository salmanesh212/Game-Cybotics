import { Router } from 'express';
import { startGame, submitRound, finishGame } from '../controllers/game.controller';
import { gameLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/start', gameLimiter, startGame);
router.post('/:id/round', gameLimiter, submitRound);
router.post('/:id/finish', gameLimiter, finishGame);

export default router;

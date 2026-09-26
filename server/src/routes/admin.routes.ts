import { Router } from 'express';
import * as AdminController from '../controllers/admin.controller';
import { verifyAdmin } from '../middleware/adminAuth';
import { authLimiter, generalLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/login', authLimiter, AdminController.login);
router.get('/players', verifyAdmin, generalLimiter, AdminController.getPlayers);
router.get('/games', verifyAdmin, generalLimiter, AdminController.getGames);
router.delete('/games/:id', verifyAdmin, generalLimiter, AdminController.deleteGame);
router.get('/events', verifyAdmin, generalLimiter, AdminController.getEvents);
router.post('/events', verifyAdmin, generalLimiter, AdminController.createEvent);
router.post('/events/:id/reset', verifyAdmin, generalLimiter, AdminController.resetEvent);
router.get('/export', verifyAdmin, generalLimiter, AdminController.exportCsv);
router.get('/config', verifyAdmin, generalLimiter, AdminController.getConfig);
router.put('/config', verifyAdmin, generalLimiter, AdminController.updateConfig);
router.get('/stats', verifyAdmin, generalLimiter, AdminController.getDetailedStats);

export default router;

import { Router } from 'express';
import { StatsController } from '../controllers/stats.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/daily', StatsController.getDaily);
router.get('/weekly', StatsController.getWeekly);
router.get('/monthly', StatsController.getMonthly);

export default router;


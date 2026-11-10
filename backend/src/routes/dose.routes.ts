import { Router } from 'express';
import { DoseController } from '../controllers/dose.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', DoseController.getDoses);
router.get('/upcoming', DoseController.getUpcoming);
router.post('/:id/confirm', DoseController.confirm);
router.post('/:id/snooze', DoseController.snooze);
router.post('/:id/skip', DoseController.skip);

export default router;


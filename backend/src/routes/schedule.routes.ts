import { Router } from 'express';
import { ScheduleController } from '../controllers/schedule.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', ScheduleController.getByMedication);
router.post('/', ScheduleController.create);
router.put('/:id', ScheduleController.update);
router.delete('/:id', ScheduleController.delete);

export default router;


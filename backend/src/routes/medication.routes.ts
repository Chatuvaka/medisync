import { Router } from 'express';
import { MedicationController } from '../controllers/medication.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', MedicationController.getAll);
router.post('/', MedicationController.create);
router.get('/:id', MedicationController.getById);
router.put('/:id', MedicationController.update);
router.delete('/:id', MedicationController.delete);

export default router;


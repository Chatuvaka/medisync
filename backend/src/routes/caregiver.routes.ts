import { Router } from 'express';
import { CaregiverController } from '../controllers/caregiver.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/invite', CaregiverController.invite);
router.post('/accept', CaregiverController.accept);
router.get('/', CaregiverController.getCaregivers);
router.get('/patients', CaregiverController.getPatients);
router.get('/patient/:patientId/dashboard', CaregiverController.getPatientDashboard);
router.delete('/:id', CaregiverController.removeCaregiver);

export default router;


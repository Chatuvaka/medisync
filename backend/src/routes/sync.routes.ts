import { Router } from 'express';
import { SyncController } from '../controllers/sync.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/events', SyncController.syncEvents);
router.get('/pending', SyncController.getPending);
router.post('/devices', SyncController.registerOrUpdateDevice);
router.get('/devices', SyncController.getDevices);

export default router;


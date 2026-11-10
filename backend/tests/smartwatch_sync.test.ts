import request from 'supertest';
import app from '../src/app';

describe('Smartwatch Synchronization & Idempotency Endpoints', () => {
  let token = '';
  let targetDoseId = '';

  beforeAll(async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'demo@medisync.com', password: 'password123' });
    token = loginRes.body.data.token;

    // Obtener una toma pendiente
    const dosesRes = await request(app)
      .get('/api/doses')
      .set('Authorization', `Bearer ${token}`);
    const found = dosesRes.body.data.find((d: any) => d.status === 'PENDING' || d.status === 'LATE');
    if (found) {
      targetDoseId = found.id;
    }
  });

  it('GET /api/sync/pending debe entregar tomas pendientes para el Smartwatch', async () => {
    const res = await request(app)
      .get('/api/sync/pending')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('POST /api/sync/devices debe registrar o actualizar un reloj o simulador', async () => {
    const res = await request(app)
      .post('/api/sync/devices')
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceType: 'SMARTWATCH_WEAROS',
        deviceName: 'Pixel Watch 2',
        deviceIdentifier: 'wearos_test_uuid_99',
        batteryLevel: 95,
        isConnected: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.deviceIdentifier).toBe('wearos_test_uuid_99');
  });

  it('POST /api/sync/events debe procesar eventos del smartwatch con idempotencia', async () => {
    if (!targetDoseId) return;

    const testEventId = `evt_${Date.now()}_test`;

    // Primer envío del evento
    const res1 = await request(app)
      .post('/api/sync/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        events: [
          {
            eventId: testEventId,
            scheduledDoseId: targetDoseId,
            action: 'CONFIRM',
            deviceSource: 'SMARTWATCH_WEAROS',
            timestamp: new Date().toISOString(),
          },
        ],
        deviceIdentifier: 'wearos_test_uuid_99',
      });

    expect(res1.status).toBe(200);
    expect(res1.body.success).toBe(true);
    expect(res1.body.results[0].status).toBe('PROCESSED');

    // Segundo envío idéntico (simulando reintento por pérdida de red)
    const res2 = await request(app)
      .post('/api/sync/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        events: [
          {
            eventId: testEventId,
            scheduledDoseId: targetDoseId,
            action: 'CONFIRM',
            deviceSource: 'SMARTWATCH_WEAROS',
            timestamp: new Date().toISOString(),
          },
        ],
      });

    expect(res2.status).toBe(200);
    expect(res2.body.results[0].status).toBe('DUPLICATE_IGNORED');
  });
});


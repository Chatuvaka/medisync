import request from 'supertest';
import app from '../src/app';

describe('Doses & History Tracking Endpoints', () => {
  let token = '';
  let pendingDoseId = '';

  beforeAll(async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'demo@medisync.com', password: 'password123' });
    token = loginRes.body.data.token;
  });

  it('GET /api/doses debe listar las tomas del día', async () => {
    const res = await request(app)
      .get('/api/doses')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);

    const pending = res.body.data.find((d: any) => d.status === 'PENDING');
    if (pending) {
      pendingDoseId = pending.id;
    }
  });

  it('GET /api/doses/upcoming debe devolver la próxima toma pendiente', async () => {
    const res = await request(app)
      .get('/api/doses/upcoming')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    if (res.body.data) {
      expect(res.body.data.medication).toBeDefined();
    }
  });

  it('POST /api/doses/:id/confirm debe confirmar una toma y registrar el dispositivo', async () => {
    if (!pendingDoseId) return;

    const res = await request(app)
      .post(`/api/doses/${pendingDoseId}/confirm`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceSource: 'PHONE',
        notes: 'Confirmación de prueba',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.dose.status).toBe('CONFIRMED');
    expect(res.body.data.event.deviceSource).toBe('PHONE');
  });

  it('POST /api/doses/:id/confirm debe ser idempotente si ya fue confirmada', async () => {
    if (!pendingDoseId) return;

    const res = await request(app)
      .post(`/api/doses/${pendingDoseId}/confirm`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        deviceSource: 'PHONE',
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('previamente');
  });
});


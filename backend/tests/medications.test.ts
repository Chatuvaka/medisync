import request from 'supertest';
import app from '../src/app';

describe('Medications & Schedules Endpoints', () => {
  let token = '';
  let medicationId = '';

  beforeAll(async () => {
    // Login con usuario demo
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'demo@medisync.com', password: 'password123' });
    token = loginRes.body.data.token;
  });

  it('GET /api/medications debe listar los medicamentos del usuario', async () => {
    const res = await request(app)
      .get('/api/medications')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('POST /api/medications debe crear un nuevo medicamento con horarios', async () => {
    const res = await request(app)
      .post('/api/medications')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Amoxicilina',
        description: 'Antibiótico betalactámico',
        dosage: '500',
        unit: 'mg',
        frequency: 'CADA_8_HORAS',
        instructions: 'Tomar cada 8 horas completando 7 días.',
        schedules: ['07:00', '15:00', '23:00'],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Amoxicilina');
    expect(res.body.data.schedules.length).toBe(3);
    medicationId = res.body.data.id;
  });

  it('GET /api/medications/:id debe devolver el medicamento por su ID', async () => {
    const res = await request(app)
      .get(`/api/medications/${medicationId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(medicationId);
  });

  it('PUT /api/medications/:id debe actualizar campos del medicamento', async () => {
    const res = await request(app)
      .put(`/api/medications/${medicationId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        description: 'Antibiótico con prescripción médica',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.description).toBe('Antibiótico con prescripción médica');
  });

  it('POST /api/schedules debe advertir si un horario se superpone', async () => {
    // Paracetamol ya tiene 08:00
    const res = await request(app)
      .post('/api/schedules')
      .set('Authorization', `Bearer ${token}`)
      .send({
        medicationId,
        timeOfDay: '08:00',
      });

    expect(res.status).toBe(201);
    expect(res.body.warning).toBeDefined();
    expect(res.body.warning).toContain('Atención');
  });

  it('DELETE /api/medications/:id debe eliminar el medicamento y sus horarios', async () => {
    const res = await request(app)
      .delete(`/api/medications/${medicationId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});


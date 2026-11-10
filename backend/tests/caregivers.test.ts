import request from 'supertest';
import app from '../src/app';

describe('Caregiver Supervision & Alerts Endpoints', () => {
  let patientToken = '';
  let caregiverToken = '';
  let patientId = '';
  let inviteCode = '';

  beforeAll(async () => {
    // Login paciente
    const pRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'demo@medisync.com', password: 'password123' });
    patientToken = pRes.body.data.token;
    patientId = pRes.body.data.user.id;

    // Login cuidador
    const cRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'cuidador@medisync.com', password: 'password123' });
    caregiverToken = cRes.body.data.token;
  });

  it('POST /api/caregivers/invite debe generar un código de 6 caracteres', async () => {
    const res = await request(app)
      .post('/api/caregivers/invite')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ inviteeEmail: 'familiar@example.com' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.inviteCode).toBeDefined();
    expect(res.body.data.inviteCode.length).toBe(6);
    inviteCode = res.body.data.inviteCode;
  });

  it('GET /api/caregivers/patient/:patientId/dashboard debe permitir al cuidador ver el panel', async () => {
    const res = await request(app)
      .get(`/api/caregivers/patient/${patientId}/dashboard`)
      .set('Authorization', `Bearer ${caregiverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.patient.id).toBe(patientId);
    expect(res.body.data.adherenceRate).toBeDefined();
    expect(Array.isArray(res.body.data.alerts)).toBe(true);
  });

  it('GET /api/caregivers/patient/:patientId/dashboard debe denegar acceso a cuidadores no vinculados', async () => {
    // Registrar otro usuario
    const newUser = await request(app)
      .post('/api/auth/register')
      .send({
        email: `unauthorized_${Date.now()}@example.com`,
        password: 'password123',
        fullName: 'Intruso',
      });
    const fakeToken = newUser.body.data.token;

    const res = await request(app)
      .get(`/api/caregivers/patient/${patientId}/dashboard`)
      .set('Authorization', `Bearer ${fakeToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});


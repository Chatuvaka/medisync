import request from 'supertest';
import app from '../src/app';

describe('Auth & User Endpoints', () => {
  const testUser = {
    email: `test_${Date.now()}@example.com`,
    password: 'securePassword123',
    fullName: 'Juan Pérez',
    phone: '+52 55 1111 2222',
  };

  let token = '';

  it('POST /api/auth/register debe registrar un nuevo usuario con éxito', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email);
    expect(res.body.data.token).toBeDefined();
  });

  it('POST /api/auth/register no debe permitir emails duplicados', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/auth/login debe autenticar credenciales válidas y devolver JWT', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    token = res.body.data.token;
  });

  it('POST /api/auth/login debe rechazar contraseña incorrecta', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'wrong_password',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/auth/me debe retornar el perfil del usuario autenticado', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(testUser.email);
  });
});


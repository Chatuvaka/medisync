import dotenv from 'dotenv';
dotenv.config();

import app from './app';

const PORT = Number(process.env.PORT) || 4000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`===============================================`);
  console.log(` MediSync Backend Server activo en http://${HOST}:${PORT}`);
  console.log(` Healthcheck: http://localhost:${PORT}/health`);
  console.log(` API Docs:    http://localhost:${PORT}/api`);
  console.log(`===============================================`);
});


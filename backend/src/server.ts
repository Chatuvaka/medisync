import dotenv from 'dotenv';
dotenv.config();

import app from './app';

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(` MediSync Backend Server activo en el puerto ${PORT}`);
  console.log(` Healthcheck: http://localhost:${PORT}/health`);
  console.log(` API Docs:    http://localhost:${PORT}/api`);
  console.log(`===============================================`);
});


import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'medisync_super_secret_jwt_key_2026_health_secure';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export const signToken = (payload: JwtPayload): string => {
  return jwt.sign(payload as object, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
};

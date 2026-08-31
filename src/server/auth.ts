import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from './db.js';
import { User } from '../types.js';

const JWT_SECRET = process.env.JWT_SECRET || 'nexa_super_secure_jwt_secret_token_2026';

export interface AuthRequest extends Request {
  user?: User;
}

export function generateToken(user: User): string {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username, 
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

export function hashPassword(password: string): string {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Akses ditolak: Token autentikasi diperlukan.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; username: string; role: string };
    const user = db.findUserById(decoded.id);
    if (!user) {
      res.status(401).json({ error: 'Sesi kedaluwarsa atau pengguna tidak ditemukan.' });
      return;
    }
    const { password_hash, ...safeUser } = user;
    req.user = safeUser as User;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token tidak valid atau telah kedaluwarsa.' });
  }
}

export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; username: string };
      const user = db.findUserById(decoded.id);
      if (user) {
        const { password_hash, ...safeUser } = user;
        req.user = safeUser as User;
      }
    } catch {
      // ignore invalid optional token
    }
  }
  next();
}

export function requireRole(allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Akses ditolak: Anda tidak memiliki izin untuk fitur ini.' });
      return;
    }
    next();
  };
}

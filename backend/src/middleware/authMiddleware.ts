import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/authService';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = verifyToken(token);
    req.user = { id: decoded.id };
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { serverConfig } from '../config';

export function verifyAdmin(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const token = authHeader.split(' ')[1];
    try {
        const payload = jwt.verify(token, serverConfig.JWT_SECRET);
        (req as any).admin = payload;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}

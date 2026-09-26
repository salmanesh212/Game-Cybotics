import rateLimit from 'express-rate-limit';

export const generalLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 3000, // Players at a venue often share one public IP.
    message: { error: 'Too many requests, please try again later.' }
});

export const gameLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 2400, // Up to 50 simultaneous 20-round games behind one venue NAT.
    message: { error: 'Too many game actions, please try again later.' }
});

export const authLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20, // 20 admin logins per minute
    message: { error: 'Too many auth attempts, please try again later.' }
});

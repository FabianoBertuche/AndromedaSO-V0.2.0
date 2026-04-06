import rateLimit from "express-rate-limit";

const defaultGlobalMax = process.env.NODE_ENV === "development" ? 100 : 10;
const globalWindowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 1000);
const globalMax = Number(process.env.RATE_LIMIT_MAX || defaultGlobalMax);
const authMax = Number(process.env.RATE_LIMIT_AUTH_MAX || 5);

// Limite global para a maioria das rotas v1
export const globalRateLimiter = rateLimit({
    windowMs: globalWindowMs,
    max: globalMax,
    message: { error: "Too many requests, please slow down." },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Limite restrito para rotas de autenticação
export const authRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: authMax,
    message: { error: "Too many login attempts, please try again after a minute" },
    standardHeaders: true,
    legacyHeaders: false,
});

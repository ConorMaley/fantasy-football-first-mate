import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";

import { authRouter } from "./routes/auth.js";
import { healthRouter } from "./routes/health.js";

export const app = express();

app.use(cors({ credentials: true, origin: process.env.CLIENT_APP_URL ?? true }));
app.use(express.json());
app.use(cookieParser());

const authRateLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 60 });

app.use("/api", healthRouter);
app.use("/api/auth", authRateLimit, authRouter);

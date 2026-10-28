import type { Request, Response, NextFunction } from "express";

import mongoose from "mongoose";

import { isRedisHealthy } from "../../config/redis";

const startedAt = Date.now();

type DependencyStatus = "healthy" | "unhealthy" | "unknown";

interface HealthCheck {
  status: DependencyStatus;
  latencyMs?: number;
}

async function checkMongoDB(): Promise<HealthCheck> {
  const started = Date.now();

  try {
    if (mongoose.connection.readyState !== 1) {
      return {
        status: "unhealthy",
        latencyMs: Date.now() - started,
      };
    }

    await mongoose.connection.db?.admin().ping();

    return {
      status: "healthy",
      latencyMs: Date.now() - started,
    };
  } catch {
    return {
      status: "unhealthy",
      latencyMs: Date.now() - started,
    };
  }
}

async function checkRedis(): Promise<HealthCheck> {
  const started = Date.now();

  try {
    const healthy = await isRedisHealthy();

    return {
      status: healthy ? "healthy" : "unhealthy",
      latencyMs: Date.now() - started,
    };
  } catch {
    return {
      status: "unhealthy",
      latencyMs: Date.now() - started,
    };
  }
}

export async function livenessController(
  _req: Request,
  res: Response,
): Promise<void> {
  res.status(200).json({
    success: true,
    status: "alive",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  });
}

export async function readinessController(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const [database, redis] = await Promise.all([checkMongoDB(), checkRedis()]);

    const dependencies = {
      database,
      redis,
    };

    const ready = Object.values(dependencies).every(
      (dependency) => dependency.status === "healthy",
    );

    res.status(ready ? 200 : 503).json({
      success: ready,
      status: ready ? "ready" : "not_ready",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      dependencies,
    });
  } catch (error) {
    next(error);
  }
}

export async function detailedHealthController(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const [database, redis] = await Promise.all([checkMongoDB(), checkRedis()]);

    const ready = database.status === "healthy" && redis.status === "healthy";

    res.status(ready ? 200 : 503).json({
      success: ready,
      service: "NOPTRIX API",
      status: ready ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      startedAt: new Date(Date.now() - (Date.now() - startedAt)).toISOString(),
      dependencies: {
        database,
        redis,
      },
    });
  } catch (error) {
    next(error);
  }
}

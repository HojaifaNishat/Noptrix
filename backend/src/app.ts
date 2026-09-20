import express from "express";
import cors from "cors";
import apiRoutes from "./routes";
const app = express();

/*
|--------------------------------------------------------------------------
| Global Middleware
|--------------------------------------------------------------------------
*/

app.use(
    cors({
        origin: true,
        credentials: true,
    })
);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

/*
|--------------------------------------------------------------------------
| Health / Root
|--------------------------------------------------------------------------
*/

app.get("/", (_req, res) => {
    res.status(200).json({
        success: true,
        message: "NOPTRIX API is Running",
        service: "backend",
        environment: process.env.NODE_ENV ?? "development",
    });
});

app.get("/health", (_req, res) => {
    res.status(200).json({
        success: true,
        message: "NOPTRIX API is Healthy",
        timestamp: new Date().toISOString(),
    });
});

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Routes will be connected here later.
|
*/

app.use("/api", apiRoutes);

export default app;
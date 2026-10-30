import { Router } from "express";

import messageRoutes from "./messages/message.routes";
import announcementRoutes from "./announcements/announcement.routes";
import broadcastRoutes from "./broadcast.routes";

const router = Router();

/*
|--------------------------------------------------------------------------
| Communication Routes
|--------------------------------------------------------------------------
|
| Internal administrative communication:
|
| - Messages
| - Announcements
|
|--------------------------------------------------------------------------
*/

router.use("/messages", messageRoutes);

router.use("/announcements", announcementRoutes);

router.use("/broadcast", broadcastRoutes);

export default router;

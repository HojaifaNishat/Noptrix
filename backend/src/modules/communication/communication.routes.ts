import {
    Router,
} from "express";

import messageRoutes from "./messages/message.routes";
import announcementRoutes from "./announcements/announcement.routes";

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

router.use(
    "/messages",
    messageRoutes,
);

router.use(
    "/announcements",
    announcementRoutes,
);

export default router;

import { Router } from "express";
import { userAuth, requireUser } from "../../middlewares/userAuth.middleware";
import { getMyTransactions } from "./transaction.controller";

const router = Router();

router.use(userAuth, requireUser);
router.get("/my", getMyTransactions);

export default router;

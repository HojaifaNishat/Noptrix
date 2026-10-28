import { Router } from "express";
import {
  ownerAuth,
  ownerSecretVerified,
} from "../../middlewares/ownerAuth.middleware";
import accountsRoutes from "./accounts/accounts.routes";
import assetsRoutes from "./assets/assets.routes";
import balanceSheetRoutes from "./balance-sheet/balance-sheet.routes";
import cashFlowRoutes from "./cash-flow/cash-flow.routes";
import chartOfAccountsRoutes from "./chart-of-accounts/chart-of-accounts.routes";
import expensesRoutes from "./expenses/expenses.routes";
import incomeRoutes from "./income/income.routes";
import journalRoutes from "./journal/journal.routes";
import ledgerRoutes from "./ledger/ledger.routes";
import liabilitiesRoutes from "./liabilities/liabilities.routes";
import profitLossRoutes from "./profit-loss/profit-loss.routes";
import { accountingRecordsRoutes } from "./core/accounting-records.routes";

const router = Router();

router.use(ownerAuth, ownerSecretVerified);
router.use("/accounts", accountsRoutes);
router.use("/chart-of-accounts", chartOfAccountsRoutes);
router.use("/journal", journalRoutes);
router.use("/ledger", ledgerRoutes);
router.use("/expenses", expensesRoutes);
router.use("/income", incomeRoutes);
router.use("/assets", assetsRoutes);
router.use("/liabilities", liabilitiesRoutes);
router.use("/reports/profit-loss", profitLossRoutes);
router.use("/reports/balance-sheet", balanceSheetRoutes);
router.use("/reports/cash-flow", cashFlowRoutes);
router.use("/records", accountingRecordsRoutes);

export default router;

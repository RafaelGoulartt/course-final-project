import { Router } from "express";
import {
  atualizarFilho,
  gerarToken,
  getDashboard,
  salvarTempoUso,
} from "../controllers/dashboardController.js";

const router = Router();

router.post("/gerar-token", gerarToken);
router.get("/", getDashboard);
router.put("/filhos/:filhoId", atualizarFilho);
router.post("/tempo-uso", salvarTempoUso);

export default router;

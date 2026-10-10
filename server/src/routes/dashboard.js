import { Router } from "express";
import {
  atualizarFilho,
  enviarMensagem,
  gerarToken,
  getControle,
  getDashboard,
  getEstadoDispositivo,
  getResumoDispositivo,
  liberarApp,
  marcarMensagemLida,
  salvarTempoUso,
  suspenderApp,
} from "../controllers/dashboardController.js";

const router = Router();

router.post("/gerar-token", gerarToken);
router.get("/", getDashboard);
router.put("/filhos/:filhoId", atualizarFilho);
router.post("/tempo-uso", salvarTempoUso);

// Painel dos pais
router.get("/filhos/:filhoId/controle", getControle);
router.post("/filhos/:filhoId/mensagens", enviarMensagem);
router.post("/filhos/:filhoId/suspensoes", suspenderApp);
router.delete("/filhos/:filhoId/suspensoes/:suspensaoId", liberarApp);

// Celular do filho (autenticado pelo token de conexao)
router.get("/dispositivo/estado", getEstadoDispositivo);
router.get("/dispositivo/resumo", getResumoDispositivo);
router.post("/dispositivo/mensagens/:mensagemId/lida", marcarMensagemLida);

export default router;

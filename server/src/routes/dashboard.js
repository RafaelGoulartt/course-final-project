import { Router } from "express";
import {
  atualizarFilho,
  bloquearApp,
  confirmarNotificacao,
  enviarNotificacao,
  gerarToken,
  getDashboard,
  listarNotificacoesPendentes,
  listarAppsRegistrados,
  listarBloqueiosAtivos,
  registrarDispositivoPush,
  salvarTempoUso,
} from "../controllers/dashboardController.js";

const router = Router();

router.post("/gerar-token", gerarToken);
router.get("/apps-registrados", listarAppsRegistrados);
router.post("/bloqueios", bloquearApp);
router.get("/bloqueios/ativos", listarBloqueiosAtivos);
router.post("/notificacoes", enviarNotificacao);
router.post("/notificacoes/registrar-dispositivo", registrarDispositivoPush);
router.get("/notificacoes/pendentes", listarNotificacoesPendentes);
router.post("/notificacoes/:notificacaoId/confirmar", confirmarNotificacao);
router.get("/", getDashboard);
router.put("/filhos/:filhoId", atualizarFilho);
router.post("/tempo-uso", salvarTempoUso);

export default router;

import crypto from "node:crypto";
import { getPool } from "../db.js";

function parseUserId(req) {
  const raw = req.body?.user_id ?? req.query?.user_id ?? req.headers["x-user-id"];
  const userId = Number(raw);
  return Number.isInteger(userId) && userId > 0 ? userId : null;
}

function parseFilhoId(req) {
  const raw = req.body?.filho_id ?? req.query?.filho_id;
  if (raw === undefined || raw === null || raw === "") {
    return null;
  }
  const filhoId = Number(raw);
  return Number.isInteger(filhoId) && filhoId > 0 ? filhoId : null;
}

function buildNoDataResponse(token = null, filhos = [], filhoSelecionadoId = null) {
  return {
    ok: true,
    message: "Nenhum dado disponivel",
    hasData: false,
    token,
    filhos,
    filhoSelecionadoId,
    tempoPorApp: [],
    tempoPorDia: [],
  };
}

async function findLatestUserToken(pool, userId) {
  const result = await pool.query(
    "SELECT token, data_expiracao FROM tokens WHERE user_id = $1 ORDER BY id DESC LIMIT 1",
    [userId],
  );
  return result.rows[0] || null;
}

export async function gerarToken(req, res) {
  const userId = parseUserId(req);

  if (!userId) {
    return res.status(400).json({ message: "user_id invalido." });
  }

  try {
    const pool = await getPool();
    const userResult = await pool.query("SELECT id FROM usuarios WHERE id = $1 LIMIT 1", [userId]);

    if (userResult.rowCount === 0) {
      return res.status(404).json({ message: "Usuario nao encontrado." });
    }

    const token = crypto.randomUUID();
    const expirationResult = await pool.query("SELECT NOW() + INTERVAL '7 days' AS data_expiracao");
    const dataExpiracao = expirationResult.rows[0].data_expiracao;

    await pool.query("INSERT INTO tokens (user_id, token, data_expiracao) VALUES ($1, $2, $3)", [
      userId,
      token,
      dataExpiracao,
    ]);

    return res.status(201).json({
      ok: true,
      token,
      data_expiracao: dataExpiracao,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Erro ao gerar token.",
      detail: error.message,
    });
  }
}

export async function getDashboard(req, res) {
  const userId = parseUserId(req);
  const requestedFilhoId = parseFilhoId(req);

  if (!userId) {
    return res.status(400).json({ message: "user_id invalido." });
  }

  try {
    const pool = await getPool();
    const latestToken = await findLatestUserToken(pool, userId);

    const filhosResult = await pool.query("SELECT id, nome FROM filhos WHERE user_id = $1 ORDER BY id ASC", [userId]);
    const filhos = filhosResult.rows;

    if (filhos.length === 0) {
      return res.status(200).json(buildNoDataResponse(latestToken?.token || null, [], null));
    }

    const filhoSelecionadoId = requestedFilhoId || filhos[0].id;
    const filhoExiste = filhos.some((filho) => filho.id === filhoSelecionadoId);

    if (!filhoExiste) {
      return res.status(400).json({ message: "filho_id invalido para este usuario." });
    }

    if (!latestToken) {
      return res.status(200).json(buildNoDataResponse(null, filhos, filhoSelecionadoId));
    }

    const tempoPorAppResult = await pool.query(
      `SELECT a.nome, SUM(t.tempo_minutos)::int AS total
       FROM tempo_uso t
       JOIN apps a ON a.id = t.app_id
       WHERE t.filho_id = $1
         AND t.data_uso >= date_trunc('week', CURRENT_DATE)
         AND t.data_uso < date_trunc('week', CURRENT_DATE) + INTERVAL '7 days'
       GROUP BY a.nome
       ORDER BY total DESC`,
      [filhoSelecionadoId],
    );

    const tempoPorDiaResult = await pool.query(
      `SELECT t.data_uso, SUM(t.tempo_minutos)::int AS total
       FROM tempo_uso t
       WHERE t.filho_id = $1
       GROUP BY t.data_uso
       ORDER BY t.data_uso`,
      [filhoSelecionadoId],
    );

    if (tempoPorAppResult.rowCount === 0 || tempoPorDiaResult.rowCount === 0) {
      return res.status(200).json(buildNoDataResponse(latestToken.token, filhos, filhoSelecionadoId));
    }

    return res.status(200).json({
      ok: true,
      hasData: true,
      token: latestToken.token,
      tokenExpiraEm: latestToken.data_expiracao,
      filhos,
      filhoSelecionadoId,
      tempoPorApp: tempoPorAppResult.rows,
      tempoPorDia: tempoPorDiaResult.rows,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Erro ao carregar dashboard.",
      detail: error.message,
    });
  }
}

export async function atualizarFilho(req, res) {
  const userId = parseUserId(req);
  const filhoId = Number(req.params?.filhoId);
  const { nome } = req.body || {};

  if (!userId) {
    return res.status(400).json({ message: "user_id invalido." });
  }

  if (!Number.isInteger(filhoId) || filhoId <= 0) {
    return res.status(400).json({ message: "filhoId invalido." });
  }

  if (!nome || !String(nome).trim()) {
    return res.status(400).json({ message: "Nome do filho e obrigatorio." });
  }

  try {
    const pool = await getPool();
    const result = await pool.query(
      `UPDATE filhos
       SET nome = $1
       WHERE id = $2 AND user_id = $3
       RETURNING id, user_id, nome, data_nascimento, dispositivo_id`,
      [String(nome).trim(), filhoId, userId],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Filho nao encontrado para este usuario." });
    }

    return res.status(200).json({
      ok: true,
      message: "Nome do filho atualizado com sucesso.",
      filho: result.rows[0],
    });
  } catch (error) {
    return res.status(500).json({
      message: "Erro ao atualizar filho.",
      detail: error.message,
    });
  }
}

export async function listarAppsRegistrados(req, res) {
  const userId = parseUserId(req);
  const selectedChildId = parseFilhoId(req);
  if (!userId) return res.status(400).json({ message: "user_id invalido." });

  try {
    const pool = await getPool();
    if (selectedChildId) {
      const child = await pool.query("SELECT id FROM filhos WHERE id = $1 AND user_id = $2", [selectedChildId, userId]);
      if (child.rowCount === 0) return res.status(404).json({ message: "Filho nao encontrado." });
    }

    const result = await pool.query(
      `SELECT DISTINCT a.nome, a.package_name,
              b.bloqueado_ate,
              EXISTS (
                SELECT 1 FROM tokens t
                WHERE t.user_id = $1 AND t.token = $2 AND t.data_expiracao > NOW()
              ) AS possui_token
       FROM apps a
       JOIN instalacoes i ON i.app_id = a.id
       JOIN filhos f ON f.id = i.filho_id
       LEFT JOIN tokens t ON t.user_id = f.user_id AND t.token = $2 AND t.data_expiracao > NOW()
       LEFT JOIN app_bloqueios b ON b.token_id = t.id AND b.package_name = a.package_name AND b.bloqueado_ate > NOW()
       WHERE f.user_id = $1 AND ($3::int IS NULL OR f.id = $3)
       ORDER BY a.nome`,
      [userId, String(req.query.token || ""), selectedChildId],
    );
    return res.status(200).json({ apps: result.rows });
  } catch (error) {
    return res.status(500).json({ message: "Erro ao carregar apps registrados.", detail: error.message });
  }
}

export async function bloquearApp(req, res) {
  const userId = parseUserId(req);
  const token = String(req.body?.token || "").trim();
  const packageName = String(req.body?.package_name || "").trim();
  const durationMinutes = Number(req.body?.duration_minutes);
  const allowedDurations = new Set([15, 30, 60, 120, 240]);

  if (!userId || !token || !packageName || !allowedDurations.has(durationMinutes)) {
    return res.status(400).json({ message: "Usuario, token, app ou duracao invalida." });
  }

  try {
    const pool = await getPool();
    const tokenResult = await pool.query(
      "SELECT id FROM tokens WHERE user_id = $1 AND token = $2 AND data_expiracao > NOW() LIMIT 1",
      [userId, token],
    );
    if (tokenResult.rowCount === 0) return res.status(404).json({ message: "Dispositivo sincronizado nao encontrado." });

    const appResult = await pool.query(
      `SELECT a.nome FROM apps a
       JOIN instalacoes i ON i.app_id = a.id
       JOIN filhos f ON f.id = i.filho_id
       WHERE f.user_id = $1 AND a.package_name = $2 LIMIT 1`,
      [userId, packageName],
    );
    if (appResult.rowCount === 0) return res.status(404).json({ message: "App nao registrado para este usuario." });

    const result = await pool.query(
      `INSERT INTO app_bloqueios (token_id, package_name, app_nome, iniciado_em, bloqueado_ate)
       VALUES ($1, $2, $3, NOW(), NOW() + ($4 * INTERVAL '1 minute'))
       ON CONFLICT (token_id, package_name)
       DO UPDATE SET app_nome = EXCLUDED.app_nome, iniciado_em = NOW(), bloqueado_ate = EXCLUDED.bloqueado_ate
       RETURNING package_name, app_nome, bloqueado_ate`,
      [tokenResult.rows[0].id, packageName, appResult.rows[0].nome, durationMinutes],
    );
    return res.status(200).json({ ok: true, bloqueio: result.rows[0] });
  } catch (error) {
    return res.status(500).json({ message: "Erro ao bloquear app.", detail: error.message });
  }
}

export async function listarBloqueiosAtivos(req, res) {
  const token = String(req.query.token || "").trim();
  if (!token) return res.status(400).json({ message: "Token do dispositivo obrigatorio." });

  try {
    const pool = await getPool();
    const result = await pool.query(
      `SELECT b.package_name, b.app_nome, b.bloqueado_ate
       FROM app_bloqueios b JOIN tokens t ON t.id = b.token_id
       WHERE t.token = $1 AND t.data_expiracao > NOW() AND b.bloqueado_ate > NOW()
       ORDER BY b.bloqueado_ate`,
      [token],
    );
    return res.status(200).json({ bloqueios: result.rows });
  } catch (error) {
    return res.status(500).json({ message: "Erro ao carregar bloqueios.", detail: error.message });
  }
}

export async function enviarNotificacao(req, res) {
  const userId = parseUserId(req);
  const token = String(req.body?.token || "").trim();
  const mensagem = String(req.body?.mensagem || "").trim();

  if (!userId) {
    return res.status(400).json({ message: "user_id invalido." });
  }
  if (!token) {
    return res.status(400).json({ message: "Token do app obrigatorio." });
  }
  if (!mensagem || mensagem.length > 500) {
    return res.status(400).json({ message: "A mensagem deve ter entre 1 e 500 caracteres." });
  }

  try {
    const pool = await getPool();
    const tokenResult = await pool.query(
      `SELECT id, expo_push_token FROM tokens
       WHERE user_id = $1 AND token = $2 AND data_expiracao > NOW()
       ORDER BY id DESC LIMIT 1`,
      [userId, token],
    );
    if (tokenResult.rowCount === 0) {
      return res.status(404).json({ message: "App sincronizado nao encontrado ou token expirado." });
    }

    const result = await pool.query(
      "INSERT INTO notificacoes (token_id, mensagem) VALUES ($1, $2) RETURNING id, mensagem, data_criacao",
      [tokenResult.rows[0].id, mensagem],
    );

    let pushEnviada = false;
    if (tokenResult.rows[0].expo_push_token) {
      await enviarPushExpo(tokenResult.rows[0].expo_push_token, result.rows[0]);
      await pool.query("UPDATE notificacoes SET data_entrega = NOW() WHERE id = $1", [result.rows[0].id]);
      pushEnviada = true;
    }

    return res.status(201).json({ ok: true, pushEnviada, notificacao: result.rows[0] });
  } catch (error) {
    return res.status(500).json({ message: "Erro ao enviar notificacao.", detail: error.message });
  }
}

export async function registrarDispositivoPush(req, res) {
  const token = String(req.body?.token || "").trim();
  const expoPushToken = String(req.body?.expo_push_token || "").trim();
  const hasValidPushTokenPrefix = expoPushToken.startsWith("ExpoPushToken[")
    || expoPushToken.startsWith("ExponentPushToken[");

  if (!token || !hasValidPushTokenPrefix || !expoPushToken.endsWith("]")) {
    return res.status(400).json({ message: "Token de conexao ou Expo Push Token invalido." });
  }

  try {
    const pool = await getPool();
    const connection = await pool.query(
      "SELECT id FROM tokens WHERE token = $1 AND data_expiracao > NOW() LIMIT 1",
      [token],
    );
    if (connection.rowCount === 0) {
      return res.status(401).json({ message: "Token de conexao invalido ou expirado." });
    }

    await pool.query(
      "UPDATE tokens SET expo_push_token = NULL WHERE expo_push_token = $1 AND token <> $2",
      [expoPushToken, token],
    );
    const result = await pool.query(
      "UPDATE tokens SET expo_push_token = $1 WHERE id = $2 RETURNING id",
      [expoPushToken, connection.rows[0].id],
    );
    return res.status(200).json({ ok: true, registrado: true });
  } catch (error) {
    return res.status(500).json({ message: "Erro ao registrar dispositivo para push.", detail: error.message });
  }
}

async function enviarPushExpo(to, notification) {
  const headers = { "Content-Type": "application/json", Accept: "application/json" };
  if (process.env.EXPO_ACCESS_TOKEN) {
    headers.Authorization = `Bearer ${process.env.EXPO_ACCESS_TOKEN}`;
  }

  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers,
    body: JSON.stringify({
      to,
      title: "Nova mensagem do painel",
      body: notification.mensagem,
      data: { notificationId: notification.id },
      sound: "default",
      priority: "high",
      channelId: "default",
    }),
  });
  const payload = await response.json();
  const ticket = Array.isArray(payload.data) ? payload.data[0] : payload.data;
  if (!response.ok || ticket?.status !== "ok") {
    throw new Error(ticket?.message || payload.errors?.[0]?.message || "O Expo Push Service recusou a mensagem.");
  }
}

export async function listarNotificacoesPendentes(req, res) {
  const token = String(req.query.token || "").trim();
  if (!token) {
    return res.status(400).json({ message: "Token do app obrigatorio." });
  }

  try {
    const pool = await getPool();
    const tokenResult = await pool.query(
      "SELECT id FROM tokens WHERE token = $1 AND data_expiracao > NOW() LIMIT 1",
      [token],
    );
    if (tokenResult.rowCount === 0) {
      return res.status(401).json({ message: "Token invalido ou expirado." });
    }

    const result = await pool.query(
      `SELECT id, mensagem, data_criacao FROM notificacoes
       WHERE token_id = $1 AND data_entrega IS NULL
       ORDER BY id ASC LIMIT 20`,
      [tokenResult.rows[0].id],
    );
    return res.status(200).json({ notificacoes: result.rows });
  } catch (error) {
    return res.status(500).json({ message: "Erro ao buscar notificacoes.", detail: error.message });
  }
}

export async function confirmarNotificacao(req, res) {
  const token = String(req.body?.token || "").trim();
  const notificacaoId = Number(req.params.notificacaoId);
  if (!token || !Number.isInteger(notificacaoId) || notificacaoId < 1) {
    return res.status(400).json({ message: "Token ou notificacao invalida." });
  }

  try {
    const pool = await getPool();
    const result = await pool.query(
      `UPDATE notificacoes n SET data_entrega = NOW()
       FROM tokens t
       WHERE n.id = $1 AND n.token_id = t.id AND t.token = $2 AND n.data_entrega IS NULL
       RETURNING n.id`,
      [notificacaoId, token],
    );
    return res.status(200).json({ ok: true, confirmada: result.rowCount > 0 });
  } catch (error) {
    return res.status(500).json({ message: "Erro ao confirmar notificacao.", detail: error.message });
  }
}

export async function salvarTempoUso(req, res) {
  const { token, dados, dispositivo_id, nome_filho } = req.body || {};

  console.log("[tempo-uso] Requisição recebida:", {
    token: token ? `${token.slice(0, 8)}...` : null,
    nome_filho,
    dispositivo_id,
    quantidade_registros: Array.isArray(dados) ? dados.length : 0,
    dados,
  });

  if (!token || !Array.isArray(dados) || dados.length === 0) {
    return res.status(400).json({ message: "Payload invalido. Envie token e dados." });
  }

  let pool;
  let client;

  try {
    pool = await getPool();
    client = await pool.connect();
    await client.query("BEGIN");

    const tokenResult = await client.query(
      `SELECT user_id
       FROM tokens
       WHERE token = $1 AND data_expiracao > NOW()
       ORDER BY id DESC
       LIMIT 1`,
      [token],
    );

    if (tokenResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(401).json({ message: "Token invalido ou expirado." });
    }

    const userId = tokenResult.rows[0].user_id;
    const filhoResult = await client.query("SELECT id FROM filhos WHERE user_id = $1 ORDER BY id ASC LIMIT 1", [
      userId,
    ]);

    let filhoId;
    if (filhoResult.rowCount === 0) {
      // Primeiro acesso via app: cria automaticamente um filho vinculado ao usuario do token.
      const nomeFilho = String(nome_filho || "Filho App").trim();
      const dispositivoId = String(dispositivo_id || "app-mobile").trim();
      const novoFilho = await client.query(
        `INSERT INTO filhos (user_id, nome, data_nascimento, dispositivo_id)
         VALUES ($1, $2, NULL, $3)
         RETURNING id`,
        [userId, nomeFilho, dispositivoId],
      );
      filhoId = novoFilho.rows[0].id;
    } else {
      filhoId = filhoResult.rows[0].id;
    }

    for (const item of dados) {
      const packageName = String(item?.package_name || "").trim();
      const tempoMinutos = Math.round(Number(item?.tempo_minutos));
      const dataUso = String(item?.data_uso || "").trim();
      const nomeApp = String(item?.nome || packageName).trim();

      if (!packageName || !Number.isFinite(tempoMinutos) || tempoMinutos < 0 || !dataUso) {
        await client.query("ROLLBACK");
        return res.status(400).json({ message: "Item de dados invalido no payload." });
      }

      const appLookup = await client.query("SELECT id FROM apps WHERE package_name = $1 LIMIT 1", [packageName]);
      let appId;

      if (appLookup.rowCount > 0) {
        appId = appLookup.rows[0].id;
      } else {
        const appInsert = await client.query("INSERT INTO apps (nome, package_name) VALUES ($1, $2) RETURNING id", [
          nomeApp,
          packageName,
        ]);
        appId = appInsert.rows[0].id;
      }

      const instalacaoExistente = await client.query(
        "SELECT id FROM instalacoes WHERE filho_id = $1 AND app_id = $2 LIMIT 1",
        [filhoId, appId],
      );

      if (instalacaoExistente.rowCount === 0) {
        await client.query("INSERT INTO instalacoes (filho_id, app_id, data_instalacao) VALUES ($1, $2, NOW())", [
          filhoId,
          appId,
        ]);
      }

      await client.query(
        `INSERT INTO tempo_uso (filho_id, app_id, tempo_minutos, data_uso)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (filho_id, app_id, data_uso)
         DO UPDATE SET tempo_minutos = EXCLUDED.tempo_minutos`,
        [filhoId, appId, tempoMinutos, dataUso],
      );
    }

    await client.query("COMMIT");

    console.log("[tempo-uso] Dados salvos com sucesso. filho_id:", filhoId, "| registros:", dados.length);

    return res.status(201).json({
      ok: true,
      message: "Dados de tempo de uso salvos com sucesso.",
    });
  } catch (error) {
    if (client) {
      await client.query("ROLLBACK");
    }
    return res.status(500).json({
      message: "Erro ao salvar tempo de uso.",
      detail: error.message,
    });
  } finally {
    if (client) {
      client.release();
    }
  }
}

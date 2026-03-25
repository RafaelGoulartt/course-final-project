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

export async function salvarTempoUso(req, res) {
  const { token, dados, dispositivo_id, nome_filho } = req.body || {};

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
      const tempoMinutos = Number(item?.tempo_minutos);
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
        "INSERT INTO tempo_uso (filho_id, app_id, tempo_minutos, data_uso) VALUES ($1, $2, $3, $4)",
        [filhoId, appId, tempoMinutos, dataUso],
      );
    }

    await client.query("COMMIT");

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

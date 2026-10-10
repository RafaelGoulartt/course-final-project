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

const PERIODOS = ["dia", "semana", "mes"];

function parsePeriodo(req) {
  const periodo = String(req.query?.periodo || "semana");
  return PERIODOS.includes(periodo) ? periodo : "semana";
}

// Data de referencia no formato YYYY-MM-DD. Sem data, usa o dia de hoje no horario de Brasilia.
function parseDataRef(req) {
  const raw = String(req.query?.data || "");
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw) && !Number.isNaN(Date.parse(`${raw}T00:00:00Z`))) {
    return raw;
  }
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

function addDias(isoDate, dias) {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + dias);
  return date.toISOString().slice(0, 10);
}

// inicio/fim delimitam o periodo (fim exclusivo). serieInicio/fim delimitam o grafico de uso por dia:
// no "dia" ele mostra os 7 dias terminando na data escolhida, para dar contexto.
function calcularPeriodo(periodo, dataRef) {
  if (periodo === "dia") {
    return { tipo: periodo, dataRef, inicio: dataRef, fim: addDias(dataRef, 1), serieInicio: addDias(dataRef, -6) };
  }
  if (periodo === "semana") {
    const diaDaSemana = (new Date(`${dataRef}T00:00:00Z`).getUTCDay() + 6) % 7; // segunda = 0
    const inicio = addDias(dataRef, -diaDaSemana);
    return { tipo: periodo, dataRef, inicio, fim: addDias(inicio, 7), serieInicio: inicio };
  }
  const inicio = `${dataRef.slice(0, 7)}-01`;
  const proximoMes = new Date(`${inicio}T00:00:00Z`);
  proximoMes.setUTCMonth(proximoMes.getUTCMonth() + 1);
  return { tipo: periodo, dataRef, inicio, fim: proximoMes.toISOString().slice(0, 10), serieInicio: inicio };
}

async function carregarEstatisticas(pool, filhoId, periodo, dataRef) {
  const intervalo = calcularPeriodo(periodo, dataRef);

  const tempoPorAppResult = await pool.query(
    `SELECT a.id AS app_id, a.nome, a.package_name, SUM(t.tempo_minutos)::int AS total
     FROM tempo_uso t
     JOIN apps a ON a.id = t.app_id
     WHERE t.filho_id = $1
       AND t.data_uso >= $2::date
       AND t.data_uso < $3::date
     GROUP BY a.id, a.nome, a.package_name
     HAVING SUM(t.tempo_minutos) > 0
     ORDER BY total DESC`,
    [filhoId, intervalo.inicio, intervalo.fim],
  );

  // generate_series preenche com zero os dias sem uso, para o grafico nao pular dias.
  const tempoPorDiaResult = await pool.query(
    `SELECT to_char(g.dia, 'YYYY-MM-DD') AS data_uso, COALESCE(SUM(t.tempo_minutos), 0)::int AS total
     FROM generate_series($2::date, $3::date - 1, INTERVAL '1 day') AS g(dia)
     LEFT JOIN tempo_uso t ON t.data_uso = g.dia::date AND t.filho_id = $1
     GROUP BY g.dia
     ORDER BY g.dia`,
    [filhoId, intervalo.serieInicio, intervalo.fim],
  );

  const temDadosResult = await pool.query(
    "SELECT EXISTS (SELECT 1 FROM tempo_uso WHERE filho_id = $1 AND tempo_minutos > 0) AS tem",
    [filhoId],
  );

  return {
    hasData: temDadosResult.rows[0].tem,
    periodo: { tipo: intervalo.tipo, dataRef, inicio: intervalo.inicio, fim: intervalo.fim },
    tempoPorApp: tempoPorAppResult.rows,
    tempoPorDia: tempoPorDiaResult.rows,
  };
}

function buildNoDataResponse(token = null, filhos = [], filhoSelecionadoId = null) {
  return {
    ok: true,
    message: "Nenhum dado disponivel",
    hasData: false,
    token,
    filhos,
    filhoSelecionadoId,
    periodo: null,
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

async function filhoPertenceAoUsuario(pool, filhoId, userId) {
  const result = await pool.query("SELECT 1 FROM filhos WHERE id = $1 AND user_id = $2", [filhoId, userId]);
  return result.rowCount > 0;
}

// Filho vinculado ao token do celular (o primeiro filho do usuario, como em salvarTempoUso).
// Retorna undefined se o token for invalido e null se o usuario ainda nao tiver filho.
async function findFilhoByToken(pool, token) {
  if (!token) return undefined;
  const tokenResult = await pool.query(
    "SELECT user_id FROM tokens WHERE token = $1 AND data_expiracao > NOW() ORDER BY id DESC LIMIT 1",
    [String(token)],
  );
  if (tokenResult.rowCount === 0) return undefined;

  const filhoResult = await pool.query("SELECT id, nome FROM filhos WHERE user_id = $1 ORDER BY id ASC LIMIT 1", [
    tokenResult.rows[0].user_id,
  ]);
  return filhoResult.rows[0] || null;
}

const SUSPENSAO_ATIVA = "s.liberada_em IS NULL AND (s.fim IS NULL OR s.fim > NOW())";

async function listarSuspensoesAtivas(pool, filhoId) {
  const result = await pool.query(
    `SELECT s.id, s.app_id, a.nome, a.package_name, s.criada_em, s.fim
     FROM suspensoes s
     JOIN apps a ON a.id = s.app_id
     WHERE s.filho_id = $1 AND ${SUSPENSAO_ATIVA}
     ORDER BY s.criada_em DESC`,
    [filhoId],
  );
  return result.rows;
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

    const estatisticas = await carregarEstatisticas(pool, filhoSelecionadoId, parsePeriodo(req), parseDataRef(req));

    return res.status(200).json({
      ok: true,
      token: latestToken.token,
      tokenExpiraEm: latestToken.data_expiracao,
      filhos,
      filhoSelecionadoId,
      ...estatisticas,
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
        // Versoes antigas do app nao mandavam o nome: troca o nome do pacote pelo nome real quando ele chegar.
        if (nomeApp !== packageName) {
          await client.query("UPDATE apps SET nome = $1 WHERE id = $2 AND nome = package_name", [nomeApp, appId]);
        }
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

// ---------------------------------------------------------------------------
// Controle dos pais: mensagens e suspensao de apps
// ---------------------------------------------------------------------------

// Apps que nao podem ser suspensos: o proprio app de monitoramento (a tela de bloqueio faz parte dele),
// a tela inicial e telas do sistema que a crianca precisa para liberar permissoes.
const PACOTES_NAO_SUSPENSIVEIS = [
  "sem.dados",
  "com.mobileapptcc",
  "com.android.settings",
  "com.android.systemui",
  "com.google.android.permissioncontroller",
  "com.android.permissioncontroller",
];
const FILTRO_SUSPENSIVEL = `a.package_name <> ALL($2::text[]) AND a.package_name NOT ILIKE '%launcher%'`;

function parseFilhoIdParam(req) {
  const filhoId = Number(req.params?.filhoId);
  return Number.isInteger(filhoId) && filhoId > 0 ? filhoId : null;
}

async function validarPaiEFilho(req, res, pool) {
  const userId = parseUserId(req);
  const filhoId = parseFilhoIdParam(req);

  if (!userId || !filhoId) {
    res.status(400).json({ message: "user_id ou filhoId invalido." });
    return null;
  }
  if (!(await filhoPertenceAoUsuario(pool, filhoId, userId))) {
    res.status(404).json({ message: "Filho nao encontrado para este usuario." });
    return null;
  }
  return filhoId;
}

export async function getControle(req, res) {
  try {
    const pool = await getPool();
    const filhoId = await validarPaiEFilho(req, res, pool);
    if (!filhoId) return;

    const appsResult = await pool.query(
      `SELECT a.id, a.nome, a.package_name
       FROM instalacoes i
       JOIN apps a ON a.id = i.app_id
       WHERE i.filho_id = $1 AND ${FILTRO_SUSPENSIVEL}
       ORDER BY LOWER(a.nome)`,
      [filhoId, PACOTES_NAO_SUSPENSIVEIS],
    );

    const mensagensResult = await pool.query(
      `SELECT id, texto, criada_em, lida_em
       FROM mensagens
       WHERE filho_id = $1
       ORDER BY criada_em DESC
       LIMIT 10`,
      [filhoId],
    );

    return res.status(200).json({
      ok: true,
      apps: appsResult.rows,
      mensagens: mensagensResult.rows,
      suspensoes: await listarSuspensoesAtivas(pool, filhoId),
    });
  } catch (error) {
    return res.status(500).json({ message: "Erro ao carregar controles.", detail: error.message });
  }
}

export async function enviarMensagem(req, res) {
  const texto = String(req.body?.texto || "").trim();

  if (!texto) {
    return res.status(400).json({ message: "Escreva a mensagem antes de enviar." });
  }
  if (texto.length > 500) {
    return res.status(400).json({ message: "A mensagem pode ter no maximo 500 caracteres." });
  }

  try {
    const pool = await getPool();
    const filhoId = await validarPaiEFilho(req, res, pool);
    if (!filhoId) return;

    const result = await pool.query(
      "INSERT INTO mensagens (filho_id, texto) VALUES ($1, $2) RETURNING id, texto, criada_em, lida_em",
      [filhoId, texto],
    );

    return res.status(201).json({ ok: true, message: "Mensagem enviada.", mensagem: result.rows[0] });
  } catch (error) {
    return res.status(500).json({ message: "Erro ao enviar mensagem.", detail: error.message });
  }
}

export async function suspenderApp(req, res) {
  const appId = Number(req.body?.app_id);
  const fimRaw = req.body?.fim;
  const fim = fimRaw ? new Date(fimRaw) : null;

  if (!Number.isInteger(appId) || appId <= 0) {
    return res.status(400).json({ message: "Escolha o app que sera suspenso." });
  }
  if (fim && (Number.isNaN(fim.getTime()) || fim.getTime() <= Date.now())) {
    return res.status(400).json({ message: "O fim da suspensao precisa ser no futuro." });
  }

  let client;
  try {
    const pool = await getPool();
    const filhoId = await validarPaiEFilho(req, res, pool);
    if (!filhoId) return;

    const instalado = await pool.query(
      `SELECT a.package_name, (${FILTRO_SUSPENSIVEL.replace("$2", "$3")}) AS suspensivel
       FROM instalacoes i
       JOIN apps a ON a.id = i.app_id
       WHERE i.filho_id = $1 AND i.app_id = $2`,
      [filhoId, appId, PACOTES_NAO_SUSPENSIVEIS],
    );
    if (instalado.rowCount === 0) {
      return res.status(404).json({ message: "Este app nao foi encontrado no celular do filho." });
    }
    if (!instalado.rows[0].suspensivel) {
      return res.status(400).json({ message: "Este app nao pode ser suspenso (e do sistema ou e o proprio app de controle)." });
    }

    // Uma suspensao ativa por app: a nova substitui a anterior.
    client = await pool.connect();
    await client.query("BEGIN");
    await client.query(
      `UPDATE suspensoes s SET liberada_em = NOW()
       WHERE s.filho_id = $1 AND s.app_id = $2 AND ${SUSPENSAO_ATIVA}`,
      [filhoId, appId],
    );
    await client.query("INSERT INTO suspensoes (filho_id, app_id, fim) VALUES ($1, $2, $3)", [filhoId, appId, fim]);
    await client.query("COMMIT");

    return res.status(201).json({
      ok: true,
      message: "App suspenso.",
      suspensoes: await listarSuspensoesAtivas(pool, filhoId),
    });
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    return res.status(500).json({ message: "Erro ao suspender app.", detail: error.message });
  } finally {
    if (client) client.release();
  }
}

export async function liberarApp(req, res) {
  const suspensaoId = Number(req.params?.suspensaoId);

  if (!Number.isInteger(suspensaoId) || suspensaoId <= 0) {
    return res.status(400).json({ message: "suspensaoId invalido." });
  }

  try {
    const pool = await getPool();
    const filhoId = await validarPaiEFilho(req, res, pool);
    if (!filhoId) return;

    await pool.query(
      "UPDATE suspensoes SET liberada_em = NOW() WHERE id = $1 AND filho_id = $2 AND liberada_em IS NULL",
      [suspensaoId, filhoId],
    );

    return res.status(200).json({
      ok: true,
      message: "App liberado.",
      suspensoes: await listarSuspensoesAtivas(pool, filhoId),
    });
  } catch (error) {
    return res.status(500).json({ message: "Erro ao liberar app.", detail: error.message });
  }
}

// ---------------------------------------------------------------------------
// Rotas usadas pelo celular do filho (autenticadas pelo token de conexao)
// ---------------------------------------------------------------------------

export async function getEstadoDispositivo(req, res) {
  try {
    const pool = await getPool();
    const filho = await findFilhoByToken(pool, req.query?.token);

    if (filho === undefined) {
      return res.status(401).json({ message: "Token invalido ou expirado." });
    }
    if (filho === null) {
      return res.status(200).json({ ok: true, mensagens: [], suspensoes: [] });
    }

    const mensagensResult = await pool.query(
      `SELECT id, texto, criada_em
       FROM mensagens
       WHERE filho_id = $1 AND lida_em IS NULL
       ORDER BY criada_em ASC`,
      [filho.id],
    );

    const suspensoes = await listarSuspensoesAtivas(pool, filho.id);

    return res.status(200).json({
      ok: true,
      mensagens: mensagensResult.rows,
      suspensoes: suspensoes.map(({ package_name, nome, fim }) => ({ package_name, nome, fim })),
    });
  } catch (error) {
    return res.status(500).json({ message: "Erro ao carregar estado.", detail: error.message });
  }
}

export async function marcarMensagemLida(req, res) {
  const mensagemId = Number(req.params?.mensagemId);

  if (!Number.isInteger(mensagemId) || mensagemId <= 0) {
    return res.status(400).json({ message: "mensagemId invalido." });
  }

  try {
    const pool = await getPool();
    const filho = await findFilhoByToken(pool, req.body?.token);

    if (!filho) {
      return res.status(401).json({ message: "Token invalido ou expirado." });
    }

    await pool.query("UPDATE mensagens SET lida_em = NOW() WHERE id = $1 AND filho_id = $2 AND lida_em IS NULL", [
      mensagemId,
      filho.id,
    ]);

    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ message: "Erro ao marcar mensagem.", detail: error.message });
  }
}

export async function getResumoDispositivo(req, res) {
  try {
    const pool = await getPool();
    const filho = await findFilhoByToken(pool, req.query?.token);

    if (filho === undefined) {
      return res.status(401).json({ message: "Token invalido ou expirado." });
    }
    if (filho === null) {
      return res.status(200).json({ ...buildNoDataResponse(), suspensoes: [] });
    }

    const estatisticas = await carregarEstatisticas(pool, filho.id, parsePeriodo(req), parseDataRef(req));

    return res.status(200).json({
      ok: true,
      filho,
      ...estatisticas,
      suspensoes: await listarSuspensoesAtivas(pool, filho.id),
    });
  } catch (error) {
    return res.status(500).json({ message: "Erro ao carregar resumo.", detail: error.message });
  }
}

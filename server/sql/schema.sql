-- Schema completo do banco de dados
-- Cole este SQL no Supabase: SQL Editor > New query > Run

CREATE TABLE IF NOT EXISTS usuarios (
  id          SERIAL PRIMARY KEY,
  nome        VARCHAR(150) NOT NULL,
  email       VARCHAR(255) NOT NULL UNIQUE,
  senha_hash  VARCHAR(255) NOT NULL,
  data_criacao TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tokens (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token           TEXT NOT NULL UNIQUE,
  data_expiracao  TIMESTAMP NOT NULL,
  expo_push_token TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS tokens_expo_push_token_unique
  ON tokens(expo_push_token) WHERE expo_push_token IS NOT NULL;

CREATE TABLE IF NOT EXISTS notificacoes (
  id             SERIAL PRIMARY KEY,
  token_id       INTEGER NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
  mensagem       TEXT NOT NULL CHECK (char_length(btrim(mensagem)) BETWEEN 1 AND 500),
  data_criacao   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_entrega   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS notificacoes_pendentes_idx
  ON notificacoes(token_id, data_entrega, id);

CREATE TABLE IF NOT EXISTS app_bloqueios (
  id             SERIAL PRIMARY KEY,
  token_id       INTEGER NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
  package_name   VARCHAR(255) NOT NULL,
  app_nome       VARCHAR(255) NOT NULL,
  iniciado_em    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  bloqueado_ate  TIMESTAMPTZ NOT NULL,
  UNIQUE(token_id, package_name)
);

CREATE INDEX IF NOT EXISTS app_bloqueios_ativos_idx
  ON app_bloqueios(token_id, bloqueado_ate);

CREATE TABLE IF NOT EXISTS filhos (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nome            VARCHAR(150) NOT NULL,
  data_nascimento DATE,
  dispositivo_id  VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS apps (
  id            SERIAL PRIMARY KEY,
  nome          VARCHAR(255) NOT NULL,
  package_name  VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS instalacoes (
  id               SERIAL PRIMARY KEY,
  filho_id         INTEGER NOT NULL REFERENCES filhos(id) ON DELETE CASCADE,
  app_id           INTEGER NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  data_instalacao  TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(filho_id, app_id)
);

CREATE TABLE IF NOT EXISTS tempo_uso (
  id             SERIAL PRIMARY KEY,
  filho_id       INTEGER NOT NULL REFERENCES filhos(id) ON DELETE CASCADE,
  app_id         INTEGER NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  tempo_minutos  INTEGER NOT NULL CHECK (tempo_minutos >= 0),
  data_uso       DATE NOT NULL,
  UNIQUE(filho_id, app_id, data_uso)
);

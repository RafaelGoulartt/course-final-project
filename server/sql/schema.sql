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
  data_expiracao  TIMESTAMP NOT NULL
);

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

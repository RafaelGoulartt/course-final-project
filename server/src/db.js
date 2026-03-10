import sql from "mssql";

const config = {
  user: process.env.SQLSERVER_USER,
  password: process.env.SQLSERVER_PASSWORD,
  server: process.env.SQLSERVER_HOST,
  port: Number(process.env.SQLSERVER_PORT || 1433),
  database: process.env.SQLSERVER_DATABASE,
  options: {
    encrypt: process.env.SQLSERVER_ENCRYPT === "true",
    trustServerCertificate: process.env.SQLSERVER_TRUST_SERVER_CERT !== "false",
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let poolPromise;

export async function getPool() {
  if (!poolPromise) {
    poolPromise = sql.connect(config);
  }

  return poolPromise;
}

export { sql };

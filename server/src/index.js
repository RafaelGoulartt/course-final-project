import "dotenv/config";
import app from "./app.js";
import { getPool } from "./db.js";

const port = Number(process.env.PORT || 3001);

app.listen(port, async () => {
  try {
    const pool = await getPool();
    await pool.query("SELECT 1");
    console.log(`API rodando em http://localhost:${port}`);
    console.log("Conexao com PostgreSQL estabelecida.");
  } catch (error) {
    console.error("Falha ao conectar no PostgreSQL:", error.message);
  }
});

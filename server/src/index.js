import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import dashboardRoutes from "./routes/dashboard.js";
import { getPool } from "./db.js";

const app = express();
const port = Number(process.env.PORT || 3001);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  }),
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.status(200).json({ ok: true, message: "API online" });
});

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);

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

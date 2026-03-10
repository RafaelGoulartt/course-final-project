import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
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

app.listen(port, async () => {
  try {
    await getPool();
    console.log(`API rodando em http://localhost:${port}`);
    console.log("Conexao com SQL Server estabelecida.");
  } catch (error) {
    console.error("Falha ao conectar no SQL Server:", error.message);
  }
});

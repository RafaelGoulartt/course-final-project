import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { getPool } from "../db.js";

const router = Router();

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Campos obrigatorios: name, email e password." });
  }

  try {
    const pool = await getPool();
    const normalizedEmail = email.trim().toLowerCase();

    const existing = await pool.query("SELECT id FROM users WHERE email = $1 LIMIT 1", [normalizedEmail]);

    if (existing.rowCount > 0) {
      return res.status(409).json({ message: "Este email ja esta cadastrado." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const normalizedName = name.trim();

    await pool.query("INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3)", [
      normalizedName,
      normalizedEmail,
      passwordHash,
    ]);

    return res.status(201).json({
      ok: true,
      message: "Cadastro realizado com sucesso.",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Erro interno ao cadastrar usuario.",
      detail: error.message,
    });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: "Campos obrigatorios: email e password." });
  }

  try {
    const pool = await getPool();
    const normalizedEmail = email.trim().toLowerCase();

    const result = await pool.query(
      "SELECT id, name, email, password_hash FROM users WHERE email = $1 LIMIT 1",
      [normalizedEmail],
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ message: "Email ou senha invalidos." });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ message: "Email ou senha invalidos." });
    }

    const token = crypto.randomBytes(24).toString("hex");

    return res.status(200).json({
      ok: true,
      message: "Login realizado com sucesso.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Erro interno ao autenticar usuario.",
      detail: error.message,
    });
  }
});

export default router;

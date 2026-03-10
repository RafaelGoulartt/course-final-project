import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { getPool, sql } from "../db.js";

const router = Router();

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Campos obrigatorios: name, email e password." });
  }

  try {
    const pool = await getPool();

    const existing = await pool
      .request()
      .input("email", sql.NVarChar(255), email.trim().toLowerCase())
      .query("SELECT TOP 1 Id FROM Users WHERE Email = @email");

    if (existing.recordset.length > 0) {
      return res.status(409).json({ message: "Este email ja esta cadastrado." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await pool
      .request()
      .input("name", sql.NVarChar(150), name.trim())
      .input("email", sql.NVarChar(255), email.trim().toLowerCase())
      .input("passwordHash", sql.NVarChar(255), passwordHash)
      .query(`
        INSERT INTO Users (Name, Email, PasswordHash, CreatedAt)
        VALUES (@name, @email, @passwordHash, GETDATE())
      `);

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

    const result = await pool
      .request()
      .input("email", sql.NVarChar(255), email.trim().toLowerCase())
      .query(`
        SELECT TOP 1 Id, Name, Email, PasswordHash
        FROM Users
        WHERE Email = @email
      `);

    const user = result.recordset[0];

    if (!user) {
      return res.status(401).json({ message: "Email ou senha invalidos." });
    }

    const isValidPassword = await bcrypt.compare(password, user.PasswordHash);

    if (!isValidPassword) {
      return res.status(401).json({ message: "Email ou senha invalidos." });
    }

    const token = crypto.randomBytes(24).toString("hex");

    return res.status(200).json({
      ok: true,
      message: "Login realizado com sucesso.",
      token,
      user: {
        id: user.Id,
        name: user.Name,
        email: user.Email,
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
